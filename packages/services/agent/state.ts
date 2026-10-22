import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod/v4";
export const MessagesState = new StateSchema({
  messages: MessagesValue,
  title: z.string().default("new-chat"),
  summery: z.string().nullable().default(""),
});
