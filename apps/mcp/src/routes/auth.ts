import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import * as crypto from "node:crypto";
import { z } from "zod";
import { AppError } from "@repo/error";
import AuthServices from "@repo/services/auth";
import EmailServices from "@repo/services/email";
import OauthService from "@repo/services/oAuth";
import { oAuthServerService } from "@repo/services/mcp-oauth";
import redis from "@repo/services/redis";
import {
  registerWithEmailAndPasswordDto,
  loginWithEmailAndPasswordDto,
  verifySignUpOtpDto,
  resendOtpDto,
  resetPasswordRouteDto,
  changeUsernameRouteDto,
  updateProfileRouteDto,
  forgotPasswordRouteDto,
} from "@repo/services/auth/model";
import logger from "@repo/logger/logger";
import { env } from "../env";

const authService = new AuthServices();
const emailServices = new EmailServices();
const oAuthService = new OauthService();

export const authRoutes = new Hono();

function handleAuthError(
  c: any,
  err: any,
  fallbackMessage: string,
  defaultStatus = 400,
) {
  if (err instanceof z.ZodError) {
    return c.json({ error: err.issues.map((e) => e.message).join(", ") }, 400);
  }
  if (
    err instanceof AppError ||
    (err instanceof Error && err.name === "AppError")
  ) {
    const statusMap: Record<string, number> = {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      INTERNAL_SERVER_ERROR: 500,
    };
    const status = statusMap[(err as AppError).code] || defaultStatus;
    return c.json({ error: err.message }, status);
  }
  return c.json({ error: err?.message || fallbackMessage }, defaultStatus);
}

interface McpAuthState {
  authMode?: string;
  clientId?: string;
  redirectUri?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  mcpState?: string;
  scope?: string;
  returnTo?: string;
}

function getGoogleCallbackUrl(): string {
  return `${env.BASE_URL}/auth/google/callback`;
}

function setAuthCookies(c: any, accessToken: string, refreshToken: string) {
  const isProduction = env.NODE_ENV === "production";
  const sameSite = isProduction ? ("None" as const) : ("Lax" as const);

  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  setCookie(c, "accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 15 * 60,
    path: "/",
  });
}

function clearAuthCookies(c: any) {
  const isProduction = env.NODE_ENV === "production";
  const sameSite = isProduction ? ("None" as const) : ("Lax" as const);

  deleteCookie(c, "refreshToken", {
    path: "/",
    secure: isProduction,
    sameSite,
  });
  deleteCookie(c, "accessToken", {
    path: "/",
    secure: isProduction,
    sameSite,
  });
}

