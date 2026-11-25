"use client";

// Toolbar for File Dock workspace: breadcrumbs, search, category pills, sort select, view toggle, and upload trigger
import {
  Search,
  LayoutGrid,
  List,
  UploadCloud,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import type {
  FileCategoryFilter,
  FileDockFolderItem,
  FileSortBy,
  FileViewMode,
} from "./types";

interface FileDockToolbarProps {
  dockName: string;
  breadcrumbs: FileDockFolderItem[];
  onSelectFolder: (folderId: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: FileCategoryFilter;
  onFilterChange: (f: FileCategoryFilter) => void;
  sortBy: FileSortBy;
  onSortChange: (s: FileSortBy) => void;
  viewMode: FileViewMode;
  onViewModeChange: (m: FileViewMode) => void;
  onNewFolder: () => void;
  onUploadClick: () => void;
  isUploading: boolean;
}

const FILTER_OPTIONS: { id: FileCategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "document", label: "Docs" },
  { id: "other", label: "Other" },
];

export function FileDockToolbar({
  dockName,
  breadcrumbs,
  onSelectFolder,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onNewFolder,
  onUploadClick,
  isUploading,
}: FileDockToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumbs & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Folder breadcrumbs"
          className="flex items-center flex-wrap gap-1 text-xs min-w-0"
        >
          <button
            type="button"
            onClick={() => onSelectFolder(null)}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              breadcrumbs.length === 0
                ? "text-[var(--i)] bg-[var(--s)]"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
            }`}
          >
            {dockName || "File Dock"}
          </button>

          {breadcrumbs.map((folder, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span
                key={folder.folderId}
                className="flex items-center gap-1 min-w-0"
              >
                <ChevronRight size={13} className="text-[var(--m)] shrink-0" />
                <button
                  type="button"
                  onClick={() => onSelectFolder(folder.folderId)}
                  className={`px-2 py-1 rounded-md truncate max-w-[160px] transition-colors ${
                    isLast
                      ? "text-[var(--i)] font-semibold bg-[var(--s)]"
                      : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
                  }`}
                >
                  {folder.name}
                </button>
              </span>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onNewFolder}
            className="bt !w-auto !h-9 px-3 text-xs font-medium flex items-center gap-1.5"
          >
            <FolderPlus size={14} />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <button
            type="button"
            onClick={onUploadClick}
            disabled={isUploading}
            className="bt p !w-auto !h-9 px-3.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
          >
            <UploadCloud size={14} />
            <span>{isUploading ? "Uploading..." : "Upload Files"}</span>
          </button>
        </div>
      </div>

      {/* Search, Category Filter Pills, Sort & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search saved files..."
              className="w-full h-9 pl-8 pr-8 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] hover:text-[var(--i)]"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="nav-pill-group flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {FILTER_OPTIONS.map((opt) => {
              const active = filterType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  className={`nav-pill-item transition-colors ${
                    active
                      ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                      : "text-[var(--m)] hover:text-[var(--i)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {/* Custom styled select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as FileSortBy)}
              aria-label="Sort files"
              className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs font-medium text-[var(--i)] hover:border-[var(--m)] hover:bg-[var(--s)] focus:outline-none focus:border-[var(--p)] cursor-pointer transition-colors"
            >
              <option
                value="newest"
                className="bg-[var(--surface-card)] text-[var(--i)]"
              >
                Newest first
              </option>
              <option
                value="name"
                className="bg-[var(--surface-card)] text-[var(--i)]"
              >
                Name (A-Z)
              </option>
              <option
                value="size"
                className="bg-[var(--surface-card)] text-[var(--i)]"
              >
                Largest first
              </option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
          </div>

          {/* Grid / List toggle */}
          <div className="flex items-center rounded-lg border border-[var(--h)] bg-[var(--s)] p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center justify-center w-8 h-7 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-[var(--p)] text-[var(--pt)]"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`flex items-center justify-center w-8 h-7 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--p)] text-[var(--pt)]"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
              title="List view"
              aria-label="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
