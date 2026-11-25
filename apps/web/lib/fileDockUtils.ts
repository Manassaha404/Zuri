// Utility helpers for File Dock classification, previewing, and formatting
import type {
  FileCategoryFilter,
  FileDockFileItem,
} from "@/components/file-dock/types";

// Determine whether file supports in-app modal preview
export function getFilePreviewType(
  mimeType?: string | null,
  format?: string | null,
  name?: string | null,
): "image" | "video" | "pdf" | null {
  const mime = (mimeType || "").toLowerCase();
  const fmt = (format || "").toLowerCase();
  const lowerName = (name || "").toLowerCase();

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "avif"].includes(fmt) ||
    /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(lowerName)
  ) {
    return "image";
  }

  if (
    mime.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov"].includes(fmt) ||
    /\.(mp4|webm|ogg|mov)$/i.test(lowerName)
  ) {
    return "video";
  }

  if (
    mime === "application/pdf" ||
    fmt === "pdf" ||
    lowerName.endsWith(".pdf")
  ) {
    return "pdf";
  }

  return null;
}

// Categorize file for filter pills
export function getFileCategory(
  file: FileDockFileItem,
): Exclude<FileCategoryFilter, "all"> {
  const mime = (file.mimeType || "").toLowerCase();
  const fmt = (file.format || "").toLowerCase();
  const name = file.name.toLowerCase();

  if (file.resourceType === "image" || mime.startsWith("image/")) {
    return "image";
  }
  if (file.resourceType === "video" || mime.startsWith("video/")) {
    return "video";
  }
  if (
    mime === "application/pdf" ||
    mime.includes("document") ||
    mime.includes("word") ||
    mime.includes("sheet") ||
    mime.includes("excel") ||
    mime.includes("presentation") ||
    mime.startsWith("text/") ||
    [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "csv",
      "ppt",
      "pptx",
      "txt",
      "md",
      "json",
    ].includes(fmt) ||
    /\.(pdf|docx?|xlsx?|csv|pptx?|txt|md|json)$/i.test(name)
  ) {
    return "document";
  }
  return "other";
}

// Format file byte count to human readable label
export function formatDockBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${idx === 0 ? value : value.toFixed(1)} ${units[idx]}`;
}

// Format date string for display
export function formatDockDate(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Trigger browser file download
export async function downloadDockFile(url: string, fileName: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
