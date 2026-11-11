"use client";

// Bookmark block: URL with title, description, and favicon
import { Block } from "../../types";
import { ExternalLink, Globe } from "lucide-react";

interface BookmarkBlockProps {
  block: Block;
}

export function BookmarkBlock({ block }: BookmarkBlockProps) {
  const content = block.content;
  if (content.type !== "bookmark") return null;

  return (
    <a
      href={content.url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-4 block rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] p-4 sm:p-5 hover:border-[var(--m)]/40 transition-all shadow-xs group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2.5">
            {content.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.favicon}
                alt=""
                className="h-5 w-5 rounded-sm shrink-0 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="h-5 w-5 text-[var(--m)] shrink-0" />
            )}
            <h4 className="text-sm sm:text-base font-bold text-[var(--i)] truncate group-hover:text-[var(--accent)] transition-colors">
              {content.title || content.url}
            </h4>
          </div>

          {content.description && (
            <p className="text-xs sm:text-sm text-[var(--m)] line-clamp-2 leading-relaxed">
              {content.description}
            </p>
          )}

          <div className="pt-1 text-xs font-mono text-[var(--m)] truncate">
            {content.url}
          </div>
        </div>

        <ExternalLink className="h-5 w-5 text-[var(--m)] opacity-60 group-hover:opacity-100 shrink-0 transition-opacity mt-0.5" />
      </div>
    </a>
  );
}
