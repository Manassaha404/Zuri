"use client";

// Page link block: internal reference card linking to another page with chapter-wise page selector, custom title, and caption
import { useState, useMemo } from "react";
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
  Pencil,
  Sparkles,
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
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [customTitleInput, setCustomTitleInput] = useState(
    content.title || targetPage?.title || "",
  );
  const [captionInput, setCaptionInput] = useState(content.caption || "");

  // Filter available pages (exclude archived and the page containing this block)
  const availablePages = useMemo(() => {
    return pages.filter((p) => {
      if (p.isArchived) return false;
      if (p.pageId === block.pageId) return false; // Prevent linking page to itself
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
  }, [pages, chapters, notebooks, block.pageId, searchQuery]);

  // Group pages chapter-wise (and identify pages with no chapter)
  const chapterGroups = useMemo(() => {
    const groups: {
      chapter: (typeof chapters)[number] | null;
      notebook: (typeof notebooks)[number] | null;
      pages: typeof pages;
    }[] = [];

    // Map each known chapter that has matching pages
    chapters.forEach((ch) => {
      const chPages = availablePages.filter(
        (p) => p.chapterId === ch.chapterId,
      );
      if (chPages.length > 0) {
        const nb =
          notebooks.find((n) => n.notebookId === ch.notebookId) || null;
        groups.push({
          chapter: ch,
          notebook: nb,
          pages: chPages,
        });
      }
    });

    // Check for orphan pages without a matching chapter
    const orphanPages = availablePages.filter(
      (p) => !chapters.some((c) => c.chapterId === p.chapterId),
    );
    if (orphanPages.length > 0) {
      groups.push({
        chapter: null,
        notebook: null,
        pages: orphanPages,
      });
    }

    return groups;
  }, [availablePages, chapters, notebooks]);

  const handleSelectPage = (pageId: string) => {
    const selected = pages.find((p) => p.pageId === pageId);
    const chosenTitle =
      customTitleInput && customTitleInput !== targetPage?.title
        ? customTitleInput
        : selected?.title || "Untitled Page";

    updateBlockContent(block.blockId, {
      type: "page_link",
      pageId,
      title: chosenTitle,
      caption: captionInput,
    });
    setCustomTitleInput(chosenTitle);
    setIsPickerOpen(false);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.pageId) return;

    updateBlockContent(block.blockId, {
      type: "page_link",
      pageId: content.pageId,
      title: customTitleInput.trim() || targetPage?.title || "Untitled Page",
      caption: captionInput.trim(),
    });
    setIsEditingDetails(false);
  };

  // Chapter-wise in-place page picker view
  if (isPickerOpen || !targetPage) {
    return (
      <div className="my-3 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] p-3 sm:p-4 shadow-xl select-none animate-in fade-in-0 duration-150">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--h)]">
          <div className="flex items-center gap-2 flex-1 mr-2">
            <Search className="h-4 w-4 text-[var(--m)] shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all pages by title, chapter, or notebook..."
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

        {/* Chapter-wise list */}
        <div className="max-h-72 overflow-y-auto notes-scrollbar space-y-3.5 pr-1">
          {availablePages.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--m)]">
              {searchQuery ? (
                <>No matching pages found for &ldquo;{searchQuery}&rdquo;</>
              ) : (
                <>No available pages found in your workspace.</>
              )}
            </div>
          ) : (
            chapterGroups.map((group, groupIdx) => {
              const chapterTitle = group.chapter?.title || "Other Pages";
              const notebookTitle = group.notebook?.title;

              return (
                <div
                  key={group.chapter?.chapterId || `group-${groupIdx}`}
                  className="space-y-1"
                >
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-[var(--m)] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 truncate">
                      <Folder className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                      <span className="truncate">{chapterTitle}</span>
                      {notebookTitle && (
                        <span className="text-[10px] font-normal text-[var(--m)]/80 truncate">
                          ({notebookTitle})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--m)]/70 shrink-0">
                      {group.pages.length}{" "}
                      {group.pages.length === 1 ? "page" : "pages"}
                    </span>
                  </div>

                  {/* Chapter Pages */}
                  <div className="space-y-1 pl-1">
                    {group.pages.map((p) => {
                      const isSelected = p.pageId === content.pageId;
                      return (
                        <button
                          key={p.pageId}
                          type="button"
                          onClick={() => handleSelectPage(p.pageId)}
                          className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[var(--s)] text-[var(--i)] ring-1 ring-[var(--accent)]/50 shadow-xs"
                              : "text-[var(--b)] hover:bg-[var(--s)]/70 hover:text-[var(--i)]"
                          }`}
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--accent)] shrink-0 mt-0.5">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[var(--i)] truncate">
                              {p.title || "Untitled Page"}
                            </div>
                            {p.summary && (
                              <p className="text-xs text-[var(--m)] line-clamp-1 mt-0.5">
                                {p.summary}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-[var(--accent)] shrink-0 mt-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const displayTitle = content.title || targetPage.title || "Referenced Page";
  const displayCaption = content.caption;

  // Linked Page Card View with navigation, custom caption, and title
  return (
    <div className="my-3 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] hover:border-[var(--m)]/50 transition-all shadow-xs group relative overflow-hidden">
      {/* Inline caption & title editor */}
      {isEditingDetails ? (
        <form onSubmit={handleSaveDetails} className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--h)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--i)] uppercase tracking-wider">
              <Pencil className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Edit Page Link Title & Caption</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingDetails(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Display Title
            </label>
            <input
              type="text"
              value={customTitleInput}
              onChange={(e) => setCustomTitleInput(e.target.value)}
              placeholder={targetPage.title || "Untitled Page"}
              className="w-full rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Caption / Note to go to this page
            </label>
            <input
              type="text"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              placeholder="e.g., Click here to see the detailed guide..."
              className="w-full rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingDetails(false)}
              className="px-3 py-1.5 rounded-xl border border-[var(--h)] text-xs font-medium text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--accent)] text-xs font-semibold text-white hover:opacity-90 active:scale-98 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>
      ) : (
        /* Normal Link Card */
        <div
          onClick={() => {
            if (content.pageId) setActivePage(content.pageId);
          }}
          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
        >
          {/* Main Info */}
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--h)] bg-[var(--bg)] text-[var(--accent)] shrink-0 shadow-xs mt-0.5">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              {/* Title */}
              <h4 className="text-sm sm:text-base font-bold text-[var(--i)] truncate group-hover:text-[var(--accent)] transition-colors">
                {displayTitle}
              </h4>

              {/* Breadcrumbs: Notebook / Chapter */}
              <div className="flex items-center gap-2 text-xs text-[var(--m)]">
                {targetNotebook && (
                  <span className="flex items-center gap-1 truncate">
                    <BookOpen className="h-3 w-3 shrink-0" />
                    <span className="truncate">{targetNotebook.title}</span>
                  </span>
                )}
                {targetChapter && (
                  <span className="flex items-center gap-1 truncate">
                    <span>/</span>
                    <Folder className="h-3 w-3 shrink-0" />
                    <span className="truncate">{targetChapter.title}</span>
                  </span>
                )}
              </div>

              {/* Caption or Page Summary */}
              {displayCaption ? (
                <p className="text-xs sm:text-sm text-[var(--accent)] font-medium line-clamp-2 mt-1">
                  {displayCaption}
                </p>
              ) : targetPage.summary ? (
                <p className="text-xs text-[var(--m)] line-clamp-1 mt-0.5">
                  {targetPage.summary}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--m)]/60 italic mt-0.5">
                  Click to open this page
                </p>
              )}
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Edit Title/Caption button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCustomTitleInput(content.title || targetPage.title || "");
                setCaptionInput(content.caption || "");
                setIsEditingDetails(true);
              }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs font-semibold text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)]/50 shadow-xs transition-all cursor-pointer"
              title="Edit title & caption"
            >
              <Pencil className="h-3 w-3" />
              <span>{content.caption ? "Edit Caption" : "Add Caption"}</span>
            </button>

            {/* Change linked page button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPickerOpen(true);
              }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs font-semibold text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)]/50 shadow-xs transition-all cursor-pointer"
              title="Change linked page"
            >
              <Link2 className="h-3 w-3" />
              <span>Change</span>
            </button>

            {/* Go to page action button */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--s)] text-xs font-semibold text-[var(--i)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all shadow-xs">
              <span>Go to page</span>
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
