import "dotenv/config";
import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { uploadRouter } from "./routes/upload/route";
import { router } from "./trpc";
import { agentRouter } from "./routes/agent/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  upload: uploadRouter,
  agent: agentRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
