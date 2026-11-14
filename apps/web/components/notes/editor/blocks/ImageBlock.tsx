"use client";

// Full image block supporting Cloudinary upload dropzone, external embed URL, aspect ratio, in-place captions, and replace
import { useState, useRef, useCallback } from "react";
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import { useCloudinaryUpload } from "@/hook/uploads/useCloudinaryUpload";
import {
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";

interface ImageBlockProps {
  block: Block;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { attachments, updateBlockContent } = useNotesStore();
  const {
    upload,
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
    reset: resetUpload,
  } = useCloudinaryUpload();

  const [activeTab, setActiveTab] = useState<"upload" | "embed">("upload");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [captionValue, setCaptionValue] = useState("");
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const content = block.content;
  if (content.type !== "image") return null;

  // Resolve image URL from Cloudinary direct URL or legacy attachment store
  const attachment = content.attachmentId
    ? attachments.find((a) => a.id === content.attachmentId)
    : undefined;
  const imageUrl = content.cloudinaryUrl || attachment?.url;

  // Handle Cloudinary upload
  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        return;
      }
      try {
        const result = await upload(file, "notes_images");
        if (result?.secureUrl) {
          updateBlockContent(block.blockId, {
            type: "image",
            cloudinaryUrl: result.secureUrl,
            cloudinaryPublicId: result.publicId,
            width: result.width,
            height: result.height,
            caption: content.caption || "",
          });
        }
      } catch {
        // Upload failed - handled by uploadError state
      }
    },
    [upload, updateBlockContent, block.blockId, content.caption],
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleEmbedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!embedUrl.trim()) return;

    updateBlockContent(block.blockId, {
      type: "image",
      cloudinaryUrl: embedUrl.trim(),
      caption: content.caption || "",
    });
  };

  const handleCopyLink = () => {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCaptionBlur = () => {
    setIsEditingCaption(false);
    updateBlockContent(block.blockId, {
      ...content,
      caption: captionValue.trim(),
    });
  };

  const isUploading =
    uploadStatus === "uploading" || uploadStatus === "signing";

  // Setup / Empty State: Dropzone & Embed Tabs
  if (!imageUrl) {
    return (
      <div className="my-3 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-2xs">
        {/* Tab Switcher */}
        <div className="flex items-center gap-4 border-b border-[var(--h)] pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 pb-1 transition-colors border-b-2 ${
              activeTab === "upload"
                ? "border-[var(--i)] text-[var(--i)] font-bold"
                : "border-transparent text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Image</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("embed")}
            className={`flex items-center gap-1.5 pb-1 transition-colors border-b-2 ${
              activeTab === "embed"
                ? "border-[var(--i)] text-[var(--i)] font-bold"
                : "border-transparent text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Embed Link</span>
          </button>
        </div>

        {/* Tab 1: Cloudinary Upload Dropzone */}
        {activeTab === "upload" && (
          <div className="pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileInputChange}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--accent)]/50 bg-[var(--accent)]/5 p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)] mb-2.5" />
                <h4 className="text-sm font-semibold text-[var(--i)]">
                  {uploadStatus === "signing"
                    ? "Preparing upload..."
                    : "Uploading to Cloudinary..."}
                </h4>
                <div className="mt-3 w-48 h-1.5 bg-[var(--h)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="mt-1.5 font-mono text-[11px] text-[var(--m)]">
                  {uploadProgress}%
                </span>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--h)] hover:border-[var(--m)]/60 bg-[var(--bg)]/50 hover:bg-[var(--bg)]"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--h)] bg-[var(--s)] text-[var(--m)] group-hover:text-[var(--i)] group-hover:scale-105 transition-all mb-3 shadow-2xs">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[var(--i)]">
                  Click to upload or drag and drop
                </div>
                <p className="mt-1 text-[11px] text-[var(--m)]">
                  SVG, PNG, JPG, WebP, GIF (max 20MB)
                </p>

                {uploadError && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Embed via URL */}
        {activeTab === "embed" && (
          <form onSubmit={handleEmbedSubmit} className="pt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                className="flex-1 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3.5 py-2 text-xs sm:text-sm text-[var(--i)] placeholder:text-[var(--m)]/50 focus:outline-hidden focus:border-[var(--i)] transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={!embedUrl.trim()}
                className="rounded-xl bg-[var(--p)] px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--pt)] hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
              >
                Embed Image
              </button>
            </div>
            <p className="text-[11px] text-[var(--m)]">
              Works with direct links from any CDN or image hosting service.
            </p>
          </form>
        )}
      </div>
    );
  }

  // Display State: Rendered Image with Action Overlays and In-place Caption
  const aspectRatio =
    content.width && content.height
      ? `${content.width} / ${content.height}`
      : undefined;

  return (
    <figure className="group/img my-4 space-y-2">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
      />

      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] shadow-xs transition-all hover:border-[var(--m)]/40"
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={content.caption || "Image"}
          width={content.width || 1200}
          height={content.height || 640}
          className="h-auto max-h-[700px] w-full object-contain mx-auto"
          loading="lazy"
        />

        {/* Floating Actions Overlay */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 z-10">
          {/* Replace Button */}
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="flex items-center gap-1 rounded-lg border border-white/20 bg-black/75 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-md hover:bg-black transition-colors shadow-xs"
            title="Replace image"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Replace</span>
          </button>

          {/* Copy URL */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-black/75 text-white backdrop-blur-md hover:bg-black transition-colors shadow-xs"
            title="Copy image link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Open in New Tab */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-black/75 text-white backdrop-blur-md hover:bg-black transition-colors shadow-xs"
            title="Open original"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Dimension badge if available */}
        {content.width && content.height && (
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity">
            {content.width} × {content.height}
          </div>
        )}
      </div>

      {/* In-place Editable Caption */}
      <div className="px-2">
        {isEditingCaption ? (
          <input
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            onBlur={handleCaptionBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder="Write a caption..."
            className="w-full text-center text-xs text-[var(--b)] italic bg-transparent border-b border-[var(--h)] pb-1 focus:outline-hidden focus:border-[var(--i)] transition-colors"
            autoFocus
          />
        ) : (
          <figcaption
            onClick={() => {
              setCaptionValue(content.caption || "");
              setIsEditingCaption(true);
            }}
            className="cursor-pointer text-center text-xs text-[var(--m)] hover:text-[var(--i)] italic transition-colors py-0.5"
          >
            {content.caption || "Add a caption..."}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
