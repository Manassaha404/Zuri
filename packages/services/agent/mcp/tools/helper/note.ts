import { type BlockContent } from "@repo/database/models";
import { BlockType } from "../schema/note";

// Helper to normalize and ensure BlockContent payload has matching type
export function normalizeBlockContentPayload(
  blockType?: string,
  content?: any,
): BlockContent {
  if (!content) {
    return {
      type: (blockType as any) || "paragraph",
      richText: [],
    } as BlockContent;
  }
  if (Array.isArray(content)) {
    return {
      type: (blockType as any) || "paragraph",
      richText: content,
    } as BlockContent;
  }
  const resolvedType = content.type || blockType || "paragraph";
  return {
    ...content,
    type: resolvedType,
  } as BlockContent;
}

// Helper to extract searchable plain text from block content
export function extractPlainTextFromContent(content: any): string {
  if (!content) return "";
  if (Array.isArray(content.richText)) {
    return content.richText.map((span: any) => span.text || "").join("");
  }
  if (typeof content.code === "string") return content.code;
  if (typeof content.title === "string") return content.title;
  if (typeof content.url === "string") return content.url;
  if (Array.isArray(content.rows)) {
    return content.rows
      .map((row: any[]) =>
        row
          .map((cell: any) =>
            Array.isArray(cell)
              ? cell.map((span: any) => span.text || "").join("")
              : "",
          )
          .join(" | "),
      )
      .join("\n");
  }
  return "";
}

// Helper to detect if a paragraph text contains multi-element Markdown that should be decomposed into native blocks
export function shouldDecomposeMarkdown(text?: string): boolean {
  if (!text || typeof text !== "string") return false;
  return (
    text.includes("```") ||
    /(?:^|\n)#{1,6}\s+/.test(text) ||
    /(?:^|\n)\d+\.\s+/.test(text) ||
    /(?:^|\n)[-*]\s+/.test(text)
  );
}

// Helper to decompose a raw Markdown blob into native BlockContent and block records
export function decomposeMarkdownToBlocks(
  rawText: string,
  basePosition: string = "a0",
): Array<{
  type: BlockType;
  content: BlockContent;
  position: string;
  plainText: string;
}> {
  const lines = rawText.split("\n");
  const blocks: Array<{
    type: BlockType;
    content: BlockContent;
    position: string;
    plainText: string;
  }> = [];

  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines: string[] = [];

  const getPosition = (index: number) => {
    const match = basePosition.match(/^([a-zA-Z]+)(\d+)(.*)$/);
    if (match && match[1] && match[2]) {
      const prefix = match[1];
      const num = parseInt(match[2], 10) + index;
      const suffix = match[3] || "";
      return `${prefix}${num}${suffix}`;
    }
    return `${basePosition}_${index}`;
  };

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join("\n").trim();
      if (text) {
        const idx = blocks.length;
        blocks.push({
          type: "paragraph",
          content: { type: "paragraph", richText: [{ text }] } as BlockContent,
          position: getPosition(idx),
          plainText: text,
        });
      }
      currentParagraph = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (typeof line !== "string") continue;
    const trimmed = line.trim();

    // Code block fences
    const codeMatch = trimmed.match(/^```(\w*)/);
    if (codeMatch) {
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        codeLanguage = codeMatch[1] || "text";
        codeLines = [];
      } else {
        inCodeBlock = false;
        const code = codeLines.join("\n");
        const idx = blocks.length;
        blocks.push({
          type: "code",
          content: {
            type: "code",
            language: codeLanguage,
            code,
          } as BlockContent,
          position: getPosition(idx),
          plainText: code,
        });
        codeLines = [];
        codeLanguage = "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Heading tags
    const h1Match = trimmed.match(/^#\s+(.*)/);
    const h2Match = trimmed.match(/^##\s+(.*)/);
    const h3Match = trimmed.match(/^###\s+(.*)/);
    const matchedHeading = h1Match || h2Match || h3Match;
    if (matchedHeading && matchedHeading[1]) {
      flushParagraph();
      const type: BlockType = h1Match
        ? "heading_1"
        : h2Match
          ? "heading_2"
          : "heading_3";
      const text = matchedHeading[1].trim();
      const idx = blocks.length;
      blocks.push({
        type,
        content: { type, richText: [{ text }] } as BlockContent,
        position: getPosition(idx),
        plainText: text,
      });
      continue;
    }

    // Lists
    const numMatch = trimmed.match(/^\d+\.\s+(.*)/);
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (numMatch && numMatch[1]) {
      flushParagraph();
      const text = numMatch[1].trim();
      const idx = blocks.length;
      blocks.push({
        type: "numbered_list",
        content: {
          type: "numbered_list",
          richText: [{ text }],
        } as BlockContent,
        position: getPosition(idx),
        plainText: text,
      });
      continue;
    }
    if (bulletMatch && bulletMatch[1]) {
      flushParagraph();
      const text = bulletMatch[1].trim();
      const idx = blocks.length;
      blocks.push({
        type: "bulleted_list",
        content: {
          type: "bulleted_list",
          richText: [{ text }],
        } as BlockContent,
        position: getPosition(idx),
        plainText: text,
      });
      continue;
    }

    if (trimmed === "") {
      flushParagraph();
      continue;
    }

    currentParagraph.push(trimmed);
  }

  flushParagraph();
  return blocks;
}
