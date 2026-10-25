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

// Format byte size to human readable string
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Extract clean file name from URL or path
export function getFileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const parts = pathname.split("/");
    const last = parts[parts.length - 1];
    if (last) {
      return decodeURIComponent(last);
    }
  } catch {
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return "attachment";
}

// Inspect file category and extension
export function getFileCategory(nameOrUrl: string): {
  category: "pdf" | "image" | "sheet" | "doc" | "code" | "file";
  ext: string;
} {
  const clean = nameOrUrl.split("?")[0]?.split("#")[0] ?? "";
  const ext = (clean.split(".").pop() || "").toLowerCase();

  if (ext === "pdf") return { category: "pdf", ext: "PDF" };
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"].includes(ext)) {
    return { category: "image", ext: ext.toUpperCase() };
  }
  if (["xlsx", "xls", "csv"].includes(ext)) {
    return { category: "sheet", ext: ext.toUpperCase() };
  }
  if (["doc", "docx", "txt", "rtf", "md"].includes(ext)) {
    return { category: "doc", ext: ext.toUpperCase() };
  }
  if (["js", "ts", "tsx", "jsx", "py", "json", "html", "css"].includes(ext)) {
    return { category: "code", ext: ext.toUpperCase() };
  }

  return { category: "file", ext: ext ? ext.toUpperCase() : "FILE" };
}
