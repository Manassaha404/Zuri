import crypto from "node:crypto";
import * as jwt from "jsonwebtoken";
import db, { eq } from "@repo/database";
import {
  oauthClients,
  oauthCodes,
  oauthTokens,
  users,
} from "@repo/database/models";
import { AppError } from "@repo/error";
import { env } from "../env";
import {
  RegisterClientInput,
  registerClientDto,
  AuthorizeRequestInput,
  authorizeRequestDto,
  TokenRequestInput,
  tokenRequestDto,
  OAuthTokenPayload,
} from "./model";

export class OAuthServerService {
  // RFC 9728 Protected Resource Metadata
  public getProtectedResourceMetadata(baseUrl: string = env.BASE_URL) {
    return {
      resource: baseUrl,
      authorization_servers: [baseUrl],
      scopes_supported: ["mcp:tools", "mcp:resources", "mcp:prompts"],
      bearer_methods_supported: ["header"],
      resource_documentation: `${baseUrl}/docs`,
    };
  }

  // RFC 8414 OAuth 2.0 Authorization Server Metadata & OpenID Connect Discovery
  public getAuthorizationServerMetadata(baseUrl: string = env.BASE_URL) {
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      registration_endpoint: `${baseUrl}/oauth/register`,
      revocation_endpoint: `${baseUrl}/oauth/revoke`,
      userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: [
        "none",
        "client_secret_post",
        "client_secret_basic",
      ],
      scopes_supported: ["mcp:tools", "mcp:resources", "mcp:prompts"],
      token_endpoint_auth_signing_alg_values_supported: ["HS256"],
    };
  }
  // RFC 7591 Dynamic Client Registration
  public async registerClient(input: RegisterClientInput) {
    const data = await registerClientDto.parseAsync(input);
    const clientId = `client_${crypto.randomBytes(16).toString("hex")}`;
    const clientSecret =
      data.token_endpoint_auth_method !== "none"
        ? `secret_${crypto.randomBytes(32).toString("hex")}`
        : null;

    const [client] = await db
      .insert(oauthClients)
      .values({
        clientId,
        clientSecret,
        clientName: data.client_name,
        redirectUris: JSON.stringify(data.redirect_uris),
        isPublic: data.token_endpoint_auth_method === "none",
      })
      .returning();

    if (!client) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to register client");
    }

    return {
      client_id: client.clientId,
      client_secret: client.clientSecret ?? undefined,
      client_name: client.clientName,
      redirect_uris: JSON.parse(client.redirectUris) as string[],
      grant_types: data.grant_types,
      response_types: data.response_types,
      token_endpoint_auth_method: data.token_endpoint_auth_method,
    };
  }

  // Get an existing OAuth client by ID, or auto-seed the default MCP client if queried
  public async getClient(clientId: string) {
    const [client] = await db
      .select()
      .from(oauthClients)
      .where(eq(oauthClients.clientId, clientId));

    if (client) {
      return {
        ...client,
        clientId: client.clientId as string,
        clientName: client.clientName as string,
        redirectUrisArray: JSON.parse(client.redirectUris) as string[],
      };
    }

    // Default auto-seeded client for local/web MCP clients (e.g. Claude Desktop, Claude Web, Cursor)
    const lowerId = clientId.toLowerCase();
    if (
      lowerId === "mcp-client-default" ||
      lowerId.includes("claude") ||
      lowerId.includes("cursor") ||
      lowerId.includes("anthropic")
    ) {
      const defaultRedirects = [
        "https://claude.ai/api/auth/callback",
        "https://claude.ai/oauth/callback",
        "https://claude.ai",
        "http://localhost:3000/callback",
        "http://localhost:8000/callback",
        "http://127.0.0.1:8000/callback",
        "http://127.0.0.1:3000/callback",
        "https://oauth.pstmn.io/v1/callback",
        "vscode://vscode.github-authentication/did-authenticate",
      ];
      const [seeded] = await db
        .insert(oauthClients)
        .values({
          clientId,
          clientSecret: null,
          clientName: lowerId.includes("claude")
            ? "Claude MCP Client"
            : "Default Remote MCP Client",
          redirectUris: JSON.stringify(defaultRedirects),
          isPublic: true,
        })
        .returning();

      if (!seeded) {
        throw new AppError(
          "INTERNAL_SERVER_ERROR",
          "Failed to seed default client",
        );
      }

      return {
        ...seeded,
        clientId: seeded.clientId as string,
        clientName: seeded.clientName as string,
        redirectUrisArray: defaultRedirects,
      };
    }

    throw new AppError("NOT_FOUND", `Client '${clientId}' not found`);
  }

  // Validate authorization request parameters
  public async validateAuthorizeRequest(params: unknown) {
    const validated = await authorizeRequestDto.parseAsync(params);
    const client = await this.getClient(validated.client_id);

    let redirectUriMatch = client.redirectUrisArray.some(
      (uri) => uri.toLowerCase() === validated.redirect_uri.toLowerCase(),
    );

    if (!redirectUriMatch) {
      throw new AppError(
        "BAD_REQUEST",
        `Invalid redirect_uri '${validated.redirect_uri}' for client '${client.clientId}'`,
      );
    }

    return { ...validated, client };
  }

  // Issue an authorization code with PKCE verification record
  public async createAuthorizationCode(params: {
    clientId: string;
    userId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: "S256";
    scope: string;
  }) {
    const code = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await db.insert(oauthCodes).values({
      code,
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      scope: params.scope,
      expiresAt,
      used: false,
    });

    return code;
  }

  // Exchange authorization code or refresh token for tokens (RFC 6749 / RFC 7636 PKCE)
  public async handleTokenRequest(input: unknown) {
    const request = await tokenRequestDto.parseAsync(input);

    if (request.grant_type === "authorization_code") {
      return await this.exchangeAuthorizationCode(request);
    } else if (request.grant_type === "refresh_token") {
      return await this.exchangeRefreshToken(request);
    }

    throw new AppError("BAD_REQUEST", "Unsupported grant_type");
  }

  // Handle Authorization Code Grant with strict PKCE validation (OAuth 2.1)
  private async exchangeAuthorizationCode(params: {
    code: string;
    code_verifier: string;
    client_id: string;
    client_secret?: string;
    redirect_uri?: string;
  }) {
    const [codeRecord] = await db
      .select()
      .from(oauthCodes)
      .where(eq(oauthCodes.code, params.code));

    if (!codeRecord) {
      throw new AppError("BAD_REQUEST", "Invalid authorization code");
    }

    if (codeRecord.used) {
      // Security mandate: code reuse revocation
      await db
        .update(oauthTokens)
        .set({ revoked: true })
        .where(eq(oauthTokens.userId, codeRecord.userId));
      throw new AppError(
        "UNAUTHORIZED",
        "Authorization code has already been used. Tokens revoked for security.",
      );
    }

    if (new Date() > codeRecord.expiresAt) {
      throw new AppError("BAD_REQUEST", "Authorization code has expired");
    }

    if (codeRecord.clientId !== params.client_id) {
      throw new AppError(
        "BAD_REQUEST",
        "client_id does not match authorization code",
      );
    }

    if (params.redirect_uri && codeRecord.redirectUri !== params.redirect_uri) {
      throw new AppError(
        "BAD_REQUEST",
        "redirect_uri does not match authorization code",
      );
    }

    // Verify PKCE S256: base64url(sha256(code_verifier)) === code_challenge
    const computedChallenge = crypto
      .createHash("sha256")
      .update(params.code_verifier)
      .digest("base64url");

    if (computedChallenge !== codeRecord.codeChallenge) {
      throw new AppError(
        "UNAUTHORIZED",
        "PKCE verification failed: invalid code_verifier",
      );
    }

    // Check client secret if confidential
    const client = await this.getClient(params.client_id);
    if (!client.isPublic && client.clientSecret) {
      if (client.clientSecret !== params.client_secret) {
        throw new AppError("UNAUTHORIZED", "Invalid client_secret");
      }
    }

    // Mark code as used immediately
    await db
      .update(oauthCodes)
      .set({ used: true })
      .where(eq(oauthCodes.code, params.code));

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, codeRecord.userId));

    if (!user) {
      throw new AppError("NOT_FOUND", "User associated with code not found");
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      scope: codeRecord.scope,
    });

    const refreshToken = `rt_${crypto.randomBytes(32).toString("hex")}`;
    const refreshTokenExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ); // 30 days

    await db.insert(oauthTokens).values({
      refreshToken,
      clientId: client.clientId,
      userId: user.userId,
      scope: codeRecord.scope,
      expiresAt: refreshTokenExpiresAt,
      revoked: false,
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600, // 1 hour
      refresh_token: refreshToken,
      scope: codeRecord.scope,
    };
  }

  // Handle Refresh Token Grant
  private async exchangeRefreshToken(params: {
    refresh_token: string;
    client_id: string;
    client_secret?: string;
    scope?: string;
  }) {
    const [tokenRecord] = await db
      .select()
      .from(oauthTokens)
      .where(eq(oauthTokens.refreshToken, params.refresh_token));

    if (
      !tokenRecord ||
      tokenRecord.revoked ||
      new Date() > tokenRecord.expiresAt
    ) {
      throw new AppError("UNAUTHORIZED", "Invalid or expired refresh token");
    }

    if (tokenRecord.clientId !== params.client_id) {
      throw new AppError(
        "BAD_REQUEST",
        "client_id does not match refresh token",
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, tokenRecord.userId));

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }

    // Refresh token rotation
    const newRefreshToken = `rt_${crypto.randomBytes(32).toString("hex")}`;
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db
      .update(oauthTokens)
      .set({
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      })
      .where(eq(oauthTokens.tokenId, tokenRecord.tokenId));

    const accessToken = this.generateAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      scope: params.scope || tokenRecord.scope,
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: params.scope || tokenRecord.scope,
    };
  }

  // Generate JWT Access Token signed with JWT_ACCESS_SECRET
  public generateAccessToken(params: {
    userId: string;
    email: string;
    username: string;
    scope: string;
  }): string {
    return jwt.sign(
      {
        sub: params.userId,
        userId: params.userId,
        email: params.email,
        username: params.username,
        scope: params.scope,
      },
      env.JWT_ACCESS_TOKEN_SERECT,
      {
        expiresIn: "1h",
      },
    );
  }

  // Verify JWT Access Token for FastMCP and API requests
  public verifyAccessToken(token: string): OAuthTokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        env.JWT_ACCESS_TOKEN_SERECT,
      ) as unknown as OAuthTokenPayload & { userId?: string };

      if (!decoded) {
        throw new AppError("UNAUTHORIZED", "Invalid access token");
      }

      const resolvedSub = decoded.sub || decoded.userId;
      if (!resolvedSub) {
        throw new AppError(
          "UNAUTHORIZED",
          "Access token missing subject identifier",
        );
      }

      return {
        ...decoded,
        sub: resolvedSub,
        userId: resolvedSub,
        email: decoded.email || "",
        username: decoded.username || "",
        scope: decoded.scope || "mcp:tools mcp:resources mcp:prompts",
      } as OAuthTokenPayload;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        "UNAUTHORIZED",
        `Invalid access token: ${err.message}`,
      );
    }
  }

  // Revoke token (RFC 7009)
  public async revokeToken(token: string) {
    await db
      .update(oauthTokens)
      .set({ revoked: true })
      .where(eq(oauthTokens.refreshToken, token));
    return { success: true };
  }
}

export const oAuthServerService = new OAuthServerService();
export default oAuthServerService;
