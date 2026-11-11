"use client";

// Block wrapper — Notion-style smooth drag & drop motion reordering, beside-block aligned handles, middle formatting toolbar, options dropdown
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Block, BlockType } from "../types";
import { useNotesStore } from "@/store/notesStore";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { BlockFormattingToolbar } from "./BlockFormattingToolbar";
import { toggleRichTextFormat, htmlToRichText } from "./richTextUtils";
import {
  generatePositionBetween,
  sortByPosition,
} from "../utils/fractional-index";
import { TextBlock } from "./blocks/TextBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { ListBlock } from "./blocks/ListBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { TableBlock } from "./blocks/TableBlock";
import { BookmarkBlock } from "./blocks/BookmarkBlock";
import { PageLinkBlock } from "./blocks/PageLinkBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { FileBlock } from "./blocks/FileBlock";
import {
  GripVertical,
  Plus,
  Trash2,
  Indent,
  Outdent,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface BlockItemProps {
  block: Block;
  indexInList?: number;
  prevBlockId?: string;
}

export function BlockItem({
  block,
  indexInList = 1,
  prevBlockId,
}: BlockItemProps) {
  const {
    addBlock,
    deleteBlock,
    updateBlockContent,
    indentBlock,
    outdentBlock,
    convertBlockType,
    reorderBlock,
    moveBlock,
    blocks,
  } = useNotesStore();

  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<"top" | "bottom" | null>(
    null,
  );

  const menuRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const isNested = Boolean(block.parentBlockId);
  const childBlocks = blocks.filter((b) => b.parentBlockId === block.blockId);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen]);

  // Track text selection inside this block to keep formatting toolbar visible & selectable
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setHasSelection(false);
        return;
      }
      if (blockRef.current && blockRef.current.contains(sel.anchorNode)) {
        setHasSelection(true);
      } else {
        setHasSelection(false);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleSlashSelect = (type: BlockType) => {
    const isTextBlock =
      block.type === "paragraph" ||
      block.type === "heading_1" ||
      block.type === "heading_2" ||
      block.type === "heading_3" ||
      block.type === "quote";
    const isCurrentEmpty =
      isTextBlock &&
      (!block.plainText ||
        block.plainText.trim() === "" ||
        block.plainText.trim() === "/");
    if (isCurrentEmpty) {
      convertBlockType(block.blockId, type);
    } else {
      addBlock(block.pageId, type, block.blockId);
    }
  };

  const handleFormatCommand = (
    cmd: "bold" | "italic" | "underline" | "strike" | "code",
  ) => {
    toggleRichTextFormat(cmd);
    const editableEl = blockRef.current?.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement | null;
    if (editableEl) {
      const newRichText = htmlToRichText(editableEl);
      const currContent = block.content;
      if ("richText" in currContent) {
        updateBlockContent(block.blockId, {
          ...currContent,
          richText: newRichText,
        });
      }
    }
  };

  // Drag and Drop reordering handlers with smooth physics
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", block.blockId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    if (!blockRef.current) return;
    const rect = blockRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const isTopHalf = offsetY < rect.height / 2;
    setDropPosition(isTopHalf ? "top" : "bottom");
  };

  const handleDragLeave = () => {
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceBlockId = e.dataTransfer.getData("text/plain");
    const targetBlockId = block.blockId;
    const targetDropPosition = dropPosition;
    setDropPosition(null);
    setIsDragging(false);

    if (!sourceBlockId || sourceBlockId === targetBlockId) return;

    // Get sorted sibling blocks
    const pageSiblings = sortByPosition(
      blocks.filter(
        (b) =>
          b.pageId === block.pageId && b.parentBlockId === block.parentBlockId,
      ),
    );

    const targetIdx = pageSiblings.findIndex(
      (b) => b.blockId === targetBlockId,
    );
    if (targetIdx === -1) return;

    let newPosition = "a0";

    if (targetDropPosition === "top") {
      const prevBlock = targetIdx > 0 ? pageSiblings[targetIdx - 1] : null;
      newPosition = generatePositionBetween(
        prevBlock?.position || null,
        pageSiblings[targetIdx]?.position || null,
      );
    } else {
      const nextBlock =
        targetIdx < pageSiblings.length - 1
          ? pageSiblings[targetIdx + 1]
          : null;
      newPosition = generatePositionBetween(
        pageSiblings[targetIdx]?.position || null,
        nextBlock?.position || null,
      );
    }

    reorderBlock(sourceBlockId, newPosition);
  };

  const isTextType =
    block.type === "paragraph" ||
    block.type === "heading_1" ||
    block.type === "heading_2" ||
    block.type === "heading_3" ||
    block.type === "quote" ||
    block.type === "bulleted_list" ||
    block.type === "numbered_list" ||
    block.type === "todo" ||
    block.type === "toggle" ||
    block.type === "callout";

  const renderContent = () => {
    switch (block.type) {
      case "heading_1":
      case "heading_2":
      case "heading_3":
      case "paragraph":
      case "quote":
        return (
          <TextBlock
            block={block}
            onOpenSlash={() => setIsSlashOpen(true)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 300)}
          />
        );
      case "callout":
        return (
          <CalloutBlock
            block={block}
            onOpenSlash={() => setIsSlashOpen(true)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 300)}
          />
        );
      case "bulleted_list":
      case "numbered_list":
      case "todo":
      case "toggle":
        return (
          <ListBlock
            block={block}
            indexInList={indexInList}
            onOpenSlash={() => setIsSlashOpen(true)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 300)}
          >
            {childBlocks.map((child, idx) => (
              <BlockItem
                key={child.blockId}
                block={child}
                indexInList={idx + 1}
                prevBlockId={childBlocks[idx - 1]?.blockId}
              />
            ))}
          </ListBlock>
        );
      case "code":
        return <CodeBlock block={block} />;
      case "divider":
        return <DividerBlock block={block} />;
      case "table":
        return <TableBlock block={block} />;
      case "bookmark":
        return <BookmarkBlock block={block} />;
      case "page_link":
        return <PageLinkBlock block={block} />;
      case "image":
        return <ImageBlock block={block} />;
      case "file":
        return <FileBlock block={block} />;
      case "diagram":
        return null;
      default:
        return (
          <div className="text-xs text-[var(--m)]">Unsupported block type</div>
        );
    }
  };

  return (
    <motion.div
      ref={blockRef}
      layout
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group/block relative flex items-center gap-0 transition-opacity ${
        isNested ? "ml-6 pl-3.5 border-l-2 border-[var(--h)]" : ""
      } ${isDragging ? "opacity-35" : "opacity-100"} ${
        isSlashOpen || isMenuOpen ? "z-30" : ""
      }`}
    >
      {/* Drop indicator line with smooth animation */}
      <AnimatePresence>
        {dropPosition && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.85 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.85 }}
            transition={{ duration: 0.12 }}
            className={`absolute left-0 right-0 h-[3px] bg-blue-500 rounded-full z-40 shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none ${
              dropPosition === "top" ? "-top-[2px]" : "-bottom-[2px]"
            }`}
          />
        )}
      </AnimatePresence>

      {/* Middle Block Formatting Toolbar — animated spring popover, visible on focus or text selection */}
      <AnimatePresence>
        {(isFocused || hasSelection) && isTextType && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute left-1/2 -translate-x-1/2 -top-14 z-30 pointer-events-auto"
          >
            <BlockFormattingToolbar
              blockId={block.blockId}
              currentType={block.type}
              onOpenSlash={() => setIsSlashOpen(true)}
              onFormatCommand={handleFormatCommand}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover handles — in the perfect vertical middle of every block */}
      <div
        className={`absolute right-full top-1/2 -translate-y-1/2 flex items-center gap-1 pr-2.5 ${
          isMenuOpen ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"
        } transition-opacity duration-150 select-none z-20`}
        style={{ width: 64 }}
      >
        {/* + Add block below */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSlashOpen(true);
          }}
          className="flex h-[28px] w-[28px] items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          title="Add block below"
        >
          <Plus className="h-4.5 w-4.5" />
        </button>

        {/* :: Drag to reorder / Click for options */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((v) => !v);
            }}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors cursor-grab active:cursor-grabbing"
            title="Drag up/down to reorder, or click for options"
          >
            <GripVertical className="h-4.5 w-4.5" />
          </button>

          {/* Options dropdown */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 w-52 rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-2 shadow-2xl text-xs sm:text-sm space-y-1 animate-in fade-in-0 zoom-in-95 duration-100 select-none">
              {/* Move up */}
              <button
                type="button"
                onClick={() => {
                  moveBlock(block.blockId, "up");
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              >
                <ArrowUp className="h-4 w-4 text-[var(--m)] shrink-0" />
                <span>Move up</span>
              </button>

              {/* Move down */}
              <button
                type="button"
                onClick={() => {
                  moveBlock(block.blockId, "down");
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              >
                <ArrowDown className="h-4 w-4 text-[var(--m)] shrink-0" />
                <span>Move down</span>
              </button>

              <div className="my-1 h-px bg-[var(--h)]" />

              {/* Indent */}
              {prevBlockId && !isNested && (
                <button
                  type="button"
                  onClick={() => {
                    indentBlock(block.blockId, prevBlockId);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
                >
                  <Indent className="h-4 w-4 text-[var(--m)] shrink-0" />
                  <span>Indent</span>
                </button>
              )}

              {/* Outdent */}
              {isNested && (
                <button
                  type="button"
                  onClick={() => {
                    outdentBlock(block.blockId);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
                >
                  <Outdent className="h-4 w-4 text-[var(--m)] shrink-0" />
                  <span>Outdent</span>
                </button>
              )}

              {/* Insert below */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSlashOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              >
                <CornerDownRight className="h-4 w-4 text-[var(--m)] shrink-0" />
                <span>Insert block below</span>
              </button>

              <div className="my-1 h-px bg-[var(--h)]" />

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  deleteBlock(block.blockId);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                <span>Delete block</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Block content */}
      <div
        className="flex-1 min-w-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}

        {/* Slash command below this block */}
        {isSlashOpen && (
          <SlashCommandMenu
            isOpen={isSlashOpen}
            onClose={() => setIsSlashOpen(false)}
            onSelect={(type: BlockType) => {
              handleSlashSelect(type);
              setIsSlashOpen(false);
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
