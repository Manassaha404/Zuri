import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import {
  setCookieFactory,
  getCookieFactory,
  clearCookieFactory,
} from "./utils/cookie";

export interface TRPCContext {
  setCookie: ReturnType<typeof setCookieFactory>;
  getCookie: ReturnType<typeof getCookieFactory>;
  clearCookie: ReturnType<typeof clearCookieFactory>;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const ctx: TRPCContext = {
    setCookie: setCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),
  };
  return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;
