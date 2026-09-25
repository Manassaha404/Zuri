import redis from "@repo/services/redis";
import { authService, oAuthService } from "../../services";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import {
  loginWithEmailAndPasswordDto,
  registerWithEmailAndPasswordDto,
} from "@repo/services/auth/model";
import { emailServices } from "../../services";
import { handleRouteError } from "../../utils/error";
import { AppError } from "@repo/error";
import {
  forgotPasswordDto,
  verifySignUpOtpDto,
  resetPasswordRouteDto,
  resendOtpDto,
  changeUsernameRouteDto,
  updateProfileRouteDto,
} from "./model";
import { z } from "zod";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import * as crypto from "node:crypto";
export const authRouter = router({
  registerUserWithEmailandPass: publicProcedure
    .input(registerWithEmailAndPasswordDto)
    .mutation(async ({ input }) => {
      try {
        const {
          firstName,
          lastName,
          email,
          username,
          password,
          id,
          verificationOtp,
        } = await authService.registerWithEmailAndPassword(input);
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
        return { message: "verification email sent successfully" };
      } catch (error) {
        handleRouteError(error);
      }
    }),
  verifySignUpOtp: publicProcedure
    .input(verifySignUpOtpDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, otp } = await verifySignUpOtpDto.parseAsync(input);
        const userData = await redis.hgetall(id);
        if (Object.keys(userData).length === 0) {
          throw new Error("Invalid or expired OTP");
        }
        if (userData.verificationOtp !== otp) {
          throw new Error("Invalid OTP");
        }
        const { firstName, lastName, email, username, password } = userData;
        const user = await authService.createVerifiedUser({
          firstName,
          lastName,
          email,
          username,
          password,
        } as any);
        const accessToken = generateAccessToken(user.userId);
        const refreshToken = generateRefreshToken(user.userId);
        ctx.setCookie("accessToken", accessToken);
        ctx.setCookie("refreshToken", refreshToken);
        redis.del(id);
        return { message: "User verified and logged in successfully", user };
      } catch (error) {
        handleRouteError(error);
      }
    }),
  loginWithEmailAndPass: publicProcedure
    .input(loginWithEmailAndPasswordDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { user } = await authService.loginWithEmailAndPassword(input);
        const accessToken = generateAccessToken(user.userId);
        const refreshToken = generateRefreshToken(user.userId);
        ctx.setCookie("accessToken", accessToken);
        ctx.setCookie("refreshToken", refreshToken);
        return { message: "Logged in successfully", user };
      } catch (error) {
        handleRouteError(error);
      }
    }),
  getMe: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { users, auths } = await authService.getme({ userId: ctx.user.id });

      return {
        users,
      };
    } catch (error) {
      handleRouteError(error);
    }
  }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      ctx.clearCookie("accessToken");
      ctx.clearCookie("refreshToken");
      return { message: "Logged out successfully" };
    } catch (error) {
      handleRouteError(error);
    }
  }),
  forgotPassword: publicProcedure
    .input(forgotPasswordDto)
    .mutation(async ({ input }) => {
      try {
        const { email, id } = await forgotPasswordDto.parseAsync(input);
        const { otp, otpExpiry } = await authService.forgotPassword(input);
        await redis.hset(id, { email, otp });
        const ttlInSeconds = Math.max(
          1,
          Math.floor((otpExpiry.getTime() - Date.now()) / 1000),
        );
        await redis.expire(id, ttlInSeconds);

        await emailServices.sendPasswordResetEmail(email, otp);
        return { message: "Password reset OTP sent successfully" };
      } catch (error) {
        handleRouteError(error);
      }
    }),
  resetPassword: publicProcedure
    .input(resetPasswordRouteDto)
    .mutation(async ({ input }) => {
      try {
        const { id, otp, newPassword } =
          await resetPasswordRouteDto.parseAsync(input);
        const data = await redis.hgetall(id);
        if (Object.keys(data).length === 0) {
          throw new AppError("BAD_REQUEST", "Invalid or expired reset link");
        }
        if (data.otp !== otp) {
          throw new AppError("BAD_REQUEST", "Invalid OTP");
        }
        if (!data.email) {
          throw new AppError("BAD_REQUEST", "Invalid reset link data");
        }
        await authService.resetPassword({ email: data.email, newPassword });
        await redis.del(id);
        return { message: "Password updated successfully" };
      } catch (error) {
        handleRouteError(error);
      }
    }),
  resendOtp: publicProcedure.input(resendOtpDto).mutation(async ({ input }) => {
    try {
      const { id } = await resendOtpDto.parseAsync(input);
      const data = await redis.hgetall(id);
      if (Object.keys(data).length === 0) {
        throw new AppError("BAD_REQUEST", "Invalid request");
      }
      if (!data.email) {
        throw new AppError("BAD_REQUEST", "Invalid request data");
      }
      const newOtp = crypto.randomInt(100000, 1000000).toString();
      await redis.hset(id, { ...data, verificationOtp: newOtp });
      await redis.expire(id, 60 * 5);
      await emailServices.sendVerificationEmail(data.email, newOtp);
      return { message: "New OTP sent successfully" };
    } catch (error) {
      handleRouteError(error);
    }
  }),
  changeUsername: protectedProcedure
    .input(changeUsernameRouteDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { newUsername } = await changeUsernameRouteDto.parseAsync(input);
        const result = await authService.changeUsername(ctx.user.id, {
          newUsername,
        });
        return { message: "Username updated successfully", ...result };
      } catch (error) {
        handleRouteError(error);
      }
    }),
  updateProfile: protectedProcedure
    .input(updateProfileRouteDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const payload = await updateProfileRouteDto.parseAsync(input);
        const result = await authService.updateProfile(ctx.user.id, payload);
        return { message: "Profile updated successfully", ...result };
      } catch (error) {
        handleRouteError(error);
      }
    }),
});
