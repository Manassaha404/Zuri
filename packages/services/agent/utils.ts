import { trimMessages } from "@langchain/core/messages";
import model from "./model";

// for trimming recent chats with ai
const MAX_TOKENS = 20000;
export const trimmer = trimMessages({
  maxTokens: MAX_TOKENS,
  strategy: "last", // keep the newest messages
  tokenCounter: model, // uses the model's tokenizer
  includeSystem: true, // always keep a leading system message if present
  startOn: "human", // trimmed history must begin with a human message
  allowPartial: false, // never cut a message in half
});

// convert message content to plain string
export const textOf = (content: unknown): string =>
  typeof content === "string" ? content : JSON.stringify(content);

// find latest message of given type (human or ai)
export const lastOfType = (messages: any[], type: "human" | "ai") =>
  [...messages].reverse().find((m) => m.type === type);
