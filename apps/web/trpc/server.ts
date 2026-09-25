import { createTRPCClient } from "@repo/trpc/client";
import type { ServerRouter } from "@repo/trpc/client";
import { createTRPCLink } from "./create-client";

export const api = createTRPCClient<ServerRouter>({
  links: [createTRPCLink()],
});
