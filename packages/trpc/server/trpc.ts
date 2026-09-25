import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { createContext } from "./context";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "./utils/jwt";

export const tRPCContext = initTRPC
  .context<typeof createContext>()
  .meta<OpenApiMeta>()
  .create({});

export const router = tRPCContext.router;

const isProduction = process.env.NODE_ENV === "production";

const getGuestToken = tRPCContext.middleware(({ ctx, next }) => {
  let guestToken;
  guestToken = ctx.getCookie("guestToken");
  if (!guestToken) {
    guestToken = crypto.randomUUID();
    ctx.setCookie("guestToken", guestToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 24 * 365 * 20,
      path: "/",
    });
  }
  return next({ ctx: { ...ctx, guestToken } });
});

const getOptionalUser = tRPCContext.middleware(({ ctx, next }) => {
  const accessToken = ctx.getCookie("accessToken");
  const refreshToken = ctx.getCookie("refreshToken");

  let userId: string | undefined = undefined;

  try {
    if (accessToken) {
      const decoded = verifyAccessToken(accessToken);
      userId = decoded.userId;
    } else {
      throw new Error("Missing access token");
    }
  } catch (error) {
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        userId = decoded.userId;

        const newAccessToken = generateAccessToken(userId);
        const newRefreshToken = generateRefreshToken(userId);
        ctx.setCookie("accessToken", newAccessToken);
        ctx.setCookie("refreshToken", newRefreshToken);
      } catch (refreshError) {
        // Token is invalid, user remains undefined
      }
    }
  }

  return next({
    ctx: {
      ...ctx,
      user: userId ? { id: userId } : null,
    },
  });
});

export const publicProcedure = tRPCContext.procedure
  .use(getGuestToken)
  .use(getOptionalUser);

const isAuthed = tRPCContext.middleware(async ({ ctx, next }) => {
  const accessToken = ctx.getCookie("accessToken");
  const refreshToken = ctx.getCookie("refreshToken");

  if (!accessToken && !refreshToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  let userId: string;
  try {
    if (accessToken) {
      const decoded = verifyAccessToken(accessToken);
      userId = decoded.userId;
    } else {
      throw new Error("Missing access token");
    }
  } catch (error) {
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        userId = decoded.userId;
        // plan = await subscriptionService.getUserPlan(userId);
        const newAccessToken = generateAccessToken(userId);
        const newRefreshToken = generateRefreshToken(userId);
        ctx.setCookie("accessToken", newAccessToken);
        ctx.setCookie("refreshToken", newRefreshToken);
      } catch (refreshError) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session expired. Please log in again.",
        });
      }
    } else {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token.",
      });
    }
  }

  return next({
    ctx: {
      ...ctx,
      user: {
        id: userId,
      },
    },
  });
});

export const protectedProcedure = tRPCContext.procedure.use(isAuthed);


