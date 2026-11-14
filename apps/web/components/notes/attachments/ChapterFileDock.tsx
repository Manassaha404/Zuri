"use client";

// Slide-over drawer for chapter file dock with on-demand dock creation, in-website preview (images, videos, PDFs), and Cloudinary direct upload
import { useState, useRef, useMemo } from "react";
import { useNotesStore } from "@/store/notesStore";
import { useChapterFileDock, getPreviewType } from "@/hook/notes";
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
  FolderArchive,
  HardDrive,
  Search,
  FileSpreadsheet,
  FileArchive,
  Music,
  Video,
  ExternalLink,
  Eye,
  Loader2,
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
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{
    total: number;
    current: number;
    fileName: string;
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    fileName: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    type: "image" | "video" | "pdf";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChapter = chapters.find(
    (c) => c.chapterId === activeChapterFileDockId,
  );
  const ChapterIcon = getLucideIcon(activeChapter?.icon, FolderArchive);

  const {
    files: serverFiles,
    uploadFile,
    deleteFile,
    openFileInNewTab,
    isUploading,
    uploadStatus,
    uploadProgress,
    refetch,
  } = useChapterFileDock(activeChapterFileDockId);

  // Unified list of files combining persistent PostgreSQL dock files and local attachments
  const chapterAttachments = useMemo(() => {
    if (!activeChapterFileDockId) return [];

    const serverItems = (serverFiles || []).map((sf) => ({
      id: sf.fileId,
      chapterId: activeChapterFileDockId,
      fileName: sf.name,
      mimeType: sf.mimeType || "application/octet-stream",
      sizeBytes: Number(sf.bytes) || 0,
      storageKey: sf.cloudinaryPublicId,
      url: sf.cloudinaryUrl,
      isServer: true,
      createdAt: sf.createdAt
        ? new Date(sf.createdAt).toISOString()
        : new Date().toISOString(),
    }));

    const serverStorageKeys = new Set(serverItems.map((s) => s.storageKey));
    const serverFileNames = new Set(serverItems.map((s) => s.fileName));

    const localItems = attachments
      .filter((a) => a.chapterId === activeChapterFileDockId)
      .filter(
        (a) =>
          !serverStorageKeys.has(a.storageKey) &&
          !serverFileNames.has(a.fileName),
      )
      .map((a) => ({
        ...a,
        isServer: false,
      }));

    return [...serverItems, ...localItems];
  }, [serverFiles, attachments, activeChapterFileDockId]);

  // Filtered by search query (file name only, no keys)
  const filteredAttachments = useMemo(() => {
    if (!searchQuery.trim()) return chapterAttachments;
    const q = searchQuery.toLowerCase();
    return chapterAttachments.filter((a) =>
      a.fileName.toLowerCase().includes(q),
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

  const handleUploadFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    let successCount = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]!;
      setUploadQueue({
        total: fileList.length,
        current: i + 1,
        fileName: file.name,
      });

      try {
        const res = await uploadFile(file);
        if (res) {
          successCount++;
          addAttachment({
            chapterId: activeChapterFileDockId,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            storageKey: res.cloudinaryPublicId,
            url: res.cloudinaryUrl,
          });
        }
        // Explicitly re-request chapter file dock after each uploaded file
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload error";
        showNotification(`Failed to upload ${file.name}: ${message}`, "info");
      }
    }

    setUploadQueue(null);
    await refetch();
    if (successCount > 0) {
      showNotification(
        fileList.length === 1
          ? `Uploaded ${fileList[0]!.name}`
          : `Uploaded ${successCount} of ${fileList.length} files successfully`,
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleUploadFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDownloadFile = (att: { fileName: string; url?: string }) => {
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

  const handleOpenFileInNewTab = (url?: string) => {
    if (!url) {
      showNotification("Direct file URL not available", "info");
      return;
    }
    openFileInNewTab(url);
  };

  // If image, video, or PDF: open in-website modal viewer; if other type: open in new tab
  const handleItemClick = (att: {
    fileName: string;
    url?: string;
    mimeType?: string;
    sizeBytes?: number;
  }) => {
    if (!att.url) {
      showNotification("Direct file URL not available", "info");
      return;
    }
    const pType = getPreviewType(att.mimeType, undefined, att.fileName);
    if (pType) {
      setPreviewFile({
        fileName: att.fileName,
        url: att.url,
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes,
        type: pType,
      });
    } else {
      openFileInNewTab(att.url);
    }
  };

  const handleDeleteFile = async (att: { id: string; isServer?: boolean }) => {
    try {
      if (att.isServer) {
        await deleteFile(att.id);
      }
      deleteAttachment(att.id);
      showNotification("File removed");
    } catch {
      showNotification("Failed to delete file", "info");
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

        {/* Upload Dropzone & Live Progress Indicator */}
        <div className="p-4 border-b border-[var(--h)]">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            disabled={isUploading}
            className="hidden"
            onChange={handleFileInputChange}
          />

          {isUploading || uploadQueue ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--accent)]/50 bg-[var(--accent)]/5 p-5 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)] mb-2" />
              <h4 className="text-xs sm:text-sm font-semibold text-[var(--i)] truncate max-w-[280px]">
                {uploadQueue
                  ? `Uploading ${uploadQueue.fileName}`
                  : "Uploading file..."}
              </h4>
              {uploadQueue && uploadQueue.total > 1 && (
                <span className="text-[11px] text-[var(--m)] mt-0.5">
                  File {uploadQueue.current} of {uploadQueue.total}
                </span>
              )}
              {/* Live Upload Progress Bar & Percentage */}
              <div className="mt-3 w-48 h-1.5 bg-[var(--h)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between w-48 text-[11px] font-mono text-[var(--m)]">
                <span>
                  {uploadStatus === "signing" ? "Preparing..." : "Uploading..."}
                </span>
                <span className="font-semibold text-[var(--i)]">
                  {uploadProgress}%
                </span>
              </div>
            </div>
          ) : (
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
                Upload images, videos, documents, or reference files for this
                chapter
              </p>
            </div>
          )}

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
                Upload images, videos, PDFs, and assets for this chapter.
              </p>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--m)]">
              No files match &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredAttachments.map((att) => {
              const previewType = getPreviewType(
                att.mimeType,
                undefined,
                att.fileName,
              );
              const isImage = previewType === "image";

              return (
                <div
                  key={att.id}
                  className="group rounded-xl border border-[var(--h)] bg-[var(--surface-card)] p-3 space-y-2 text-xs hover:border-[var(--i)]/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div
                      onClick={() => handleItemClick(att)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      {/* Thumbnail or Icon */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] shrink-0 overflow-hidden group-hover:border-[var(--i)]/30 transition-colors">
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

                      {/* File Details (No Keys Displayed) */}
                      <div className="min-w-0 flex-1">
                        <h4
                          className="font-medium text-[var(--i)] group-hover:text-blue-500 truncate transition-colors leading-tight"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--m)]">
                          <span>{formatSize(att.sizeBytes)}</span>
                          {previewType && (
                            <>
                              <span>•</span>
                              <span className="rounded bg-[var(--h)]/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--i)]">
                                {previewType}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Preview in website (if image/video/pdf), Open in new tab, Download, Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      {previewType ? (
                        <button
                          type="button"
                          onClick={() => handleItemClick(att)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
                          title={`Preview ${previewType} in website`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      ) : null}

                      {/* Open in new tab link */}
                      {att.url ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(att)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(att)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[var(--h)] bg-[var(--s)]/40 px-6 py-2.5 text-[11px] text-[var(--m)] flex items-center justify-between">
          <span>Chapter Assets</span>
          <span className="font-medium text-[var(--i)]">
            {chapterAttachments.length}{" "}
            {chapterAttachments.length === 1 ? "file" : "files"}
          </span>
        </div>
      </div>

      {/* In-Website Preview Modal for Images, Videos, and PDFs */}
      {previewFile && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] text-[var(--i)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--h)] px-5 py-3.5 bg-[var(--s)]/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="rounded-md bg-[var(--h)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--i)]">
                  {previewFile.type}
                </span>
                <h3 className="text-sm font-semibold truncate max-w-[360px] sm:max-w-[480px]">
                  {previewFile.fileName}
                </h3>
                {previewFile.sizeBytes ? (
                  <span className="text-xs text-[var(--m)]">
                    ({formatSize(previewFile.sizeBytes)})
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--h)] bg-[var(--bg)] px-2.5 text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open in tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewFile)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--h)] bg-[var(--bg)] px-2.5 text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors ml-1"
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[350px]">
              {previewFile.type === "image" && (
                <img
                  src={previewFile.url}
                  alt={previewFile.fileName}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              )}
              {previewFile.type === "video" && (
                <video
                  src={previewFile.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-lg shadow-lg"
                />
              )}
              {previewFile.type === "pdf" && (
                <iframe
                  src={previewFile.url}
                  title={previewFile.fileName}
                  className="w-full h-[75vh] rounded-lg border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
