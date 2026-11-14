"use client";

// Bookmark block: web link with title, description, favicon, metadata fetching, and in-place editing
import { useState, useEffect, useRef } from "react";
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import { trpc } from "@/trpc/client";
import {
  ExternalLink,
  Globe,
  Pencil,
  Loader2,
  Bookmark as BookmarkIcon,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BookmarkBlockProps {
  block: Block;
}

export function BookmarkBlock({ block }: BookmarkBlockProps) {
  const { updateBlockContent } = useNotesStore();
  const content = block.content;

  const isBookmark = content.type === "bookmark";
  const url = isBookmark ? content.url : "";
  const title = isBookmark ? content.title : "";
  const description = isBookmark ? content.description : "";
  const favicon = isBookmark ? content.favicon : "";

  const [isEditing, setIsEditing] = useState(!url);
  const [urlInput, setUrlInput] = useState(url || "");
  const [titleInput, setTitleInput] = useState(title || "");
  const [descInput, setDescInput] = useState(description || "");
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(title || description),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const previewMutation = trpc.notes.getLinkPreview.useMutation();

  // Keep inputs in sync if content changes externally
  useEffect(() => {
    setUrlInput(url || "");
    setTitleInput(title || "");
    setDescInput(description || "");
    setFaviconError(false);
    if (!url) {
      setIsEditing(true);
    }
  }, [url, title, description]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing]);

  if (!isBookmark) return null;

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const formattedUrl = normalizeUrl(urlInput);
    if (!formattedUrl) {
      setErrorMsg("Please enter a valid URL");
      return;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setErrorMsg("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    try {
      const preview = await previewMutation.mutateAsync({ url: formattedUrl });
      const finalTitle = titleInput.trim() || preview?.title || formattedUrl;
      const finalDesc = descInput.trim() || preview?.description || "";
      const finalFavicon =
        preview?.favicon ||
        `https://www.google.com/s2/favicons?domain=${new URL(formattedUrl).hostname}&sz=128`;

      updateBlockContent(block.blockId, {
        type: "bookmark",
        url: formattedUrl,
        title: finalTitle,
        description: finalDesc,
        favicon: finalFavicon,
      });
      setIsEditing(false);
    } catch {
      // Graceful client fallback
      try {
        const host = new URL(formattedUrl).hostname;
        updateBlockContent(block.blockId, {
          type: "bookmark",
          url: formattedUrl,
          title: titleInput.trim() || host,
          description: descInput.trim() || "",
          favicon: `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
        });
        setIsEditing(false);
      } catch {
        setErrorMsg("Failed to parse URL");
      }
    }
  };

  const handleCancel = () => {
    if (!url) {
      setErrorMsg("Bookmark requires a URL");
      return;
    }
    setUrlInput(url);
    setTitleInput(title || "");
    setDescInput(description || "");
    setErrorMsg(null);
    setIsEditing(false);
  };

  // Editing form view
  if (isEditing) {
    return (
      <div className="my-3 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-lg select-none animate-in fade-in-0 duration-150">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--h)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--i)] uppercase tracking-wider">
              <BookmarkIcon className="h-4 w-4 text-[var(--accent)]" />
              <span>{url ? "Edit Bookmark" : "Add Web Bookmark"}</span>
            </div>
            {url && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
                title="Cancel editing"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3 py-2 focus-within:border-[var(--accent)] transition-colors">
              <Globe className="h-4 w-4 text-[var(--m)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Paste web link or URL (e.g., https://github.com)..."
                className="w-full bg-transparent text-sm text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none"
              />
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Optional Title & Description toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--m)] hover:text-[var(--i)] transition-colors"
            >
              {showAdvanced ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <span>Custom Title & Description (Optional)</span>
            </button>

            {showAdvanced && (
              <div className="mt-2.5 space-y-2.5 pl-2 border-l-2 border-[var(--h)]">
                <div>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="Custom title (auto-detected if blank)..."
                    className="w-full rounded-lg border border-[var(--h)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <textarea
                    rows={2}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Custom description (auto-detected if blank)..."
                    className="w-full rounded-lg border border-[var(--h)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {url && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-xl border border-[var(--h)] text-xs font-medium text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={previewMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--accent)] text-xs font-semibold text-white hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
            >
              {previewMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Fetching info...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{url ? "Update Bookmark" : "Create Bookmark"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Display card view
  return (
    <div className="my-3 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] hover:border-[var(--m)]/40 transition-all shadow-xs group relative overflow-hidden">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              {favicon && !faviconError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={favicon}
                  alt=""
                  className="h-5 w-5 rounded-sm shrink-0 object-contain"
                  onError={() => setFaviconError(true)}
                />
              ) : (
                <Globe className="h-5 w-5 text-[var(--m)] shrink-0" />
              )}
              <h4 className="text-sm sm:text-base font-bold text-[var(--i)] truncate group-hover:text-[var(--accent)] transition-colors">
                {title || url}
              </h4>
            </div>

            {description && (
              <p className="text-xs sm:text-sm text-[var(--m)] line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}

            <div className="pt-1 text-xs font-mono text-[var(--m)] truncate">
              {url}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs font-semibold text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)]/50 shadow-xs transition-all cursor-pointer"
              title="Edit bookmark"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>

            <ExternalLink className="h-5 w-5 text-[var(--m)] opacity-60 group-hover:opacity-100 shrink-0 transition-opacity mt-0.5" />
          </div>
        </div>
      </a>
    </div>
  );
}
