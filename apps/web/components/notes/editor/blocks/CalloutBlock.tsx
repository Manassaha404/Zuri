"use client";

// Callout block with icon, theme color, and in-place rich text editing with generous padding & readable text
import { useEffect, useRef } from "react";
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import {
  richTextToHtml,
  htmlToRichText,
  toggleRichTextFormat,
} from "../richTextUtils";
import {
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Terminal,
} from "lucide-react";

interface CalloutBlockProps {
  block: Block;
  onOpenSlash?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Terminal,
};

export function CalloutBlock({
  block,
  onOpenSlash,
  onFocus,
  onBlur,
}: CalloutBlockProps) {
  const {
    updateBlockContent,
    addBlock,
    deleteBlock,
    convertBlockType,
    focusedBlockId,
    setFocusedBlockId,
  } = useNotesStore();
  const editableRef = useRef<HTMLDivElement>(null);
  const isUserEditingRef = useRef(false);

  const content = block.content;
  if (content.type !== "callout") return null;

  const IconComp = (content.icon && ICON_MAP[content.icon]) || Lightbulb;
  const color = content.color || "blue";

  // Auto-focus when this block was just created
  useEffect(() => {
    if (focusedBlockId === block.blockId && editableRef.current) {
      editableRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      setFocusedBlockId(null);
    }
  }, [focusedBlockId, block.blockId, setFocusedBlockId]);

  // Sync HTML from store
  useEffect(() => {
    if (!isUserEditingRef.current && editableRef.current) {
      const html = richTextToHtml(content.richText);
      if (editableRef.current.innerHTML !== html) {
        editableRef.current.innerHTML = html;
      }
    }
  }, [content.richText]);

  const handleFocus = () => {
    isUserEditingRef.current = true;
    onFocus?.();
  };

  const handleBlur = () => {
    isUserEditingRef.current = false;
    onBlur?.();
    if (editableRef.current) {
      const newRichText = htmlToRichText(editableRef.current);
      updateBlockContent(block.blockId, {
        ...content,
        richText: newRichText,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      onOpenSlash?.();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleRichTextFormat("bold");
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      toggleRichTextFormat("italic");
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
      e.preventDefault();
      toggleRichTextFormat("underline");
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      toggleRichTextFormat("strike");
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
      e.preventDefault();
      toggleRichTextFormat("code");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
      addBlock(block.pageId, "paragraph", block.blockId);
      return;
    }
    if (e.key === "Backspace") {
      const text = editableRef.current?.textContent || "";
      if (text.length === 0 || text === "\n") {
        e.preventDefault();
        convertBlockType(block.blockId, "paragraph");
      }
    }
  };

  const colorClasses =
    color === "blue"
      ? "border-blue-500/20 bg-blue-500/5 text-blue-900 dark:text-blue-100"
      : color === "emerald"
        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100"
        : color === "amber"
          ? "border-amber-500/20 bg-amber-500/5 text-amber-900 dark:text-amber-100"
          : "border-[var(--h)] bg-[var(--s)] text-[var(--i)]";

  return (
    <div
      className={`my-4 flex items-start gap-4 rounded-2xl border p-5 sm:p-6 text-[18px] sm:text-[19px] leading-relaxed transition-colors ${colorClasses}`}
    >
      <div className="shrink-0 mt-1 text-[var(--accent)]">
        <IconComp className="h-6 w-6" />
      </div>
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder="Callout text…"
        className="flex-1 min-w-0 text-[var(--b)] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--m)]/40 empty:before:pointer-events-none"
      />
    </div>
  );
}
