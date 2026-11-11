"use client";

// Right-click context menu offering copy, paste, duplicate, ordering, grouping, and alignment
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  Lock,
  Unlock,
  Sparkles,
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const {
    selectedIds,
    elements,
    copySelected,
    cutSelected,
    paste,
    duplicateSelected,
    deleteSelected,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    toggleLockSelected,
  } = useDiagramStudioStore();

  const hasSelection = selectedIds.length > 0;
  const anyLocked = elements.some(
    (el) => selectedIds.includes(el.id) && el.isLocked,
  );
  const anyGrouped = elements.some(
    (el) => selectedIds.includes(el.id) && el.groupId,
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        style={{ left: `${x}px`, top: `${y}px` }}
        className="fixed z-50 w-52 rounded-2xl border border-[var(--h)] bg-[var(--bg)]/95 backdrop-blur-md p-1.5 shadow-2xl space-y-0.5 text-xs animate-in zoom-in-95 duration-100 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            copySelected();
            onClose();
          }}
          disabled={!hasSelection}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <div className="flex items-center gap-2">
            <Copy className="h-3.5 w-3.5 text-[var(--m)]" />
            <span>Copy</span>
          </div>
          <span className="font-mono text-[10px] text-[var(--m)]">⌘C</span>
        </button>

        <button
          type="button"
          onClick={() => {
            cutSelected();
            onClose();
          }}
          disabled={!hasSelection}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <div className="flex items-center gap-2">
            <Scissors className="h-3.5 w-3.5 text-[var(--m)]" />
            <span>Cut</span>
          </div>
          <span className="font-mono text-[10px] text-[var(--m)]">⌘X</span>
        </button>

        <button
          type="button"
          onClick={() => {
            paste();
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)]"
        >
          <div className="flex items-center gap-2">
            <Clipboard className="h-3.5 w-3.5 text-[var(--m)]" />
            <span>Paste</span>
          </div>
          <span className="font-mono text-[10px] text-[var(--m)]">⌘V</span>
        </button>

        <button
          type="button"
          onClick={() => {
            duplicateSelected();
            onClose();
          }}
          disabled={!hasSelection}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <div className="flex items-center gap-2">
            <Copy className="h-3.5 w-3.5 text-[var(--m)]" />
            <span>Duplicate</span>
          </div>
          <span className="font-mono text-[10px] text-[var(--m)]">⌘D</span>
        </button>

        <div className="my-1 border-t border-[var(--h)]" />

        <button
          type="button"
          onClick={() => {
            bringToFront();
            onClose();
          }}
          disabled={!hasSelection}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <BringToFront className="h-3.5 w-3.5 text-[var(--m)]" />
          <span>Bring to Front</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sendToBack();
            onClose();
          }}
          disabled={!hasSelection}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <SendToBack className="h-3.5 w-3.5 text-[var(--m)]" />
          <span>Send to Back</span>
        </button>

        <button
          type="button"
          onClick={() => {
            groupSelected();
            onClose();
          }}
          disabled={selectedIds.length < 2}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <div className="flex items-center gap-2">
            <Group className="h-3.5 w-3.5 text-[var(--m)]" />
            <span>Group</span>
          </div>
          <span className="text-[10px] text-[var(--m)]">Ctrl+G</span>
        </button>

        <button
          type="button"
          onClick={() => {
            ungroupSelected();
            onClose();
          }}
          disabled={!anyGrouped}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <div className="flex items-center gap-2">
            <Ungroup className="h-3.5 w-3.5 text-[var(--m)]" />
            <span>Ungroup</span>
          </div>
          <span className="text-[10px] text-[var(--m)]">Ctrl+Shift+G</span>
        </button>

        <button
          type="button"
          onClick={() => {
            toggleLockSelected();
            onClose();
          }}
          disabled={!hasSelection}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] disabled:opacity-40"
        >
          <div className="flex items-center gap-2">
            {anyLocked ? (
              <Unlock className="h-3.5 w-3.5 text-[var(--m)]" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-[var(--m)]" />
            )}
            <span>{anyLocked ? "Unlock" : "Lock"}</span>
          </div>
          <span className="text-[10px] text-[var(--m)]">Ctrl+L</span>
        </button>

        <div className="my-1 border-t border-[var(--h)]" />

        <button
          type="button"
          onClick={() => {
            deleteSelected();
            onClose();
          }}
          disabled={!hasSelection}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-500 hover:bg-red-500/10 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </>
  );
}
