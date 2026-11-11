"use client";

// Lucide icon picker with curated icon registry and search filtering
import React, { useState, useMemo } from "react";
import {
  Folder,
  BookOpen,
  Layers,
  Database,
  Sparkles,
  Terminal,
  Code,
  Cpu,
  Compass,
  Box,
  Archive,
  Heart,
  Shield,
  Flame,
  CheckSquare,
  Zap,
  Globe,
  Bookmark,
  FileCode,
  Coffee,
  Star,
  Rocket,
  Hash,
  Radio,
  Palette,
  Clock,
  Activity,
  Award,
  Briefcase,
  BookmarkCheck,
  Cloud,
  Feather,
  Flag,
  Key,
  MapPin,
  Music,
  Package,
  PenTool,
  Scissors,
  Server,
  Smartphone,
  Tag,
  Wrench,
  Umbrella,
  Watch,
  Wifi,
  Wind,
  Brain,
  Lightbulb,
  Search,
  X,
  LucideIcon,
} from "lucide-react";

// Curated icon registry mapping
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Folder,
  BookOpen,
  Layers,
  Database,
  Sparkles,
  Terminal,
  Code,
  Cpu,
  Compass,
  Box,
  Archive,
  Heart,
  Shield,
  Flame,
  CheckSquare,
  Zap,
  Globe,
  Bookmark,
  FileCode,
  Coffee,
  Star,
  Rocket,
  Hash,
  Radio,
  Palette,
  Clock,
  Activity,
  Award,
  Briefcase,
  BookmarkCheck,
  Cloud,
  Feather,
  Flag,
  Key,
  MapPin,
  Music,
  Package,
  PenTool,
  Scissors,
  Server,
  Smartphone,
  Tag,
  Tool: Wrench,
  Wrench,
  Umbrella,
  Watch,
  Wifi,
  Wind,
  Brain,
  Lightbulb,
};

// Curated icon names list for picker display
export const CURATED_ICON_NAMES: string[] = [
  "Folder",
  "BookOpen",
  "Layers",
  "Database",
  "Sparkles",
  "Terminal",
  "Code",
  "Cpu",
  "Compass",
  "Box",
  "Archive",
  "Heart",
  "Shield",
  "Flame",
  "CheckSquare",
  "Zap",
  "Globe",
  "Bookmark",
  "FileCode",
  "Coffee",
  "Star",
  "Rocket",
  "Hash",
  "Radio",
  "Palette",
  "Clock",
  "Activity",
  "Award",
  "Briefcase",
  "BookmarkCheck",
  "Cloud",
  "Feather",
  "Flag",
  "Key",
  "MapPin",
  "Music",
  "Package",
  "PenTool",
  "Scissors",
  "Server",
  "Smartphone",
  "Tag",
  "Wrench",
  "Umbrella",
  "Watch",
  "Wifi",
  "Wind",
  "Brain",
];

// Helper to resolve an icon component by name with fallback
export function getLucideIcon(
  name?: string,
  fallback: LucideIcon = Folder,
): LucideIcon {
  if (!name) return fallback;
  return ICON_REGISTRY[name] || fallback;
}

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
  color?: string;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  color,
  className = "",
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIcons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return CURATED_ICON_NAMES;
    return CURATED_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-[var(--m)] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter icons..."
          className="w-full rounded-lg border border-[var(--h)] bg-[var(--s)] pl-8 pr-7 py-1.5 text-xs text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none focus:border-[var(--i)] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 text-[var(--m)] hover:text-[var(--i)] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Icons Grid Container */}
      <div className="max-h-40 overflow-y-auto notes-scrollbar rounded-lg border border-[var(--h)] bg-[var(--s)]/30 p-2">
        {filteredIcons.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--m)]">
            No matching icons found
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
            {filteredIcons.map((name) => {
              const IconComp = ICON_REGISTRY[name] || Folder;
              const isSelected = value.toLowerCase() === name.toLowerCase();

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange(name)}
                  title={name}
                  className={`group relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                    isSelected
                      ? "border-[var(--i)] bg-[var(--surface-strong)] text-[var(--i)] shadow-xs scale-105"
                      : "border-transparent text-[var(--m)] hover:border-[var(--h)] hover:bg-[var(--s)] hover:text-[var(--i)]"
                  }`}
                >
                  <IconComp
                    className="h-4 w-4 transition-transform group-hover:scale-110"
                    style={{ color: isSelected && color ? color : undefined }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Icon Status Preview */}
      <div className="flex items-center justify-between text-[11px] text-[var(--m)] px-1">
        <span className="flex items-center gap-1.5">
          <span>Selected:</span>
          <span className="font-medium text-[var(--i)]">{value || "None"}</span>
        </span>
        <span>{filteredIcons.length} available</span>
      </div>
    </div>
  );
}
