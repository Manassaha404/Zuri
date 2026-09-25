import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional(),
  CLIENT_URL: z.string(),
  API_BASE_URL: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  REDIS_HOST: z.string().describe("Redis host").default("localhost"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
