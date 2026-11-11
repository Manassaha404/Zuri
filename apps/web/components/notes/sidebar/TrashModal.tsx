"use client";

// Modal for viewing and restoring archived notebooks, chapters, and pages
import { useState } from "react";
import { useNotesStore } from "@/store/notesStore";
import {
  X,
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  Folder,
  BookOpen,
} from "lucide-react";

type TrashTab = "pages" | "chapters" | "notebooks";

export function TrashModal() {
  const {
    isTrashOpen,
    closeTrash,
    notebooks,
    chapters,
    pages,
    restorePage,
    deletePagePermanently,
    restoreChapter,
    deleteChapterPermanently,
    restoreNotebook,
    deleteNotebookPermanently,
  } = useNotesStore();

  const [activeTab, setActiveTab] = useState<TrashTab>("pages");

  if (!isTrashOpen) return null;

  const archivedPages = pages.filter((p) => p.isArchived);
  const archivedChapters = chapters.filter((c) => c.isArchived);
  const archivedNotebooks = notebooks.filter((n) => n.isArchived);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--h)] bg-[var(--bg)] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--h)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-[var(--m)]" />
            <h2 className="text-base font-semibold text-[var(--i)]">
              Trash & Lifecycle Manager
            </h2>
          </div>
          <button
            type="button"
            onClick={closeTrash}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[var(--h)] px-5 pt-3 gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("pages")}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "pages"
                ? "border-[var(--i)] text-[var(--i)] font-semibold"
                : "border-transparent text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Pages ({archivedPages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chapters")}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "chapters"
                ? "border-[var(--i)] text-[var(--i)] font-semibold"
                : "border-transparent text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Chapters ({archivedChapters.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notebooks")}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "notebooks"
                ? "border-[var(--i)] text-[var(--i)] font-semibold"
                : "border-transparent text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Notebooks ({archivedNotebooks.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto notes-scrollbar p-5 space-y-2">
          {activeTab === "pages" && (
            <>
              {archivedPages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--m)]">
                  No archived pages found.
                </div>
              ) : (
                archivedPages.map((page) => (
                  <div
                    key={page.pageId}
                    className="flex items-center justify-between rounded-lg border border-[var(--h)] bg-[var(--s)] p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[var(--m)] shrink-0" />
                        <span className="font-medium text-[var(--i)] truncate">
                          {page.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--m)]">
                        Archived{" "}
                        {page.archivedAt
                          ? new Date(page.archivedAt).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => restorePage(page.pageId)}
                        className="flex items-center gap-1 rounded-md border border-[var(--h)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePagePermanently(page.pageId)}
                        className="flex items-center gap-1 rounded-md bg-red-500/10 text-red-500 px-2.5 py-1.5 text-xs font-medium hover:bg-red-500/20 transition-colors"
                        title="Permanent delete cascades to blocks and diagrams"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "chapters" && (
            <>
              {archivedChapters.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--m)]">
                  No archived chapters found.
                </div>
              ) : (
                archivedChapters.map((ch) => (
                  <div
                    key={ch.chapterId}
                    className="flex items-center justify-between rounded-lg border border-[var(--h)] bg-[var(--s)] p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-[var(--m)] shrink-0" />
                        <span className="font-medium text-[var(--i)] truncate">
                          {ch.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => restoreChapter(ch.chapterId)}
                        className="flex items-center gap-1 rounded-md border border-[var(--h)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteChapterPermanently(ch.chapterId)}
                        className="flex items-center gap-1 rounded-md bg-red-500/10 text-red-500 px-2.5 py-1.5 text-xs font-medium hover:bg-red-500/20 transition-colors"
                        title="Cascades to all pages in this chapter"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "notebooks" && (
            <>
              {archivedNotebooks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--m)]">
                  No archived notebooks found.
                </div>
              ) : (
                archivedNotebooks.map((nb) => (
                  <div
                    key={nb.notebookId}
                    className="flex items-center justify-between rounded-lg border border-[var(--h)] bg-[var(--s)] p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[var(--m)] shrink-0" />
                        <span className="font-medium text-[var(--i)] truncate">
                          {nb.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--m)]">
                        Archived{" "}
                        {nb.archivedAt
                          ? new Date(nb.archivedAt).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => restoreNotebook(nb.notebookId)}
                        className="flex items-center gap-1 rounded-md border border-[var(--h)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNotebookPermanently(nb.notebookId)}
                        className="flex items-center gap-1 rounded-md bg-red-500/10 text-red-500 px-2.5 py-1.5 text-xs font-medium hover:bg-red-500/20 transition-colors"
                        title="Cascade deletes all chapters, pages, and blocks"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer info note */}
        <div className="border-t border-[var(--h)] px-5 py-3 bg-[var(--s)] flex items-center justify-between text-xs text-[var(--m)]">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>
              Permanent delete triggers cascade deletion across all related
              child records.
            </span>
          </div>
          <button
            type="button"
            onClick={closeTrash}
            className="rounded-lg border border-[var(--h)] px-3 py-1.5 text-xs font-medium text-[var(--i)] hover:bg-[var(--bg)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
