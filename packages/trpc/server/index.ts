import "dotenv/config";
import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { uploadRouter } from "./routes/upload/route";
import { router } from "./trpc";
import { agentRouter } from "./routes/agent/route";
import { notesRouter } from "./routes/notes/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  upload: uploadRouter,
  agent: agentRouter,
  notes: notesRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
