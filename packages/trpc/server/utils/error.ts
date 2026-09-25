import { AppError } from "@repo/error";
import { TRPCError } from "@trpc/server/unstable-core-do-not-import";
import { z } from "zod";
import logger from "@repo/logger/logger";

export const handleRouteError = (error: unknown): never => {
  if (
    error instanceof AppError ||
    (error instanceof Error && error.name === "AppError")
  ) {
    throw new TRPCError({
      code: (error as AppError).code as any,
      message: (error as Error).message,
    });
  }
  if (error instanceof z.ZodError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.issues.map((e) => e.message).join(", "),
    });
  }

  if (error instanceof Error) {
    logger.error(
      `[tRPC] Unhandled ${error.constructor.name}: ${error.message}`,
      { stack: error.stack },
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "development"
          ? `${error.constructor.name}: ${error.message}`
          : "An unexpected error occurred",
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};
