"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  File as FileIcon,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import type { AttachedFile } from "@/store/agentStore";
import { formatFileSize, getFileCategory } from "@/lib/utils";

interface ComposerAttachmentDockProps {
  attachedFiles: AttachedFile[];
  onRemove: (id: string) => void;
}

// Category theme for composer pills
function getCategoryIcon(
  category: ReturnType<typeof getFileCategory>["category"],
) {
  switch (category) {
    case "pdf":
      return {
        icon: FileText,
        colorClass: "text-red-500 bg-red-500/10",
      };
    case "sheet":
      return {
        icon: FileSpreadsheet,
        colorClass: "text-emerald-500 bg-emerald-500/10",
      };
    case "code":
      return {
        icon: FileCode,
        colorClass: "text-purple-500 bg-purple-500/10",
      };
    case "doc":
      return {
        icon: FileText,
        colorClass: "text-blue-500 bg-blue-500/10",
      };
    case "image":
      return {
        icon: ImageIcon,
        colorClass: "text-amber-500 bg-amber-500/10",
      };
    default:
      return {
        icon: FileIcon,
        colorClass: "text-[var(--m)] bg-[var(--h)]/50",
      };
  }
}

// Individual file item thumbnail / chip
function AttachmentItem({
  file,
  onRemove,
}: {
  file: AttachedFile;
  onRemove: (id: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { category, ext } = getFileCategory(file.name);
  const { icon: Icon, colorClass } = getCategoryIcon(category);
  const formattedSize = formatFileSize(file.size);

  // Generate object preview for local image files
  useEffect(() => {
    if (file.file && file.file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file.file]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--b)] max-w-xs shadow-xs animate-in fade-in-0 duration-150">
      {/* Thumbnail or Category Icon */}
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-6 h-6 object-cover rounded-md shrink-0 border border-[var(--h)]"
        />
      ) : (
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${colorClass}`}
        >
          <Icon size={14} />
        </div>
      )}

      {/* File info */}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <span className="truncate font-medium text-[var(--i)] text-[12px] leading-tight">
          {file.name}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-[var(--m)] leading-tight mt-0.5">
          <span className="font-mono uppercase font-semibold">{ext}</span>
          {formattedSize && (
            <>
              <span>•</span>
              <span>{formattedSize}</span>
            </>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {file.status === "uploading" && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent shrink-0"
          title="Uploading file…"
        />
      )}

      {file.status === "uploaded" && (
        <span title="Uploaded and ready" className="shrink-0 flex items-center">
          <Check size={13} className="text-[#10b981]" />
        </span>
      )}

      {file.status === "error" && (
        <span
          title={file.error || "Upload failed"}
          className="shrink-0 flex items-center"
        >
          <AlertCircle size={13} className="text-red-500" />
        </span>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
        className="rounded-md p-1 text-[var(--m)] hover:text-red-500 hover:bg-[var(--s)] transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Dock container rendering active attachment badges
export function ComposerAttachmentDock({
  attachedFiles,
  onRemove,
}: ComposerAttachmentDockProps) {
  if (attachedFiles.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      {attachedFiles.map((file) => (
        <AttachmentItem key={file.id} file={file} onRemove={onRemove} />
      ))}
    </div>
  );
}
