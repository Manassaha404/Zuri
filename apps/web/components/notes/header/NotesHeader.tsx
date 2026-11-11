"use client";

// Editorial top header with breadcrumbs, action pills, attachments trigger, and lifecycle controls
import { useState } from "react";
import { useNotesStore } from "@/store/notesStore";
import { useUIStore } from "@/store/uiStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Pin,
  FolderArchive,
  Share2,
  MoreHorizontal,
  Archive,
  ChevronRight,
  BookOpen,
  Folder,
  Layers,
} from "lucide-react";

export function NotesHeader() {
  const { darkMode, toggleTheme } = useUIStore();
  const {
    notebooks,
    chapters,
    pages,
    activeNotebookId,
    activeChapterId,
    activePageId,
    togglePinPage,
    archivePage,
    openChapterFileDock,
    openPageDiagram,
  } = useNotesStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const notebook = notebooks.find((n) => n.notebookId === activeNotebookId);
  const chapter = chapters.find((c) => c.chapterId === activeChapterId);
  const page = pages.find((p) => p.pageId === activePageId);

  if (!page) {
    return (
      <header className="h-14 border-b border-[var(--h)] bg-[var(--bg)] px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--m)]">
          <span>{notebook?.title || "Notes"}</span>
        </div>
        <ThemeToggle
          darkMode={darkMode}
          onToggle={toggleTheme}
          size={16}
          className="w-8.5 h-8.5 rounded-xl border border-[var(--h)] bg-transparent text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
        />
      </header>
    );
  }

  return (
    <>
      <header className="h-15 shrink-0 border-b border-[var(--h)] bg-[var(--bg)] px-6 flex items-center justify-between z-10">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-[var(--m)] min-w-0">
          <div className="flex items-center gap-1.5 font-medium text-[var(--b)] shrink-0">
            <BookOpen
              className="h-4 w-4"
              style={{ color: notebook?.color || "#3b82f6" }}
            />
            <span>{notebook?.title}</span>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-[var(--m)]/60 shrink-0" />

          {chapter && (
            <div className="flex items-center gap-1.5 shrink-0 font-medium text-[var(--b)]">
              <Folder
                className="h-4 w-4"
                style={{ color: chapter?.color || "#3b82f6" }}
              />
              <span>{chapter.title}</span>
            </div>
          )}

          <ChevronRight className="h-3.5 w-3.5 text-[var(--m)]/60 shrink-0" />

          <span className="font-bold text-[var(--i)] truncate text-sm sm:text-base max-w-[200px] sm:max-w-[340px]">
            {page.title}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pin page */}
          <button
            type="button"
            onClick={() => togglePinPage(page.pageId)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
              page.isPinned
                ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                : "border-[var(--h)] text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)]"
            }`}
            title={page.isPinned ? "Unpin page" : "Pin page to top"}
          >
            <Pin
              className={`h-4 w-4 ${page.isPinned ? "fill-amber-500" : ""}`}
            />
            <span className="hidden sm:inline">
              {page.isPinned ? "Pinned" : "Pin"}
            </span>
          </button>

          {/* Chapter File Dock */}
          {chapter && (
            <button
              type="button"
              onClick={() => openChapterFileDock(chapter.chapterId)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--h)] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              title="Chapter File Dock (store & manage files for this chapter)"
            >
              <FolderArchive className="h-4 w-4 text-[var(--m)]" />
              <span className="hidden sm:inline">Chapter Dock</span>
            </button>
          )}

          {/* Page Diagram */}
          <button
            type="button"
            onClick={() => openPageDiagram(page.pageId)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--h)] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
            title="Open canvas diagram for this page"
          >
            <Layers className="h-4 w-4 text-[var(--m)]" />
            <span className="hidden md:inline">Diagram</span>
          </button>
          {/* More options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--h)] text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
            >
              <MoreHorizontal className="h-4.5 w-4.5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-[var(--h)] bg-[var(--bg)] p-1.5 shadow-xl text-xs space-y-0.5 animate-in fade-in-0">
                  <div className="px-2.5 py-1 text-[10px] text-[var(--m)] font-medium">
                    Updated{" "}
                    {new Date(page.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="my-1 border-t border-[var(--h)]" />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)]"
                  >
                    <Share2 className="h-3.5 w-3.5 text-[var(--m)]" />
                    <span>Copy Page Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      archivePage(page.pageId);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-500 hover:bg-red-500/10"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archive to Trash</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
