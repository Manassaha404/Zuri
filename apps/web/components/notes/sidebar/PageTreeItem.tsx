"use client";

// Page item in sidebar chapter tree - strictly no icon/color on pages per DB design
import { useState, useRef } from "react";
import { Page } from "../types";
import { useNotesStore } from "@/store/notesStore";
import { useNotes } from "@/hook/notes";
import { Pin, MoreHorizontal, Archive } from "lucide-react";

interface PageTreeItemProps {
  page: Page;
}

export function PageTreeItem({ page }: PageTreeItemProps) {
  const { activePageId, setActivePage } = useNotesStore();
  const { togglePinPage, archivePage } = useNotes();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isActive = activePageId === page.pageId;

  return (
    <div
      className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm sm:text-[14.5px] transition-colors cursor-pointer ${
        isActive
          ? "bg-[var(--surface-strong)]/80 text-[var(--i)] font-semibold shadow-2xs"
          : "text-[var(--b)] hover:bg-[var(--s)]/80 hover:text-[var(--i)]"
      }`}
      onClick={() => setActivePage(page.pageId)}
    >
      {/* Title & Pin indicator */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="truncate">{page.title || "Untitled"}</span>
        {page.isPinned && (
          <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500/20" />
        )}
      </div>

      {/* Hover actions */}
      <div
        className={`flex items-center gap-1 ${
          isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } transition-opacity`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => togglePinPage(page.pageId)}
          className={`h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--bg)] transition-colors ${
            page.isPinned
              ? "text-amber-500"
              : "text-[var(--m)] hover:text-[var(--i)]"
          }`}
          title={page.isPinned ? "Unpin page" : "Pin page"}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--bg)] text-[var(--m)] hover:text-[var(--i)] transition-colors"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Context dropdown menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            ref={menuRef}
            className="absolute right-0 top-8 z-50 w-52 rounded-xl border border-[var(--h)] bg-[var(--bg)] p-1.5 shadow-xl text-sm animate-in fade-in-0 duration-100 space-y-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                togglePinPage(page.pageId);
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
            >
              <Pin className="h-4 w-4 text-[var(--m)]" />
              <span>
                {page.isPinned ? "Unpin from top" : "Pin page to top"}
              </span>
            </button>
            <div className="my-1 border-t border-[var(--h)]" />
            <button
              type="button"
              onClick={() => {
                archivePage(page.pageId);
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-red-500 hover:bg-red-500/10 font-medium transition-colors"
            >
              <Archive className="h-4 w-4" />
              <span>Archive page</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
