"use client";

// Grid card and list row component for saved File Dock files
import {
  FileText,
  Image as ImageIcon,
  Video,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Music,
  File as FileIcon,
  Eye,
  Download,
  ExternalLink,
  Edit3,
  FolderInput,
  Trash2,
} from "lucide-react";
import {
  downloadDockFile,
  formatDockBytes,
  formatDockDate,
  getFilePreviewType,
} from "@/lib/fileDockUtils";
import type { FileDockFileItem, FileViewMode } from "./types";

interface FileDockFileCardProps {
  file: FileDockFileItem;
  folderName?: string | null;
  viewMode: FileViewMode;
  onPreview: (file: FileDockFileItem) => void;
  onRename: (file: FileDockFileItem) => void;
  onMove: (file: FileDockFileItem) => void;
  onDelete: (file: FileDockFileItem) => void;
}

function renderTypeIcon(file: FileDockFileItem, size = 20) {
  const mime = (file.mimeType || "").toLowerCase();
  const fmt = (file.format || "").toLowerCase();

  if (file.resourceType === "image" || mime.startsWith("image/")) {
    return <ImageIcon size={size} className="text-[#3b82f6]" />;
  }
  if (file.resourceType === "video" || mime.startsWith("video/")) {
    return <Video size={size} className="text-[#8b5cf6]" />;
  }
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(fmt)) {
    return <Music size={size} className="text-[#ec4899]" />;
  }
  if (["xls", "xlsx", "csv"].includes(fmt) || mime.includes("sheet")) {
    return <FileSpreadsheet size={size} className="text-[#10b981]" />;
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(fmt)) {
    return <FileArchive size={size} className="text-[#f59e0b]" />;
  }
  if (["js", "ts", "tsx", "py", "json", "html", "css", "md"].includes(fmt)) {
    return <FileCode size={size} className="text-[#06b6d4]" />;
  }
  if (fmt === "pdf" || mime === "application/pdf" || mime.startsWith("text/")) {
    return <FileText size={size} className="text-rose-500" />;
  }
  return <FileIcon size={size} className="text-[var(--m)]" />;
}

export function FileDockFileCard({
  file,
  folderName,
  viewMode,
  onPreview,
  onRename,
  onMove,
  onDelete,
}: FileDockFileCardProps) {
  const previewType = getFilePreviewType(file.mimeType, file.format, file.name);
  const ext = (
    file.format ||
    file.name.split(".").pop() ||
    "file"
  ).toUpperCase();

  const handleOpenOrPreview = () => {
    if (previewType) {
      onPreview(file);
    } else {
      window.open(file.cloudinaryUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (viewMode === "list") {
    return (
      <div className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--h)] bg-[var(--bg)] hover:bg-[var(--s)] px-3.5 py-2.5 transition-colors">
        <div
          onClick={handleOpenOrPreview}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg border border-[var(--h)] bg-[var(--s)] flex items-center justify-center overflow-hidden shrink-0">
            {previewType === "image" ? (
              <img
                src={file.cloudinaryUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              renderTypeIcon(file, 17)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[var(--i)] truncate">
              {file.name}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--m)] mt-0.5">
              <span className="font-mono text-[10px] uppercase">{ext}</span>
              <span>·</span>
              <span>{formatDockBytes(file.bytes)}</span>
              {folderName && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[120px]">{folderName}</span>
                </>
              )}
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                {formatDockDate(file.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {previewType && (
            <button
              type="button"
              onClick={() => onPreview(file)}
              className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors"
              title="Preview"
            >
              <Eye size={14} />
            </button>
          )}
          <a
            href={file.cloudinaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            onClick={() => downloadDockFile(file.cloudinaryUrl, file.name)}
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors"
            title="Download"
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(file)}
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors"
            title="Move to folder"
          >
            <FolderInput size={14} />
          </button>
          <button
            type="button"
            onClick={() => onRename(file)}
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors"
            title="Rename"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(file)}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col rounded-xl border border-[var(--h)] bg-[var(--bg)] hover:border-[var(--m)] transition-colors overflow-hidden">
      {/* Thumbnail / Icon Preview Area */}
      <div
        onClick={handleOpenOrPreview}
        className="relative h-32 w-full bg-[var(--s)] border-b border-[var(--h)] flex items-center justify-center overflow-hidden cursor-pointer"
      >
        {previewType === "image" ? (
          <img
            src={file.cloudinaryUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            {renderTypeIcon(file, 28)}
            <span className="text-[10px] font-mono font-semibold uppercase text-[var(--m)] px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--h)]">
              {ext}
            </span>
          </div>
        )}

        {/* Quick hover overlay actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {previewType && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
              className="w-7 h-7 rounded-lg bg-[var(--bg)]/90 border border-[var(--h)] text-[var(--i)] flex items-center justify-center hover:bg-[var(--s)]"
              title="Preview"
            >
              <Eye size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadDockFile(file.cloudinaryUrl, file.name);
            }}
            className="w-7 h-7 rounded-lg bg-[var(--bg)]/90 border border-[var(--h)] text-[var(--i)] flex items-center justify-center hover:bg-[var(--s)]"
            title="Download"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Metadata & Footer Actions */}
      <div className="p-3 flex flex-col gap-2">
        <div className="min-w-0">
          <p
            onClick={handleOpenOrPreview}
            className="text-xs font-semibold text-[var(--i)] truncate cursor-pointer hover:underline"
            title={file.name}
          >
            {file.name}
          </p>
          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--m)] mt-1">
            <span>{formatDockBytes(file.bytes)}</span>
            <span className="truncate">{formatDockDate(file.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--h)]">
          <span className="text-[10px] text-[var(--m)] truncate max-w-[100px]">
            {folderName || "Root"}
          </span>

          <div className="flex items-center gap-0.5">
            <a
              href={file.cloudinaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={() => onMove(file)}
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Move"
            >
              <FolderInput size={12} />
            </button>
            <button
              type="button"
              onClick={() => onRename(file)}
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Rename"
            >
              <Edit3 size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
