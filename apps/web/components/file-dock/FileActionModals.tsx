"use client";

// Modals for creating/renaming docks & folders, renaming files, and moving files between docks/folders
import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import type {
  FileDockFileItem,
  FileDockFolderItem,
  FileDockItem,
} from "./types";

interface NamePromptModalProps {
  isOpen: boolean;
  title: string;
  label: string;
  placeholder: string;
  initialValue?: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void> | void;
}

export function NamePromptModal({
  isOpen,
  title,
  label,
  placeholder,
  initialValue = "",
  submitLabel,
  onClose,
  onSubmit,
}: NamePromptModalProps) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] p-5 text-[var(--i)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              {label}
            </label>
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="h-9 px-3 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bt !w-auto !h-9 px-3.5 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim() || submitting}
              className="bt p !w-auto !h-9 px-4 text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MoveFileModalProps {
  file: FileDockFileItem | null;
  docks: FileDockItem[];
  folders: FileDockFolderItem[];
  onClose: () => void;
  onMove: (
    fileId: string,
    targetDockId: string,
    targetFolderId: string | null,
  ) => Promise<void> | void;
}

export function MoveFileModal({
  file,
  docks,
  folders,
  onClose,
  onMove,
}: MoveFileModalProps) {
  const [targetDockId, setTargetDockId] = useState("");
  const [targetFolderId, setTargetFolderId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (file) {
      setTargetDockId(file.fileDockId);
      setTargetFolderId(file.folderId ?? "");
    }
  }, [file]);

  if (!file) return null;

  const dockFolders = folders.filter((f) => f.fileDockId === targetDockId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDockId) return;
    setSubmitting(true);
    try {
      await onMove(file.fileId, targetDockId, targetFolderId || null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] p-5 text-[var(--i)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold truncate pr-4">
            Move &ldquo;{file.name}&rdquo;
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Destination Dock
            </label>
            <div className="relative">
              <select
                value={targetDockId}
                onChange={(e) => {
                  setTargetDockId(e.target.value);
                  setTargetFolderId("");
                }}
                className="appearance-none w-full h-9 pl-3 pr-8 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs text-[var(--i)] focus:outline-none focus:border-[var(--p)] cursor-pointer"
              >
                {docks.map((d) => (
                  <option
                    key={d.fileDockId}
                    value={d.fileDockId}
                    className="bg-[var(--surface-card)] text-[var(--i)]"
                  >
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Destination Folder
            </label>
            <div className="relative">
              <select
                value={targetFolderId}
                onChange={(e) => setTargetFolderId(e.target.value)}
                className="appearance-none w-full h-9 pl-3 pr-8 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs text-[var(--i)] focus:outline-none focus:border-[var(--p)] cursor-pointer"
              >
                <option
                  value=""
                  className="bg-[var(--surface-card)] text-[var(--i)]"
                >
                  Dock Root (No folder)
                </option>
                {dockFolders.map((f) => (
                  <option
                    key={f.folderId}
                    value={f.folderId}
                    className="bg-[var(--surface-card)] text-[var(--i)]"
                  >
                    {f.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bt !w-auto !h-9 px-3.5 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bt p !w-auto !h-9 px-4 text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Moving..." : "Move File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
