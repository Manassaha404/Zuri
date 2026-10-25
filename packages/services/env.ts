import "dotenv/config";
import { z } from "zod";

// Sync LangSmith and LangChain tracing environment variables
if (
  process.env.LANGSMITH_TRACING === "true" ||
  process.env.LANGCHAIN_TRACING_V2 === "true"
) {
  process.env.LANGSMITH_TRACING = "true";
  process.env.LANGCHAIN_TRACING_V2 = "true";
}
if (process.env.LANGSMITH_API_KEY && !process.env.LANGCHAIN_API_KEY) {
  process.env.LANGCHAIN_API_KEY = process.env.LANGSMITH_API_KEY;
}
if (process.env.LANGCHAIN_API_KEY && !process.env.LANGSMITH_API_KEY) {
  process.env.LANGSMITH_API_KEY = process.env.LANGCHAIN_API_KEY;
}
if (process.env.LANGSMITH_PROJECT && !process.env.LANGCHAIN_PROJECT) {
  process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT;
}
if (process.env.LANGCHAIN_PROJECT && !process.env.LANGSMITH_PROJECT) {
  process.env.LANGSMITH_PROJECT = process.env.LANGCHAIN_PROJECT;
}

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  ENCRYPTION_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  RESEND_API_KEY: z.string(),
  CLIENT_URL: z.string(),
  API_BASE_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  QDRANT_URL: z.string(),
  REDIS_HOST: z.string().default("localhost"),
  OPENAI_MAIN_MODEL: z.string().trim().default("gpt-4o-mini"),
  DATABASE_URL: z.string().describe("DB URL"),
  TAVILY_API_KEY: z.string(),
  LANGSMITH_TRACING: z.string().optional(),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.string().optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
