import {
  RichText,
  RichTextSpan,
  RichTextMark,
  Block,
  BlockType,
  BlockContent,
} from "../types";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function richTextToHtml(richText: RichText): string {
  if (!richText || richText.length === 0) return "";

  return richText
    .map((span) => {
      let text = escapeHtml(span.text);
      if (!text) return "";

      if (span.marks?.includes("code")) {
        text = `<code class="font-mono text-[0.85em] bg-[var(--s)] text-[var(--i)] px-1.5 py-0.5 rounded-md border border-[var(--h)]">${text}</code>`;
      }
      if (span.marks?.includes("bold")) {
        text = `<strong>${text}</strong>`;
      }
      if (span.marks?.includes("italic")) {
        text = `<em>${text}</em>`;
      }
      if (span.marks?.includes("underline")) {
        text = `<u>${text}</u>`;
      }
      if (span.marks?.includes("strike")) {
        text = `<s>${text}</s>`;
      }
      if (span.pageId) {
        text = `<span data-page-id="${escapeHtml(span.pageId)}" class="inline-flex items-center gap-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 mx-0.5 text-[0.9em] font-medium">${text}</span>`;
      } else if (span.href) {
        text = `<a href="${escapeHtml(span.href)}" target="_blank" rel="noopener noreferrer" class="text-[var(--accent)] underline underline-offset-3">${text}</a>`;
      }

      return text;
    })
    .join("");
}

export function htmlToRichText(container: HTMLElement): RichText {
  const spans: RichTextSpan[] = [];

  function traverse(
    node: Node,
    currentMarks: Set<RichTextMark>,
    href?: string,
    pageId?: string,
  ) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || "";
      if (text.length > 0) {
        spans.push({
          text,
          marks:
            currentMarks.size > 0
              ? (Array.from(currentMarks) as RichTextMark[])
              : undefined,
          href,
          pageId,
        });
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      // Line breaks
      if (tagName === "BR") {
        spans.push({ text: "\n" });
        return;
      }

      const nextMarks = new Set(currentMarks);
      let nextHref = href;
      let nextPageId = pageId;

      if (
        tagName === "B" ||
        tagName === "STRONG" ||
        el.style.fontWeight === "bold" ||
        parseInt(el.style.fontWeight || "0", 10) >= 600 ||
        el.classList.contains("font-bold")
      ) {
        nextMarks.add("bold");
      }
      if (
        tagName === "I" ||
        tagName === "EM" ||
        el.style.fontStyle === "italic" ||
        el.classList.contains("italic")
      ) {
        nextMarks.add("italic");
      }
      if (
        tagName === "U" ||
        el.style.textDecoration?.includes("underline") ||
        el.classList.contains("underline")
      ) {
        nextMarks.add("underline");
      }
      if (
        tagName === "S" ||
        tagName === "STRIKE" ||
        tagName === "DEL" ||
        el.style.textDecoration?.includes("line-through") ||
        el.classList.contains("line-through")
      ) {
        nextMarks.add("strike");
      }
      if (tagName === "CODE" || el.classList.contains("font-mono")) {
        nextMarks.add("code");
      }
      if (tagName === "A") {
        nextHref = el.getAttribute("href") || undefined;
      }
      if (el.getAttribute("data-page-id")) {
        nextPageId = el.getAttribute("data-page-id") || undefined;
      }

      for (let i = 0; i < el.childNodes.length; i++) {
        traverse(el.childNodes[i]!, nextMarks, nextHref, nextPageId);
      }
    }
  }

  traverse(container, new Set());

  // Merge adjacent spans that share the exact same marks and links
  const merged: RichTextSpan[] = [];
  for (const span of spans) {
    const prev = merged[merged.length - 1];
    const prevMarks = (prev?.marks || []).slice().sort().join(",");
    const currMarks = (span.marks || []).slice().sort().join(",");

    if (
      prev &&
      prevMarks === currMarks &&
      prev.href === span.href &&
      prev.pageId === span.pageId
    ) {
      prev.text += span.text;
    } else {
      merged.push({ ...span });
    }
  }

  return merged.length > 0 ? merged : [{ text: "" }];
}

