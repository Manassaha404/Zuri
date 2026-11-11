"use client";

// Page link block: internal reference card linking to another page with in-place page search & selector
import { useState } from "react";
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import {
  FileText,
  ArrowUpRight,
  Folder,
  BookOpen,
  Search,
  Check,
  Link2,
  X,
} from "lucide-react";

interface PageLinkBlockProps {
  block: Block;
}

export function PageLinkBlock({ block }: PageLinkBlockProps) {
  const { pages, chapters, notebooks, setActivePage, updateBlockContent } =
    useNotesStore();

  const content = block.content;
  if (content.type !== "page_link") return null;

  const targetPage = pages.find((p) => p.pageId === content.pageId);
  const targetChapter = chapters.find(
    (c) => c.chapterId === targetPage?.chapterId,
  );
  const targetNotebook = notebooks.find(
    (n) => n.notebookId === targetPage?.notebookId,
  );

  const [isPickerOpen, setIsPickerOpen] = useState(!targetPage);
  const [searchQuery, setSearchQuery] = useState("");

  const availablePages = pages.filter((p) => {
    if (p.isArchived) return false;
    if (p.pageId === block.pageId) return false; // Avoid linking page to itself
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const ch = chapters.find((c) => c.chapterId === p.chapterId);
    const nb = notebooks.find((n) => n.notebookId === p.notebookId);

    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.summary && p.summary.toLowerCase().includes(q)) ||
      (ch?.title && ch.title.toLowerCase().includes(q)) ||
      (nb?.title && nb.title.toLowerCase().includes(q))
    );
  });

  // In-place Search / Select View
  if (isPickerOpen || !targetPage) {
    return (
      <div className="my-3 rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-3 shadow-lg select-none animate-in fade-in-0 duration-150">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--h)]">
          <div className="flex items-center gap-2 flex-1 mr-2">
            <Search className="h-4 w-4 text-[var(--m)] shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search page by title, chapter, or notebook..."
              className="w-full bg-transparent text-sm text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none"
            />
          </div>
          {targetPage && (
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              title="Close picker"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto notes-scrollbar space-y-1">
          {availablePages.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--m)]">
              No matching pages found for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            availablePages.map((p) => {
              const ch = chapters.find((c) => c.chapterId === p.chapterId);
              const nb = notebooks.find((n) => n.notebookId === p.notebookId);
              const isSelected = p.pageId === content.pageId;

              return (
                <button
                  key={p.pageId}
                  type="button"
                  onClick={() => {
                    updateBlockContent(block.blockId, {
                      type: "page_link",
                      pageId: p.pageId,
                    });
                    setIsPickerOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--s)] text-[var(--i)] ring-1 ring-[var(--accent)]/40"
                      : "text-[var(--b)] hover:bg-[var(--s)]/70 hover:text-[var(--i)]"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--accent)] shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--i)] truncate">
                      {p.title || "Untitled Page"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--m)] mt-0.5">
                      {nb && (
                        <span className="flex items-center gap-1 truncate">
                          <BookOpen className="h-3 w-3 shrink-0" />
                          <span className="truncate">{nb.title}</span>
                        </span>
                      )}
                      {ch && (
                        <span className="flex items-center gap-1 truncate">
                          <span>/</span>
                          <Folder className="h-3 w-3 shrink-0" />
                          <span className="truncate">{ch.title}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-[var(--accent)] shrink-0 mt-1" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Linked Page Card View
  return (
    <div
      onClick={() => {
        if (content.pageId) setActivePage(content.pageId);
      }}
      className="my-3 flex items-center justify-between rounded-2xl border border-[var(--h)] bg-[var(--s)]/70 p-4 hover:border-[var(--m)]/50 hover:bg-[var(--s)] transition-all cursor-pointer shadow-xs group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--h)] bg-[var(--bg)] text-[var(--accent)] shrink-0 shadow-xs">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-[var(--i)] truncate group-hover:text-[var(--accent)] transition-colors">
            {targetPage.title || "Referenced Page"}
          </h4>
          <div className="flex items-center gap-2 text-xs text-[var(--m)] mt-0.5">
            {targetNotebook && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{targetNotebook.title}</span>
              </span>
            )}
            {targetChapter && (
              <span className="flex items-center gap-1">
                <span>/</span>
                <Folder className="h-3 w-3" />
                <span>{targetChapter.title}</span>
              </span>
            )}
          </div>
          {targetPage.summary && (
            <p className="text-xs text-[var(--m)] mt-1 line-clamp-1 font-normal">
              {targetPage.summary}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPickerOpen(true);
          }}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs font-semibold text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)]/50 shadow-xs transition-all cursor-pointer"
          title="Change linked page"
        >
          <Link2 className="h-3 w-3" />
          <span>Change</span>
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--m)] group-hover:text-[var(--i)] group-hover:bg-[var(--bg)] transition-all">
          <ArrowUpRight className="h-4.5 w-4.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
