"use client";

// Hook managing chapter file dock queries, folder hierarchy, and Cloudinary upload integration
import { useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useNotesStore } from "@/store/notesStore";
import { useCloudinaryUpload } from "@/hook/uploads/useCloudinaryUpload";

// Helper to check if file should be previewed directly in our website
export function getPreviewType(
  mimeType?: string | null,
  format?: string | null,
  name?: string | null,
): "image" | "video" | "pdf" | null {
  const mime = (mimeType || "").toLowerCase();
  const fmt = (format || "").toLowerCase();
  const lowerName = (name || "").toLowerCase();

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "avif"].includes(fmt) ||
    /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(lowerName)
  ) {
    return "image";
  }

  if (
    mime.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov"].includes(fmt) ||
    /\.(mp4|webm|ogg|mov)$/i.test(lowerName)
  ) {
    return "video";
  }

  if (
    mime === "application/pdf" ||
    fmt === "pdf" ||
    lowerName.endsWith(".pdf")
  ) {
    return "pdf";
  }

  return null;
}

export function useChapterFileDock(chapterId?: string | null) {
  const activeChapterFileDockId = useNotesStore(
    (s) => s.activeChapterFileDockId,
  );
  const targetChapterId = chapterId || activeChapterFileDockId;

  const utils = trpc.useUtils();
  const { upload, progress, status: uploadStatus } = useCloudinaryUpload();

  // Query file dock files and folders for chapter
  const dockQuery = trpc.notes.getChapterFileDock.useQuery(
    { chapterId: targetChapterId! },
    {
      enabled: Boolean(targetChapterId),
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  );

  const addFileMutation = trpc.notes.addDockFile.useMutation({
    onSuccess: async () => {
      await utils.notes.getChapterFileDock.invalidate({
        chapterId: targetChapterId!,
      });
      await utils.notes.getWorkspace.invalidate();
      await dockQuery.refetch();
    },
  });

  const deleteFileMutation = trpc.notes.deleteDockFile.useMutation({
    onSuccess: async () => {
      await utils.notes.getChapterFileDock.invalidate({
        chapterId: targetChapterId!,
      });
      await utils.notes.getWorkspace.invalidate();
      await dockQuery.refetch();
    },
  });

  const createFolderMutation = trpc.notes.createDockFolder.useMutation({
    onSuccess: () => {
      utils.notes.getChapterFileDock.invalidate({
        chapterId: targetChapterId!,
      });
    },
  });

  const deleteFolderMutation = trpc.notes.deleteDockFolder.useMutation({
    onSuccess: () => {
      utils.notes.getChapterFileDock.invalidate({
        chapterId: targetChapterId!,
      });
    },
  });

  // Upload file to Cloudinary and record in database dock (creates file dock on demand if not present)
  const uploadFile = useCallback(
    async (file: File) => {
      if (!targetChapterId) {
        throw new Error("No chapter selected for file dock upload");
      }

      const result = await upload(file, "chapter_files");
      if (!result) {
        throw new Error("Failed to upload file to Cloudinary");
      }

      const resourceType =
        result.resourceType === "image" || result.resourceType === "video"
          ? result.resourceType
          : "raw";

      const created = await addFileMutation.mutateAsync({
        chapterId: targetChapterId,
        fileDockId: dockQuery.data?.dock?.fileDockId,
        name: file.name,
        cloudinaryPublicId: result.publicId,
        cloudinaryUrl: result.secureUrl,
        resourceType,
        format: result.format || file.name.split(".").pop() || null,
        mimeType: file.type || "application/octet-stream",
        bytes: typeof result.bytes === "number" ? result.bytes : file.size,
      });

      // Explicitly re-request chapter file dock query
      await dockQuery.refetch();
      return created;
    },
    [targetChapterId, dockQuery, upload, addFileMutation],
  );

  const deleteFile = useCallback(
    async (fileId: string) => {
      return await deleteFileMutation.mutateAsync({ fileId });
    },
    [deleteFileMutation],
  );

  const createFolder = useCallback(
    async (name: string, parentFolderId?: string | null) => {
      if (!dockQuery.data?.dock) return;
      return await createFolderMutation.mutateAsync({
        fileDockId: dockQuery.data.dock.fileDockId,
        parentFolderId,
        name,
      });
    },
    [dockQuery.data?.dock, createFolderMutation],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      return await deleteFolderMutation.mutateAsync({ folderId });
    },
    [deleteFolderMutation],
  );

  // Helper to open file in a new browser tab
  const openFileInNewTab = useCallback((url?: string | null) => {
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }, []);

  return {
    dock: dockQuery.data?.dock,
    folders: dockQuery.data?.folders || [],
    files: dockQuery.data?.files || [],
    isLoading: dockQuery.isLoading,
    isUploading: uploadStatus === "uploading" || uploadStatus === "signing",
    uploadStatus,
    uploadProgress: progress,
    uploadFile,
    deleteFile,
    createFolder,
    deleteFolder,
    openFileInNewTab,
    refetch: dockQuery.refetch,
  };
}
