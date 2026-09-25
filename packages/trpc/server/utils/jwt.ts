import * as jwt from "jsonwebtoken";
import { env } from "../env";
import { AppError } from "@repo/error";
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_ACCESS_TOKEN_SERECT, {
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY as
      `${number}${"s" | "m" | "h" | "d"}` | number,
  });
};

export const verifyAccessToken = (
  token: string,
): jwt.JwtPayload & { userId: string } => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_TOKEN_SERECT) as jwt.JwtPayload & {
      userId: string;
    };
  } catch {
    throw new AppError("UNAUTHORIZED", "token is invalid");
  }
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_TOKEN_SERECT, {
    expiresIn: env.JWT_REFRESH_TOKEN_EXPIRY as
      `${number}${"s" | "m" | "h" | "d"}` | number,
  });
};

export const verifyRefreshToken = (
  token: string,
): jwt.JwtPayload & { userId: string } => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_TOKEN_SERECT) as jwt.JwtPayload & {
      userId: string;
    };
  } catch {
    throw new AppError("UNAUTHORIZED", "token is invalid");
  }
};
