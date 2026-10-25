import { MessagesValue, ReducedValue, StateSchema } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";
import { z } from "zod/v4";
export const MessagesState = new StateSchema({
  isFilesInclude: z.boolean().default(false),
  messages: MessagesValue,
  title: z.string().default("new-chat"),
  summery: z.string().nullable().default(""),
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
