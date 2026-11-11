"use client";

// Modal to move a page to another chapter or notebook, updating denormalized notebookId
import { useState, useEffect } from "react";
import { useNotesStore } from "@/store/notesStore";
import { X, ArrowRightLeft, BookOpen, Folder, Check } from "lucide-react";

export function MovePageModal() {
  const {
    isMovePageOpen,
    targetMovePageId,
    closeMovePage,
    pages,
    notebooks,
    chapters,
    movePage,
  } = useNotesStore();

  const targetPage = pages.find((p) => p.pageId === targetMovePageId);

  const [selectedNotebookId, setSelectedNotebookId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  useEffect(() => {
    if (targetPage) {
      setSelectedNotebookId(targetPage.notebookId);
      setSelectedChapterId(targetPage.chapterId);
    }
  }, [targetPage, isMovePageOpen]);

  if (!isMovePageOpen || !targetPage) return null;

  const activeNotebooks = notebooks.filter((n) => !n.isArchived);
  const destinationChapters = chapters.filter(
    (c) => c.notebookId === selectedNotebookId && !c.isArchived,
  );

  const handleMove = () => {
    if (!selectedNotebookId || !selectedChapterId) return;
    movePage(targetPage.pageId, selectedNotebookId, selectedChapterId);
    closeMovePage();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div className="w-full max-w-md rounded-xl border border-[var(--h)] bg-[var(--bg)] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--h)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-[var(--m)]" />
            <h2 className="text-base font-semibold text-[var(--i)]">
              Move Page
            </h2>
          </div>
          <button
            type="button"
            onClick={closeMovePage}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="rounded-lg border border-[var(--h)] bg-[var(--s)] p-3 text-xs">
            <span className="text-[var(--m)]">Moving page: </span>
            <strong className="text-[var(--i)] font-semibold">
              {targetPage.title}
            </strong>
          </div>

          {/* Destination Notebook */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--m)]">
              Destination Notebook
            </label>
            <div className="space-y-1 max-h-36 overflow-y-auto notes-scrollbar">
              {activeNotebooks.map((nb) => {
                const isSelected = selectedNotebookId === nb.notebookId;
                return (
                  <button
                    key={nb.notebookId}
                    type="button"
                    onClick={() => {
                      setSelectedNotebookId(nb.notebookId);
                      // Pick first chapter of selected notebook
                      const firstCh = chapters.find(
                        (c) => c.notebookId === nb.notebookId && !c.isArchived,
                      );
                      if (firstCh) setSelectedChapterId(firstCh.chapterId);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-left transition-colors ${
                      isSelected
                        ? "border border-[var(--i)] bg-[var(--s)] text-[var(--i)] font-medium"
                        : "border border-[var(--h)] text-[var(--b)] hover:bg-[var(--s)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen
                        className="h-3.5 w-3.5"
                        style={{ color: nb.color || "#3b82f6" }}
                      />
                      <span className="truncate">{nb.title}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[var(--i)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Chapter */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--m)]">
              Destination Chapter
            </label>
            <div className="space-y-1 max-h-36 overflow-y-auto notes-scrollbar">
              {destinationChapters.length === 0 ? (
                <div className="p-3 text-xs text-[var(--m)] italic text-center border border-dashed border-[var(--h)] rounded-lg">
                  No chapters in selected notebook
                </div>
              ) : (
                destinationChapters.map((ch) => {
                  const isSelected = selectedChapterId === ch.chapterId;
                  return (
                    <button
                      key={ch.chapterId}
                      type="button"
                      onClick={() => setSelectedChapterId(ch.chapterId)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-left transition-colors ${
                        isSelected
                          ? "border border-[var(--i)] bg-[var(--s)] text-[var(--i)] font-medium"
                          : "border border-[var(--h)] text-[var(--b)] hover:bg-[var(--s)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder
                          className="h-3.5 w-3.5"
                          style={{ color: ch.color || "#3b82f6" }}
                        />
                        <span className="truncate">{ch.title}</span>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[var(--i)]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Notice on denormalization */}
          <p className="text-[11px] text-[var(--m)]">
            Moving this page updates both{" "}
            <code className="font-mono text-[var(--i)]">chapterId</code> and
            denormalized{" "}
            <code className="font-mono text-[var(--i)]">notebookId</code> for
            instant notebook-scoped search and list queries.
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={closeMovePage}
              className="rounded-lg border border-[var(--h)] px-4 py-2 text-xs font-medium text-[var(--b)] hover:bg-[var(--s)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMove}
              disabled={!selectedNotebookId || !selectedChapterId}
              className="rounded-lg bg-[var(--p)] px-4 py-2 text-xs font-semibold text-[var(--pt)] hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              Confirm Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
