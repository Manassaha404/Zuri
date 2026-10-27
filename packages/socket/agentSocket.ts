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
        try {
          const { jobId, topic, payload } = JSON.parse(message);
          if (jobId) {
            io.to(`agent:${jobId}`).emit(topic, payload);
          }
          if (payload?.userId) {
            io.to(`user:${payload.userId}`).emit(topic, payload);
          }
        } catch (err) {
          console.error("Failed to parse agent status message:", err);
        }
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
    socket.on("join:user", (userId: string) => {
      socket.join(`user:${userId}`);
    });
    socket.on("leave:user", (userId: string) => {
      socket.leave(`user:${userId}`);
    });
  });
}
