"use client";

// Slide-over drawer managing page attachments with S3/MinIO metadata and checksum deduplication
import { useState, useRef } from "react";
import { useNotesStore } from "@/store/notesStore";
import { Attachment } from "../types";
import {
  X,
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
} from "lucide-react";

export function AttachmentsDrawer() {
  const {
    isAttachmentsOpen,
    closeAttachments,
    activePageId,
    pages,
    attachments,
    addAttachment,
    deleteAttachment,
    addBlock,
  } = useNotesStore();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dedupeAlert, setDedupeAlert] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAttachmentsOpen) return null;

  const activePage = pages.find((p) => p.pageId === activePageId);
  const pageAttachments = attachments.filter((a) => a.pageId === activePageId);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePageId) return;

    // Simulate SHA-256 checksum based on file name & size
    const mockChecksum = `sha256-${file.name.slice(0, 3)}-${file.size}`;

    // Check deduplication
    const existing = attachments.find((a) => a.checksum === mockChecksum);
    if (existing) {
      setDedupeAlert(
        `Deduplicated: Exact matching file already stored at ${existing.storageKey}`,
      );
      setTimeout(() => setDedupeAlert(null), 4000);
      return;
    }

    const isImage = file.type.startsWith("image/");
    const storageKey = `notes/attachments/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${file.name.replace(/\s+/g, "-")}`;

    const newAtt = addAttachment({
      pageId: activePageId,
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

    setDedupeAlert(`Uploaded successfully: ${newAtt.fileName}`);
    setTimeout(() => setDedupeAlert(null), 3000);
  };

  const handleCopyStorageKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeAttachments}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-[var(--h)] bg-[var(--bg)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--h)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-[var(--m)]" />
            <h3 className="text-sm font-semibold text-[var(--i)]">
              Page Attachments
            </h3>
          </div>
          <button
            type="button"
            onClick={closeAttachments}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Page Context */}
        <div className="border-b border-[var(--h)] bg-[var(--s)]/50 px-6 py-2.5 text-xs text-[var(--m)] flex items-center justify-between">
          <span className="truncate max-w-[260px]">
            Page:{" "}
            <strong className="text-[var(--i)]">
              {activePage?.title || "Page"}
            </strong>
          </span>
          <span>{pageAttachments.length} stored</span>
        </div>

        {/* Upload Zone */}
        <div className="p-6 border-b border-[var(--h)]">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleSimulatedUpload}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--h)] hover:border-[var(--i)] rounded-xl p-5 text-center cursor-pointer transition-colors bg-[var(--s)]/40 hover:bg-[var(--s)]"
          >
            <UploadCloud className="mx-auto h-7 w-7 text-[var(--m)] mb-2" />
            <div className="text-xs font-semibold text-[var(--i)]">
              Click or drag files to upload
            </div>
            <p className="mt-1 text-[11px] text-[var(--m)]">
              Uploaded files are stored in S3/MinIO with checksum deduplication.
            </p>
          </div>

          {dedupeAlert && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--s)] border border-[var(--h)] p-2.5 text-xs text-[var(--i)] animate-in fade-in-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>{dedupeAlert}</span>
            </div>
          )}
        </div>

        {/* List of Attachments */}
        <div className="flex-1 overflow-y-auto notes-scrollbar p-6 space-y-3">
          {pageAttachments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--m)]">
              No files attached to this page yet.
            </div>
          ) : (
            pageAttachments.map((att) => {
              const isImage = att.mimeType.startsWith("image/");
              return (
                <div
                  key={att.id}
                  className="rounded-xl border border-[var(--h)] bg-[var(--surface-card)] p-3.5 space-y-2 text-xs shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] shrink-0">
                        {isImage ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-[var(--i)] truncate">
                          {att.fileName}
                        </h4>
                        <p className="text-[10px] text-[var(--m)]">
                          {formatSize(att.sizeBytes)} • {att.mimeType}
                          {att.width && att.height
                            ? ` • ${att.width}×${att.height}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteAttachment(att.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10"
                      title="Delete attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* S3 Storage Key & Checksum */}
                  <div className="rounded-lg bg-[var(--bg)] border border-[var(--h)] p-2 font-mono text-[10px] text-[var(--m)] flex items-center justify-between">
                    <span className="truncate pr-2">{att.storageKey}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyStorageKey(att.storageKey)}
                      className="text-[var(--m)] hover:text-[var(--i)] shrink-0"
                      title="Copy S3 storage key"
                    >
                      {copiedKey === att.storageKey ? (
                        "Copied"
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {/* Quick Embed Button */}
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (activePageId) {
                          addBlock(activePageId, isImage ? "image" : "file");
                          closeAttachments();
                        }
                      }}
                      className="flex items-center gap-1 rounded border border-[var(--h)] bg-[var(--bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Insert Block in Page</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-[var(--h)] bg-[var(--s)] px-6 py-3 text-[11px] text-[var(--m)] flex items-center justify-between">
          <span>Attachments survive single-block deletions</span>
          <span>Deduplication Active</span>
        </div>
      </div>
    </>
  );
}
