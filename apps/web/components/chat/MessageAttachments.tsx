"use client";

import {
  ExternalLink,
  File as FileIcon,
  FileCode,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import type { ChatAttachment } from "./types";
import {
  formatFileSize,
  getFileCategory,
  getFileNameFromUrl,
} from "@/lib/utils";

interface MessageAttachmentsProps {
  attachments?: ChatAttachment[];
  fileUrls?: string[];
}

// Category theme styling helper
function getCategoryTheme(
  category: ReturnType<typeof getFileCategory>["category"],
) {
  switch (category) {
    case "pdf":
      return {
        icon: FileText,
        badgeBg:
          "bg-red-500/15 text-red-400 dark:bg-red-500/15 dark:text-red-600",
      };
    case "sheet":
      return {
        icon: FileSpreadsheet,
        badgeBg:
          "bg-emerald-500/15 text-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-600",
      };
    case "code":
      return {
        icon: FileCode,
        badgeBg:
          "bg-purple-500/15 text-purple-400 dark:bg-purple-500/15 dark:text-purple-600",
      };
    case "doc":
      return {
        icon: FileText,
        badgeBg:
          "bg-blue-500/15 text-blue-400 dark:bg-blue-500/15 dark:text-blue-600",
      };
    default:
      return {
        icon: FileIcon,
        badgeBg: "bg-white/20 text-white dark:bg-black/10 dark:text-[#111111]",
      };
  }
}

// Component to render rich user attachment preview cards in chat bubbles
export function MessageAttachments({
  attachments,
  fileUrls,
}: MessageAttachmentsProps) {
  // Normalize attachments
  const normalized: ChatAttachment[] =
    attachments && attachments.length > 0
      ? attachments
      : (fileUrls || []).map((url) => ({
          url,
          name: getFileNameFromUrl(url),
        }));

  if (normalized.length === 0) return null;

  // Separate images from document/code files
  const images = normalized.filter(
    (item) => getFileCategory(item.name || item.url).category === "image",
  );
  const documents = normalized.filter(
    (item) => getFileCategory(item.name || item.url).category !== "image",
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Image attachments */}
      {images.length > 0 && (
        <div
          className={
            images.length === 1
              ? "w-full"
              : "grid grid-cols-2 gap-2 w-full max-w-md"
          }
        >
          {images.map((img, idx) => (
            <a
              key={idx}
              href={img.url}
              target="_blank"
              rel="noreferrer"
              title={img.name || "View image"}
              className="group relative block overflow-hidden rounded-xl border border-white/20 dark:border-black/10 bg-black/20 dark:bg-black/5 transition-all hover:opacity-95"
            >
              <img
                src={img.url}
                alt={img.name || "Attachment"}
                loading="lazy"
                className="w-full max-h-60 object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                <div className="flex justify-end">
                  <span className="p-1 rounded-md bg-black/60 backdrop-blur-xs text-white">
                    <ExternalLink size={13} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium max-w-[180px] text-white">
                    {img.name || "Image"}
                  </span>
                  {img.size && (
                    <span className="text-[10px] opacity-80 font-mono text-white">
                      {formatFileSize(img.size)}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Document / File attachments */}
      {documents.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full">
          {documents.map((doc, idx) => {
            const { category, ext } = getFileCategory(doc.name || doc.url);
            const theme = getCategoryTheme(category);
            const Icon = theme.icon;
            const formattedSize = formatFileSize(doc.size);

            return (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                title={`Open ${doc.name || "attachment"}`}
                className="group flex items-center gap-3 p-2.5 rounded-xl border border-white/15 dark:border-black/10 bg-white/10 dark:bg-black/5 hover:bg-white/15 dark:hover:bg-black/10 transition-all w-full max-w-sm text-[var(--pt)] dark:text-[#111111]"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${theme.badgeBg}`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate group-hover:underline text-[var(--pt)] dark:text-[#111111]">
                    {doc.name || "Document"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] mt-0.5 font-medium text-[var(--pt)]/75 dark:text-black/75">
                    <span className="px-1.5 py-0.5 rounded font-mono font-semibold tracking-wider text-[9px] uppercase bg-white/15 dark:bg-black/8 text-[var(--pt)] dark:text-[#111111]">
                      {ext}
                    </span>
                    {formattedSize && (
                      <>
                        <span>•</span>
                        <span>{formattedSize}</span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink
                  size={14}
                  className="opacity-50 group-hover:opacity-100 transition-opacity ml-1 shrink-0 text-[var(--pt)] dark:text-[#111111]"
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
