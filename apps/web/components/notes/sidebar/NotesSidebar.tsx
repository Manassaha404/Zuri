"use client";

// High-contrast notes sidebar
import { useState } from "react";
import Link from "next/link";
import { useNotesStore } from "@/store/notesStore";
import { useUIStore } from "@/store/uiStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { sortByPosition } from "../utils/fractional-index";
import { NotebookSelector } from "./NotebookSelector";
import { ChapterTreeItem } from "./ChapterTreeItem";
import { NotebookModal } from "./NotebookModal";
import { ChapterModal } from "./ChapterModal";
import { TrashModal } from "./TrashModal";
import {
  Search,
  Plus,
  Trash2,
  Pin,
  ListFilter,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useNotesTrash } from "@/hook/notes";

export function NotesSidebar() {
  const { darkMode, toggleTheme } = useUIStore();
  const {
    notebooks,
    chapters,
    pages,
    activeNotebookId,
    activeView,
    setActiveView,
    openSearch,
    openTrash,
    openChapterModal,
    setActivePage,
  } = useNotesStore();

  const {
    pages: trashPages,
    chapters: trashChapters,
    notebooks: trashNotebooks,
  } = useNotesTrash();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const notebookChapters = sortByPosition(
    chapters.filter((c) => c.notebookId === activeNotebookId && !c.isArchived),
  );
  const notebookPages = pages.filter(
    (p) => p.notebookId === activeNotebookId && !p.isArchived,
  );

  // Pinned pages across notebook
  const pinnedPages = notebookPages.filter((p) => p.isPinned);

  // Archived count
  const archivedCount =
    trashPages.length + trashChapters.length + trashNotebooks.length;

  if (isCollapsed) {
    return (
      <aside className="w-16 shrink-0 border-r border-[var(--h)] bg-[var(--s)] flex flex-col items-center py-5 justify-between transition-all select-none">
        <div className="flex flex-col items-center gap-3.5">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors shadow-2xs"
            title="Back to AI Chat"
          >
            <MessageSquare className="h-5 w-5 text-[#3b82f6]" />
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--h)] bg-[var(--bg)] text-[var(--m)] hover:text-[var(--i)] shadow-2xs transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => openSearch()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors"
            title="Search notes (Cmd+K)"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={openTrash}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors"
          title="Trash"
        >
          <Trash2 className="h-5 w-5" />
          {archivedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-2xs">
              {archivedCount}
            </span>
          )}
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-80 sm:w-[340px] shrink-0 border-r border-[var(--h)] bg-[var(--s)] flex flex-col h-screen select-none">
        {/* Top Header: Notebook selector & collapse */}
        <div className="p-3.5 border-b border-[var(--h)] flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <NotebookSelector />
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] shrink-0 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Quick Actions & Navigation */}
        <div className="p-3 space-y-1.5 border-b border-[var(--h)]">
          {/* Back to AI Chat */}
          <Link
            href="/"
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[var(--b)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors no-underline"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-[#3b82f6]" />
              <span>Back to AI Chat</span>
            </div>
            <span className="text-xs text-[var(--m)] font-mono">Chat</span>
          </Link>

          <button
            type="button"
            onClick={() => openSearch()}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)]/40 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4" />
              <span>Search notes...</span>
            </div>
            <kbd className="rounded-md border border-[var(--h)] bg-[var(--s)] px-2 py-0.5 text-xs font-mono text-[var(--m)]">
              ⌘K
            </kbd>
          </button>

          {/* Fast All Pages in Notebook query view */}
          <button
            type="button"
            onClick={() => setActiveView("all-pages")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              activeView === "all-pages"
                ? "bg-[var(--surface-strong)] text-[var(--i)] shadow-2xs font-bold"
                : "text-[var(--b)] hover:bg-[var(--bg)] hover:text-[var(--i)]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ListFilter className="h-4 w-4 text-[var(--m)]" />
              <span>All Pages in Notebook</span>
            </div>
            <span className="rounded-full bg-[var(--h)]/70 px-2 py-0.5 text-xs font-mono text-[var(--m)]">
              {notebookPages.length}
            </span>
          </button>
        </div>

        {/* Scrollable tree content */}
        <div className="flex-1 overflow-y-auto notes-scrollbar p-3 space-y-5">
          {/* Pinned pages section */}
          {pinnedPages.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-2.5 py-1 text-xs font-bold text-[var(--m)] uppercase tracking-wider">
                <Pin className="h-3.5 w-3.5 text-amber-500" />
                <span>Pinned</span>
              </div>
              <div className="space-y-1">
                {pinnedPages.map((page) => (
                  <button
                    key={page.pageId}
                    type="button"
                    onClick={() => setActivePage(page.pageId)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--b)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors group"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 group-hover:scale-125 transition-transform" />
                    <span className="truncate">{page.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chapters and Pages hierarchy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2.5 py-1 text-xs font-bold text-[var(--m)] uppercase tracking-wider">
              <span>Chapters ({notebookChapters.length})</span>
              <button
                type="button"
                onClick={() => openChapterModal()}
                className="flex items-center gap-1 text-xs text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--bg)] px-2 py-1 rounded-lg font-medium transition-colors"
                title="Create new chapter"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>chapter</span>
              </button>
            </div>

            <div className="space-y-1">
              {notebookChapters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--h)] p-5 text-center bg-[var(--bg)]/50">
                  <p className="text-sm text-[var(--m)]">No chapters yet</p>
                  <button
                    type="button"
                    onClick={() => openChapterModal()}
                    className="mt-2 text-sm font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add your first chapter</span>
                  </button>
                </div>
              ) : (
                notebookChapters.map((chapter) => (
                  <ChapterTreeItem
                    key={chapter.chapterId}
                    chapter={chapter}
                    pages={pages.filter(
                      (p) => p.chapterId === chapter.chapterId,
                    )}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-[var(--h)] flex items-center justify-between text-sm bg-[var(--s)]/50">
          <button
            type="button"
            onClick={openTrash}
            className="flex items-center gap-2.5 text-[var(--m)] hover:text-[var(--i)] font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Trash</span>
            {archivedCount > 0 && (
              <span className="rounded-full bg-amber-500/10 text-amber-500 px-2 py-0.5 text-xs font-semibold">
                {archivedCount}
              </span>
            )}
          </button>

          <ThemeToggle
            darkMode={darkMode}
            onToggle={toggleTheme}
            size={16}
            className="w-8 h-8 rounded-lg border-0 bg-transparent text-[var(--m)] hover:text-[var(--i)]"
          />
        </div>
      </aside>

      {/* Modals mounted */}
      <NotebookModal />
      <ChapterModal />
      <TrashModal />
    </>
  );
}
