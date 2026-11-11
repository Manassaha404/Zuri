"use client";

// Notion-like canvas editor — full page with cover, in-place editable title, page summary, diagram trigger, and block stream
import { useState, useRef, useEffect, useCallback } from "react";
import { useNotesStore } from "@/store/notesStore";
import { sortByPosition } from "../utils/fractional-index";
import { BlockItem } from "./BlockItem";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { BlockType } from "../types";
import {
  FileText,
  Clock,
  Folder,
  BookOpen,
  Layers,
  Sparkles,
} from "lucide-react";

export function BlockEditor() {
  const {
    pages,
    blocks,
    chapters,
    notebooks,
    diagrams,
    activePageId,
    activeNotebookId,
    updatePageTitle,
    updatePageSummary,
    openPageDiagram,
    addBlock,
    setFocusedBlockId,
  } = useNotesStore();

  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryValue, setSummaryValue] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);

  const activePage = pages.find((p) => p.pageId === activePageId);
  const activeNotebook = notebooks.find(
    (n) => n.notebookId === activeNotebookId,
  );
  const activeChapter = chapters.find(
    (c) => c.chapterId === activePage?.chapterId,
  );

  // Top-level only — child blocks (parentBlockId set) are rendered by their parent toggle
  const pageBlocks = sortByPosition(
    blocks.filter((b) => b.pageId === activePageId && !b.parentBlockId),
  );

  // Sync title DOM when active page changes
  useEffect(() => {
    if (titleRef.current && activePage) {
      if (titleRef.current.textContent !== (activePage.title || "")) {
        titleRef.current.textContent = activePage.title || "";
      }
    }
  }, [activePage?.pageId, activePage?.title]);

  // Sync summary state when active page changes
  useEffect(() => {
    setSummaryValue(activePage?.summary || "");
    setIsEditingSummary(false);
  }, [activePage?.pageId, activePage?.summary]);

  // Auto-focus summary textarea when editing begins
  useEffect(() => {
    if (isEditingSummary && summaryTextareaRef.current) {
      summaryTextareaRef.current.focus();
      const len = summaryTextareaRef.current.value.length;
      summaryTextareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditingSummary]);

  const handleCanvasClick = useCallback(() => {
    if (!activePage || pageBlocks.length > 0) return;
    addBlock(activePage.pageId, "paragraph");
  }, [activePage, pageBlocks.length, addBlock]);

  if (!activePage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--h)] bg-[var(--s)] text-[var(--m)] mb-3">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-[var(--i)]">
          No page selected
        </h3>
        <p className="mt-1 text-xs text-[var(--m)] max-w-sm">
          Select a page from the sidebar or create a new chapter to begin
          writing.
        </p>
      </div>
    );
  }

  const pageDiagram = diagrams.find((d) => d.pageId === activePage.pageId);
  const hasDiagram = Boolean(
    pageDiagram &&
    ((pageDiagram.scene?.elements && pageDiagram.scene.elements.length > 0) ||
      (pageDiagram.source && pageDiagram.source.trim().length > 0)),
  );

  const totalWords = blocks
    .filter((b) => b.pageId === activePageId)
    .reduce(
      (acc, b) =>
        acc +
        (b.plainText ? b.plainText.split(/\s+/).filter(Boolean).length : 0),
      0,
    );

  return (
    <div className="flex-1 overflow-y-auto notes-scrollbar bg-[var(--bg)]">
      {/* Cover image */}
      {activeNotebook?.coverUrl && (
        <div className="relative h-56 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeNotebook.coverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
      )}

      {/* Editor canvas — generous width and padding for clear, spacious reading & writing */}
      <div
        className="mx-auto max-w-5xl px-8 sm:px-16 pt-14 pb-80 transition-all"
        onClick={handleCanvasClick}
      >
        {/* Page title — Notion-style in-place editable heading with large clear typography */}
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <h1
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const text = e.currentTarget.textContent?.trim() || "Untitled";
              updatePageTitle(activePage.pageId, text);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.currentTarget as HTMLElement).blur();
                if (pageBlocks.length === 0) {
                  addBlock(activePage.pageId, "paragraph");
                } else if (pageBlocks[0]) {
                  setFocusedBlockId(pageBlocks[0].blockId);
                }
              }
            }}
            data-placeholder="Untitled"
            className="text-5xl sm:text-6xl font-black tracking-tight text-[var(--i)] cursor-text leading-[1.15] min-h-[1.2em] outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--m)]/30 empty:before:pointer-events-none mb-3"
          >
            {activePage.title}
          </h1>
        </div>

        {/* Page meta — subdued breadcrumb and diagram trigger */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--m)] mb-6 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            {activeNotebook && (
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="h-4 w-4" />
                <span>{activeNotebook.title}</span>
              </span>
            )}
            {activeChapter && (
              <>
                <span className="text-[var(--m)]/40">/</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Folder className="h-4 w-4" />
                  <span>{activeChapter.title}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Page Diagram Pill Button */}
            <button
              type="button"
              onClick={() => openPageDiagram(activePage.pageId)}
              className="flex items-center gap-2 rounded-xl border border-[var(--h)] bg-[var(--s)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--b)] hover:border-[var(--m)]/40 hover:bg-[var(--s)] hover:text-[var(--i)] transition-all cursor-pointer shadow-xs group"
              title="Open diagram for this page"
            >
              <Layers className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Page Diagram</span>
              {hasDiagram ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="text-[11px] text-[var(--m)]/70">Canvas</span>
              )}
            </button>

            <span className="flex items-center gap-1 text-xs text-[var(--m)]">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Edited {new Date(activePage.updatedAt).toLocaleDateString()}
              </span>
              <span className="mx-1">·</span>
              <span>{totalWords} words</span>
            </span>
          </div>
        </div>

        {/* Page Summary Section */}
        <div className="mb-8" onClick={(e) => e.stopPropagation()}>
          {isEditingSummary ? (
            <div className="rounded-2xl border border-[var(--accent)]/50 bg-[var(--s)]/50 p-4 shadow-sm animate-in fade-in-0 duration-150">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--i)] uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Page Summary</span>
                </div>
                <span className="text-[11px] text-[var(--m)]">
                  Press Esc to save
                </span>
              </div>
              <textarea
                ref={summaryTextareaRef}
                value={summaryValue}
                onChange={(e) => setSummaryValue(e.target.value)}
                onBlur={() => {
                  setIsEditingSummary(false);
                  updatePageSummary(activePage.pageId, summaryValue.trim());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsEditingSummary(false);
                    updatePageSummary(activePage.pageId, summaryValue.trim());
                  }
                }}
                placeholder="Write a concise overview or executive summary of this page..."
                rows={3}
                className="w-full resize-y bg-transparent text-base sm:text-lg text-[var(--i)] placeholder:text-[var(--m)]/50 outline-none leading-relaxed"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsEditingSummary(false);
                    updatePageSummary(activePage.pageId, summaryValue.trim());
                  }}
                  className="rounded-lg bg-[var(--i)] text-[var(--bg)] px-3 py-1 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Save Summary
                </button>
              </div>
            </div>
          ) : activePage.summary && activePage.summary.trim().length > 0 ? (
            <div
              onClick={() => setIsEditingSummary(true)}
              className="rounded-2xl border border-[var(--h)] bg-[var(--s)]/40 hover:bg-[var(--s)]/70 hover:border-[var(--m)]/40 p-4 transition-all cursor-pointer group"
              title="Click to edit page summary"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--m)] tracking-wide uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Page Summary</span>
                </div>
                <span className="text-xs text-[var(--m)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to edit
                </span>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-[var(--b)] whitespace-pre-wrap">
                {activePage.summary}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingSummary(true)}
              className="flex items-center gap-2.5 rounded-2xl border border-dashed border-[var(--h)] px-4 py-3 text-[var(--m)] hover:border-[var(--m)]/50 hover:bg-[var(--s)]/40 hover:text-[var(--i)] transition-all cursor-pointer group text-left w-full select-none"
            >
              <Sparkles className="h-4 w-4 text-[var(--accent)] opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium">Add page summary...</span>
            </button>
          )}
        </div>

        {/* Block stream */}
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {pageBlocks.map((block, idx) => (
            <BlockItem
              key={block.blockId}
              block={block}
              indexInList={idx + 1}
              prevBlockId={pageBlocks[idx - 1]?.blockId}
            />
          ))}
        </div>

        {/* Click-anywhere-below to add a paragraph — Notion behavior */}
        {pageBlocks.length === 0 && (
          <div
            className="mt-6 h-28 cursor-text flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              if (activePage) addBlock(activePage.pageId, "paragraph");
            }}
          >
            <p className="text-lg sm:text-xl text-[var(--m)]/50 select-none py-3">
              Click to start writing, or type{" "}
              <kbd className="font-mono bg-[var(--s)] px-2 py-0.5 rounded border border-[var(--h)] text-sm">
                /
              </kbd>{" "}
              for commands…
            </p>
          </div>
        )}

        {/* Slash command triggered from bottom */}
        <div className="relative mt-6" onClick={(e) => e.stopPropagation()}>
          {isSlashOpen && (
            <SlashCommandMenu
              isOpen={isSlashOpen}
              onClose={() => setIsSlashOpen(false)}
              onSelect={(type: BlockType) => {
                addBlock(activePage.pageId, type);
                setIsSlashOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
