"use client";

// Dropdown selector and switcher for user's notebooks
import { useState, useRef } from "react";
import { useNotesStore } from "@/store/notesStore";
import { sortByPosition } from "../utils/fractional-index";
import { getLucideIcon } from "./IconPicker";
import { ChevronDown, Plus, Settings, BookOpen, Check } from "lucide-react";

export function NotebookSelector() {
  const { notebooks, activeNotebookId, setActiveNotebook, openNotebookModal } =
    useNotesStore();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeNotebook =
    notebooks.find((n) => n.notebookId === activeNotebookId) || notebooks[0];
  const activeNotebooks = sortByPosition(
    notebooks.filter((n) => !n.isArchived),
  );

  const ActiveIcon = getLucideIcon(activeNotebook?.icon, BookOpen);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2.5 rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-2.5 text-left hover:border-[var(--m)]/40 transition-all shadow-2xs"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shadow-2xs"
            style={{
              backgroundColor: `${activeNotebook?.color || "#3b82f6"}18`,
            }}
          >
            <ActiveIcon
              className="h-5 w-5"
              style={{ color: activeNotebook?.color || "#3b82f6" }}
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm sm:text-[15px] font-bold text-[var(--i)] leading-tight">
              {activeNotebook?.title || "Select Notebook"}
            </h3>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-[var(--m)] shrink-0" />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-14 z-50 w-72 sm:w-80 rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-2 shadow-2xl text-sm space-y-1.5 animate-in fade-in-0">
            <div className="px-2.5 py-1 text-xs font-bold tracking-wider text-[var(--m)] uppercase">
              Your Notebooks
            </div>

            <div className="max-h-64 overflow-y-auto notes-scrollbar space-y-1">
              {activeNotebooks.map((nb) => {
                const ItemIcon = getLucideIcon(nb.icon, BookOpen);
                const isCurrent = nb.notebookId === activeNotebookId;

                return (
                  <button
                    key={nb.notebookId}
                    type="button"
                    onClick={() => {
                      setActiveNotebook(nb.notebookId);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isCurrent
                        ? "bg-[var(--s)] text-[var(--i)] font-bold shadow-2xs"
                        : "text-[var(--b)] hover:bg-[var(--s)]/70 hover:text-[var(--i)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                        style={{
                          backgroundColor: `${nb.color || "#3b82f6"}20`,
                        }}
                      >
                        <ItemIcon
                          className="h-4 w-4"
                          style={{ color: nb.color || "#3b82f6" }}
                        />
                      </div>
                      <span className="truncate text-sm font-medium">
                        {nb.title}
                      </span>
                    </div>
                    {isCurrent && (
                      <Check className="h-4 w-4 text-[var(--i)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[var(--h)] pt-1.5 space-y-1">
              {/* Edit Current Notebook */}
              {activeNotebook && (
                <button
                  type="button"
                  onClick={() => {
                    openNotebookModal(activeNotebook);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] font-medium transition-colors"
                >
                  <Settings className="h-4 w-4 text-[var(--m)]" />
                  <span>Notebook Settings</span>
                </button>
              )}

              {/* Create New Notebook */}
              <button
                type="button"
                onClick={() => {
                  openNotebookModal();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[var(--i)] font-semibold hover:bg-[var(--s)] transition-colors"
              >
                <Plus className="h-4 w-4 text-[var(--m)]" />
                <span>Create New Notebook</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
