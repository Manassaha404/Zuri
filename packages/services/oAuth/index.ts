import db, { eq, like } from "@repo/database";
import { auths } from "@repo/database/models/auths";
import { users } from "@repo/database/models/users";
import { AppError } from "@repo/error";
import { env } from "../env";

import {
  GoogleUserInfo,
  ExchangeCodeParams,
  GetGoogleUserInfoParams,
  FindOrCreateUserParams,
} from "./model";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

import { encrypt } from "../utils/encryption";

class OauthService {
  //auth
  private async generateUniqueUsername(base: string): Promise<string> {
    const sanitized = base
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);

    const baseName = sanitized || "user";

    const existing = await db
      .select()
      .from(users)
      .where(like(users.username, `${baseName}%`));

    if (!existing.length) return baseName;

    const taken = new Set(existing.map((u) => u.username));
    let candidate: string;
    do {
      candidate = `${baseName}_${Math.floor(1000 + Math.random() * 9000)}`;
    } while (taken.has(candidate));

    return candidate;
  }

  public getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline", // to get refresh_token
      prompt: "consent", // force consent to always get refresh_token
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  public async exchangeCodeForTokens({ code }: ExchangeCodeParams): Promise<{
    access_token: string;
    refresh_token?: string;
  }> {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        `Token exchange failed: ${err.error_description}`,
      );
    }
    return res.json();
  }

  public async getGoogleUserInfo({
    accessToken,
  }: GetGoogleUserInfoParams): Promise<GoogleUserInfo> {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error("Failed to fetch Google user info");

    return res.json();
  }

  public async findOrCreateUser({
    googleUser,
    refreshToken,
  }: FindOrCreateUserParams): Promise<{ userId: string; isNewUser: boolean }> {
    // Case 1: Already linked Google account
    const [existingAuth] = await db
      .select()
      .from(auths)
      .where(eq(auths.googleAccountId, googleUser.sub));

    if (existingAuth) {
      await db
        .update(auths)
        .set({
          googleRefreshToken: refreshToken ?? existingAuth.googleRefreshToken,
          lastLoginAt: new Date(),
        })
        .where(eq(auths.authId, existingAuth.authId));

      return { userId: existingAuth.userId, isNewUser: false };
    }

    // Case 2: Email exists — link Google to the existing account
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email));

    if (existingUser) {
      const [existingAuthRecord] = await db
        .select()
        .from(auths)
        .where(eq(auths.userId, existingUser.userId));

      if (existingAuthRecord) {
        await db
          .update(auths)
          .set({
            googleAccountId: googleUser.sub,
            googleRefreshToken:
              refreshToken ?? existingAuthRecord.googleRefreshToken,
            isVerified: true,
            lastLoginAt: new Date(),
          })
          .where(eq(auths.authId, existingAuthRecord.authId));
      } else {
        await db.insert(auths).values({
          userId: existingUser.userId,
          password: null,
          googleAccountId: googleUser.sub,
          googleRefreshToken: refreshToken ?? null,
          isVerified: true,
          lastLoginAt: new Date(),
        });
      }

      return {
        userId: existingUser.userId,
        isNewUser: false,
      };
    }

    // Case 3: Brand new user — transaction
    return await db.transaction(async (tx) => {
      const username = await this.generateUniqueUsername(
        googleUser.given_name ?? googleUser.email.split("@")[0],
      );

      const [newUser] = await tx
        .insert(users)
        .values({
          firstName: googleUser.given_name ?? "User",
          lastName: googleUser.family_name ?? "",
          username,
          email: googleUser.email,
          avatarUrl: googleUser.picture ?? null,
        })
        .returning();
      if (!newUser) {
        throw new AppError(
          "INTERNAL_SERVER_ERROR",
          "problem to create the user",
        );
      }
      const [newAuth] = await tx
        .insert(auths)
        .values({
          userId: newUser.userId,
          password: null, // no password for OAuth users
          googleAccountId: googleUser.sub,
          googleRefreshToken: refreshToken ?? null,
          isVerified: true, // Google already verified the email
          lastLoginAt: new Date(),
        })
        .returning();
      if (!newAuth) {
        throw new AppError(
          "INTERNAL_SERVER_ERROR",
          "problem to create the user",
        );
      }
      return { userId: newUser.userId, isNewUser: true };
    });
  }
}

export default OauthService;
