import { serve } from "inngest/express";
import { inngest } from "./client";
export const inngestRouter = serve({
  client: inngest,
  functions: [],
  serveOrigin: "http://localhost:8000",
});

export { inngest };
