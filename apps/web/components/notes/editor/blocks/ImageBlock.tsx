"use client";

// Image block referencing an attachment with width & height to avoid layout shift
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import { Image as ImageIcon, Eye, ExternalLink } from "lucide-react";

interface ImageBlockProps {
  block: Block;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { attachments } = useNotesStore();

  const content = block.content;
  if (content.type !== "image") return null;

  const attachment = attachments.find((a) => a.id === content.attachmentId);

  if (!attachment) {
    return (
      <div className="my-3 rounded-xl border border-dashed border-[var(--h)] p-6 text-center text-xs text-[var(--m)]">
        <ImageIcon className="mx-auto h-6 w-6 text-[var(--m)] mb-1.5" />
        <p>Attachment deleted or missing</p>
      </div>
    );
  }

  // Aspect ratio styling to avoid layout shift
  const aspectRatio =
    attachment.width && attachment.height
      ? `${attachment.width} / ${attachment.height}`
      : "16 / 9";

  return (
    <figure className="my-4 space-y-1.5">
      <div
        className="relative overflow-hidden rounded-xl border border-[var(--h)] bg-[var(--surface-card)]"
        style={{ aspectRatio }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            attachment.url ||
            "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200"
          }
          alt={content.caption || attachment.fileName}
          width={attachment.width || 1200}
          height={attachment.height || 640}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
          loading="lazy"
        />
        {/* Attachment metadata badge */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-mono text-white backdrop-blur-xs flex items-center gap-1.5">
          <span>
            {attachment.width}×{attachment.height}
          </span>
          <span>•</span>
          <span>{(attachment.sizeBytes / 1024).toFixed(0)} KB</span>
        </div>
      </div>

      {content.caption && (
        <figcaption className="text-center text-xs text-[var(--m)] italic">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}
