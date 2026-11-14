"use client";

// Flat table view for fast "all pages in notebook" queries without joining through chapters
import { useState } from "react";
import { useNotesStore } from "@/store/notesStore";
import { useNotes } from "@/hook/notes";
import { sortByPosition } from "../utils/fractional-index";
import {
  FileText,
  Pin,
  ArrowRightLeft,
  Archive,
  ArrowUpDown,
  Folder,
  Clock,
  Plus,
  Search,
} from "lucide-react";

type SortField = "position" | "updatedAt" | "createdAt" | "title";

export function AllPagesView() {
  const {
    pages,
    chapters,
    notebooks,
    activeNotebookId,
    setActivePage,
    openMovePage,
  } = useNotesStore();

  const { togglePinPage, archivePage, createPage } = useNotes();

  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const activeNotebook = notebooks.find(
    (n) => n.notebookId === activeNotebookId,
  );

  // Fast direct query on denormalized notebookId
  let notebookPages = pages.filter(
    (p) => p.notebookId === activeNotebookId && !p.isArchived,
  );

  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    notebookPages = notebookPages.filter((p) =>
      p.title.toLowerCase().includes(q),
    );
  }

  // Sort
  const sortedPages = [...notebookPages].sort((a, b) => {
    if (sortField === "position") {
      return sortAsc
        ? a.position > b.position
          ? 1
          : -1
        : a.position < b.position
          ? 1
          : -1;
    }
    if (sortField === "title") {
      return sortAsc
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    const dateA = new Date(a[sortField]).getTime();
    const dateB = new Date(b[sortField]).getTime();
    return sortAsc ? dateA - dateB : dateB - dateA;
  });

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const firstChapter = chapters.find(
    (c) => c.notebookId === activeNotebookId && !c.isArchived,
  );

  return (
    <div className="flex-1 overflow-y-auto notes-scrollbar bg-[var(--bg)] p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--h)] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--i)]">
              All Pages in {activeNotebook?.title || "Notebook"}
            </h1>
            <p className="mt-1 text-xs text-[var(--m)]">
              Queried directly from{" "}
              <code className="font-mono text-[var(--i)]">
                pages.notebookId
              </code>{" "}
              without joining through chapters table.
            </p>
          </div>

          {firstChapter && (
            <button
              type="button"
              onClick={() =>
                createPage(activeNotebookId, firstChapter.chapterId)
              }
              className="flex items-center gap-1.5 rounded-lg bg-[var(--p)] px-3.5 py-2 text-xs font-semibold text-[var(--pt)] hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Page</span>
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--h)] bg-[var(--s)] px-3 py-1.5 text-xs text-[var(--i)] w-72">
            <Search className="h-3.5 w-3.5 text-[var(--m)]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter pages..."
              className="w-full bg-transparent outline-none placeholder:text-[var(--m)]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--m)]">
            <span>Sort by:</span>
            <button
              type="button"
              onClick={() => handleToggleSort("updatedAt")}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                sortField === "updatedAt"
                  ? "border-[var(--i)] text-[var(--i)] bg-[var(--s)]"
                  : "border-[var(--h)] hover:text-[var(--i)]"
              }`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => handleToggleSort("title")}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                sortField === "title"
                  ? "border-[var(--i)] text-[var(--i)] bg-[var(--s)]"
                  : "border-[var(--h)] hover:text-[var(--i)]"
              }`}
            >
              Title
            </button>
            <button
              type="button"
              onClick={() => handleToggleSort("position")}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                sortField === "position"
                  ? "border-[var(--i)] text-[var(--i)] bg-[var(--s)]"
                  : "border-[var(--h)] hover:text-[var(--i)]"
              }`}
            >
              Position
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="rounded-xl border border-[var(--h)] bg-[var(--surface-card)] overflow-hidden shadow-2xs">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--h)] bg-[var(--s)] text-[var(--m)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Page Title</th>
                <th className="py-3 px-4">Chapter</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--h)]">
              {sortedPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--m)]">
                    No pages found matching criteria.
                  </td>
                </tr>
              ) : (
                sortedPages.map((page) => {
                  const ch = chapters.find(
                    (c) => c.chapterId === page.chapterId,
                  );
                  return (
                    <tr
                      key={page.pageId}
                      onClick={() => setActivePage(page.pageId)}
                      className="group cursor-pointer hover:bg-[var(--s)]/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-[var(--i)]">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[var(--m)] shrink-0" />
                          <span className="truncate">{page.title}</span>
                          {page.isPinned && (
                            <Pin className="h-3 w-3 text-amber-500 fill-amber-500/20 shrink-0" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[var(--b)]">
                        {ch ? (
                          <div className="flex items-center gap-1.5">
                            <Folder
                              className="h-3.5 w-3.5"
                              style={{ color: ch.color || "#3b82f6" }}
                            />
                            <span>{ch.title}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--m)] italic">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--m)]">
                        {page.position}
                      </td>

                      <td className="py-3 px-4 text-[var(--m)]">
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => togglePinPage(page.pageId)}
                            className={`p-1.5 rounded hover:bg-[var(--bg)] transition-colors ${
                              page.isPinned
                                ? "text-amber-500"
                                : "text-[var(--m)]"
                            }`}
                            title={page.isPinned ? "Unpin page" : "Pin page"}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openMovePage(page.pageId)}
                            className="p-1.5 rounded hover:bg-[var(--bg)] text-[var(--m)] hover:text-[var(--i)] transition-colors"
                            title="Move to another chapter or notebook"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => archivePage(page.pageId)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Archive page"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
