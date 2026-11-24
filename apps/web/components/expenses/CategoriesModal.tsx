// Dedicated Modal for Adding and Managing Categories
"use client";

import { useState } from "react";
import { X, Plus, Trash2, Tag, Check } from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import type { TransactionType } from "./types";
import { CategoryIcon } from "./CategoryIcon";

const AVAILABLE_ICONS = [
  "Utensils",
  "Home",
  "ShoppingCart",
  "Car",
  "Zap",
  "Film",
  "HeartPulse",
  "ShoppingBag",
  "Briefcase",
  "Laptop",
  "TrendingUp",
  "CreditCard",
  "Smartphone",
  "Wallet",
  "Users",
  "Compass",
  "Tag",
];

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { categories, addCategory, deleteCategory } = useExpenses();

  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<TransactionType>("expense");
  const [categoryIcon, setCategoryIcon] = useState("Tag");
  const [categoryColor, setCategoryColor] = useState("#3b82f6");

  if (!isOpen) return null;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    addCategory({
      name: categoryName.trim(),
      type: categoryType,
      icon: categoryIcon,
      color: categoryColor,
    });

    setCategoryName("");
    setCategoryIcon("Tag");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--h)] bg-[var(--s)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Tag size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
                Categories Management
              </h2>
              <p className="text-xs text-[var(--m)]">
                Create and manage expense and income categories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 styled-scrollbar flex flex-col gap-6">
          {/* Category List */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              All Categories ({categories.length})
            </span>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto styled-scrollbar pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon icon={cat.icon} size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[var(--i)]">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border ${
                            cat.type === "expense"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}
                        >
                          {cat.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="text-[var(--m)] hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Category Form */}
          <form
            onSubmit={handleAddCategory}
            className="flex flex-col gap-3.5 p-4 rounded-xl border border-[var(--h)] bg-[var(--s)]"
          >
            <span className="text-xs font-semibold text-[var(--i)]">
              Add New Category
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--b)] font-medium">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Groceries, Freelance"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--b)] font-medium">
                  Category Type
                </label>
                <select
                  value={categoryType}
                  onChange={(e) =>
                    setCategoryType(e.target.value as TransactionType)
                  }
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            {/* Color Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[var(--b)] font-medium">
                Color Tag
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setCategoryColor(col)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: col }}
                  >
                    {categoryColor === col && (
                      <Check size={12} className="text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selection - icon color uses categoryColor, selected indicator uses neutral border & background so they don't clash */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-[var(--b)] font-medium">
                  Select Icon
                </label>
                <span className="text-[10px] text-[var(--m)]">
                  Selected: {categoryIcon}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 p-2 bg-[var(--bg)] border border-[var(--h)] rounded-lg max-h-36 overflow-y-auto styled-scrollbar">
                {AVAILABLE_ICONS.map((iconName) => {
                  const isSelected = categoryIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setCategoryIcon(iconName)}
                      className={`relative p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[var(--s)] ring-2 ring-emerald-500 shadow-xs"
                          : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
                      }`}
                      title={iconName}
                    >
                      <div
                        style={{
                          color: isSelected ? categoryColor : undefined,
                        }}
                      >
                        <CategoryIcon icon={iconName} size={18} />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check size={9} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="bt p text-xs font-semibold py-1.5 self-end flex items-center gap-1 mt-1"
            >
              <Plus size={13} />
              Add Category
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--h)] bg-[var(--s)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bt p text-xs font-semibold px-4 py-1.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
