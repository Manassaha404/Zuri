"use client";

// List blocks: bulleted, numbered, todo (checked), toggle — in-place seamless editing with large, easily readable text
import { useState, useEffect, useRef } from "react";
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import {
  richTextToHtml,
  htmlToRichText,
  toggleRichTextFormat,
} from "../richTextUtils";
import { Check, ChevronRight, ChevronDown } from "lucide-react";

interface ListBlockProps {
  block: Block;
  indexInList?: number;
  children?: React.ReactNode;
  onOpenSlash?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function ListBlock({
  block,
  indexInList = 1,
  children,
  onOpenSlash,
  onFocus,
  onBlur,
}: ListBlockProps) {
  const {
    toggleTodoBlock,
    updateBlockContent,
    addBlock,
    deleteBlock,
    convertBlockType,
    outdentBlock,
    focusedBlockId,
    setFocusedBlockId,
  } = useNotesStore();
  const [isOpen, setIsOpen] = useState(true);
  const editableRef = useRef<HTMLDivElement>(null);
  const isUserEditingRef = useRef(false);

  const content = block.content;

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

  // Sync HTML from store when not actively editing
  useEffect(() => {
    if (
      !isUserEditingRef.current &&
      editableRef.current &&
      "richText" in content
    ) {
      const html = richTextToHtml(content.richText);
      if (editableRef.current.innerHTML !== html) {
        editableRef.current.innerHTML = html;
      }
    }
  }, [content]);

  const handleFocus = () => {
    isUserEditingRef.current = true;
    onFocus?.();
  };

  const handleBlur = () => {
    isUserEditingRef.current = false;
    onBlur?.();
    if (editableRef.current && "richText" in content) {
      const newRichText = htmlToRichText(editableRef.current);
      updateBlockContent(block.blockId, {
        ...content,
        richText: newRichText,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // 1. Slash command
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      onOpenSlash?.();
    }

    // 2. Formatting shortcuts (select & unselect)
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

    // 3. Enter key: if empty (no text added to list), exit list & create normal text block
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const rawText = editableRef.current?.textContent || "";
      const cleanText = rawText.replace(/[\u200B\u00A0\s]/g, "");

      if (cleanText.length === 0) {
        if (block.parentBlockId) {
          outdentBlock(block.blockId);
        }
        if (editableRef.current) {
          editableRef.current.innerHTML = "";
        }
        updateBlockContent(block.blockId, {
          type: "paragraph",
          richText: [{ text: "" }],
        } as any);
        convertBlockType(block.blockId, "paragraph");
        setFocusedBlockId(block.blockId);
        return;
      }

      handleBlur();
      addBlock(
        block.pageId,
        block.type,
        block.blockId,
        block.parentBlockId ?? null,
      );
      return;
    }

    // 4. Backspace on empty converts to paragraph or deletes
    if (e.key === "Backspace") {
      const rawText = editableRef.current?.textContent || "";
      const cleanText = rawText.replace(/[\u200B\u00A0\s]/g, "");
      if (cleanText.length === 0) {
        e.preventDefault();
        if (block.parentBlockId) {
          outdentBlock(block.blockId);
        }
        if (editableRef.current) {
          editableRef.current.innerHTML = "";
        }
        updateBlockContent(block.blockId, {
          type: "paragraph",
          richText: [{ text: "" }],
        } as any);
        convertBlockType(block.blockId, "paragraph");
        setFocusedBlockId(block.blockId);
      }
    }
  };

  // ── Todo ──────────────────────────────────────────────────────────────────
  if (block.type === "todo" && content.type === "todo") {
    return (
      <div className="flex items-start gap-4 py-2.5 text-[22px] sm:text-[24px]">
        <button
          type="button"
          onClick={() => toggleTodoBlock(block.blockId)}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all mt-1 ${
            content.checked
              ? "border-[var(--i)] bg-[var(--i)] text-[var(--pt)]"
              : "border-[var(--m)]/50 hover:border-[var(--i)] bg-transparent"
          }`}
        >
          {content.checked && <Check className="h-4.5 w-4.5 stroke-[3]" />}
        </button>

        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          data-placeholder="To-do item…"
          className={`flex-1 min-w-0 leading-[1.8] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--m)]/40 empty:before:pointer-events-none transition-opacity ${
            content.checked
              ? "line-through opacity-40 text-[var(--m)]"
              : "text-[var(--b)]"
          }`}
        />
      </div>
    );
  }

  // ── Bulleted list ──────────────────────────────────────────────────────────
  if (block.type === "bulleted_list" && "richText" in content) {
    return (
      <div className="flex items-start gap-4 py-2 text-[22px] sm:text-[24px]">
        <span className="mt-3.5 h-3 w-3 shrink-0 rounded-full bg-[var(--i)]/80" />
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          data-placeholder="List item…"
          className="flex-1 min-w-0 leading-[1.8] text-[var(--b)] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--m)]/40 empty:before:pointer-events-none"
        />
      </div>
    );
  }

  // ── Numbered list ──────────────────────────────────────────────────────────
  if (block.type === "numbered_list" && "richText" in content) {
    return (
      <div className="flex items-start gap-4 py-2 text-[22px] sm:text-[24px]">
        <span className="min-w-[2rem] shrink-0 text-right text-lg sm:text-xl font-bold text-[var(--m)] pt-0.5">
          {indexInList}.
        </span>
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          data-placeholder="Numbered item…"
          className="flex-1 min-w-0 leading-[1.8] text-[var(--b)] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--m)]/40 empty:before:pointer-events-none"
        />
      </div>
    );
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────
  if (block.type === "toggle" && "richText" in content) {
    return (
      <div className="py-2 text-[22px] sm:text-[24px]">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="mt-1.5 shrink-0 text-[var(--m)] hover:text-[var(--i)] transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </button>
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            data-placeholder="Toggle heading…"
            className="flex-1 min-w-0 font-bold text-[var(--i)] leading-[1.8] outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--m)]/40 empty:before:pointer-events-none"
          />
        </div>

        {isOpen && children && (
          <div className="ml-9 mt-2.5 border-l-2 border-[var(--h)]/60 pl-5 space-y-2">
            {children}
          </div>
        )}
      </div>
    );
  }

  return null;
}
