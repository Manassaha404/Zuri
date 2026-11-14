import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../env";
import { z } from "zod/v4";
import { tavily } from "@tavily/core";
export const model = new ChatOpenAI({
  model: env.OPENAI_MAIN_MODEL,
});

export const nanoModel = new ChatOpenAI({
  model: "gpt-5-nano",
});

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});
export const tvly = tavily({ apiKey: env.TAVILY_API_KEY });
export const memoryTypeEnum = z.enum([
  "episodic",
  "semantic",
  "procedural",
  "profile",
]);
export type MemoryType = z.infer<typeof memoryTypeEnum>;

const MemoryOps = z.object({
  operations: z.array(
    z.object({
      action: z
        .enum(["add", "update", "delete"])
        .describe(
          "add = new memory, update = replace existing by ref number, delete = remove existing by ref number",
        ),
      type: memoryTypeEnum
        .nullable()
        .describe(
          "Type of memory: 'episodic' (past interactions/events), 'semantic' (facts/preferences), 'procedural' (rules/workflows/behaviors), or 'profile' (name/address/identity). Required for 'add' and 'update', null for 'delete'",
        ),
      text: z
        .string()
        .nullable()
        .describe(
          "Fact text — required for 'add' and 'update', null for 'delete'",
        ),
      ref: z
        .number()
        .int()
        .nullable()
        .describe(
          "Index of the existing memory to update or delete, null for 'add'",
        ),
    }),
  ),
});
export const extractor = new ChatOpenAI({
  model: "gpt-5-nano",
}).withStructuredOutput(MemoryOps);

export const evaluatorLLMSchema = z.object({
  score: z
    .number()
    .describe(
      "A score from 0 to 1 indicating how relevant the document is to the question.",
    ),
});
export const refineLLMSchema = z.object({
  splits: z
    .array(z.string())
    .describe(
      "The splits of the document which are relevant to the question. If none of the splits are relevant, return an empty array.",
    ),
});

// Router model decides which toolkits are needed and query for tool catalog
const ToolkitRoute = z.object({
  toolkits: z
    .array(z.string())
    .describe("Toolkits needed for this request. Empty if none is needed."),
  toolQuery: z
    .string()
    .describe(
      "Short search query describing the API action needed, phrased like a tool name/description. Example: 'list repositories for the authenticated user'. Empty string if no toolkit is needed.",
    ),
});
export const router = new ChatOpenAI({
  model: "gpt-5-nano",
}).withStructuredOutput(ToolkitRoute);

const RiskSchema = z.object({
  needsApproval: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z
    .string()
    .describe("One short sentence a human can read in an approval prompt"),
});
// Stronger model for complex risk approval decisions
export const riskJudge = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
}).withStructuredOutput(RiskSchema);

const RagJudgeSchema = z.object({
  isRagRequired: z
    .boolean()
    .describe(
      "True if answering the user's message requires retrieving context from uploaded documents or specific knowledge base. False for general conversation, chit-chat, tool calls, or common knowledge.",
    ),
});
export const ragJudge = new ChatOpenAI({
  model: "gpt-5-nano",
}).withStructuredOutput(RagJudgeSchema);

const checkFullFileContextSchema = z.object({
  isFullFileContextNeeded: z
    .boolean()
    .describe(
      "True if answering the user's message requires retrieving context from the full content of uploaded files. False if only specific sections or summaries are needed.",
    ),
});
export const checkFullFileContextJudge = new ChatOpenAI({
  model: "gpt-5-nano",
}).withStructuredOutput(checkFullFileContextSchema);

const crossFileComparisonSchema = z.object({
  needsHistoricalFiles: z
    .boolean()
    .describe(
      "True if answering the user's message requires comparing with, referencing, or analyzing files/documents/videos from previous turns in the conversation. False if the question is exclusively about the newly attached file(s) or does not require previous files.",
    ),
});
export const crossFileComparisonJudge = new ChatOpenAI({
  model: "gpt-5-nano",
}).withStructuredOutput(crossFileComparisonSchema);

const docSummerySchema = z.object({
  summery: z
    .string()
    .describe(
      "A concise summary of the document's content, highlighting key points and relevant information.",
    ),
});
export const docSummeryLLM = new ChatOpenAI({
  model: "gpt-5-nano",
}).withStructuredOutput(docSummerySchema);

export default model;
