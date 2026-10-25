"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  Plug,
  Plus,
  UploadCloud,
} from "lucide-react";
import { type RefObject, useState } from "react";
import type { AttachedFile } from "@/store/agentStore";
import { ComposerAttachmentDock } from "./ComposerAttachmentDock";

interface ChatComposerProps {
  darkMode: boolean;
  input: string;
  attachedFiles: AttachedFile[];
  model: string;
  modelMenuOpen: boolean;
  loading: boolean;
  isUploading?: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  onAttachFile: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  onModelSelect: (model: string) => void;
  onModelMenuToggle: () => void;
}

export function ChatComposer({
  input,
  attachedFiles,
  model,
  modelMenuOpen,
  loading,
  isUploading = false,
  textareaRef,
  fileInputRef,
  onInputChange,
  onKeyDown,
  onSubmit,
  onAttachFile,
  onRemoveAttachment,
  onModelSelect,
  onModelMenuToggle,
}: ChatComposerProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag over composer
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  // Handle drag leave composer
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  // Handle dropped files
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => onAttachFile(file));
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full max-w-[760px] shrink-0 mt-auto flex flex-col gap-2 rounded-2xl transition-all ${
        isDragging
          ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]"
          : ""
      }`}
    >
      {/* Drag & drop overlay indicator */}
      {isDragging && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--bg)]/90 backdrop-blur-xs text-[var(--accent)] pointer-events-none">
          <UploadCloud size={28} className="animate-bounce" />
          <span className="text-sm font-semibold">
            Drop files here to attach
          </span>
        </div>
      )}

      {/* Attachment Dock */}
      <ComposerAttachmentDock
        attachedFiles={attachedFiles}
        onRemove={onRemoveAttachment}
      />

      <form onSubmit={onSubmit} className="bx">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Message Zuri or ask questions about files…"
          aria-label="Message Zuri"
          className="w-full resize-none bg-transparent outline-none text-[15px] text-[var(--i)] placeholder:text-[var(--m)] max-h-[140px] leading-relaxed no-scrollbar"
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                Array.from(files).forEach((file) => onAttachFile(file));
              }
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file (PDF, Docs, Sheets, Code, Images)"
            aria-label="Attach file"
            className="ib"
          >
            <Plus size={18} />
          </button>

          <button
            type="button"
            title="Connectors"
            aria-label="Connectors"
            onClick={() =>
              window.alert("Connectors: Google Drive and GitHub are active.")
            }
            className="ib"
          >
            <Plug size={18} />
          </button>

          <div className="relative">
            <button type="button" onClick={onModelMenuToggle} className="md">
              <span>{model}</span>
              <ChevronDown size={14} />
            </button>

            {modelMenuOpen && (
              <div className="absolute bottom-11 left-0 z-30 w-44 rounded-xl border border-[var(--h)] bg-[var(--bg)] p-1 shadow-lg">
                {["Zuri Fast", "Zuri Thinking"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onModelSelect(item)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--i)] hover:bg-[var(--s)]"
                  >
                    <span>{item}</span>
                    {model === item && (
                      <Check size={14} className="text-[#3b82f6]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="flex-1" />

          <button
            type="submit"
            disabled={
              loading ||
              isUploading ||
              (!input.trim() && attachedFiles.length === 0)
            }
            aria-label="Send"
            className="ib bg-[var(--p)] text-[var(--pt)] border-0 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading || isUploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--pt)] border-t-transparent" />
            ) : (
              <ArrowUp size={18} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
