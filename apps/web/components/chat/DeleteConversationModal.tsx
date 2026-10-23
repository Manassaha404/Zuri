"use client";

import { useEffect, useRef } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteConversationModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConversationModal({
  isOpen,
  title,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConversationModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isDeleting) {
          onClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      // Auto focus delete button
      confirmBtnRef.current?.focus();
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 grid place-items-center shrink-0 border border-red-500/20">
            <Trash2 size={20} />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h3
              id="delete-dialog-title"
              className="text-base font-semibold text-[var(--i)] tracking-tight"
            >
              Delete conversation?
            </h3>
            <p className="text-xs text-[var(--m)] leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[var(--i)] break-words">
                &ldquo;{title || "this chat"}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--h)]/60">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="bt w-auto px-4 py-2 text-xs font-medium hover:bg-[var(--h)]"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? "Deleting..." : "Delete chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
