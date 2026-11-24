// Modal for viewing and creating custom deadline categories
"use client";

import { useState } from "react";
import { X, Tag, Plus, Trash2, Check } from "lucide-react";
import { useDeadlines } from "@/hook/deadlines";
import type { DeadlineCategoryItem } from "./types";

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo
];

export function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { categories, addCategory, deleteCategory } = useDeadlines();

  const [newCatName, setNewCatName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addCategory({
        name: newCatName.trim(),
        color: selectedColor,
      });
      setNewCatName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--h)]">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--i)]">
              Deadline Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form to Add New Category */}
        <form
          onSubmit={handleAdd}
          className="p-6 flex flex-col gap-4 border-b border-[var(--h)] bg-[var(--bg)]"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--i)]">
              New Category Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Lab, Scholarship, Workshop..."
                className="flex-1 px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-[var(--i)] text-xs focus:outline-hidden focus:border-[var(--p)]"
              />
              <button
                type="submit"
                disabled={!newCatName.trim() || isSubmitting}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--p)] text-[var(--pt)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Color Palette Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[var(--m)]">
              Category Color Accent
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && (
                      <Check size={12} className="text-white drop-shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Categories List */}
        <div className="p-6 flex flex-col gap-3 max-h-72 overflow-y-auto styled-scrollbar">
          <h3 className="text-xs font-semibold text-[var(--m)] uppercase tracking-wider">
            Available Categories ({categories.length})
          </h3>

          <div className="divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl overflow-hidden bg-[var(--bg)]">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-[var(--i)]">
                    {cat.name}
                  </span>
                  {cat.isSystem && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)] font-medium">
                      Default
                    </span>
                  )}
                </div>

                {!cat.isSystem && (
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    className="text-[var(--m)] hover:text-red-500 p-1 rounded-md transition-colors"
                    title="Delete custom category"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-[var(--h)] bg-[var(--s)]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--p)] text-[var(--pt)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
