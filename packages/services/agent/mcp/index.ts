import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import {
  StructuredToolInterface,
  type DynamicStructuredTool,
} from "@langchain/core/tools";
import jwt from "jsonwebtoken";
import db, { eq } from "@repo/database";
import { conversations } from "@repo/database/models";
import { env } from "../../env";
import { decrypt } from "../../utils/encryption";
import redis from "../../redis";

export interface MCPClientOptions {
  accessToken?: string;
  refreshToken?: string;
  serverUrl?: string;
}

// Instantiate MultiServerMCPClient configured with user authentication headers
export function getMCPClient(options: MCPClientOptions = {}) {
  const {
    accessToken,
    refreshToken,
    serverUrl = process.env.MCP_SERVER_URL || "http://localhost:9000/mcp",
  } = options;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["authorization"] = `Bearer ${accessToken}`;
  }
  if (refreshToken) {
    headers["x-refresh-token"] = refreshToken;
  }

  return new MultiServerMCPClient({
    prefixToolNameWithServerName: false,
    servers: {
      zuriMcp: {
        url: serverUrl,
        transport: "http",
        headers,
      },
    },
  });
}

export async function resolveMcpClient(
  serverName = "zuriMcp",
  conversationId?: string,
  options?: MCPClientOptions,
  userId?: string,
) {
  let clientOptions = options;
  if (!clientOptions && conversationId) {
    try {
      const encrypted = await redis.get(`redis:agent:tokens:${conversationId}`);
      if (encrypted) {
        const decrypted = decrypt(encrypted);
        const { accessToken, refreshToken } = JSON.parse(decrypted);
        clientOptions = { accessToken, refreshToken };
      }
    } catch {
      // Ignore token retrieval errors and fallback to unauthenticated client
    }
  }

  // Fallback: If tokens in Redis are missing or expired (300s TTL), resolve userId and mint a valid session JWT
  if (!clientOptions?.accessToken && !clientOptions?.refreshToken) {
    let resolvedUserId = userId;
    if (!resolvedUserId && conversationId) {
      try {
        const conv = await db
          .select({ userId: conversations.userId })
          .from(conversations)
          .where(eq(conversations.conversationId, conversationId))
          .limit(1);
        if (conv.length && conv[0]?.userId) {
          resolvedUserId = conv[0].userId;
        }
      } catch {}
    }

    if (resolvedUserId && resolvedUserId !== "anonymous") {
      try {
        const token = jwt.sign(
          { userId: resolvedUserId, sub: resolvedUserId },
          env.JWT_ACCESS_TOKEN_SERECT,
          { expiresIn: "10m" },
        );
        clientOptions = { accessToken: token };
      } catch (jwtErr) {
        console.error("[MCP] Failed to sign fallback token:", jwtErr);
      }
    }
  }

  const multi = getMCPClient(clientOptions);
  const client = await multi.getClient(serverName);
  if (!client) {
    throw new Error(`MCP server "${serverName}" not found or not connected`);
  }
  return client;
}

// Fetch executable LangChain tools from the remote MCP server
export async function getMCPServerTools(
  options: MCPClientOptions = {},
): Promise<DynamicStructuredTool[]> {
  try {
    const client = getMCPClient(options);
    return await client.listTools();
  } catch (error) {
    console.error("[MCP] Failed to fetch tools from server:", error);
    return [];
  }
}

// Fetch FastMCP tools using decrypted session tokens from Redis or active user fallback
export const getLiveMCPTools = async (
  conversationId?: string | null,
  userId?: string | null,
): Promise<StructuredToolInterface[]> => {
  let clientOptions: MCPClientOptions | undefined;

  if (conversationId) {
    try {
      const encrypted = await redis.get(`redis:agent:tokens:${conversationId}`);
      if (encrypted) {
        const decrypted = decrypt(encrypted);
        const { accessToken, refreshToken } = JSON.parse(decrypted);
        clientOptions = { accessToken, refreshToken };
      }
    } catch (err) {
      console.error("[MCP] Failed to hydrate live MCP tools from Redis:", err);
    }
  }

  if (
    !clientOptions?.accessToken &&
    !clientOptions?.refreshToken &&
    userId &&
    userId !== "anonymous"
  ) {
    try {
      const token = jwt.sign(
        { userId, sub: userId },
        env.JWT_ACCESS_TOKEN_SERECT,
        { expiresIn: "10m" },
      );
      clientOptions = { accessToken: token };
    } catch {}
  }

  if (!clientOptions?.accessToken && !clientOptions?.refreshToken) return [];

  return await getMCPServerTools(clientOptions);
};

export default getMCPClient;
