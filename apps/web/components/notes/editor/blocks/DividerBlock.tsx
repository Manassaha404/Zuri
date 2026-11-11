"use client";

import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";

interface DividerBlockProps {
  block: Block;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function DividerBlock({ block, onFocus, onBlur }: DividerBlockProps) {
  const { addBlock, deleteBlock } = useNotesStore();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBlock(block.pageId, "paragraph", block.blockId);
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      deleteBlock(block.blockId);
      return;
    }
  };

  return (
    <div
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      className="my-3 py-3 px-2 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all group"
      title="Divider (Press Enter to insert paragraph, Backspace to delete)"
    >
      <hr className="border-0 border-t border-[var(--h)] group-hover:border-[var(--m)]/40 transition-colors" />
    </div>
  );
}
