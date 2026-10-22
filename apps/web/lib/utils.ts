import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract message content
export function extractMessageContent(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";

  const obj = result as Record<string, any>;

  // Check direct output / message properties
  if (typeof obj.output === "string" && obj.output.trim()) return obj.output;
  if (typeof obj.message === "string" && obj.message.trim()) return obj.message;

  // Check nested result object
  const nested = obj.result ?? obj;
  if (typeof nested.output === "string" && nested.output.trim())
    return nested.output;
  if (typeof nested.message === "string" && nested.message.trim())
    return nested.message;

  // Check messages array in nested or top-level result
  const messages = nested.messages ?? obj.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (typeof lastMsg === "string") return lastMsg;
    if (lastMsg && typeof lastMsg === "object") {
      const content =
        lastMsg.content ?? lastMsg.kwargs?.content ?? lastMsg.text;
      if (typeof content === "string" && content.trim()) return content;
      if (Array.isArray(content)) {
        const text = content
          .map((c: any) => (typeof c === "string" ? c : (c?.text ?? "")))
          .join("");
        if (text.trim()) return text;
      }
    }
  }

  return JSON.stringify(result);
}
