import { Redis } from "ioredis";

const createRedisConnection = () => {
  return new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: 6379,
  });
};

export const publisher = createRedisConnection();
export const subscriber = createRedisConnection();
