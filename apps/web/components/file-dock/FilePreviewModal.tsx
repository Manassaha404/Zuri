"use client";

// In-website modal previewer for saved images, videos, and PDFs
import { X, Download, ExternalLink } from "lucide-react";
import { downloadDockFile, formatDockBytes } from "@/lib/fileDockUtils";
import type { PreviewFileState } from "./types";

interface FilePreviewModalProps {
  file: PreviewFileState | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] text-[var(--i)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--h)] px-5 py-3.5 bg-[var(--s)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="rounded-md bg-[var(--h)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--i)]">
              {file.type}
            </span>
            <h3 className="text-sm font-semibold truncate max-w-[280px] sm:max-w-[460px]">
              {file.name}
            </h3>
            {file.bytes ? (
              <span className="text-xs text-[var(--m)] shrink-0">
                ({formatDockBytes(file.bytes)})
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bt !w-auto !h-8 px-2.5 text-xs font-medium flex items-center gap-1.5 no-underline"
              title="Open in new tab"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open</span>
            </a>
            <button
              type="button"
              onClick={() => downloadDockFile(file.url, file.name)}
              className="bt !w-auto !h-8 px-2.5 text-xs font-medium flex items-center gap-1.5"
              title="Download"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors ml-1"
              title="Close preview"
              aria-label="Close preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto styled-scrollbar p-4 flex items-center justify-center bg-[var(--bg)] min-h-[340px]">
          {file.type === "image" && (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />
          )}
          {file.type === "video" && (
            <video
              src={file.url}
              controls
              autoPlay
              className="max-h-[75vh] max-w-full rounded-lg"
            />
          )}
          {file.type === "pdf" && (
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-[75vh] rounded-lg border border-[var(--h)] bg-[#faf9f6]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
