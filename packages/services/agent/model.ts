import { ChatOpenAI } from "@langchain/openai";
import { env } from "../env";
import { z } from "zod/v4";
export const model = new ChatOpenAI({
  model: env.OPENAI_MAIN_MODEL,
});

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
  model: "gpt-4o-mini",
  temperature: 0,
}).withStructuredOutput(MemoryOps);

export default model;
