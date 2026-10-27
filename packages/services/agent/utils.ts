import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { trimMessages } from "@langchain/core/messages";
import { AppError } from "@repo/error";
import model from "./model";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { composio } from "./composio";
import {
  DynamicStructuredTool,
  type StructuredToolInterface,
} from "@langchain/core/tools";
import ToolService from "./toolService";

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

// text splitter configuration
export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 200,
});

// convert message content to plain string
export const textOf = (content: unknown): string =>
  typeof content === "string" ? content : JSON.stringify(content);

// find latest message of given type (human or ai)
export const lastOfType = (messages: any[], type: "human" | "ai") =>
  [...messages].reverse().find((m) => m.type === type);

// Check if URL is hosted on Cloudinary
export const isCloudinaryUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("cloudinary.com") ||
      parsed.hostname.includes("res.cloudinary.com")
    );
  } catch {
    return false;
  }
};

// Check if URL is a downloadable remote file
export const isDownloadableUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (isCloudinaryUrl(url)) {
      return true;
    }
    const ext = path.extname(parsed.pathname).toLowerCase();
    const fileExtensions = new Set([
      ".pdf",
      ".csv",
      ".docx",
      ".doc",
      ".xlsx",
      ".xls",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".bmp",
      ".txt",
      ".md",
    ]);
    return fileExtensions.has(ext);
  } catch {
    return false;
  }
};

// Infer file extension from buffer magic bytes
export const inferExtension = (buffer: Buffer): string | null => {
  if (buffer.length >= 4) {
    // PDF
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return ".pdf";
    }
    // PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return ".png";
    }
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return ".jpg";
    }
    // WebP
    if (
      buffer.length >= 12 &&
      buffer.toString("utf8", 0, 4) === "RIFF" &&
      buffer.toString("utf8", 8, 12) === "WEBP"
    ) {
      return ".webp";
    }
    // ZIP / Office document
    if (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      return ".docx";
    }
  }
  return null;
};

// Download remote file to temporary directory
export const downloadRemoteFile = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError(
      "BAD_REQUEST",
      `Failed to download file from URL (${response.status} ${response.statusText})`,
    );
  }

  let ext = "";
  try {
    const parsed = new URL(url);
    ext = path.extname(parsed.pathname).toLowerCase();
  } catch {
    // Ignore URL parsing errors
  }

  const contentType = response.headers.get("content-type");
  if (!ext && contentType) {
    const mime = contentType.split(";")[0]?.trim().toLowerCase();
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
      "application/vnd.ms-excel": ".xls",
      "text/csv": ".csv",
      "text/plain": ".txt",
      "text/markdown": ".md",
      "text/html": ".html",
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/webp": ".webp",
      "image/bmp": ".bmp",
    };
    if (mime && mimeMap[mime]) {
      ext = mimeMap[mime];
    }
  }

  const contentDisposition = response.headers.get("content-disposition");
  if (!ext && contentDisposition) {
    const match = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i.exec(
      contentDisposition,
    );
    if (match?.[1]) {
      ext = path.extname(match[1]).toLowerCase();
    }
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!ext) {
    ext = inferExtension(buffer) ?? "";
  }

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(
    tempDir,
    `doc-${Date.now()}-${crypto.randomUUID()}${ext}`,
  );

  await fs.promises.writeFile(tempFilePath, buffer);
  return tempFilePath;
};

// composio schema sometimes has type "None" (python artifact), remove it at every level
const stripBadTypes = (node: any): any => {
  if (Array.isArray(node)) return node.map(stripBadTypes);
  if (node && typeof node === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "type" && (v === "None" || v === null)) continue;
      out[k] = stripBadTypes(v);
    }
    return out;
  }
  return node;
};
// openai need top level type object + properties, so fix the schema before giving to llm
const normalizeSchema = (input: any): Record<string, any> => {
  const s: Record<string, any> =
    input && typeof input === "object" ? stripBadTypes(input) : {};
  // openai dont allow these at top level
  for (const k of ["anyOf", "oneOf", "allOf", "not", "enum", "$schema"]) {
    delete s[k];
  }
  s.type = "object";
  if (!s.properties || typeof s.properties !== "object") s.properties = {};
  // required keys must exist in properties
  if (Array.isArray(s.required)) {
    s.required = s.required.filter((r: string) => r in s.properties);
    if (!s.required.length) delete s.required;
  } else {
    delete s.required;
  }
  return s;
};
// make langchain tool from composio raw tool, run it with composio execute
export const buildTool = (
  userId: string,
  raw: any,
): StructuredToolInterface => {
  const slug: string = raw.slug;
  return new DynamicStructuredTool({
    name: slug,
    description: String(raw.description ?? raw.name ?? slug).slice(0, 1000),
    schema: normalizeSchema(raw.inputParameters) as any,
    func: async (args: Record<string, unknown>) => {
      // Auto-correct "me" placeholder for GitHub tool username/owner arguments
      if (slug.startsWith("GITHUB_")) {
        if (args.username === "me" || args.owner === "me") {
          try {
            const accounts = await ToolService.getUserConnectedAccounts(userId);
            const githubAcc = accounts.find((a) => a.toolkitSlug === "github");
            if (githubAcc?.displayName) {
              if (args.username === "me") args.username = githubAcc.displayName;
              if (args.owner === "me") args.owner = githubAcc.displayName;
            }
          } catch (err) {
            console.error("Failed to auto-correct github username:", err);
          }
        }
      }

      const res: any = await composio.tools.execute(slug, {
        userId,
        arguments: args,
        dangerouslySkipVersionCheck: true,
      });
      // throw on failure so ToolNode mark it as error and llm can retry with other tool
      if (res && res.successful === false) {
        throw new Error(String(res.error ?? "Tool execution failed"));
      }
      return JSON.stringify(res?.data ?? res);
    },
  }) as unknown as StructuredToolInterface;
};

export const lastTurnHadToolError = (messages: any[]): boolean => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.type === "human") break;
    if (m.type !== "tool") continue;
    if (m.status === "error") return true;
    const c = textOf(m.content);
    if (/"successful"\s*:\s*false/i.test(c) || /^error/i.test(c.trim())) {
      return true;
    }
  }
  return false;
};

// Sanitize tool output to strip verbose URLs and truncate huge payloads
export function sanitizeToolOutput(output: unknown): unknown {
  if (!output) return output;
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      const cleaned = sanitizeToolOutput(parsed);
      return JSON.stringify(cleaned);
    } catch {
      if (output.length > 50000) {
        return (
          output.slice(0, 50000) +
          "\n... [Output truncated to avoid payload limits]"
        );
      }
      return output;
    }
  }

  if (Array.isArray(output)) {
    return output.map((item) => sanitizeToolOutput(item));
  }

  if (typeof output === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      output as Record<string, unknown>,
    )) {
      if (key.endsWith("_url") && key !== "html_url" && key !== "url") {
        continue;
      }
      if (key === "node_id" || key === "gravatar_id") {
        continue;
      }
      cleaned[key] = sanitizeToolOutput(value);
    }
    return cleaned;
  }

  return output;
}
