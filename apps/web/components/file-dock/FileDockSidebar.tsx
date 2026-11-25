"use client";

// Left sidebar for File Dock workspace: manages docks, nestable folder trees, and storage summary
import { useState, useMemo } from "react";
import {
  HardDrive,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Files,
} from "lucide-react";
import { formatDockBytes } from "@/lib/fileDockUtils";
import type {
  FileDockFileItem,
  FileDockFolderItem,
  FileDockItem,
} from "./types";

interface FileDockSidebarProps {
  docks: FileDockItem[];
  folders: FileDockFolderItem[];
  files: FileDockFileItem[];
  activeDockId: string | null;
  activeFolderId: string | null;
  onSelectDock: (dockId: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onCreateDock: () => void;
  onRenameDock: (dock: FileDockItem) => void;
  onDeleteDock: (dock: FileDockItem) => void;
  onCreateFolder: (parentFolderId: string | null) => void;
  onRenameFolder: (folder: FileDockFolderItem) => void;
  onDeleteFolder: (folder: FileDockFolderItem) => void;
}

export function FileDockSidebar({
  docks,
  folders,
  files,
  activeDockId,
  activeFolderId,
  onSelectDock,
  onSelectFolder,
  onCreateDock,
  onRenameDock,
  onDeleteDock,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FileDockSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Count files per dock
  const fileCountByDock = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files) {
      map.set(f.fileDockId, (map.get(f.fileDockId) ?? 0) + 1);
    }
    return map;
  }, [files]);

  // Folders belonging to the currently selected dock
  const dockFolders = useMemo(
    () => folders.filter((f) => f.fileDockId === activeDockId),
    [folders, activeDockId],
  );

  // Total storage across all docks
  const totalBytes = useMemo(
    () => files.reduce((acc, f) => acc + (Number(f.bytes) || 0), 0),
    [files],
  );

  // Recursive folder tree renderer
  const renderFolderTree = (parentId: string | null, depth = 0) => {
    const children = dockFolders.filter(
      (f) => (f.parentFolderId ?? null) === parentId,
    );
    if (children.length === 0) return null;

    return children.map((folder) => {
      const hasChildren = dockFolders.some(
        (f) => f.parentFolderId === folder.folderId,
      );
      const isExpanded = expandedFolders[folder.folderId] ?? true;
      const isActive = activeFolderId === folder.folderId;
      const count = files.filter((f) => f.folderId === folder.folderId).length;

      return (
        <div key={folder.folderId} className="flex flex-col">
          <div
            className={`group flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer ${
              isActive
                ? "bg-[var(--p)] text-[var(--pt)] font-semibold"
                : "text-[var(--b)] hover:bg-[var(--surface-card)] hover:text-[var(--i)]"
            }`}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            onClick={() => onSelectFolder(folder.folderId)}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(folder.folderId);
                  }}
                  className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
                  aria-label="Toggle subfolder"
                >
                  {isExpanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              ) : (
                <span className="w-4 shrink-0" />
              )}
              {isActive ? (
                <FolderOpen size={14} className="shrink-0" />
              ) : (
                <Folder size={14} className="shrink-0 text-[var(--m)]" />
              )}
              <span className="truncate">{folder.name}</span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-[var(--pt)]"
                      : "text-[var(--m)]"
                  }`}
                >
                  {count}
                </span>
              )}
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(folder.folderId);
                  }}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                  title="New subfolder"
                >
                  <Plus size={11} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameFolder(folder);
                  }}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                  title="Rename folder"
                >
                  <Edit3 size={11} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder);
                  }}
                  className="p-1 rounded text-rose-500 hover:bg-rose-500/15"
                  title="Delete folder"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>

          {hasChildren &&
            isExpanded &&
            renderFolderTree(folder.folderId, depth + 1)}
        </div>
      );
    });
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 flex flex-col rounded-2xl border border-[var(--h)] bg-[var(--s)] overflow-hidden">
      {/* Docks Section */}
      <div className="p-3 border-b border-[var(--h)]">
        <div className="flex items-center justify-between px-1.5 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
            File Docks
          </span>
          <button
            type="button"
            onClick={onCreateDock}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors"
            title="Create new file dock"
          >
            <Plus size={12} />
            <span>New Dock</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto styled-scrollbar pr-0.5">
          {docks.map((dock) => {
            const isActive = dock.fileDockId === activeDockId;
            const count = fileCountByDock.get(dock.fileDockId) ?? 0;

            return (
              <div
                key={dock.fileDockId}
                onClick={() => onSelectDock(dock.fileDockId)}
                className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)] font-semibold"
                    : "text-[var(--b)] hover:bg-[var(--surface-card)] hover:text-[var(--i)]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HardDrive
                    size={14}
                    className={
                      isActive ? "shrink-0" : "shrink-0 text-[var(--m)]"
                    }
                  />
                  <span className="truncate">{dock.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-[var(--pt)]"
                        : "bg-[var(--bg)] text-[var(--m)] border border-[var(--h)]"
                    }`}
                  >
                    {count}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameDock(dock);
                      }}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      title="Rename dock"
                    >
                      <Edit3 size={11} />
                    </button>
                    {docks.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDock(dock);
                        }}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/15"
                        title="Delete dock"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Folders Section */}
      <div className="flex-1 p-3 flex flex-col min-h-[180px] overflow-hidden">
        <div className="flex items-center justify-between px-1.5 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
            Folders
          </span>
          <button
            type="button"
            onClick={() => onCreateFolder(null)}
            disabled={!activeDockId}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors disabled:opacity-40"
            title="New root folder"
          >
            <FolderPlus size={12} />
            <span>New Folder</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto styled-scrollbar flex flex-col gap-1 pr-0.5">
          {/* All files in active dock */}
          <button
            type="button"
            onClick={() => onSelectFolder(null)}
            className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left ${
              activeFolderId === null
                ? "bg-[var(--p)] text-[var(--pt)] font-semibold"
                : "text-[var(--b)] hover:bg-[var(--surface-card)] hover:text-[var(--i)]"
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Files
                size={14}
                className={
                  activeFolderId === null
                    ? "shrink-0"
                    : "shrink-0 text-[var(--m)]"
                }
              />
              <span className="truncate">All Dock Files</span>
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeFolderId === null
                  ? "bg-white/20 text-[var(--pt)]"
                  : "text-[var(--m)]"
              }`}
            >
              {activeDockId ? (fileCountByDock.get(activeDockId) ?? 0) : 0}
            </span>
          </button>

          {renderFolderTree(null)}

          {dockFolders.length === 0 && (
            <p className="px-2.5 py-3 text-[11px] text-[var(--m)]">
              No folders yet. Create one to organize files.
            </p>
          )}
        </div>
      </div>

      {/* Storage Summary Footer */}
      <div className="border-t border-[var(--h)] bg-[var(--surface-card)]/60 px-4 py-2.5 flex items-center justify-between text-[11px]">
        <span className="text-[var(--m)]">Total Stored</span>
        <span className="font-semibold text-[var(--i)]">
          {files.length} {files.length === 1 ? "file" : "files"} ·{" "}
          {formatDockBytes(totalBytes)}
        </span>
      </div>
    </aside>
  );
}
