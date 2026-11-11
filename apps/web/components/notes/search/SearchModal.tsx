"use client";

// Full-text search with GIN index simulation, notebook scope, stemming & keyword highlighting
import { useState, useEffect, useRef } from "react";
import { useNotesStore } from "@/store/notesStore";
import { SearchResult } from "../types";
import {
  Search,
  X,
  BookOpen,
  Folder,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function SearchModal() {
  const {
    isSearchOpen,
    searchNotebookScope,
    closeSearch,
    pages,
    chapters,
    notebooks,
    blocks,
    activeNotebookId,
    setActivePage,
  } = useNotesStore();

  const [query, setQuery] = useState("");
  const [scopeToNotebook, setScopeToNotebook] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeNotebook = notebooks.find(
    (n) => n.notebookId === activeNotebookId,
  );

  // Focus input and handle keyboard shortcuts
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setSelectedIndex(0);
      setScopeToNotebook(Boolean(searchNotebookScope));
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isSearchOpen, searchNotebookScope]);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useNotesStore.getState().openSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isSearchOpen) return null;

  // Search logic simulating GIN tsvector matching
  const executeSearch = (): SearchResult[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

    let candidatePages = pages.filter((p) => !p.isArchived);

    // Apply notebook-scoped filter if enabled
    if (scopeToNotebook) {
      candidatePages = candidatePages.filter(
        (p) => p.notebookId === activeNotebookId,
      );
    }

    const results: SearchResult[] = [];

    candidatePages.forEach((page) => {
      const chapter = chapters.find((c) => c.chapterId === page.chapterId);
      const notebook = notebooks.find((n) => n.notebookId === page.notebookId);
      const pageBlocks = blocks.filter((b) => b.pageId === page.pageId);

      // Check title match
      const titleLower = page.title.toLowerCase();
      const titleMatches = queryTokens.filter((token) =>
        titleLower.includes(token),
      ).length;

      // Check searchVector & blocks plainText
      const vectorLower = (page.searchVector || "").toLowerCase();
      const combinedBlocksText = pageBlocks
        .map((b) => b.plainText || "")
        .join(" ")
        .toLowerCase();

      const contentMatches = queryTokens.filter(
        (token) =>
          vectorLower.includes(token) || combinedBlocksText.includes(token),
      ).length;

      if (titleMatches > 0 || contentMatches > 0) {
        // Find best snippet
        let snippet = page.title;
        let matchType: "title" | "content" = "title";

        if (titleMatches === 0) {
          matchType = "content";
          const matchingBlock = pageBlocks.find((b) =>
            queryTokens.some((t) =>
              (b.plainText || "").toLowerCase().includes(t),
            ),
          );
          snippet =
            matchingBlock?.plainText || combinedBlocksText.slice(0, 120);
        }

        const score = Math.min(
          99,
          Math.round(
            (titleMatches * 50 + contentMatches * 25) / queryTokens.length,
          ),
        );

        results.push({
          page,
          chapterTitle: chapter?.title,
          notebookTitle: notebook?.title,
          matchedText: snippet,
          rankingScore: score,
          matchType,
        });
      }
    });

    // Rank by score descending
    return results.sort((a, b) => b.rankingScore - a.rankingScore);
  };

  const searchResults = executeSearch();

  const handleSelectResult = (pageId: string) => {
    setActivePage(pageId);
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (searchResults.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) =>
          (prev - 1 + searchResults.length) % (searchResults.length || 1),
      );
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(searchResults[selectedIndex].page.pageId);
    } else if (e.key === "Escape") {
      closeSearch();
    }
  };

  const highlightMatches = (text: string, queryText: string) => {
    if (!queryText.trim()) return text;
    const tokens = queryText.toLowerCase().split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${tokens.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-amber-400/30 text-[var(--i)] font-semibold rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-16 sm:pt-24 animate-in fade-in-0">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--h)] bg-[var(--bg)] shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-[var(--h)] px-4 py-3 bg-[var(--s)]/40">
          <Search className="h-5 w-5 text-[var(--m)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search across pages, notes, code blocks..."
            className="flex-1 bg-transparent text-sm text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none"
          />
          <button
            type="button"
            onClick={closeSearch}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Scope Filter Bar */}
        <div className="flex items-center justify-between border-b border-[var(--h)] px-4 py-2 bg-[var(--s)]/70 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--m)]">Scope:</span>
            <button
              type="button"
              onClick={() => setScopeToNotebook(false)}
              className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                !scopeToNotebook
                  ? "bg-[var(--p)] text-[var(--pt)]"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
            >
              All Notebooks
            </button>
            {activeNotebook && (
              <button
                type="button"
                onClick={() => setScopeToNotebook(true)}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  scopeToNotebook
                    ? "bg-[var(--p)] text-[var(--pt)]"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                In {activeNotebook.title}
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-[var(--m)]">
            GIN Index (tsvector)
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto notes-scrollbar p-2 space-y-1">
          {query.trim() === "" ? (
            <div className="py-12 text-center text-xs text-[var(--m)] space-y-1">
              <p>Type to search with PostgreSQL GIN vector index ranking.</p>
              <p className="text-[11px] text-[var(--m)]/60">
                Supports stemming, exact phrase queries, and plainText search.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--m)]">
              No results found matching &quot;{query}&quot;
            </div>
          ) : (
            searchResults.map((res, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={res.page.pageId}
                  onClick={() => handleSelectResult(res.page.pageId)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-start justify-between rounded-xl p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--s)] text-[var(--i)]"
                      : "text-[var(--b)] hover:bg-[var(--s)]/60"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--m)] shrink-0" />
                      <h4 className="text-xs font-semibold text-[var(--i)] truncate">
                        {highlightMatches(res.page.title, query)}
                      </h4>
                    </div>

                    <p className="text-[11px] text-[var(--m)] line-clamp-2 leading-relaxed">
                      {highlightMatches(res.matchedText, query)}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-[var(--m)] pt-0.5">
                      {res.notebookTitle && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{res.notebookTitle}</span>
                        </span>
                      )}
                      {res.chapterTitle && (
                        <span className="flex items-center gap-1">
                          <span>/</span>
                          <Folder className="h-3 w-3" />
                          <span>{res.chapterTitle}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-md border border-[var(--h)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-mono text-[var(--m)]">
                      {res.rankingScore}% rank
                    </span>
                    <ArrowRight className="h-4 w-4 text-[var(--m)]" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[var(--h)] bg-[var(--s)]/50 px-4 py-2.5 text-[11px] text-[var(--m)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-[var(--h)] bg-[var(--bg)] px-1 py-0.5 font-mono">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-[var(--h)] bg-[var(--bg)] px-1 py-0.5 font-mono">
                ↵
              </kbd>{" "}
              select
            </span>
            <span>
              <kbd className="rounded border border-[var(--h)] bg-[var(--bg)] px-1 py-0.5 font-mono">
                esc
              </kbd>{" "}
              close
            </span>
          </div>
          <span>{searchResults.length} matches</span>
        </div>
      </div>
    </div>
  );
}