// Toggle format on current selection (select & unselect support)
export function toggleRichTextFormat(
  format: "bold" | "italic" | "underline" | "strike" | "code",
): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);

  // When selection is collapsed (cursor blinking, no text highlighted)
  if (sel.isCollapsed) {
    if (format === "bold") {
      document.execCommand("bold", false);
      try {
        return document.queryCommandState("bold");
      } catch {
        return false;
      }
    }
    if (format === "italic") {
      document.execCommand("italic", false);
      try {
        return document.queryCommandState("italic");
      } catch {
        return false;
      }
    }
    if (format === "underline") {
      document.execCommand("underline", false);
      try {
        return document.queryCommandState("underline");
      } catch {
        return false;
      }
    }
    if (format === "strike") {
      document.execCommand("strikeThrough", false);
      try {
        return document.queryCommandState("strikeThrough");
      } catch {
        return false;
      }
    }
    if (format === "code") {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      let codeEl: HTMLElement | null = null;
      while (node && node !== document.body) {
        if (
          (node as HTMLElement).tagName === "CODE" ||
          (node as HTMLElement).classList?.contains("font-mono")
        ) {
          codeEl = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }

      if (codeEl) {
        // Step cursor out after the code element
        const afterRange = document.createRange();
        afterRange.setStartAfter(codeEl);
        afterRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(afterRange);
        return false;
      } else {
        // Insert a small styled code tag with zero-width space
        const newCode = document.createElement("code");
        newCode.className =
          "font-mono text-[0.85em] bg-[var(--s)] text-[var(--i)] px-1.5 py-0.5 rounded-md border border-[var(--h)]";
        newCode.textContent = "\u200B";
        range.insertNode(newCode);
        const codeRange = document.createRange();
        codeRange.selectNodeContents(newCode);
        codeRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(codeRange);
        return true;
      }
    }
  }

  // When selection has a range (text highlighted)
  // 1. Code toggle
  if (format === "code") {
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    let codeEl: HTMLElement | null = null;
    while (node && node !== document.body) {
      if (
        (node as HTMLElement).tagName === "CODE" ||
        (node as HTMLElement).classList?.contains("font-mono")
      ) {
        codeEl = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (codeEl) {
      // UNSELECT: unwrap <code>
      const parent = codeEl.parentNode;
      while (codeEl.firstChild) {
        parent?.insertBefore(codeEl.firstChild, codeEl);
      }
      parent?.removeChild(codeEl);
      return false;
    } else {
      // SELECT: wrap in <code>
      const newCode = document.createElement("code");
      newCode.className =
        "font-mono text-[0.85em] bg-[var(--s)] text-[var(--i)] px-1.5 py-0.5 rounded-md border border-[var(--h)]";
      const fragment = range.extractContents();
      newCode.appendChild(fragment);
      range.insertNode(newCode);
      range.selectNodeContents(newCode);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    }
  }

  // 2. Strike toggle
  if (format === "strike") {
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    let strikeEl: HTMLElement | null = null;
    while (node && node !== document.body) {
      const tag = (node as HTMLElement).tagName;
      if (
        tag === "S" ||
        tag === "STRIKE" ||
        tag === "DEL" ||
        (node as HTMLElement).style?.textDecoration?.includes("line-through")
      ) {
        strikeEl = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (strikeEl) {
      // UNSELECT: unwrap strike
      const parent = strikeEl.parentNode;
      while (strikeEl.firstChild) {
        parent?.insertBefore(strikeEl.firstChild, strikeEl);
      }
      parent?.removeChild(strikeEl);
      return false;
    } else {
      // SELECT: wrap in <s>
      document.execCommand("strikeThrough", false);
      let isStruck = false;
      try {
        isStruck = document.queryCommandState("strikeThrough");
      } catch {}
      if (!isStruck) {
        const s = document.createElement("s");
        const fragment = range.extractContents();
        s.appendChild(fragment);
        range.insertNode(s);
        range.selectNodeContents(s);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return true;
    }
  }

  // 3. Bold toggle
  if (format === "bold") {
    document.execCommand("bold", false);
    try {
      return document.queryCommandState("bold");
    } catch {
      return false;
    }
  }

  // 4. Italic toggle
  if (format === "italic") {
    document.execCommand("italic", false);
    try {
      return document.queryCommandState("italic");
    } catch {
      return false;
    }
  }

  // 5. Underline toggle
  if (format === "underline") {
    document.execCommand("underline", false);
    try {
      return document.queryCommandState("underline");
    } catch {
      return false;
    }
  }

  return false;
}

// Check if format is currently active for selection
export function isFormatActive(
  format: "bold" | "italic" | "underline" | "strike" | "code",
): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  let node: Node | null = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

  if (format === "code") {
    while (node && node !== document.body) {
      if (
        (node as HTMLElement).tagName === "CODE" ||
        (node as HTMLElement).classList?.contains("font-mono")
      ) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  if (format === "strike") {
    while (node && node !== document.body) {
      const tag = (node as HTMLElement).tagName;
      if (
        tag === "S" ||
        tag === "STRIKE" ||
        tag === "DEL" ||
        (node as HTMLElement).style?.textDecoration?.includes("line-through")
      ) {
        return true;
      }
      node = node.parentNode;
    }
    try {
      return document.queryCommandState("strikeThrough");
    } catch {
      return false;
    }
  }

  if (format === "bold") {
    while (node && node !== document.body) {
      const tag = (node as HTMLElement).tagName;
      if (
        tag === "B" ||
        tag === "STRONG" ||
        (node as HTMLElement).style?.fontWeight === "bold" ||
        parseInt((node as HTMLElement).style?.fontWeight || "0", 10) >= 600
      ) {
        return true;
      }
      node = node.parentNode;
    }
    try {
      return document.queryCommandState("bold");
    } catch {
      return false;
    }
  }

  if (format === "italic") {
    while (node && node !== document.body) {
      const tag = (node as HTMLElement).tagName;
      if (
        tag === "I" ||
        tag === "EM" ||
        (node as HTMLElement).style?.fontStyle === "italic"
      ) {
        return true;
      }
      node = node.parentNode;
    }
    try {
      return document.queryCommandState("italic");
    } catch {
      return false;
    }
  }

  if (format === "underline") {
    while (node && node !== document.body) {
      const tag = (node as HTMLElement).tagName;
      if (
        tag === "U" ||
        (node as HTMLElement).style?.textDecoration?.includes("underline")
      ) {
        return true;
      }
      node = node.parentNode;
    }
    try {
      return document.queryCommandState("underline");
    } catch {
      return false;
    }
  }

  return false;
}

// Extract and normalize richText from any format (array of spans, string, object, or Slate format)
export function extractRichText(content: any, plainText?: string): RichText {
  if (!content) {
    return plainText ? [{ text: plainText }] : [{ text: "" }];
  }

  // If already array of spans or text nodes
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return plainText ? [{ text: plainText }] : [{ text: "" }];
    }
    return content.map((item) => {
      if (typeof item === "string") return { text: item };
      return {
        text: item.text ?? item.plainText ?? "",
        marks: Array.isArray(item.marks) ? item.marks : undefined,
        href: item.href,
        pageId: item.pageId,
      };
    });
  }

  // If JSON string or plain text string
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return extractRichText(parsed, plainText);
    } catch {
      return [{ text: content }];
    }
  }

  // If object
  if (typeof content === "object") {
    if (Array.isArray(content.richText)) {
      return extractRichText(content.richText, plainText);
    }
    if (typeof content.text === "string") {
      return [{ text: content.text }];
    }
  }

  return plainText ? [{ text: plainText }] : [{ text: "" }];
}

// Normalize any arbitrary block content into canonical typed BlockContent
export function normalizeBlockContent(
  type: BlockType,
  rawContent: any,
  plainText?: string,
): BlockContent {
  let content = rawContent;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      content = { richText: [{ text: content }] };
    }
  }

  switch (type) {
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "paragraph":
    case "quote":
    case "bulleted_list":
    case "numbered_list":
    case "toggle":
      return {
        type,
        richText: extractRichText(
          content?.richText !== undefined ? content.richText : content,
          plainText,
        ),
      };

    case "todo":
      return {
        type: "todo",
        richText: extractRichText(
          content?.richText !== undefined ? content.richText : content,
          plainText,
        ),
        checked: Boolean(content?.checked),
      };

    case "callout":
      return {
        type: "callout",
        richText: extractRichText(
          content?.richText !== undefined ? content.richText : content,
          plainText,
        ),
        icon: content?.icon || "Lightbulb",
        color: content?.color || "blue",
      };

    case "code":
      return {
        type: "code",
        language: content?.language || "typescript",
        code:
          typeof content?.code === "string"
            ? content.code
            : typeof content === "string"
              ? content
              : plainText || "",
        caption: content?.caption,
      };

    case "divider":
      return { type: "divider" };

    case "table":
      return {
        type: "table",
        rows: Array.isArray(content?.rows) ? content.rows : [],
      };

    case "bookmark":
      return {
        type: "bookmark",
        url: content?.url || "",
        title: content?.title,
        description: content?.description,
        favicon: content?.favicon,
      };

    case "file":
      return {
        type: "file",
        ...(typeof content === "object" ? content : {}),
      };

    case "image":
      return {
        type: "image",
        ...(typeof content === "object" ? content : {}),
      };

    case "page_link":
      return {
        type: "page_link",
        pageId: content?.pageId || "",
        title: content?.title,
        caption: content?.caption,
      };

    case "diagram":
      return {
        type: "diagram",
        diagramId: content?.diagramId || "",
      };

    default:
      return {
        type: "paragraph",
        richText: extractRichText(content, plainText),
      };
  }
}

