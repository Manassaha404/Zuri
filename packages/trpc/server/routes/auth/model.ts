import { z } from "zod";
export const verifySignUpOtpDto = z.object({
  id: z
    .string()
    .trim()
    .describe("the random nanoid key for retrieving user data from redis"),
  otp: z
    .string()
    .trim()
    .length(6)
    .describe("the 6 digit otp sent to user's email for verification"),
});
export const resendOtpDto = z.object({
  id: z
    .string()
    .trim()
    .describe("the random nanoid key for retrieving user data from redis"),
});

export const forgotPasswordDto = z.object({
  id: z
    .string()
    .trim()
    .describe("the random nanoid key for storing user data in redis initially"),
  email: z.email().trim().max(330).min(2).describe("email of the user"),
});

export const resetPasswordRouteDto = z.object({
  id: z.string().trim().describe("nanoid from url"),
  otp: z.string().trim().describe("otp user typed in"),
  newPassword: z.string().min(8).describe("new password"),
});

export const changeUsernameRouteDto = z.object({
  newUsername: z.string().trim().min(3).max(255).describe("new username"),
});

export const updateProfileRouteDto = z.object({
  firstName: z.string().trim().max(255).min(2).optional(),
  lastName: z.string().trim().max(255).min(2).optional(),
  username: z.string().trim().max(255).min(2).optional(),
  avatarUrl: z.string().url().max(512).optional(),
});
