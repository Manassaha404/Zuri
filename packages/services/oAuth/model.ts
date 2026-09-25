import { z } from "zod";

export const GoogleUserInfoSchema = z.object({
  sub: z.string(), // Google account ID
  email: z.email(),
  given_name: z.string(),
  family_name: z.string(),
  picture: z.url(),
  email_verified: z.boolean(),
});

export const ExchangeCodeSchema = z.object({
  code: z.string(),
});

export const GetGoogleUserInfoSchema = z.object({
  accessToken: z.string(),
});

export const FindOrCreateUserSchema = z.object({
  googleUser: GoogleUserInfoSchema,
  refreshToken: z.string().optional(),
});



export type GoogleUserInfo = z.infer<typeof GoogleUserInfoSchema>;
export type ExchangeCodeParams = z.infer<typeof ExchangeCodeSchema>;
export type GetGoogleUserInfoParams = z.infer<typeof GetGoogleUserInfoSchema>;
export type FindOrCreateUserParams = z.infer<typeof FindOrCreateUserSchema>;

