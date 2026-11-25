"use client";

// Drag-and-drop upload banner and multi-file upload progress bar
import { UploadCloud, Loader2 } from "lucide-react";
import type { UploadQueueState } from "./types";

interface FileDockDropzoneProps {
  isDragOver: boolean;
  isUploading: boolean;
  uploadQueue: UploadQueueState | null;
  uploadProgress: number;
  onSelectFiles: () => void;
  compact?: boolean;
}

export function FileDockDropzone({
  isDragOver,
  isUploading,
  uploadQueue,
  uploadProgress,
  onSelectFiles,
  compact = false,
}: FileDockDropzoneProps) {
  if (isUploading && uploadQueue) {
    return (
      <div className="rounded-xl border border-[var(--h)] bg-[var(--s)] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Loader2
              size={15}
              className="animate-spin text-[var(--accent)] shrink-0"
            />
            <span className="font-medium text-[var(--i)] truncate">
              Uploading {uploadQueue.fileName}
            </span>
          </div>
          <span className="text-[var(--m)] shrink-0 font-mono">
            {uploadQueue.current}/{uploadQueue.total} · {uploadProgress}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--h)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-200"
            style={{ width: `${Math.max(8, uploadProgress)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelectFiles}
      className={`rounded-xl border border-dashed transition-colors cursor-pointer flex items-center justify-center text-center ${
        compact ? "px-4 py-3" : "px-6 py-10"
      } ${
        isDragOver
          ? "border-[var(--accent)] bg-[var(--accent)]/10"
          : "border-[var(--h)] bg-[var(--s)]/50 hover:border-[var(--m)] hover:bg-[var(--s)]"
      }`}
    >
      <div
        className={`flex ${
          compact
            ? "flex-row items-center gap-3"
            : "flex-col items-center gap-2"
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-[var(--surface-card)] border border-[var(--h)] flex items-center justify-center text-[var(--i)] shrink-0">
          <UploadCloud size={17} />
        </div>
        <div className={compact ? "text-left" : "text-center"}>
          <p className="text-xs font-semibold text-[var(--i)]">
            Drop files here or click to upload
          </p>
          <p className="text-[11px] text-[var(--m)]">
            Images, videos, PDFs, documents, and archives up to 100MB
          </p>
        </div>
      </div>
    </div>
  );
}
