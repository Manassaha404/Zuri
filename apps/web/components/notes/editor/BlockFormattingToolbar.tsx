"use client";

// Floating block menu bar positioned in the middle of the block with rich text styles & block type switcher
import { useState, useEffect, useRef } from "react";
import { BlockType } from "../types";
import { useNotesStore } from "@/store/notesStore";
import { isFormatActive } from "./richTextUtils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Trash2,
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Sparkles,
  Plus,
} from "lucide-react";

interface BlockFormattingToolbarProps {
  blockId: string;
  currentType: BlockType;
  onOpenSlash: () => void;
  onFormatCommand: (
    command: "bold" | "italic" | "underline" | "strike" | "code",
  ) => void;
}

const TYPE_OPTIONS: {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "paragraph", label: "Text", icon: Type },
  { type: "heading_1", label: "Heading 1", icon: Heading1 },
  { type: "heading_2", label: "Heading 2", icon: Heading2 },
  { type: "heading_3", label: "Heading 3", icon: Heading3 },
  { type: "bulleted_list", label: "Bulleted List", icon: List },
  { type: "numbered_list", label: "Numbered List", icon: ListOrdered },
  { type: "todo", label: "To-do List", icon: CheckSquare },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "callout", label: "Callout", icon: Sparkles },
  { type: "code", label: "Code", icon: Code },
];

export function BlockFormattingToolbar({
  blockId,
  currentType,
  onOpenSlash,
  onFormatCommand,
}: BlockFormattingToolbarProps) {
  const { convertBlockType, deleteBlock } = useNotesStore();
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    code: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
  });

  const checkFormats = () => {
    setActiveFormats({
      bold: isFormatActive("bold"),
      italic: isFormatActive("italic"),
      underline: isFormatActive("underline"),
      strike: isFormatActive("strike"),
      code: isFormatActive("code"),
    });
  };

  useEffect(() => {
    checkFormats();
    const handleSelectionChange = () => {
      checkFormats();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Close dropdown on click outside
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

  const activeTypeOption =
    TYPE_OPTIONS.find((opt) => opt.type === currentType) || TYPE_OPTIONS[0]!;
  const ActiveTypeIcon = activeTypeOption.icon;

  const handleCommand = (
    cmd: "bold" | "italic" | "underline" | "strike" | "code",
  ) => {
    onFormatCommand(cmd);
    setTimeout(checkFormats, 20);
  };

  return (
    <div
      onMouseDown={(e) => {
        // Prevent editable from losing selection focus
        e.preventDefault();
      }}
      className="flex items-center gap-1 rounded-2xl border border-[var(--h)] bg-[var(--bg)] px-2 py-1.5 shadow-2xl text-sm backdrop-blur-md select-none whitespace-nowrap"
    >
      {/* Block Type Switcher */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsTypeDropdownOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-[var(--i)] hover:bg-[var(--s)] transition-colors"
          title="Turn into..."
        >
          <ActiveTypeIcon className="h-4 w-4 text-[var(--m)]" />
          <span className="font-semibold text-xs sm:text-sm">
            {activeTypeOption.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--m)] opacity-70" />
        </button>

        {isTypeDropdownOpen && (
          <div className="absolute left-0 top-full mt-2 z-50 w-52 rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-1.5 shadow-2xl text-xs sm:text-sm space-y-0.5 animate-in fade-in-0 select-none">
            <div className="px-2.5 py-1 text-[11px] font-bold text-[var(--m)] uppercase tracking-wider">
              Turn into
            </div>
            {TYPE_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = opt.type === currentType;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    convertBlockType(blockId, opt.type);
                    setIsTypeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    isSelected
                      ? "bg-[var(--s)] text-[var(--i)] font-bold"
                      : "text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)]"
                  }`}
                >
                  <IconComp className="h-4 w-4 text-[var(--m)]" />
                  <span className="text-xs sm:text-sm font-medium">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-[var(--h)] mx-1" />

      {/* Bold (Select / Unselect) */}
      <button
        type="button"
        onClick={() => handleCommand("bold")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors font-bold text-xs ${
          activeFormats.bold
            ? "bg-[var(--s)] text-[var(--accent)] font-extrabold ring-1 ring-[var(--accent)]/40"
            : "text-[var(--i)] hover:bg-[var(--s)]"
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>

      {/* Italic (Select / Unselect) */}
      <button
        type="button"
        onClick={() => handleCommand("italic")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors italic text-xs ${
          activeFormats.italic
            ? "bg-[var(--s)] text-[var(--accent)] font-bold ring-1 ring-[var(--accent)]/40"
            : "text-[var(--i)] hover:bg-[var(--s)]"
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>

      {/* Underline (Select / Unselect) */}
      <button
        type="button"
        onClick={() => handleCommand("underline")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors underline text-xs ${
          activeFormats.underline
            ? "bg-[var(--s)] text-[var(--accent)] font-bold ring-1 ring-[var(--accent)]/40"
            : "text-[var(--i)] hover:bg-[var(--s)]"
        }`}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </button>

      {/* Strikethrough (Select / Unselect) */}
      <button
        type="button"
        onClick={() => handleCommand("strike")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors text-xs ${
          activeFormats.strike
            ? "bg-[var(--s)] text-[var(--accent)] font-bold ring-1 ring-[var(--accent)]/40"
            : "text-[var(--i)] hover:bg-[var(--s)]"
        }`}
        title="Strikethrough (Ctrl+Shift+S)"
      >
        <Strikethrough className="h-4 w-4" />
      </button>

      {/* Inline Code (Select / Unselect) */}
      <button
        type="button"
        onClick={() => handleCommand("code")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors font-mono text-xs ${
          activeFormats.code
            ? "bg-[var(--s)] text-[var(--accent)] font-bold ring-1 ring-[var(--accent)]/40"
            : "text-[var(--i)] hover:bg-[var(--s)]"
        }`}
        title="Inline Code (Ctrl+E)"
      >
        <Code className="h-4 w-4" />
      </button>

      <div className="h-5 w-px bg-[var(--h)] mx-1" />

      {/* Insert below */}
      <button
        type="button"
        onClick={onOpenSlash}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
        title="Insert block below (/)"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Delete Block */}
      <button
        type="button"
        onClick={() => deleteBlock(blockId)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
        title="Delete block"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
