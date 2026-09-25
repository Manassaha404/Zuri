import Redis from "ioredis";
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: 6379,
});

export default redis;
