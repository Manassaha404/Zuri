import { CookieOptions, Response, Request } from "express";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export function setCookieFactory(res: Response) {
  return function (name: string, cookie: string, options = cookieOptions) {
    return res.cookie(name, cookie, options as Partial<CookieOptions>);
  };
}

export function getCookieFactory(req: Request) {
  return function (name: string) {
    return req.cookies?.[name];
  };
}

export function clearCookieFactory(res: Response) {
  return function (name: string) {
    res.clearCookie(name);
  };
}
