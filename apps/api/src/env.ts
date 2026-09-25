import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional(),
  CLIENT_URL: z.string(),
  DATABASE_URL: z.string().describe("DB URL"),
  REDIS_HOST: z.string().describe("Redis host").default("localhost"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  ENCRYPTION_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  RESEND_API_KEY: z.string(),
  API_BASE_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  QDRANT_URL: z.string(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
