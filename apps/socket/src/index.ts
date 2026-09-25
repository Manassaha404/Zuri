import "dotenv/config";
import http from "node:http";
import logger from "@repo/logger/logger";
import { env } from "./env";
import { attachSocketServer } from "@repo/socket/index";

async function init() {
  try {
    const server = http.createServer();
    attachSocketServer(server);

    const PORT: number = env.PORT ? +env.PORT : 8080;
    server.listen(PORT, () => {
      logger.info(`Socket server is running on PORT ${PORT}`);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}
init();
