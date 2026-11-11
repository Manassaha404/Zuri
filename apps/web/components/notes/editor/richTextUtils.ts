import { RichText, RichTextSpan, RichTextMark } from "../types";

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
