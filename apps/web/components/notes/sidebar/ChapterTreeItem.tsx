"use client";

// Collapsible chapter row with dynamic Lucide icon, file dock trigger, and pages list
import { useState } from "react";
import { Chapter, Page } from "../types";
import { useNotesStore } from "@/store/notesStore";
import { useNotes } from "@/hook/notes";
import { sortByPosition } from "../utils/fractional-index";
import { PageTreeItem } from "./PageTreeItem";
import { getLucideIcon } from "./IconPicker";
import {
  ChevronRight,
  Plus,
  Star,
  MoreHorizontal,
  FolderArchive,
  Edit2,
  Archive,
} from "lucide-react";

interface ChapterTreeItemProps {
  chapter: Chapter;
  pages: Page[];
}

export function ChapterTreeItem({ chapter, pages }: ChapterTreeItemProps) {
  const {
    activeChapterId,
    setActiveChapter,
    openChapterModal,
    openChapterFileDock,
    attachments,
    activeNotebookId,
  } = useNotesStore();

  const { createPage, toggleFavoriteChapter, archiveChapter } = useNotes();

  const [isOpen, setIsOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamic Lucide icon lookup with fallback
  const IconComponent = getLucideIcon(chapter.icon);
  const isSelected = activeChapterId === chapter.chapterId;
  const sortedPages = sortByPosition(pages.filter((p) => !p.isArchived));

  // Attached files count for this chapter
  const chapterFilesCount = attachments.filter(
    (a) => a.chapterId === chapter.chapterId,
  ).length;

  return (
    <div className="space-y-1 select-none">
      {/* Chapter header row */}
      <div
        className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm sm:text-[15px] transition-all duration-150 cursor-pointer ${
          isSelected
            ? "bg-[var(--surface-strong)] text-[var(--i)] font-bold shadow-2xs"
            : "text-[var(--b)] hover:bg-[var(--s)]/80 hover:text-[var(--i)] font-semibold"
        }`}
        onClick={() => {
          setActiveChapter(chapter.chapterId);
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Animated Chevron */}
          <span
            className="text-[var(--m)] group-hover:text-[var(--i)] transition-transform duration-150 shrink-0"
            style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </span>

          {/* Dynamic Chapter Icon */}
          <IconComponent
            className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105"
            style={{ color: chapter.color || "var(--accent)" }}
          />

          {/* Title */}
          <span className="truncate text-sm sm:text-[15px] tracking-tight">
            {chapter.title}
          </span>

          {/* Page count pill (hidden when actions are hovered) */}
          <span className="text-xs text-[var(--m)] font-mono ml-auto mr-1 group-hover:hidden transition-opacity">
            {sortedPages.length}
          </span>
        </div>

        {/* Action buttons on hover */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chapter File Dock Button */}
          <button
            type="button"
            onClick={() => openChapterFileDock(chapter.chapterId)}
            className={`flex items-center gap-1 h-6 px-2 rounded-md transition-colors ${
              chapterFilesCount > 0
                ? "bg-[var(--s)] text-[var(--i)] font-medium border border-[var(--h)]"
                : "text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)]"
            }`}
            title={`Chapter Files (${chapterFilesCount})`}
          >
            <FolderArchive className="h-3.5 w-3.5" />
            {chapterFilesCount > 0 && (
              <span className="text-[10px] font-mono leading-none">
                {chapterFilesCount}
              </span>
            )}
          </button>

          {/* Favorite toggle button */}
          <button
            type="button"
            onClick={() => toggleFavoriteChapter(chapter.chapterId)}
            className={`h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--bg)] transition-colors ${
              chapter.isFavorite
                ? "text-amber-400 opacity-100"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title={
              chapter.isFavorite ? "Favorited chapter" : "Add to favorites"
            }
          >
            <Star
              className={`h-3.5 w-3.5 ${chapter.isFavorite ? "fill-amber-400" : ""}`}
            />
          </button>

          {/* Add page in chapter button */}
          <button
            type="button"
            onClick={() => createPage(activeNotebookId, chapter.chapterId)}
            className="h-6 w-6 flex items-center justify-center rounded-md text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors"
            title="Create page in chapter"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {/* More options menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-6 w-6 flex items-center justify-center rounded-md text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Chapter context menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <div
              className="absolute right-0 top-8 z-50 w-56 rounded-xl border border-[var(--h)] bg-[var(--bg)] p-1.5 shadow-xl text-sm animate-in fade-in-0 duration-100 space-y-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  openChapterFileDock(chapter.chapterId);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FolderArchive className="h-4 w-4 text-[var(--m)]" />
                  <span>Chapter Files</span>
                </div>
                {chapterFilesCount > 0 && (
                  <span className="rounded-full bg-[var(--s)] px-2 py-0.5 text-xs text-[var(--m)] font-mono">
                    {chapterFilesCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  openChapterModal(chapter);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              >
                <Edit2 className="h-4 w-4 text-[var(--m)]" />
                <span>Edit chapter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  createPage(activeNotebookId, chapter.chapterId);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              >
                <Plus className="h-4 w-4 text-[var(--m)]" />
                <span>Add new page</span>
              </button>
              <div className="my-1 border-t border-[var(--h)]" />
              <button
                type="button"
                onClick={() => {
                  archiveChapter(chapter.chapterId);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-red-500 hover:bg-red-500/10 transition-colors font-medium"
              >
                <Archive className="h-4 w-4" />
                <span>Archive chapter</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pages under chapter */}
      {isOpen && (
        <div className="ml-4 pl-3 border-l-2 border-[var(--h)] space-y-1 pt-1 animate-in fade-in-0 duration-150">
          {sortedPages.length === 0 ? (
            <div className="py-1.5 px-2.5 text-xs text-[var(--m)] italic">
              No pages yet
            </div>
          ) : (
            sortedPages.map((page) => (
              <PageTreeItem key={page.pageId} page={page} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
