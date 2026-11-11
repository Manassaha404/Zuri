"use client";

// Searchable icon library modal supporting 7,000+ Simple Icons and Lucide React icons
import React, { useState, useMemo } from "react";
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import { ICON_CATALOG, IconItem } from "./icons";
import { X, Search, Sparkles } from "lucide-react";

interface IconsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "All",
  "Tech & Brands",
  "UI & System",
  "Servers & Data",
  "Cloud & Network",
  "Development",
  "Security",
  "Business",
  "Devices",
  "People",
  "Arrows & UI",
];

const PAGE_SIZE = 120;

export function IconsModal({ isOpen, onClose }: IconsModalProps) {
  const { setSelectedIconId, setActiveTool } = useDiagramStudioStore();
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ICON_CATALOG.filter((item) => {
      // Category filter
      let matchesCat = true;
      if (selectedCat === "Tech & Brands") {
        matchesCat = item.source === "simple-icons";
      } else if (selectedCat === "UI & System") {
        matchesCat = item.source === "lucide";
      } else if (selectedCat !== "All") {
        matchesCat = item.category === selectedCat;
      }

      if (!matchesCat) return false;

      // Query filter
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.slug && item.slug.toLowerCase().includes(q))
      );
    });
  }, [query, selectedCat]);

  if (!isOpen) return null;

  const visibleItems = filtered.slice(0, visibleCount);

  const handleSelectIcon = (item: IconItem) => {
    // Select icon to allow drawing and dragging to size on canvas
    setSelectedIconId(item.id);
    setActiveTool("icon");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 select-none">
      <div className="w-full max-w-3xl rounded-3xl border border-[var(--h)] bg-[var(--bg)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--h)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--p)]" />
            <div>
              <h2 className="text-base font-bold text-[var(--i)]">
                Icon Library
              </h2>
              <p className="text-[11px] text-[var(--m)]">
                Over 7,000 brand, tech, and UI icons from Simple Icons &amp;
                Lucide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-[var(--h)] p-4 bg-[var(--s)]/30">
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3.5 py-2.5 text-xs focus-within:border-[var(--i)] transition-all">
            <Search className="h-4 w-4 text-[var(--m)] shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search 7,000+ icons (e.g. React, Docker, AWS, Database, User, Server)..."
              className="w-full bg-transparent outline-none text-[var(--i)] placeholder:text-[var(--m)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setVisibleCount(PAGE_SIZE);
                }}
                className="text-[10px] text-[var(--m)] hover:text-[var(--i)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 border-b border-[var(--h)] px-6 py-2.5 bg-[var(--s)]/50 text-xs overflow-x-auto styled-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCat(cat);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-full px-3 py-1 font-semibold whitespace-nowrap transition-colors text-[11px] ${
                selectedCat === cat
                  ? "bg-[var(--p)] text-[var(--pt)]"
                  : "text-[var(--m)] hover:text-[var(--i)] bg-[var(--s)] border border-[var(--h)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto styled-scrollbar p-5 space-y-4">
          {visibleItems.length === 0 ? (
            <div className="py-16 text-center text-[var(--m)] text-xs">
              No icons found matching &quot;{query}&quot;.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                {visibleItems.map((item) => {
                  const IconComp = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectIcon(item)}
                      title={`${item.name} (${item.source === "simple-icons" ? "Brand" : "Lucide"})`}
                      className="group flex flex-col items-center justify-center rounded-xl border border-[var(--h)] bg-[var(--surface-card)] p-2.5 hover:border-[var(--i)] hover:bg-[var(--s)] transition-all shadow-2xs gap-1.5 text-center"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--i)] group-hover:scale-115 transition-transform">
                        {item.source === "simple-icons" && item.path ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 fill-current"
                          >
                            <path d={item.path} />
                          </svg>
                        ) : IconComp ? (
                          <IconComp size={20} />
                        ) : null}
                      </div>
                      <span className="text-[10px] font-medium text-[var(--m)] group-hover:text-[var(--i)] truncate max-w-full leading-tight">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Load More Button */}
              {visibleCount < filtered.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="rounded-xl border border-[var(--h)] bg-[var(--s)] px-4 py-2 text-xs font-semibold text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors shadow-2xs"
                  >
                    Load More Icons ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
