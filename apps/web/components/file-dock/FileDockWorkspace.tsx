"use client";

// Main File Dock & Saved Files Workspace
import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Folder, UploadCloud, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useInitUIStore, useUIStore } from "@/store/uiStore";
import { useFileDock } from "@/hook/file-dock";
import { getFileCategory, getFilePreviewType } from "@/lib/fileDockUtils";
import { FileDockSidebar } from "./FileDockSidebar";
import { FileDockToolbar } from "./FileDockToolbar";
import { FileDockDropzone } from "./FileDockDropzone";
import { FileDockFileCard } from "./FileDockFileCard";
import { FilePreviewModal } from "./FilePreviewModal";
import { NamePromptModal, MoveFileModal } from "./FileActionModals";
import type {
  FileDockFileItem,
  FileDockFolderItem,
  FileDockItem,
  PreviewFileState,
} from "./types";

type PromptState =
  | { kind: "createDock" }
  | { kind: "renameDock"; dock: FileDockItem }
  | { kind: "createFolder"; parentFolderId: string | null }
  | { kind: "renameFolder"; folder: FileDockFolderItem }
  | { kind: "renameFile"; file: FileDockFileItem }
  | null;

export function FileDockWorkspace() {
  useInitUIStore();
  const { darkMode, toggleTheme } = useUIStore();

  const {
    docks,
    folders,
    files,
    isLoading,
    activeDockId,
    activeFolderId,
    searchQuery,
    viewMode,
    filterType,
    sortBy,
    setActiveDockId,
    setActiveFolderId,
    setSearchQuery,
    setViewMode,
    setFilterType,
    setSortBy,
    uploadFiles,
    uploadQueue,
    uploadProgress,
    isUploading,
    createDock,
    renameDock,
    deleteDock,
    createFolder,
    renameFolder,
    deleteFolder,
    renameFile,
    moveFile,
    deleteFile,
  } = useFileDock();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFileState | null>(null);
  const [promptModal, setPromptModal] = useState<PromptState>(null);
  const [movingFile, setMovingFile] = useState<FileDockFileItem | null>(null);

  const activeDock = useMemo(
    () => docks.find((d) => d.fileDockId === activeDockId) ?? null,
    [docks, activeDockId],
  );

  // Build folder lookup map and breadcrumb trail for activeFolderId
  const folderMap = useMemo(
    () => new Map(folders.map((f) => [f.folderId, f])),
    [folders],
  );

  const breadcrumbs = useMemo(() => {
    const trail: FileDockFolderItem[] = [];
    let cursor = activeFolderId ? folderMap.get(activeFolderId) : undefined;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.folderId)) {
      seen.add(cursor.folderId);
      trail.unshift(cursor);
      cursor = cursor.parentFolderId
        ? folderMap.get(cursor.parentFolderId)
        : undefined;
    }
    return trail;
  }, [activeFolderId, folderMap]);

  // Direct child folders of the active folder (or root folders if activeFolderId is null)
  const visibleSubfolders = useMemo(() => {
    if (!activeDockId) return [];
    const q = searchQuery.trim().toLowerCase();
    return folders.filter((f) => {
      if (f.fileDockId !== activeDockId) return false;
      if ((f.parentFolderId ?? null) !== (activeFolderId ?? null)) {
        return false;
      }
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [folders, activeDockId, activeFolderId, searchQuery]);

  // Filtered and sorted files
  const visibleFiles = useMemo(() => {
    if (!activeDockId) return [];
    const q = searchQuery.trim().toLowerCase();

    const filtered = files.filter((file) => {
      if (file.fileDockId !== activeDockId) return false;

      // When searching, search across the entire active dock; otherwise scope to activeFolderId
      if (!q && activeFolderId !== null && file.folderId !== activeFolderId) {
        return false;
      }
      if (q && !file.name.toLowerCase().includes(q)) {
        return false;
      }
      if (filterType !== "all" && getFileCategory(file) !== filterType) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return (b.bytes ?? 0) - (a.bytes ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [files, activeDockId, activeFolderId, searchQuery, filterType, sortBy]);

  const handleFilesSelected = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    await uploadFiles(selected);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handlePreview = (file: FileDockFileItem) => {
    const type = getFilePreviewType(file.mimeType, file.format, file.name);
    if (!type) return;
    setPreviewFile({
      fileId: file.fileId,
      name: file.name,
      url: file.cloudinaryUrl,
      mimeType: file.mimeType,
      bytes: file.bytes,
      type,
    });
  };

  const promptConfig = useMemo(() => {
    if (!promptModal) return null;
    switch (promptModal.kind) {
      case "createDock":
        return {
          title: "Create File Dock",
          label: "Dock Name",
          placeholder: "e.g. Design Assets, Receipts, Project Docs",
          initialValue: "",
          submitLabel: "Create Dock",
          onSubmit: (name: string) => createDock(name).then(() => {}),
        };
      case "renameDock":
        return {
          title: "Rename File Dock",
          label: "Dock Name",
          placeholder: "Enter dock name",
          initialValue: promptModal.dock.name,
          submitLabel: "Save Name",
          onSubmit: (name: string) =>
            renameDock(promptModal.dock.fileDockId, name).then(() => {}),
        };
      case "createFolder":
        return {
          title: "Create Folder",
          label: "Folder Name",
          placeholder: "e.g. Invoices, Screenshots, Contracts",
          initialValue: "",
          submitLabel: "Create Folder",
          onSubmit: (name: string) => {
            if (!activeDockId) return;
            return createFolder(
              activeDockId,
              name,
              promptModal.parentFolderId,
            ).then(() => {});
          },
        };
      case "renameFolder":
        return {
          title: "Rename Folder",
          label: "Folder Name",
          placeholder: "Enter folder name",
          initialValue: promptModal.folder.name,
          submitLabel: "Save Name",
          onSubmit: (name: string) =>
            renameFolder(promptModal.folder.folderId, name).then(() => {}),
        };
      case "renameFile":
        return {
          title: "Rename File",
          label: "File Name",
          placeholder: "Enter file name",
          initialValue: promptModal.file.name,
          submitLabel: "Save Name",
          onSubmit: (name: string) =>
            renameFile(promptModal.file.fileId, name).then(() => {}),
        };
    }
  }, [
    promptModal,
    activeDockId,
    createDock,
    renameDock,
    createFolder,
    renameFolder,
    renameFile,
  ]);

  return (
    <div
      className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar overflow-x-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6 w-full min-w-0">
        {/* Workspace Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--h)] bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)] transition-colors shrink-0"
              title="Back to Assistant"
              aria-label="Back to Assistant"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--i)] truncate">
                  File Dock
                </h1>
                <span className="badge-pill bg-[var(--s)] text-[var(--m)] border border-[var(--h)]">
                  {files.length} saved
                </span>
              </div>
              <p className="text-xs text-[var(--m)] mt-0.5 truncate">
                Save, organize, preview, and manage files across docks and
                nested folders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle
              darkMode={darkMode}
              onToggle={toggleTheme}
              className="w-9 h-9 border border-[var(--h)] bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)]"
              size={17}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bt p !w-auto !h-9 whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 px-3.5"
            >
              <UploadCloud size={15} />
              <span>Save Files</span>
            </button>
          </div>
        </header>

        {/* Main Split Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start min-w-0">
          <FileDockSidebar
            docks={docks}
            folders={folders}
            files={files}
            activeDockId={activeDockId}
            activeFolderId={activeFolderId}
            onSelectDock={setActiveDockId}
            onSelectFolder={setActiveFolderId}
            onCreateDock={() => setPromptModal({ kind: "createDock" })}
            onRenameDock={(dock) =>
              setPromptModal({ kind: "renameDock", dock })
            }
            onDeleteDock={(dock) => {
              if (
                window.confirm(
                  `Delete dock "${dock.name}" and all its folders and files?`,
                )
              ) {
                deleteDock(dock.fileDockId);
              }
            }}
            onCreateFolder={(parentFolderId) =>
              setPromptModal({ kind: "createFolder", parentFolderId })
            }
            onRenameFolder={(folder) =>
              setPromptModal({ kind: "renameFolder", folder })
            }
            onDeleteFolder={(folder) => {
              if (
                window.confirm(
                  `Delete folder "${folder.name}"? Files inside will remain in the dock root.`,
                )
              ) {
                deleteFolder(folder.folderId);
              }
            }}
          />

          <main className="flex-1 w-full min-w-0 flex flex-col gap-4">
            <FileDockToolbar
              dockName={activeDock?.name || "File Dock"}
              breadcrumbs={breadcrumbs}
              onSelectFolder={setActiveFolderId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterType={filterType}
              onFilterChange={setFilterType}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onNewFolder={() =>
                setPromptModal({
                  kind: "createFolder",
                  parentFolderId: activeFolderId,
                })
              }
              onUploadClick={() => fileInputRef.current?.click()}
              isUploading={isUploading}
            />

            <FileDockDropzone
              isDragOver={isDragOver}
              isUploading={isUploading}
              uploadQueue={uploadQueue}
              uploadProgress={uploadProgress}
              onSelectFiles={() => fileInputRef.current?.click()}
              compact={visibleFiles.length > 0 || visibleSubfolders.length > 0}
            />

            {isLoading ? (
              <div className="py-16 flex items-center justify-center gap-2 text-xs text-[var(--m)]">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading saved files...</span>
              </div>
            ) : (
              <>
                {/* Subfolders strip */}
                {visibleSubfolders.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                      Folders
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {visibleSubfolders.map((folder) => {
                        const count = files.filter(
                          (f) => f.folderId === folder.folderId,
                        ).length;
                        return (
                          <button
                            key={folder.folderId}
                            type="button"
                            onClick={() => setActiveFolderId(folder.folderId)}
                            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--h)] bg-[var(--s)] hover:bg-[var(--surface-card)] hover:border-[var(--m)] px-3 py-2.5 text-left transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Folder
                                size={15}
                                className="text-[var(--accent)] shrink-0"
                              />
                              <span className="text-xs font-medium text-[var(--i)] truncate">
                                {folder.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--m)] shrink-0">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Files Grid / List */}
                {visibleFiles.length > 0 ? (
                  <section className="flex flex-col gap-2">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                      Files ({visibleFiles.length})
                    </h2>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
                          : "flex flex-col gap-2"
                      }
                    >
                      {visibleFiles.map((file) => (
                        <FileDockFileCard
                          key={file.fileId}
                          file={file}
                          folderName={
                            file.folderId
                              ? (folderMap.get(file.folderId)?.name ?? null)
                              : null
                          }
                          viewMode={viewMode}
                          onPreview={handlePreview}
                          onRename={(f) =>
                            setPromptModal({ kind: "renameFile", file: f })
                          }
                          onMove={(f) => setMovingFile(f)}
                          onDelete={(f) => {
                            if (window.confirm(`Delete "${f.name}"?`)) {
                              deleteFile(f.fileId);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  visibleSubfolders.length === 0 && (
                    <div className="rounded-xl border border-[var(--h)] bg-[var(--s)]/40 py-12 px-4 text-center">
                      <p className="text-sm font-semibold text-[var(--i)]">
                        No files here yet
                      </p>
                      <p className="text-xs text-[var(--m)] mt-1">
                        {searchQuery || filterType !== "all"
                          ? "Try clearing your search or category filter."
                          : "Upload files above or drag and drop them anywhere on this page."}
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Preview & Action Modals */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {promptConfig && (
        <NamePromptModal
          isOpen={true}
          title={promptConfig.title}
          label={promptConfig.label}
          placeholder={promptConfig.placeholder}
          initialValue={promptConfig.initialValue}
          submitLabel={promptConfig.submitLabel}
          onClose={() => setPromptModal(null)}
          onSubmit={promptConfig.onSubmit}
        />
      )}

      <MoveFileModal
        file={movingFile}
        docks={docks}
        folders={folders}
        onClose={() => setMovingFile(null)}
        onMove={async (fileId, targetDockId, targetFolderId) => {
          await moveFile(fileId, targetDockId, targetFolderId);
        }}
      />
    </div>
  );
}