// Safely unwrap blocks from direct arrays, tRPC batch responses, or wrapped objects
export function unwrapBlocks(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    // Check if it's a tRPC batch response: [{ result: { data: [...] } }]
    if (
      payload.length > 0 &&
      payload[0]?.result?.data &&
      Array.isArray(payload[0].result.data)
    ) {
      return payload[0].result.data;
    }
    // Check if single wrapper object: [{ data: [...] }]
    if (
      payload.length === 1 &&
      payload[0]?.data &&
      Array.isArray(payload[0].data)
    ) {
      return payload[0].data;
    }
    return payload;
  }
  if (typeof payload === "object") {
    if (Array.isArray(payload.result?.data)) return payload.result.data;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.blocks)) return payload.blocks;
  }
  return [];
}

// Normalize an entire block to guarantee consistent structure across rendering and autosave
export function normalizeBlock(raw: any): Block {
  const type = (raw.type || "paragraph") as BlockType;
  const rawPlainText = raw.plainText || raw.plain_text || "";
  const content = normalizeBlockContent(type, raw.content, rawPlainText);
  let plainText = rawPlainText;
  if (!plainText) {
    if ("richText" in content && Array.isArray(content.richText)) {
      plainText = content.richText.map((s) => s.text || "").join("");
    } else if (content.type === "code") {
      plainText = content.code || "";
    }
  }

  const blockId =
    raw.blockId ||
    raw.block_id ||
    raw.id ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Math.random()));

  const pageId = raw.pageId || raw.page_id || "";
  const parentBlockId = raw.parentBlockId ?? raw.parent_block_id ?? null;
  const position = raw.position || "a0";
  const createdAt = raw.createdAt || raw.created_at || new Date().toISOString();
  const updatedAt = raw.updatedAt || raw.updated_at || new Date().toISOString();

  return {
    blockId,
    pageId,
    parentBlockId,
    type,
    content,
    position,
    plainText,
    createdAt,
    updatedAt,
  };
}
