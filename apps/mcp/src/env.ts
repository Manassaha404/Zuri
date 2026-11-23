import { z } from "zod";
import "dotenv/config";
const envSchema = z.object({
  PORT: z.string().default("9000"),
  BASE_URL: z.string().default("http://localhost:9000"),
  DATABASE_URL: z.string().default("postgres://mcp:mcp@localhost:5432/mcp"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  JWT_ACCESS_TOKEN_SERECT: z.string(),
  JWT_REFRESH_TOKEN_SERECT: z.string(),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});
function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    console.error(
      "Environment validation error:",
      safeParseResult.error.format(),
    );
    throw new Error(safeParseResult.error.message);
  }
  return safeParseResult.data;
}
export const env = createEnv(process.env);
