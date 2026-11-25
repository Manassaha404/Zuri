import http from "node:http";
import { FastMCP } from "fastmcp";
import jwt from "jsonwebtoken";
import AuthServices from "@repo/services/auth";
import { oAuthServerService } from "@repo/services/mcp-oauth";
import { registerNoteTools } from "@repo/services/agent/mcp/tools/note";
import { registerHabitTools } from "@repo/services/agent/mcp/tools/habit";
import { registerExpenseTools } from "@repo/services/agent/mcp/tools/expense";
import { registerDeadlineTools } from "@repo/services/agent/mcp/tools/deadline";
import { registerNotePrompts } from "@repo/services/agent/mcp/prompts/notes";
import { registerHabitPrompts } from "@repo/services/agent/mcp/prompts/habits";
import { registerExpensePrompts } from "@repo/services/agent/mcp/prompts/expenses";
import { registerDeadlinePrompts } from "@repo/services/agent/mcp/prompts/deadlines";
import { oauthRoutes } from "./routes/oauth";
import { authRoutes } from "./routes/auth";
import logger from "@repo/logger/logger";
import { env } from "./env";

const authService = new AuthServices();

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...values] = pair.trim().split("=");
    if (key) {
      cookies[key] = decodeURIComponent(values.join("="));
    }
  }
  return cookies;
}

export interface MCPUserSession {
  userId: string;
  email: string;
  username: string;
  scope: string;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
}

// Initialize the FastMCP remote server with OAuth 2.1 token verification
export const mcpServer = new FastMCP<MCPUserSession>({
  name: "Multi-User Remote MCP Server Starter",
  version: "1.0.0",
  authenticate: async (request: http.IncomingMessage) => {
    const cookies = parseCookies(request.headers.cookie);
    const authHeader = request.headers["authorization"];
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : cookies.accessToken;
    const refreshToken =
      (request.headers["x-refresh-token"] as string | undefined) ||
      cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      return null;
    }

    let userId: string | null = null;
    let userEmail = "";
    let userUsername = "";
    let userScope = "mcp:tools mcp:resources mcp:prompts";

    // 1. Attempt access token verification (supporting both OAuth and app tokens)
    if (accessToken) {
      try {
        const oAuthPayload = oAuthServerService.verifyAccessToken(accessToken);
        if (oAuthPayload?.sub) {
          userId = oAuthPayload.sub;
          userEmail = oAuthPayload.email || "";
          userUsername = oAuthPayload.username || "";
          userScope = oAuthPayload.scope || userScope;
        }
      } catch {
        try {
          const decoded = jwt.verify(
            accessToken,
            env.JWT_ACCESS_TOKEN_SERECT,
          ) as jwt.JwtPayload & {
            userId?: string;
            sub?: string;
            email?: string;
            username?: string;
          };
          const resolvedId = decoded.userId || decoded.sub;
          if (resolvedId) {
            userId = resolvedId;
            userEmail = decoded.email || "";
            userUsername = decoded.username || "";
          }
        } catch {
          userId = null;
        }
      }

      if (userId) {
        try {
          const profile = await authService.getme({ userId });
          const user = profile?.users;
          return {
            userId: user?.userId || userId,
            email: user?.email || userEmail || "user@example.com",
            username: user?.username || userUsername || "user",
            scope: userScope,
            accessToken,
          };
        } catch {
          return {
            userId,
            email: userEmail || "user@example.com",
            username: userUsername || "user",
            scope: userScope,
            accessToken,
          };
        }
      }
    }

    // 2. Fallback to refresh token if access token was missing, expired, or invalid
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          env.JWT_REFRESH_TOKEN_SERECT,
        ) as jwt.JwtPayload & { userId?: string; sub?: string };

        const refreshUserId = decoded.userId || decoded.sub;
        if (!refreshUserId) {
          return null;
        }

        const profile = await authService.getme({ userId: refreshUserId });
        const user = profile?.users;
        const auth = profile?.auths;

        // Ensure user exists and is not logged out
        if (!user || (auth && auth.refreshToken === null)) {
          return null;
        }

        // Generate a new session access token for FastMCP execution context
        const sessionAccessToken = oAuthServerService.generateAccessToken({
          userId: user.userId,
          email: user.email,
          username: user.username,
          scope: userScope,
        });

        // Do not rotate or overwrite refreshToken in DB to prevent desyncing clients
        return {
          userId: user.userId,
          email: user.email,
          username: user.username,
          scope: userScope,
          accessToken: sessionAccessToken,
          refreshToken,
        };
      } catch (refreshErr) {
        logger.warn(
          `[MCP Auth] Refresh token verification failed: ${refreshErr}`,
        );
        return null;
      }
    }

    return null;
  },
});

// Register tools
registerNoteTools(mcpServer);
registerHabitTools(mcpServer);
registerExpenseTools(mcpServer);
registerDeadlineTools(mcpServer);

// Register prompts
registerNotePrompts(mcpServer);
registerHabitPrompts(mcpServer);
registerExpensePrompts(mcpServer);
registerDeadlinePrompts(mcpServer);

const app = mcpServer.getApp();
app.use("*", async (c, next) => {
  logger.info(`[HTTP] ${c.req.method} ${c.req.path}`);
  await next();
});
app.route("/", oauthRoutes);
app.route("/", authRoutes);
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    healthy: true,
    service: "Multi-User Remote FastMCP Server",
    timestamp: new Date().toISOString(),
  });
});
app.get("/", (c) => {
  return c.json({
    name: "Multi-User Remote FastMCP Server Starter",
    version: "1.0.0",
    description:
      "A lean starter pack for building multi-user remote MCP servers with hand-written email+password auth and OAuth 2.1.",
    endpoints: {
      mcp_stream: `${env.BASE_URL}/mcp`,
      sse: `${env.BASE_URL}/sse`,
      oauth_protected_resource: `${env.BASE_URL}/.well-known/oauth-protected-resource`,
      oauth_authorization_server: `${env.BASE_URL}/.well-known/oauth-authorization-server`,
      oauth_authorize: `${env.BASE_URL}/oauth/authorize`,
      oauth_token: `${env.BASE_URL}/oauth/token`,
      api_auth_register: `${env.BASE_URL}/api/auth/register`,
      api_auth_login: `${env.BASE_URL}/api/auth/login`,
      api_auth_me: `${env.BASE_URL}/api/auth/me`,
      health: `${env.BASE_URL}/health`,
    },
  });
});
export default mcpServer;
