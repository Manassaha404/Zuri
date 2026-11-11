"use client";

// Text blocks: paragraph, heading_1, heading_2, heading_3, quote — in-place seamless editing with comfortable typography & rich text
import { useState, useEffect, useRef } from "react";
import { Block, BlockType } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import {
  richTextToHtml,
  htmlToRichText,
  toggleRichTextFormat,
} from "../richTextUtils";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  ChevronDown,
} from "lucide-react";

interface TextBlockProps {
  block: Block;
  onOpenSlash?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const TEXT_OPTIONS: {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "paragraph", label: "Text", icon: Type },
  { type: "heading_1", label: "Heading 1", icon: Heading1 },
  { type: "heading_2", label: "Heading 2", icon: Heading2 },
  { type: "heading_3", label: "Heading 3", icon: Heading3 },
  { type: "quote", label: "Quote", icon: Quote },
];

export function TextBlock({
  block,
  onOpenSlash,
  onFocus,
  onBlur,
}: TextBlockProps) {
  const {
    updateBlockContent,
    addBlock,
    deleteBlock,
    convertBlockType,
    focusedBlockId,
    setFocusedBlockId,
    blocks,
  } = useNotesStore();
  const editableRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isUserEditingRef = useRef(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const content = block.content;
  if (!("richText" in content)) return null;

  // Auto-focus when this block was just created or targeted
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

  // Sync HTML from store when not actively user-editing
  useEffect(() => {
    if (!isUserEditingRef.current && editableRef.current) {
      const html = richTextToHtml(content.richText);
      if (editableRef.current.innerHTML !== html) {
        editableRef.current.innerHTML = html;
      }
    }
  }, [content.richText]);

  // Close type dropdown on click outside
  useEffect(() => {
    if (!isTypeDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTypeDropdownOpen]);

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

  const syncRichTextImmediate = () => {
    if (editableRef.current) {
      const newRichText = htmlToRichText(editableRef.current);
      updateBlockContent(block.blockId, {
        ...content,
        richText: newRichText,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // 1. Slash command trigger
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      onOpenSlash?.();
    }

    // 2. Rich text keyboard shortcuts (toggle / select & unselect) with immediate persistence
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleRichTextFormat("bold");
      syncRichTextImmediate();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      toggleRichTextFormat("italic");
      syncRichTextImmediate();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
      e.preventDefault();
      toggleRichTextFormat("underline");
      syncRichTextImmediate();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      toggleRichTextFormat("strike");
      syncRichTextImmediate();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
      e.preventDefault();
      toggleRichTextFormat("code");
      syncRichTextImmediate();
      return;
    }

    // 3. Enter key creates new paragraph below and auto-focuses it
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
      addBlock(block.pageId, "paragraph", block.blockId);
      return;
    }

    // 4. Backspace on empty block converts to paragraph or deletes
    if (e.key === "Backspace") {
      const rawText = editableRef.current?.textContent || "";
      const cleanText = rawText.replace(/[\u200B\u00A0\s]/g, "");
      if (cleanText.length === 0) {
        e.preventDefault();
        if (block.type !== "paragraph") {
          convertBlockType(block.blockId, "paragraph");
          setFocusedBlockId(block.blockId);
        } else {
          const pageSiblings = blocks.filter((b) => b.pageId === block.pageId);
          const idx = pageSiblings.findIndex(
            (b) => b.blockId === block.blockId,
          );
          if (idx > 0 && pageSiblings[idx - 1]) {
            setFocusedBlockId(pageSiblings[idx - 1]!.blockId);
          }
          deleteBlock(block.blockId);
        }
      }
    }
  };

  // Typography & placeholder — balanced, comfortable, highly readable sizes
  let Tag: "h1" | "h2" | "h3" | "blockquote" | "div" = "div";
  let classes =
    "leading-[1.75] text-[var(--b)] my-2 py-1 px-1 min-h-[1.6em] outline-none cursor-text rounded-lg";
  let style: React.CSSProperties = { fontSize: "19px", lineHeight: "1.75" };
  let placeholder = "Type something or '/' for commands...";

  if (block.type === "heading_1") {
    Tag = "h1";
    classes =
      "tracking-tight text-[var(--i)] my-4 py-1 px-1 min-h-[1.3em] outline-none cursor-text rounded-lg";
    style = { fontSize: "36px", lineHeight: "1.25", fontWeight: 800 };
    placeholder = "Heading 1";
  } else if (block.type === "heading_2") {
    Tag = "h2";
    classes =
      "tracking-tight text-[var(--i)] my-3 py-1 px-1 min-h-[1.3em] outline-none cursor-text rounded-lg";
    style = { fontSize: "28px", lineHeight: "1.3", fontWeight: 700 };
    placeholder = "Heading 2";
  } else if (block.type === "heading_3") {
    Tag = "h3";
    classes =
      "tracking-tight text-[var(--i)] my-2.5 py-1 px-1 min-h-[1.3em] outline-none cursor-text rounded-lg";
    style = { fontSize: "22px", lineHeight: "1.35", fontWeight: 600 };
    placeholder = "Heading 3";
  } else if (block.type === "quote") {
    Tag = "blockquote";
    classes =
      "border-l-4 border-[var(--i)] pl-5 my-3 py-1 px-1 italic text-[var(--b)]/90 min-h-[1.6em] outline-none cursor-text rounded-r-lg";
    style = { fontSize: "19px", lineHeight: "1.75", fontStyle: "italic" };
    placeholder = "Empty quote...";
  }

  const currentOption =
    TEXT_OPTIONS.find((opt) => opt.type === block.type) || TEXT_OPTIONS[0]!;
  const CurrentIcon = currentOption.icon;
  const CustomTag = Tag as any;

  return (
    <div className="relative group/textblock w-full">
      {/* Unobtrusive Type Selector Trigger */}
      <div
        ref={dropdownRef}
        className={`absolute right-1 -top-3 z-30 select-none transition-opacity duration-150 ${
          isTypeDropdownOpen
            ? "opacity-100"
            : "opacity-0 group-hover/textblock:opacity-100"
        }`}
      >
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsTypeDropdownOpen((prev) => !prev);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--h)] bg-[var(--bg)]/95 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)]/50 shadow-xs backdrop-blur-sm transition-all cursor-pointer"
          title="Change text block type"
        >
          <CurrentIcon className="h-3 w-3 text-[var(--accent)]" />
          <span>{currentOption.label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>

        {isTypeDropdownOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-1.5 shadow-2xl z-50 animate-in fade-in-0 duration-100 select-none"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--m)]">
              Turn into
            </div>
            {TEXT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = block.type === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    convertBlockType(block.blockId, opt.type);
                    setIsTypeDropdownOpen(false);
                    editableRef.current?.focus();
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-[var(--s)] text-[var(--i)] font-bold"
                      : "text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--m)]" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CustomTag
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={style}
        className={`${classes} [&_strong]:font-bold [&_strong]:text-[var(--i)] [&_b]:font-bold [&_b]:text-[var(--i)] [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:bg-[var(--s)] [&_code]:text-[var(--i)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:border [&_code]:border-[var(--h)] empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--m)]/40 empty:before:pointer-events-none`}
      />
    </div>
  );
}
