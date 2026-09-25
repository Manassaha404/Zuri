import db, { eq, or, and } from "@repo/database";
import { users } from "@repo/database/models/users";
import * as bcrypt from "bcrypt";
import * as crypto from "node:crypto";
import { auths } from "@repo/database/models/auths";
import {
  createVerifiedUserDto,
  createVerifiedUserType,
  forgotPasswordDto,
  forgotPasswordType,
  getMeDto,
  getMetype,
  loginWithEmailAndPasswordDto,
  loginWithEmailAndPasswordType,
  registerWithEmailAndPasswordDto,
  registerWithEmailAndPasswordType,
  resetPasswordDto,
  resetPasswordType,
  changeUsernameDto,
  changeUsernameType,
  updateProfileDto,
  updateProfileType,
} from "./model";
import { AppError } from "@repo/error";
class AuthServices {
  public async registerWithEmailAndPassword(
    payload: registerWithEmailAndPasswordType,
  ) {
    const { firstName, lastName, id, email, username, password } =
      await registerWithEmailAndPasswordDto.parseAsync(payload);
    const existingUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)));

    if (existingUsers.length > 0) {
      throw new AppError("CONFLICT", "email or username already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationOtp = crypto.randomInt(100000, 1000000).toString();
    return {
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      verificationOtp,
      id,
    };
  }
  public async createVerifiedUser(payload: createVerifiedUserType) {
    const { firstName, lastName, email, username, password } =
      await createVerifiedUserDto.parseAsync(payload);
    const user = await db.transaction(async (tx) => {
      const [userData] = await tx
        .insert(users)
        .values({
          firstName,
          lastName,
          email,
          username,
        })
        .returning();
      if (!userData) {
        throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create user");
      }
      await tx.insert(auths).values({
        userId: userData.userId,
        password,
        isVerified: true,
      });
      return userData;
    });
    return user;
  }
  public async getme(payload: getMetype) {
    const { userId } = await getMeDto.parseAsync(payload);
    const [user] = await db
      .select()
      .from(users)
      .leftJoin(auths, eq(auths.userId, userId))
      .where(eq(users.userId, userId));

    if (!user) {
      throw new AppError("NOT_FOUND", "user not found");
    }
    return { ...user };
  }

  public async loginWithEmailAndPassword(
    payload: loginWithEmailAndPasswordType,
  ) {
    const { emailOrUsername, password } =
      await loginWithEmailAndPasswordDto.parseAsync(payload);

    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername),
          eq(users.username, emailOrUsername),
        ),
      );

    if (!user) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials");
    }

    const [auth] = await db
      .select()
      .from(auths)
      .where(eq(auths.userId, user.userId));

    if (!auth) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials");
    }

    if (!auth.password) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials");
    }

    if (auth.lockedUntil && auth.lockedUntil > new Date()) {
      throw new AppError(
        "UNAUTHORIZED",
        "Account is locked. Please try again later.",
      );
    }
    const isPasswordValid = await bcrypt.compare(password, auth.password);

    if (!isPasswordValid) {
      auth.failedLoginAttempts += 1;
      if (auth.failedLoginAttempts >= 5) {
        await db
          .update(auths)
          .set({
            failedLoginAttempts: 0,
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          }) // Lock account for 15 minutes
          .where(eq(auths.userId, user.userId));
        throw new AppError(
          "UNAUTHORIZED",
          "Account locked due to multiple failed login attempts",
        );
      } else {
        await db
          .update(auths)
          .set({ failedLoginAttempts: auth.failedLoginAttempts })
          .where(eq(auths.userId, user.userId));
        throw new AppError("UNAUTHORIZED", "Invalid credentials");
      }
    }
    auth.lockedUntil = null;
    auth.failedLoginAttempts = 0;
    auth.lastLoginAt = new Date();
    await db
      .update(auths)
      .set({
        lockedUntil: auth.lockedUntil,
        failedLoginAttempts: auth.failedLoginAttempts,
        lastLoginAt: auth.lastLoginAt,
      })
      .where(eq(auths.userId, user.userId));
    return { user };
  }

  public async forgotPassword(payload: forgotPasswordType) {
    const { email } = await forgotPasswordDto.parseAsync(payload);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    return { otp, otpExpiry };
  }
  public async resetPassword(payload: resetPasswordType) {
    const { email, newPassword } = await resetPasswordDto.parseAsync(payload);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(auths)
      .set({ password: hashedPassword })
      .where(eq(auths.userId, user.userId));

    return { success: true };
  }

  public async changeUsername(userId: string, payload: changeUsernameType) {
    const { newUsername } = await changeUsernameDto.parseAsync(payload);
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, newUsername));

    if (existing) {
      throw new AppError("CONFLICT", "Username already exists");
    }

    await db
      .update(users)
      .set({ username: newUsername })
      .where(eq(users.userId, userId));

    return { success: true, newUsername };
  }

  public async updateProfile(userId: string, payload: updateProfileType) {
    const { firstName, lastName, username, avatarUrl } =
      await updateProfileDto.parseAsync(payload);

    if (username) {
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      const isOtherUser = existingUsers.some((u) => u.userId !== userId);
      if (isOtherUser) {
        throw new AppError("CONFLICT", "Username already exists");
      }
    }

    const updates: Partial<typeof users.$inferInsert> = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (username) updates.username = username;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl; // allow empty string to remove maybe? Or just use as is

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.userId, userId));
    }

    return { success: true };
  }
}

export default AuthServices;
