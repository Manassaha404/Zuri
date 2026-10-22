import { Server } from "socket.io";
import { subscriber } from "@repo/redis/pubsub";

const AGENT_STATUS_CHANNEL_NAME = "redis:agent:status";

let isSubscribed = false;

async function subscribe() {
  await subscriber.subscribe(AGENT_STATUS_CHANNEL_NAME);
}

export function registerAgentSocket(io: Server) {
  if (!isSubscribed) {
    isSubscribed = true;

    subscribe().catch((err) => {
      console.error("Failed to subscribe to Redis agent channels:", err);
    });

    subscriber.on("message", (channel, message) => {
      if (channel === AGENT_STATUS_CHANNEL_NAME) {
        const { jobId, topic, payload } = JSON.parse(message);
        io.to(`agent:${jobId}`).emit(topic, payload);
      }
    });
  }

  io.on("connection", (socket) => {
    socket.on("join:agent", (jobId: string) => {
      socket.join(`agent:${jobId}`);
    });
    socket.on("leave:agent", (jobId: string) => {
      socket.leave(`agent:${jobId}`);
    });
  });
}
