import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import {
  serverRouter,
  createContext,
} from "@repo/trpc/server";
import { env } from "./env";
import cookieParser from "cookie-parser";
import authRouter from "./authRouter";
import { inngestRouter } from "@repo/services/inngest/index";
import rateLimiter from "@repo/services/utils/rateLimiting";
import logger from "@repo/logger/logger";


export const app = express();
app.set("trust proxy", 1);

const inngestCors = cors({
  origin: (origin, callback) => {
    const allowed = [
      "http://localhost:8288",
      "http://127.0.0.1:8288",
      "https://app.inngest.com",
      "https://api.inngest.com",
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-inngest-signature",
    "x-inngest-sdk",
    "x-inngest-expected-server-kind",
  ],
  credentials: false,
});

app.use(express.json());

app.use("/api/inngest", inngestCors, inngestRouter);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

app.use((req, res, next) => {
  return rateLimiter(req, res, next);
});

app.get("/", (req, res) => {
  return res.json({ message: "server is running.." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "VibeCheck server is healthy", healthy: true });
});

app.use("/auth", authRouter);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);
export default app;
