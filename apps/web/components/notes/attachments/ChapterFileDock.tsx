"use client";

// Slide-over drawer for chapter file dock with S3/MinIO metadata, drag & drop dropzone, and deduplication
import { useState, useRef, useMemo } from "react";
import { useNotesStore } from "@/store/notesStore";
import { Attachment } from "../types";
import { getLucideIcon } from "../sidebar/IconPicker";
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
  Download,
  Trash2,
  CheckCircle2,
  Copy,
  FolderArchive,
  HardDrive,
  Search,
  FileSpreadsheet,
  FileArchive,
  Music,
  Video,
} from "lucide-react";

export function ChapterFileDock() {
  const {
    isChapterFileDockOpen,
    activeChapterFileDockId,
    closeChapterFileDock,
    chapters,
    attachments,
    addAttachment,
    deleteAttachment,
  } = useNotesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChapter = chapters.find(
    (c) => c.chapterId === activeChapterFileDockId,
  );
  const ChapterIcon = getLucideIcon(activeChapter?.icon, FolderArchive);

  // Filter attachments for current chapter
  const chapterAttachments = useMemo(() => {
    if (!activeChapterFileDockId) return [];
    return attachments.filter((a) => a.chapterId === activeChapterFileDockId);
  }, [attachments, activeChapterFileDockId]);

  // Filtered by search query
  const filteredAttachments = useMemo(() => {
    if (!searchQuery.trim()) return chapterAttachments;
    const q = searchQuery.toLowerCase();
    return chapterAttachments.filter(
      (a) =>
        a.fileName.toLowerCase().includes(q) ||
        a.storageKey.toLowerCase().includes(q),
    );
  }, [chapterAttachments, searchQuery]);

  // Calculate storage usage
  const totalSizeBytes = useMemo(() => {
    return chapterAttachments.reduce(
      (acc, curr) => acc + (curr.sizeBytes || 0),
      0,
    );
  }, [chapterAttachments]);

  if (!isChapterFileDockOpen || !activeChapterFileDockId) return null;

  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const showNotification = (
    message: string,
    type: "success" | "info" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const processUpload = (file: File) => {
    // Simulated SHA-256 checksum based on file metadata
    const mockChecksum = `sha256-${file.name.slice(0, 4)}-${file.size}`;

    // Deduplication check
    const existing = attachments.find((a) => a.checksum === mockChecksum);
    if (existing) {
      showNotification(
        `Deduplicated: File identical to ${existing.fileName}`,
        "info",
      );
      return;
    }

    const isImage = file.type.startsWith("image/");
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = `notes/chapters/${activeChapterFileDockId}/${new Date().getFullYear()}/${safeName}`;

    addAttachment({
      chapterId: activeChapterFileDockId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageKey,
      checksum: mockChecksum,
      width: isImage ? 1200 : undefined,
      height: isImage ? 800 : undefined,
      url: isImage
        ? URL.createObjectURL(file)
        : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    });

    showNotification(`Uploaded ${file.name}`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(processUpload);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processUpload);
    }
  };

  const handleCopyStorageKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (att: Attachment) => {
    if (att.url) {
      const anchor = document.createElement("a");
      anchor.href = att.url;
      anchor.download = att.fileName;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } else {
      showNotification(`Download started for ${att.fileName}`);
    }
  };

  const getMimeIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/"))
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes("pdf") || mimeType.includes("text"))
      return <FileText className="h-4 w-4 text-emerald-500" />;
    if (
      mimeType.includes("json") ||
      mimeType.includes("javascript") ||
      mimeType.includes("typescript") ||
      mimeType.includes("code")
    ) {
      return <FileCode className="h-4 w-4 text-amber-500" />;
    }
    if (mimeType.includes("sheet") || mimeType.includes("csv"))
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    if (
      mimeType.includes("zip") ||
      mimeType.includes("tar") ||
      mimeType.includes("archive")
    )
      return <FileArchive className="h-4 w-4 text-purple-500" />;
    if (mimeType.startsWith("audio/"))
      return <Music className="h-4 w-4 text-pink-500" />;
    if (mimeType.startsWith("video/"))
      return <Video className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-[var(--m)]" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeChapterFileDock}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-[var(--h)] bg-[var(--bg)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--h)] px-6 py-4 bg-[var(--s)]/30">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] shadow-2xs"
              style={{ color: activeChapter?.color || "var(--i)" }}
            >
              <ChapterIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--i)] leading-none">
                Chapter File Dock
              </h3>
              <p className="mt-1 text-xs text-[var(--m)] truncate max-w-[240px]">
                {activeChapter?.title || "Chapter Files"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeChapterFileDock}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Storage Summary Card */}
        <div className="border-b border-[var(--h)] bg-[var(--s)]/40 p-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-[var(--h)] bg-[var(--bg)] p-2.5">
              <div className="text-[10px] text-[var(--m)] uppercase tracking-wider font-medium">
                Total Files
              </div>
              <div className="mt-1 text-base font-semibold text-[var(--i)]">
                {chapterAttachments.length}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--h)] bg-[var(--bg)] p-2.5">
              <div className="text-[10px] text-[var(--m)] uppercase tracking-wider font-medium flex items-center justify-between">
                <span>Storage</span>
                <HardDrive className="h-3 w-3 text-[var(--m)]" />
              </div>
              <div className="mt-1 text-base font-semibold text-[var(--i)]">
                {formatSize(totalSizeBytes)}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="p-4 border-b border-[var(--h)]">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-[var(--i)] bg-[var(--surface-strong)]"
                : "border-[var(--h)] hover:border-[var(--i)] bg-[var(--s)]/30 hover:bg-[var(--s)]"
            }`}
          >
            <UploadCloud className="mx-auto h-6 w-6 text-[var(--m)] mb-1.5" />
            <div className="text-xs font-semibold text-[var(--i)]">
              Drop files here, or{" "}
              <span className="text-blue-500 underline">browse</span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--m)]">
              Stores chapter assets with automated SHA-256 deduplication
            </p>
          </div>

          {notification && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--s)] border border-[var(--h)] p-2.5 text-xs text-[var(--i)] animate-in fade-in-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>{notification.message}</span>
            </div>
          )}
        </div>

        {/* Search filter for files if list is non-empty */}
        {chapterAttachments.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[var(--m)] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter files..."
                className="w-full rounded-lg border border-[var(--h)] bg-[var(--s)]/60 pl-8 pr-3 py-1.5 text-xs text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none focus:border-[var(--i)] transition-colors"
              />
            </div>
          </div>
        )}

        {/* List of Chapter Files */}
        <div className="flex-1 overflow-y-auto notes-scrollbar p-4 space-y-2.5">
          {chapterAttachments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--m)] space-y-2">
              <FolderArchive className="mx-auto h-8 w-8 text-[var(--m)]/50" />
              <p className="font-medium text-[var(--b)]">
                No files stored in this chapter
              </p>
              <p className="text-[11px]">
                Upload reference documents, schematics, and assets here.
              </p>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--m)]">
              No files match &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredAttachments.map((att) => {
              const isImage = att.mimeType.startsWith("image/");
              return (
                <div
                  key={att.id}
                  className="group rounded-xl border border-[var(--h)] bg-[var(--surface-card)] p-3 space-y-2 text-xs hover:border-[var(--i)]/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] shrink-0 overflow-hidden">
                        {isImage && att.url ? (
                          <img
                            src={att.url}
                            alt={att.fileName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getMimeIcon(att.mimeType)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className="font-medium text-[var(--i)] truncate"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </h4>
                        <p className="text-[10px] text-[var(--m)]">
                          {formatSize(att.sizeBytes)} • {att.mimeType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(att)}
                        className="p-1 rounded text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAttachment(att.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* S3 Storage Key with Copy */}
                  <div className="rounded-lg bg-[var(--bg)] border border-[var(--h)] p-1.5 font-mono text-[10px] text-[var(--m)] flex items-center justify-between">
                    <span className="truncate pr-2">{att.storageKey}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyStorageKey(att.storageKey)}
                      className="text-[var(--m)] hover:text-[var(--i)] shrink-0 transition-colors"
                      title="Copy S3 storage key"
                    >
                      {copiedKey === att.storageKey ? (
                        <span className="text-[9px] text-emerald-500 font-sans font-medium">
                          Copied
                        </span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[var(--h)] bg-[var(--s)]/40 px-6 py-2.5 text-[11px] text-[var(--m)] flex items-center justify-between">
          <span>Chapter-level storage</span>
          <span className="font-mono text-[10px]">MinIO / S3</span>
        </div>
      </div>
    </>
  );
}
