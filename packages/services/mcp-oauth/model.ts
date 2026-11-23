import { z } from "zod";

export const registerClientDto = z.object({
  client_name: z.string().trim().min(1).max(255),
  redirect_uris: z.array(z.string().url()).min(1),
  is_public: z.boolean().default(true),
  grant_types: z
    .array(z.string())
    .default(["authorization_code", "refresh_token"]),
  response_types: z.array(z.string()).default(["code"]),
  scope: z.string().default("mcp:tools mcp:resources mcp:prompts"),
  token_endpoint_auth_method: z
    .enum(["none", "client_secret_post", "client_secret_basic"])
    .default("none"),
});

export const authorizeRequestDto = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  state: z.string().optional(),
  scope: z.string().default("mcp:tools mcp:resources mcp:prompts"),
  resource: z.string().optional(),
});

export const tokenRequestDto = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("authorization_code"),
    code: z.string().min(1),
    code_verifier: z.string().min(43).max(128),
    client_id: z.string().min(1),
    client_secret: z.string().optional(),
    redirect_uri: z.string().url().optional(),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    refresh_token: z.string().min(1),
    client_id: z.string().min(1),
    client_secret: z.string().optional(),
    scope: z.string().optional(),
  }),
]);

export type RegisterClientInput = z.infer<typeof registerClientDto>;
export type AuthorizeRequestInput = z.infer<typeof authorizeRequestDto>;
export type TokenRequestInput = z.infer<typeof tokenRequestDto>;

export interface OAuthTokenPayload {
  sub: string; // userId
  email: string;
  username: string;
  scope: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}
