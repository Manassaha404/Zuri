import { Server } from "socket.io";
import { env } from "./env";

import { registerAgentSocket } from "./agentSocket";

const io = new Server({
  cors: {
    origin: [
      env.CLIENT_URL,
      env.API_BASE_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const attachSocketServer = (httpServer: any) => {
  io.attach(httpServer);
  registerAgentSocket(io);
};

export { io, attachSocketServer };
