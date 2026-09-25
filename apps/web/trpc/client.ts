import { createTRPCReact } from "@trpc/react-query";
import type { ServerRouter } from "@repo/trpc/client";

type TRPCReact = ReturnType<typeof createTRPCReact<ServerRouter>>;

export const trpc: TRPCReact = createTRPCReact<ServerRouter>();