// handel google auth
async function handleGoogleAuth(c: any) {
  const returnTo = c.req.query("returnTo");
  const authMode = c.req.query("auth_mode");
  const clientId = c.req.query("client_id");
  const redirectUri = c.req.query("redirect_uri");
  const codeChallenge = c.req.query("code_challenge");
  const codeChallengeMethod = c.req.query("code_challenge_method");
  const mcpState = c.req.query("state");
  const scope = c.req.query("scope");

  const statePayload: McpAuthState = {
    returnTo:
      typeof returnTo === "string" && returnTo.startsWith("/")
        ? returnTo
        : undefined,
    authMode: authMode || (clientId ? "mcp" : undefined),
    clientId: clientId || undefined,
    redirectUri: redirectUri || undefined,
    codeChallenge: codeChallenge || undefined,
    codeChallengeMethod: codeChallengeMethod || undefined,
    mcpState: mcpState || undefined,
    scope: scope || undefined,
  };

  const serializedState = Buffer.from(JSON.stringify(statePayload)).toString(
    "base64url",
  );
  const isProduction = env.NODE_ENV === "production";

  setCookie(c, "oauth_mcp_state", serializedState, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    maxAge: 10 * 60,
    path: "/",
  });

  const googleAuthUrl = oAuthService.getGoogleAuthUrl({
    redirectUri: getGoogleCallbackUrl(),
    state: serializedState,
  });

  return c.redirect(googleAuthUrl);
}
authRoutes.get("/auth/google", handleGoogleAuth);
authRoutes.get("/api/auth/google", handleGoogleAuth);
async function handleGoogleCallback(c: any) {
  const code = c.req.query("code");
  const error = c.req.query("error");
  const stateQuery = c.req.query("state");
  const stateCookie = getCookie(c, "oauth_mcp_state");

  deleteCookie(c, "oauth_mcp_state", { path: "/" });

  let stateData: McpAuthState = {};
  try {
    const rawState = stateQuery || stateCookie;
    if (rawState) {
      stateData = JSON.parse(
        Buffer.from(rawState, "base64url").toString("utf-8"),
      );
    }
  } catch (err) {
    logger.warn("Failed to parse Google OAuth state:", err);
  }

  const isMcpFlow = Boolean(stateData.clientId && stateData.redirectUri);
  const basePath = stateData.returnTo || "";

  if (error || !code) {
    logger.warn("Google OAuth failed or cancelled:", error);
    if (isMcpFlow && stateData.redirectUri) {
      const redirectUrl = new URL(stateData.redirectUri);
      redirectUrl.searchParams.set("error", "access_denied");
      if (stateData.mcpState)
        redirectUrl.searchParams.set("state", stateData.mcpState);
      return c.redirect(redirectUrl.toString(), 302);
    }

    const redirectUrl = new URL(`${env.CLIENT_URL}/signin`);
    redirectUrl.searchParams.set("error", "oauth_cancelled");
    if (basePath) redirectUrl.searchParams.set("returnTo", basePath);
    return c.redirect(redirectUrl.toString(), 302);
  }

  try {
    const { access_token, refresh_token } =
      await oAuthService.exchangeCodeForTokens({
        code,
        redirectUri: getGoogleCallbackUrl(),
      });

    const googleUser = await oAuthService.getGoogleUserInfo({
      accessToken: access_token,
    });

    if (!googleUser.email_verified) {
      if (isMcpFlow && stateData.redirectUri) {
        const redirectUrl = new URL(stateData.redirectUri);
        redirectUrl.searchParams.set("error", "email_not_verified");
        if (stateData.mcpState)
          redirectUrl.searchParams.set("state", stateData.mcpState);
        return c.redirect(redirectUrl.toString(), 302);
      }
      return c.redirect(
        `${env.CLIENT_URL}/signin?error=email_not_verified`,
        302,
      );
    }

    const { userId, isNewUser } = await oAuthService.findOrCreateUser({
      googleUser,
      refreshToken: refresh_token,
    });

    const accessToken = oAuthServerService.generateAccessToken({
      userId,
      email: googleUser.email,
      username: googleUser.email.split("@")[0] || "user",
      scope: stateData.scope || "mcp:tools mcp:resources mcp:prompts",
    });

    const appRefreshToken = jwt.sign({ userId }, env.JWT_REFRESH_TOKEN_SERECT, {
      expiresIn: "7d",
    });

    await oAuthService.updateUserTokens(userId, accessToken, appRefreshToken);
    setAuthCookies(c, accessToken, appRefreshToken);

    // If coming from MCP Authorize PKCE flow, issue authorization code
    if (isMcpFlow && stateData.clientId && stateData.redirectUri) {
      const authCode = await oAuthServerService.createAuthorizationCode({
        clientId: stateData.clientId,
        userId,
        redirectUri: stateData.redirectUri,
        codeChallenge: stateData.codeChallenge || "",
        codeChallengeMethod:
          (stateData.codeChallengeMethod as "S256") || "S256",
        scope: stateData.scope || "mcp:tools mcp:resources mcp:prompts",
      });

      const redirectUrl = new URL(stateData.redirectUri);
      redirectUrl.searchParams.set("code", authCode);
      if (stateData.mcpState) {
        redirectUrl.searchParams.set("state", stateData.mcpState);
      }
      return c.redirect(redirectUrl.toString(), 302);
    }

    // Direct Web Redirect
    if (isNewUser) {
      const redirectUrl = new URL(`${env.CLIENT_URL}/username`);
      if (basePath) redirectUrl.searchParams.set("returnTo", basePath);
      return c.redirect(redirectUrl.toString(), 302);
    }

    return c.redirect(`${env.CLIENT_URL}${basePath}`, 302);
  } catch (err: any) {
    logger.error("Google OAuth callback error:", err);
    if (isMcpFlow && stateData.redirectUri) {
      const redirectUrl = new URL(stateData.redirectUri);
      redirectUrl.searchParams.set("error", "server_error");
      if (stateData.mcpState)
        redirectUrl.searchParams.set("state", stateData.mcpState);
      return c.redirect(redirectUrl.toString(), 302);
    }

    const redirectUrl = new URL(`${env.CLIENT_URL}/signin`);
    redirectUrl.searchParams.set("error", "server_error");
    if (basePath) redirectUrl.searchParams.set("returnTo", basePath);
    return c.redirect(redirectUrl.toString(), 302);
  }
}
authRoutes.get("/auth/google/callback", handleGoogleCallback);
authRoutes.get("/api/auth/google/callback", handleGoogleCallback);

