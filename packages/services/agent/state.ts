import { MessagesValue, ReducedValue, StateSchema } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";
import { z } from "zod/v4";
export const MessagesState = new StateSchema({
  isFilesInclude: z.boolean().default(false),
  isRagRequired: z.boolean().default(false),
  activeTools: z.array(z.string()).default([]),
  missingToolkits: z.array(z.string()).default([]),
  pending: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        args: z.any(),
        reason: z.string(),
      }),
    )
    .default([]),
  denied: z.array(z.string()).default([]),
  allowedTools: z.array(z.string()).default([]),
  tainted: z.boolean().default(false), // agent has seen external content
  messages: MessagesValue,
  title: z.string().default("new-chat"),
  summery: z.string().nullable().default(""),
  connectionStatus: z.enum(["none", "connected", "denied"]).default("none"),
});

export const RagState = new StateSchema({
  query: z.string().describe("The user question"),
  refineQuery: z
    .string()
    .describe("The refined user question")
    .nullable()
    .default(null),
  docs: new ReducedValue(z.array(z.instanceof(Document)).default([]), {
    reducer: (existing, update) => existing.concat(update),
  }),
  answer: z.string().default(""),
  evaluator_result: z
    .enum(["correct", "ambiguous", "incorrect"])
    .nullable()
    .default(null),
  good_docs: z.array(z.instanceof(Document)).default([]),
  conversationId: z.string().nullable().default(null),
});
