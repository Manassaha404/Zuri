"use client";

// Renderer for rich text spans supporting marks, external links, and internal page mentions
import { RichText } from "../types";
import { useNotesStore } from "@/store/notesStore";
import { FileText, ExternalLink } from "lucide-react";

interface InlineRichTextRendererProps {
  richText: RichText;
  placeholder?: string;
}

export function InlineRichTextRenderer({
  richText,
  placeholder,
}: InlineRichTextRendererProps) {
  const { setActivePage, pages } = useNotesStore();

  if (
    !richText ||
    richText.length === 0 ||
    (richText.length === 1 && !richText[0]?.text)
  ) {
    return (
      <span className="text-[var(--m)]/50 select-none">
        {placeholder || "Empty block"}
      </span>
    );
  }

  return (
    <span>
      {richText.map((span, idx) => {
        let classes = "";
        if (span.marks?.includes("bold"))
          classes += " font-bold text-[var(--i)]";
        if (span.marks?.includes("italic")) classes += " italic";
        if (span.marks?.includes("underline"))
          classes += " underline underline-offset-3";
        if (span.marks?.includes("strike"))
          classes += " line-through opacity-70";
        if (span.marks?.includes("code")) {
          classes +=
            " font-mono text-[0.88em] bg-[var(--surface-strong)]/80 text-[var(--i)] px-1.5 py-0.5 rounded border border-[var(--h)]";
        }

        // Internal page mention link
        if (span.pageId) {
          const target = pages.find((p) => p.pageId === span.pageId);
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (span.pageId) setActivePage(span.pageId);
              }}
              className="inline-flex items-center gap-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 mx-0.5 text-[0.9em] font-medium hover:bg-[var(--accent)]/20 transition-colors align-baseline"
              title={`Jump to page: ${target?.title || "Page"}`}
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span>{span.text || target?.title || "Mentioned Page"}</span>
            </button>
          );
        }

        // External link
        if (span.href) {
          return (
            <a
              key={idx}
              href={span.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[var(--accent)] underline underline-offset-3 hover:opacity-80 transition-opacity"
            >
              <span>{span.text}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </a>
          );
        }

        return (
          <span key={idx} className={classes || undefined}>
            {span.text}
          </span>
        );
      })}
    </span>
  );
}
