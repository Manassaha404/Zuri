"use client";

// Hook coordinating File Dock workspace queries, Cloudinary uploads, and tRPC mutations
import { useEffect, useCallback, useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { useFileDockStore } from "@/store/fileDockStore";
import { useCloudinaryUpload } from "@/hook/uploads/useCloudinaryUpload";
import type { UploadQueueState } from "@/components/file-dock/types";

export function useFileDock() {
  const utils = trpc.useUtils();
  const {
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
  } = useFileDockStore();

  const {
    upload,
    progress: uploadProgress,
    status: uploadStatus,
  } = useCloudinaryUpload();
  const [uploadQueue, setUploadQueue] = useState<UploadQueueState | null>(null);

  const workspaceQuery = trpc.fileDock.getWorkspace.useQuery(undefined, {
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const docks = useMemo(
    () => workspaceQuery.data?.docks ?? [],
    [workspaceQuery.data?.docks],
  );
  const folders = useMemo(
    () => workspaceQuery.data?.folders ?? [],
    [workspaceQuery.data?.folders],
  );
  const files = useMemo(
    () => workspaceQuery.data?.files ?? [],
    [workspaceQuery.data?.files],
  );

  // Ensure activeDockId always points to a valid dock
  useEffect(() => {
    if (docks.length === 0) return;
    const exists =
      activeDockId && docks.some((d) => d.fileDockId === activeDockId);
    if (!exists) {
      setActiveDockId(docks[0]!.fileDockId);
    }
  }, [docks, activeDockId, setActiveDockId]);

  // Ensure activeFolderId belongs to activeDockId
  useEffect(() => {
    if (!activeFolderId) return;
    const exists = folders.some(
      (f) => f.folderId === activeFolderId && f.fileDockId === activeDockId,
    );
    if (!exists) {
      setActiveFolderId(null);
    }
  }, [folders, activeFolderId, activeDockId, setActiveFolderId]);

  const invalidateWorkspace = useCallback(async () => {
    await utils.fileDock.getWorkspace.invalidate();
  }, [utils]);

  const createDockMutation = trpc.fileDock.createDock.useMutation({
    onSuccess: async (created) => {
      await invalidateWorkspace();
      if (created?.fileDockId) {
        setActiveDockId(created.fileDockId);
      }
    },
  });

  const renameDockMutation = trpc.fileDock.renameDock.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const deleteDockMutation = trpc.fileDock.deleteDock.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const createFolderMutation = trpc.fileDock.createFolder.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const renameFolderMutation = trpc.fileDock.renameFolder.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const moveFolderMutation = trpc.fileDock.moveFolder.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const deleteFolderMutation = trpc.fileDock.deleteFolder.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const addFileMutation = trpc.fileDock.addFile.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const renameFileMutation = trpc.fileDock.renameFile.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const moveFileMutation = trpc.fileDock.moveFile.useMutation({
    onSuccess: invalidateWorkspace,
  });

  const deleteFileMutation = trpc.fileDock.deleteFile.useMutation({
    onSuccess: invalidateWorkspace,
  });

  // Upload one or more files to Cloudinary and save records to active dock/folder
  const uploadFiles = useCallback(
    async (
      selectedFiles: FileList | File[],
      targetDockId?: string | null,
      targetFolderId?: string | null,
    ) => {
      const dockId = targetDockId ?? activeDockId ?? docks[0]?.fileDockId;
      if (!dockId) {
        throw new Error("No file dock available");
      }

      const folderId =
        targetFolderId !== undefined ? targetFolderId : activeFolderId;
      const list = Array.from(selectedFiles);
      if (list.length === 0) return [];

      const createdRecords = [];
      try {
        for (let i = 0; i < list.length; i += 1) {
          const file = list[i]!;
          setUploadQueue({
            total: list.length,
            current: i + 1,
            fileName: file.name,
          });

          const result = await upload(file, "file_dock");
          if (!result) continue;

          const resourceType =
            result.resourceType === "image" || result.resourceType === "video"
              ? result.resourceType
              : "raw";

          const record = await addFileMutation.mutateAsync({
            fileDockId: dockId,
            folderId: folderId ?? null,
            name: file.name,
            cloudinaryPublicId: result.publicId,
            cloudinaryUrl: result.secureUrl,
            resourceType,
            format: result.format || file.name.split(".").pop() || null,
            mimeType: file.type || "application/octet-stream",
            bytes: typeof result.bytes === "number" ? result.bytes : file.size,
          });

          createdRecords.push(record);
        }
      } finally {
        setUploadQueue(null);
      }

      return createdRecords;
    },
    [activeDockId, activeFolderId, docks, upload, addFileMutation],
  );

  return {
    docks,
    folders,
    files,
    isLoading: workspaceQuery.isLoading,
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
    uploadStatus,
    isUploading:
      uploadQueue !== null ||
      uploadStatus === "signing" ||
      uploadStatus === "uploading",
    createDock: (name: string) => createDockMutation.mutateAsync({ name }),
    renameDock: (fileDockId: string, name: string) =>
      renameDockMutation.mutateAsync({ fileDockId, name }),
    deleteDock: (fileDockId: string) =>
      deleteDockMutation.mutateAsync({ fileDockId }),
    createFolder: (
      fileDockId: string,
      name: string,
      parentFolderId?: string | null,
    ) =>
      createFolderMutation.mutateAsync({
        fileDockId,
        name,
        parentFolderId: parentFolderId ?? null,
      }),
    renameFolder: (folderId: string, name: string) =>
      renameFolderMutation.mutateAsync({ folderId, name }),
    moveFolder: (folderId: string, parentFolderId: string | null) =>
      moveFolderMutation.mutateAsync({ folderId, parentFolderId }),
    deleteFolder: (folderId: string) =>
      deleteFolderMutation.mutateAsync({ folderId }),
    renameFile: (fileId: string, name: string) =>
      renameFileMutation.mutateAsync({ fileId, name }),
    moveFile: (
      fileId: string,
      targetDockId: string,
      targetFolderId: string | null,
    ) => moveFileMutation.mutateAsync({ fileId, targetDockId, targetFolderId }),
    deleteFile: (fileId: string) => deleteFileMutation.mutateAsync({ fileId }),
    refetch: workspaceQuery.refetch,
  };
}
