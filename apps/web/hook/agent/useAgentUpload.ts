"use client";

import { useCallback } from "react";
import { useCloudinaryUpload } from "@/hook/uploads/useCloudinaryUpload";
import { useAgentStore, type AttachedFile } from "@/store/agentStore";

// Upload hook for managing chat attachments and Cloudinary upload flow
export function useAgentUpload() {
  const { upload, status, progress, error, cancel, reset } =
    useCloudinaryUpload();
  const attachedFiles = useAgentStore((state) => state.attachedFiles);
  const addAttachedFile = useAgentStore((state) => state.addAttachedFile);
  const updateAttachedFile = useAgentStore((state) => state.updateAttachedFile);
  const removeAttachedFile = useAgentStore((state) => state.removeAttachedFile);
  const clearAttachedFiles = useAgentStore((state) => state.clearAttachedFiles);

  // Upload single file to Cloudinary and update store state
  const handleUploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const fileId = crypto.randomUUID();
      addAttachedFile({
        id: fileId,
        name: file.name,
        file,
        size: file.size,
        status: "uploading",
      });

      try {
        const result = await upload(file, "chat_attachments");
        const fileUrl = result?.secureUrl ?? result?.url ?? null;

        if (fileUrl) {
          updateAttachedFile(fileId, {
            status: "uploaded",
            url: fileUrl,
          });
          return fileUrl;
        } else {
          updateAttachedFile(fileId, {
            status: "error",
            error: "Upload failed to return URL",
          });
          return null;
        }
      } catch (err: any) {
        updateAttachedFile(fileId, {
          status: "error",
          error: err?.message ?? "Upload failed",
        });
        return null;
      }
    },
    [addAttachedFile, updateAttachedFile, upload],
  );

  return {
    uploadFile: handleUploadFile,
    attachedFiles,
    removeAttachedFile,
    clearAttachedFiles,
    uploadStatus: status,
    uploadProgress: progress,
    uploadError: error,
    cancelUpload: cancel,
    resetUpload: reset,
    isUploading:
      status === "signing" ||
      status === "uploading" ||
      attachedFiles.some((f) => f.status === "uploading"),
  };
}
