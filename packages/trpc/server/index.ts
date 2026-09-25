import "dotenv/config";
import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { router } from "./trpc";


export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