// Register with Email and Password
authRoutes.post("/api/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const validated = await registerWithEmailAndPasswordDto.parseAsync({
      ...body,
      id,
    });

    const { firstName, lastName, email, username, password, verificationOtp } =
      await authService.registerWithEmailAndPassword(validated);

    await redis.hset(id, {
      firstName,
      lastName,
      email,
      username,
      password,
      verificationOtp,
    });
    await redis.expire(id, 60 * 5);
    await emailServices.sendVerificationEmail(email, verificationOtp);

    return c.json({
      message: "verification email sent successfully",
      id,
    });
  } catch (err: any) {
    logger.error("Registration error:", err);
    return handleAuthError(c, err, "Registration failed", 400);
  }
});

// Verify Sign-Up OTP
async function handleVerifySignUpOtp(c: any) {
  try {
    const body = await c.req.json();
    const { id, otp } = await verifySignUpOtpDto.parseAsync(body);

    const userData = await redis.hgetall(id);
    if (!userData || Object.keys(userData).length === 0) {
      return c.json({ error: "Invalid or expired OTP" }, 400);
    }
    if (userData.verificationOtp !== otp) {
      return c.json({ error: "Invalid OTP" }, 400);
    }

    const { firstName, lastName, email, username, password } = userData;
    const user = await authService.createVerifiedUser({
      firstName,
      lastName,
      email,
      username,
      password,
    } as any);

    const accessToken = oAuthServerService.generateAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      scope: "mcp:tools mcp:resources mcp:prompts",
    });

    const refreshToken = jwt.sign(
      { userId: user.userId },
      env.JWT_REFRESH_TOKEN_SERECT,
      { expiresIn: "7d" },
    );

    await authService.updateUserTokens(user.userId, accessToken, refreshToken);
    setAuthCookies(c, accessToken, refreshToken);
    await redis.del(id);

    return c.json({
      message: "User verified and logged in successfully",
      user,
      accessToken,
    });
  } catch (err: any) {
    logger.warn("Verify OTP failed:", err.message);
    return handleAuthError(c, err, "Verification failed", 400);
  }
}

authRoutes.post("/api/auth/verify-otp", handleVerifySignUpOtp);
authRoutes.post("/api/auth/verify-signup-otp", handleVerifySignUpOtp);

// Resend Sign-Up Verification OTP
authRoutes.post("/api/auth/resend-otp", async (c) => {
  try {
    const body = await c.req.json();
    const { id } = await resendOtpDto.parseAsync(body);

    const data = await redis.hgetall(id);
    if (!data || Object.keys(data).length === 0) {
      return c.json({ error: "Invalid request" }, 400);
    }
    if (!data.email) {
      return c.json({ error: "Invalid request data" }, 400);
    }

    const newOtp = crypto.randomInt(100000, 1000000).toString();
    await redis.hset(id, { ...data, verificationOtp: newOtp });
    await redis.expire(id, 60 * 5);
    await emailServices.sendVerificationEmail(data.email, newOtp);

    return c.json({ message: "New OTP sent successfully" });
  } catch (err: any) {
    return handleAuthError(c, err, "Failed to resend OTP", 400);
  }
});

// Login with Email or Username + Password
authRoutes.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const validated = await loginWithEmailAndPasswordDto.parseAsync(body);

    const { user } = await authService.loginWithEmailAndPassword(validated);

    const accessToken = oAuthServerService.generateAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      scope: "mcp:tools mcp:resources mcp:prompts",
    });

    const refreshToken = jwt.sign(
      { userId: user.userId },
      env.JWT_REFRESH_TOKEN_SERECT,
      { expiresIn: "7d" },
    );

    await authService.updateUserTokens(user.userId, accessToken, refreshToken);
    setAuthCookies(c, accessToken, refreshToken);

    return c.json({
      message: "Logged in successfully",
      user,
      accessToken,
    });
  } catch (err: any) {
    logger.warn("Login failed:", err.message);
    return handleAuthError(c, err, "Invalid credentials", 401);
  }
});

// Get Current User Profile (Bearer Token or Cookie Protected)
authRoutes.get("/api/auth/me", async (c) => {
  const authHeader = c.req.header("authorization");
  const cookieToken = getCookie(c, "accessToken");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : cookieToken;

  if (!token) {
    return c.json({ error: "Unauthorized: Missing authentication token" }, 401);
  }

  try {
    const payload = oAuthServerService.verifyAccessToken(token);
    const profile = await authService.getme({ userId: payload.sub });
    return c.json({ user: profile.users, users: profile.users });
  } catch (err: any) {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }
});

