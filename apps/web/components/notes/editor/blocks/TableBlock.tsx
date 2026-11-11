"use client";

// Table block with rows × cells of rich text, column/row insertion, and in-place rich text editing
import { Block, RichText } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import {
  richTextToHtml,
  htmlToRichText,
  toggleRichTextFormat,
} from "../richTextUtils";
import { Plus, Trash2 } from "lucide-react";

interface TableBlockProps {
  block: Block;
}

export function TableBlock({ block }: TableBlockProps) {
  const { updateBlockContent } = useNotesStore();

  const content = block.content;
  if (content.type !== "table") return null;

  const rows = content.rows || [];

  const handleCellBlur = (r: number, c: number, el: HTMLElement) => {
    const newRichText = htmlToRichText(el);
    const newRows = rows.map((row, rowIdx) => {
      if (rowIdx !== r) return row;
      return row.map((cell, colIdx) => {
        if (colIdx !== c) return cell;
        return newRichText;
      });
    });

    updateBlockContent(block.blockId, {
      type: "table",
      rows: newRows,
    });
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
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
  };

  const handleAddRow = () => {
    const colCount = rows[0]?.length || 2;
    const newRow: RichText[] = Array.from({ length: colCount }, () => [
      { text: "" },
    ]);
    updateBlockContent(block.blockId, {
      type: "table",
      rows: [...rows, newRow],
    });
  };

  const handleAddCol = () => {
    const newRows = rows.map((row) => [...row, [{ text: "" }]]);
    updateBlockContent(block.blockId, {
      type: "table",
      rows: newRows,
    });
  };

  const handleDeleteRow = (r: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, idx) => idx !== r);
    updateBlockContent(block.blockId, {
      type: "table",
      rows: newRows,
    });
  };

  return (
    <div className="my-5 overflow-x-auto notes-scrollbar rounded-2xl border border-[var(--h)] bg-[var(--bg)] shadow-xs">
      <table className="w-full border-collapse text-base sm:text-[17px]">
        <tbody>
          {rows.map((row, rIdx) => {
            const isHeader = rIdx === 0;
            return (
              <tr
                key={rIdx}
                className={`group/row border-b border-[var(--h)] last:border-b-0 ${
                  isHeader
                    ? "bg-[var(--s)]/70 font-semibold text-[var(--i)]"
                    : "text-[var(--b)]"
                }`}
              >
                {row.map((cell, cIdx) => {
                  return (
                    <td
                      key={cIdx}
                      className="border-r border-[var(--h)] last:border-r-0 p-4 min-w-[160px] relative hover:bg-[var(--s)]/30 transition-colors"
                    >
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          handleCellBlur(rIdx, cIdx, e.currentTarget)
                        }
                        onKeyDown={handleCellKeyDown}
                        dangerouslySetInnerHTML={{
                          __html: richTextToHtml(cell),
                        }}
                        className="outline-none min-h-[1.5em] leading-relaxed cursor-text empty:before:content-['Empty'] empty:before:text-[var(--m)]/40 empty:before:pointer-events-none"
                      />
                    </td>
                  );
                })}

                {/* Delete row button on hover — header row (rIdx === 0) is protected */}
                {rows.length > 1 && rIdx > 0 && (
                  <td className="w-10 p-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rIdx)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Table controls */}
      <div className="flex items-center justify-between border-t border-[var(--h)] bg-[var(--s)]/40 px-5 py-3 text-xs sm:text-sm font-semibold text-[var(--m)]">
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-2 hover:text-[var(--i)] font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add row</span>
        </button>
        <button
          type="button"
          onClick={handleAddCol}
          className="flex items-center gap-2 hover:text-[var(--i)] font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add column</span>
        </button>
      </div>
    </div>
  );
}
