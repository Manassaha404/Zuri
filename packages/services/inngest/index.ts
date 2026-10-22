import { serve } from "inngest/express";
import { inngest } from "./client";
import { AgentFunction } from "./AgentFunction";
export const inngestRouter = serve({
  client: inngest,
  functions: [...AgentFunction],
  serveOrigin: "http://localhost:8000",
});

export { inngest };
