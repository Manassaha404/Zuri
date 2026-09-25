import { Server } from "socket.io";
import { env } from "./env";


const io = new Server({
  cors: {
    origin: [env.CLIENT_URL, env.API_BASE_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});



const attachSocketServer = (httpServer: any) => {
  io.attach(httpServer);
};

export { io, attachSocketServer };
