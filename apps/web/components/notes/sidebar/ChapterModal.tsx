"use client";

// Modal for creating and editing chapters with icon and color
import { useState, useEffect } from "react";
import { useNotesStore } from "@/store/notesStore";
import { X } from "lucide-react";
import { IconPicker } from "./IconPicker";

const COLOR_OPTIONS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
];

export function ChapterModal() {
  const {
    isChapterModalOpen,
    editingChapter,
    activeNotebookId,
    closeChapterModal,
    createChapter,
    updateChapter,
  } = useNotesStore();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("Folder");
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {
    if (editingChapter) {
      setTitle(editingChapter.title);
      setIcon(editingChapter.icon || "Folder");
      setColor(editingChapter.color || "#3b82f6");
    } else {
      setTitle("");
      setIcon("Folder");
      setColor("#3b82f6");
    }
  }, [editingChapter, isChapterModalOpen]);

  if (!isChapterModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingChapter) {
      updateChapter(editingChapter.chapterId, {
        title: title.trim(),
        icon,
        color,
      });
    } else {
      createChapter({
        notebookId: activeNotebookId,
        title: title.trim(),
        icon,
        color,
      });
    }
    closeChapterModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div className="w-full max-w-md rounded-xl border border-[var(--h)] bg-[var(--bg)] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--h)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--i)]">
            {editingChapter ? "Edit Chapter" : "New Chapter"}
          </h2>
          <button
            type="button"
            onClick={closeChapterModal}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--m)]">
              Chapter Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Storage & Vector Indexing"
              className="w-full rounded-lg border border-[var(--h)] bg-[var(--s)] px-3.5 py-2 text-sm text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none focus:border-[var(--i)] transition-colors"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--m)]">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c.value
                      ? "scale-110 border-[var(--i)]"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--m)]">
              Chapter Icon
            </label>
            <IconPicker value={icon} onChange={setIcon} color={color} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={closeChapterModal}
              className="rounded-lg border border-[var(--h)] px-4 py-2 text-xs font-medium text-[var(--b)] hover:bg-[var(--s)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--p)] px-4 py-2 text-xs font-semibold text-[var(--pt)] hover:opacity-90 active:scale-[0.99] transition-all"
            >
              {editingChapter ? "Save Changes" : "Create Chapter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