// Refresh Access Token
authRoutes.post("/api/auth/refresh", async (c) => {
  let refreshToken = getCookie(c, "refreshToken");
  if (!refreshToken) {
    const body = await c.req.json().catch(() => ({}));
    refreshToken = body.refreshToken;
  }

  if (!refreshToken) {
    return c.json({ error: "Missing refresh token" }, 401);
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_TOKEN_SERECT,
    ) as jwt.JwtPayload & { userId: string };

    const profile = await authService.getme({ userId: decoded.userId });
    const user = profile.users;

    const newAccessToken = oAuthServerService.generateAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      scope: "mcp:tools mcp:resources mcp:prompts",
    });

    const newRefreshToken = jwt.sign(
      { userId: user.userId },
      env.JWT_REFRESH_TOKEN_SERECT,
      { expiresIn: "7d" },
    );

    await authService.updateUserTokens(
      user.userId,
      newAccessToken,
      newRefreshToken,
    );
    setAuthCookies(c, newAccessToken, newRefreshToken);

    return c.json({ accessToken: newAccessToken });
  } catch (err: any) {
    clearAuthCookies(c);
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }
});

// Logout
async function handleLogout(c: any) {
  const authHeader = c.req.header("authorization");
  const cookieToken = getCookie(c, "accessToken");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : cookieToken;

  if (token) {
    try {
      const payload = oAuthServerService.verifyAccessToken(token);
      if (payload?.sub) {
        await authService.clearUserTokens(payload.sub);
      }
    } catch {
      // Token may be invalid or expired; proceed to clear cookies
    }
  }

  clearAuthCookies(c);
  return c.json({ message: "Logged out successfully" });
}

authRoutes.post("/api/auth/logout", handleLogout);
authRoutes.get("/api/auth/logout", handleLogout);

// Forgot Password (stores OTP in Redis with TTL and sends email)
authRoutes.post("/api/auth/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const validated = await forgotPasswordRouteDto.parseAsync({
      ...body,
      id,
    });

    const { otp, otpExpiry } = await authService.forgotPassword({
      email: validated.email,
    });

    await redis.hset(id, { email: validated.email, otp });
    const ttlInSeconds = Math.max(
      1,
      Math.floor((otpExpiry.getTime() - Date.now()) / 1000),
    );
    await redis.expire(id, ttlInSeconds);

    await emailServices.sendPasswordResetEmail(validated.email, otp);

    return c.json({ message: "Password reset OTP sent successfully", id });
  } catch (err: any) {
    return handleAuthError(c, err, "Failed to process request", 400);
  }
});

// Reset Password with OTP verified from Redis
authRoutes.post("/api/auth/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { id, otp, newPassword } =
      await resetPasswordRouteDto.parseAsync(body);

    const data = await redis.hgetall(id);
    if (!data || Object.keys(data).length === 0) {
      return c.json({ error: "Invalid or expired reset link" }, 400);
    }
    if (data.otp !== otp) {
      return c.json({ error: "Invalid OTP" }, 400);
    }
    if (!data.email) {
      return c.json({ error: "Invalid reset link data" }, 400);
    }

    await authService.resetPassword({ email: data.email, newPassword });
    await redis.del(id);

    return c.json({ message: "Password updated successfully" });
  } catch (err: any) {
    return handleAuthError(c, err, "Failed to reset password", 400);
  }
});

// Change Username
authRoutes.post("/api/auth/change-username", async (c) => {
  const authHeader = c.req.header("authorization");
  const cookieToken = getCookie(c, "accessToken");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : cookieToken;

  if (!token) {
    return c.json({ error: "Unauthorized: Missing authentication token" }, 401);
  }

  try {
    const payload = oAuthServerService.verifyAccessToken(token);
    const body = await c.req.json();
    const validated = await changeUsernameRouteDto.parseAsync(body);
    const result = await authService.changeUsername(payload.sub, validated);
    return c.json({ message: "Username updated successfully", ...result });
  } catch (err: any) {
    return handleAuthError(c, err, "Failed to change username", 400);
  }
});

// Update Profile
async function handleUpdateProfile(c: any) {
  const authHeader = c.req.header("authorization");
  const cookieToken = getCookie(c, "accessToken");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : cookieToken;

  if (!token) {
    return c.json({ error: "Unauthorized: Missing authentication token" }, 401);
  }

  try {
    const payload = oAuthServerService.verifyAccessToken(token);
    const body = await c.req.json();
    const validated = await updateProfileRouteDto.parseAsync(body);
    const result = await authService.updateProfile(payload.sub, validated);
    return c.json({ message: "Profile updated successfully", ...result });
  } catch (err: any) {
    return handleAuthError(c, err, "Failed to update profile", 400);
  }
}

authRoutes.post("/api/auth/update-profile", handleUpdateProfile);
authRoutes.patch("/api/auth/profile", handleUpdateProfile);
