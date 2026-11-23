import { Hono, Context } from "hono";
import { oAuthServerService } from "@repo/services/mcp-oauth";
import { renderAuthorizeHtml } from "../views/authorize";
import AuthService from "@repo/services/auth";
import { env } from "../env";
const authService = new AuthService();
import logger from "@repo/logger/logger";
export const oauthRoutes = new Hono();
function getBaseUrl(c: Context): string {
  const forwardedProto = c.req.header("x-forwarded-proto");
  const forwardedHost = c.req.header("x-forwarded-host");
  const host = forwardedHost || c.req.header("host");
  if (host) {
    const proto =
      forwardedProto ||
      (host.includes("localhost") || host.includes("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }
  return env.BASE_URL;
}

// RFC 9728 Protected Resource Metadata
oauthRoutes.get("/.well-known/oauth-protected-resource", (c) => {
  return c.json(oAuthServerService.getProtectedResourceMetadata(getBaseUrl(c)));
});

// RFC 8414 Authorization Server Metadata
oauthRoutes.get("/.well-known/oauth-authorization-server", (c) => {
  return c.json(
    oAuthServerService.getAuthorizationServerMetadata(getBaseUrl(c)),
  );
});

// OpenID Connect Discovery
oauthRoutes.get("/.well-known/openid-configuration", (c) => {
  return c.json(
    oAuthServerService.getAuthorizationServerMetadata(getBaseUrl(c)),
  );
});

// RFC 7591 Dynamic Client Registration
oauthRoutes.post("/oauth/register", async (c) => {
  try {
    const body = await c.req.json();
    const result = await oAuthServerService.registerClient(body);
    return c.json(result, 201);
  } catch (err: any) {
    logger.error("OAuth registration error:", err);
    return c.json(
      { error: "invalid_client_metadata", error_description: err.message },
      400,
    );
  }
});

// OAuth 2.1 Authorize Endpoint (GET: render login & consent page)
oauthRoutes.get("/oauth/authorize", async (c) => {
  const query = c.req.query();
  try {
    const validated = await oAuthServerService.validateAuthorizeRequest(query);

    const html = renderAuthorizeHtml({
      clientName: validated.client.clientName || "MCP Client",
      clientId: validated.client_id,
      redirectUri: validated.redirect_uri,
      codeChallenge: validated.code_challenge,
      codeChallengeMethod: validated.code_challenge_method,
      state: validated.state,
      scope: validated.scope,
    });
    return c.html(html);
  } catch (err: any) {
    logger.error("OAuth authorize validation error:", err);
    return c.html(
      `<div style="font-family: sans-serif; padding: 2rem; color: #ef4444;">
        <h2>Authorization Error</h2>
        <p>${err.message}</p>
      </div>`,
      400,
    );
  }
});

// OAuth 2.1 Authorize Endpoint (POST: authenticate user & issue authorization code)
oauthRoutes.post("/oauth/authorize", async (c) => {
  let body: Record<string, string> = {};
  const contentType = c.req.header("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await c.req.json();
  } else {
    const formData = await c.req.formData();
    formData.forEach((value, key) => {
      body[key] = value.toString();
    });
  }

  const {
    action,
    client_id = "",
    redirect_uri = "",
    code_challenge = "",
    code_challenge_method = "S256",
    state = "",
    scope = "mcp:tools mcp:resources mcp:prompts",
    emailOrUsername = "",
    password = "",
    firstName,
    lastName,
    username,
    email,
  } = body;

  try {
    // Validate request
    const validated = await oAuthServerService.validateAuthorizeRequest({
      response_type: "code",
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method: "S256",
      state,
      scope,
    });

    let authenticatedUserId: string;

    if (action === "register") {
      // Direct registration & immediate verification
      const newUser = await authService.createVerifiedUser({
        firstName: firstName || "User",
        lastName: lastName || "",
        username: username || `user_${Date.now()}`,
        email: email || "",
        password: password || "",
      });
      authenticatedUserId = newUser.userId;
    } else {
      // Login with Email or Username + Password
      const { user } = await authService.loginWithEmailAndPassword({
        emailOrUsername,
        password,
      });
      authenticatedUserId = user.userId;
    }

    // Generate single-use authorization code with PKCE record
    const code = await oAuthServerService.createAuthorizationCode({
      clientId: validated.client_id,
      userId: authenticatedUserId,
      redirectUri: validated.redirect_uri,
      codeChallenge: validated.code_challenge,
      codeChallengeMethod: "S256",
      scope: validated.scope,
    });

    // Redirect user back to client's redirect URI
    const redirectUrl = new URL(validated.redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (validated.state) {
      redirectUrl.searchParams.set("state", validated.state);
    }

    return c.redirect(redirectUrl.toString(), 302);
  } catch (err: any) {
    logger.warn("OAuth authorization failed:", err.message);

    try {
      const client = await oAuthServerService.getClient(
        client_id || "mcp-client-default",
      );
      const html = renderAuthorizeHtml({
        clientName: client?.clientName || "MCP Client",
        clientId: client_id,
        redirectUri: redirect_uri,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method || "S256",
        state,
        scope,
        error:
          err.message ||
          "Authentication failed. Please check your credentials.",
      });
      return c.html(html, 400);
    } catch {
      return c.json(
        { error: "invalid_request", error_description: err.message },
        400,
      );
    }
  }
});

// OAuth 2.1 Token Endpoint (exchange authorization code with PKCE, or refresh token)
oauthRoutes.post("/oauth/token", async (c) => {
  try {
    let body: any = {};
    const contentType = c.req.header("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await c.req.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      body = await c.req.json();
    }

    // Also parse HTTP Basic Auth for confidential client credentials if present
    const authHeader = c.req.header("authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      const credentials = Buffer.from(authHeader.slice(6), "base64").toString(
        "utf-8",
      );
      const [clientId, clientSecret] = credentials.split(":");
      if (clientId && !body.client_id) body.client_id = clientId;
      if (clientSecret && !body.client_secret)
        body.client_secret = clientSecret;
    }

    const tokenResponse = await oAuthServerService.handleTokenRequest(body);
    return c.json(tokenResponse, 200, {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    });
  } catch (err: any) {
    logger.error("OAuth token issuance error:", err.message);
    const errorCode = err.code === "UNAUTHORIZED" ? 401 : 400;
    return c.json(
      {
        error: "invalid_grant",
        error_description: err.message,
      },
      errorCode,
      {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    );
  }
});

// RFC 7009 Token Revocation
oauthRoutes.post("/oauth/revoke", async (c) => {
  try {
    let token: string = "";
    const contentType = c.req.header("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await c.req.formData();
      token = formData.get("token")?.toString() || "";
    } else {
      const body = await c.req.json();
      token = body.token || "";
    }

    if (token) {
      await oAuthServerService.revokeToken(token);
    }

    return c.json({ success: true }, 200);
  } catch (err: any) {
    return c.json(
      { error: "invalid_request", error_description: err.message },
      400,
    );
  }
});

// OAuth 2.1 UserInfo Endpoint
oauthRoutes.get("/oauth/userinfo", async (c) => {
  const authHeader = c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "invalid_token",
        error_description: "Missing or invalid Bearer token",
      },
      401,
      {
        "WWW-Authenticate":
          'Bearer error="invalid_token", resource_metadata="' +
          c.req.url.split("/oauth/")[0] +
          '/.well-known/oauth-protected-resource"',
      },
    );
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = oAuthServerService.verifyAccessToken(token);
    const user = await authService.getme({ userId: payload.sub });

    return c.json({
      sub: user.users.userId,
      email: user.users.email,
      username: user.users.username,
      first_name: user.users.firstName,
      last_name: user.users.lastName,
      avatar_url: user.users.avatarUrl,
    });
  } catch (err: any) {
    return c.json(
      { error: "invalid_token", error_description: err.message },
      401,
    );
  }
});
