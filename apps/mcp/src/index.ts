import "dotenv/config";
import logger from "@repo/logger/logger";
import { mcpServer } from "./server";
import { env } from "./env";
async function main() {
  const port = parseInt(env.PORT, 10) || 8000;
  try {
    await mcpServer.start({
      transportType: "httpStream",
      httpStream: {
        port,
        endpoint: "/mcp",
        sseEndpoint: "/sse",
      },
    });
    logger.info(`FastMCP Remote Server running at ${env.BASE_URL}`);
    logger.info(`MCP Endpoint: ${env.BASE_URL}/mcp`);
    logger.info(`SSE Endpoint: ${env.BASE_URL}/sse`);
    logger.info(`OAuth 2.1 Authorize: ${env.BASE_URL}/oauth/authorize`);
    logger.info(`OAuth 2.1 Token: ${env.BASE_URL}/oauth/token`);
    logger.info(`Auth API: ${env.BASE_URL}/api/auth/register & /login`);
  } catch (error) {
    logger.error("Failed to start FastMCP server:", error);
    process.exit(1);
  }
}
main();
