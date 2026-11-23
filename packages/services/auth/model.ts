import { z } from "zod";

export const registerWithEmailAndPasswordDto = z.object({
  id: z
    .string()
    .trim()
    .describe("the random nanoid key for storing user data in redis initially"),
  firstName: z
    .string()
    .trim()
    .max(255)
    .min(2)
    .describe("first name of the user"),
  lastName: z.string().trim().max(255).min(2).describe("last name of the user"),
  username: z.string().trim().max(255).min(2).describe("username of the user"),
  email: z.email().trim().max(330).min(2).describe("email of the user"),
  password: z.string().min(8).describe("password of the user"),
});
export const createVerifiedUserDto = z.object({
  firstName: z
    .string()
    .trim()
    .max(255)
    .min(2)
    .describe("first name of the user"),
  lastName: z.string().trim().max(255).min(2).describe("last name of the user"),
  username: z.string().trim().max(255).min(2).describe("username of the user"),
  email: z.email().trim().max(330).min(2).describe("email of the user"),
  password: z.string().min(8).describe("password of the user"),
});
export const getMeDto = z.object({
  userId: z
    .string()
    .uuid()
    .trim()
    .describe("the user id of the user to fetch details for"),
});
export const loginWithEmailAndPasswordDto = z.object({
  emailOrUsername: z
    .string()
    .trim()
    .min(1)
    .describe("email or username of the user"),
  password: z.string().min(1).describe("password of the user"),
});
export const forgotPasswordDto = z.object({
  email: z.email().trim().max(330).min(2).describe("email of the user"),
});

export const resetPasswordDto = z.object({
  email: z.email().trim().describe("email of the user"),
  newPassword: z.string().min(8).describe("new password of the user"),
});

export const changeUsernameDto = z.object({
  newUsername: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .describe("new username for the user"),
});

export type createVerifiedUserType = z.infer<typeof createVerifiedUserDto>;
export type registerWithEmailAndPasswordType = z.infer<
  typeof registerWithEmailAndPasswordDto
>;
export type getMetype = z.infer<typeof getMeDto>;
export type loginWithEmailAndPasswordType = z.infer<
  typeof loginWithEmailAndPasswordDto
>;
export type forgotPasswordType = z.infer<typeof forgotPasswordDto>;
export type resetPasswordType = z.infer<typeof resetPasswordDto>;
export type changeUsernameType = z.infer<typeof changeUsernameDto>;

export const updateProfileDto = z.object({
  firstName: z.string().trim().max(255).min(2).optional(),
  lastName: z.string().trim().max(255).min(2).optional(),
  username: z.string().trim().max(255).min(2).optional(),
  avatarUrl: z.string().url().max(512).optional(),
});
export type updateProfileType = z.infer<typeof updateProfileDto>;

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

export const forgotPasswordRouteDto = z.object({
  id: z
    .string()
    .trim()
    .optional()
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

export const updateProfileRouteDto = updateProfileDto;

export type verifySignUpOtpType = z.infer<typeof verifySignUpOtpDto>;
export type resendOtpType = z.infer<typeof resendOtpDto>;
export type forgotPasswordRouteType = z.infer<typeof forgotPasswordRouteDto>;
export type resetPasswordRouteType = z.infer<typeof resetPasswordRouteDto>;
export type changeUsernameRouteType = z.infer<typeof changeUsernameRouteDto>;
export type updateProfileRouteType = z.infer<typeof updateProfileRouteDto>;
