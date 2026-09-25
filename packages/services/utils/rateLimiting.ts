import { NextFunction, Request, Response } from "express";
import redis from "../redis";
const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_REQUESTS = 100;

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress;
  const key = `rate-limit-${ip}`;
  const now = new Date();
  const windowStart = now.getTime() - WINDOW_SIZE_IN_SECONDS * 1000;
  const member = `${now}-${Math.random().toString(36).substring(2)}`;
  try {
    const results = await redis
      .multi()
      .zremrangebyscore(key, 0, windowStart)
      .zadd(key, now.getTime(), member)
      .zcard(key)
      .expire(key, WINDOW_SIZE_IN_SECONDS)
      .exec();

    const requestCount = (results?.[2]?.[1] as number) ?? 0;
    if (requestCount > MAX_REQUESTS) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter: WINDOW_SIZE_IN_SECONDS,
      });
    }
    next();
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fail open: If Redis goes down, allow the request so API doesn't crash
    next();
  }
};
export default rateLimiter;
