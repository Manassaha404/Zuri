"use client";

// File attachment block referencing an attachment stored in S3/MinIO
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import {
  Download,
  File,
  FileCode,
  FileSpreadsheet,
  FileText,
  ExternalLink,
} from "lucide-react";

interface FileBlockProps {
  block: Block;
}

export function FileBlock({ block }: FileBlockProps) {
  const { attachments } = useNotesStore();

  const content = block.content;
  if (content.type !== "file") return null;

  const attachment = attachments.find((a) => a.id === content.attachmentId);

  if (!attachment) {
    return (
      <div className="my-2 rounded-xl border border-dashed border-[var(--h)] p-4 text-center text-xs text-[var(--m)]">
        Attachment reference removed
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes("pdf")) return FileText;
    if (mime.includes("json") || mime.includes("code")) return FileCode;
    if (mime.includes("sheet") || mime.includes("csv")) return FileSpreadsheet;
    return File;
  };

  const FileIconComp = getFileIcon(attachment.mimeType);

  return (
    <div className="my-3 flex items-center justify-between rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] p-4 hover:border-[var(--m)]/40 transition-all shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] shrink-0 shadow-xs">
          <FileIconComp className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-[var(--i)] truncate">
            {attachment.fileName}
          </h4>
          <div className="flex items-center gap-2 text-xs text-[var(--m)] mt-0.5">
            <span>{formatSize(attachment.sizeBytes)}</span>
            <span>•</span>
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {attachment.mimeType.split("/")[1] || "FILE"}
            </span>
            <span>•</span>
            <span className="truncate max-w-[180px] font-mono text-[10px] text-[var(--m)]/70">
              {attachment.storageKey}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {attachment.url && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3 text-xs sm:text-sm font-semibold text-[var(--i)] hover:bg-[var(--s)] transition-colors shadow-2xs"
            title="Open file in new tab"
          >
            <ExternalLink className="h-4 w-4 text-[var(--m)]" />
            <span className="hidden sm:inline">Open</span>
          </a>
        )}
        <a
          href={attachment.url || "#"}
          download={attachment.fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center gap-2 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3.5 text-xs sm:text-sm font-semibold text-[var(--i)] hover:bg-[var(--s)] transition-colors shrink-0 shadow-2xs"
        >
          <Download className="h-4 w-4 text-[var(--m)]" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>
    </div>
  );
}
