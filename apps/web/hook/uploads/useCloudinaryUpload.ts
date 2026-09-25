//perfectly fine
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/trpc/client";
import type { CloudinaryUploadResult } from "@repo/services/upload/model";

export type UploadStatus = "idle" | "signing" | "uploading" | "done" | "error";

export interface UseCloudinaryUploadReturn {
  upload: (
    file: File,
    folder?: string,
  ) => Promise<CloudinaryUploadResult | null>;
  cancel: () => void;
  status: UploadStatus;
  progress: number;
  error: string | null;
  reset: () => void;
}

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB, adjust as needed

export function useCloudinaryUpload(options?: {
  maxFileSize?: number;
}): UseCloudinaryUploadReturn {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getSignature = trpc.upload.getSignature.useMutation();
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      xhrRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
  }, []);

  const upload = useCallback(
    async (
      file: File,
      folder = "quiz_media",
    ): Promise<CloudinaryUploadResult | null> => {
      const maxSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

      if (file.size > maxSize) {
        const message = `File exceeds max size of ${Math.round(maxSize / 1024 / 1024)}MB`;
        setStatus("error");
        setError(message);
        return null;
      }

      try {
        setStatus("signing");
        setProgress(0);
        setError(null);

        const resourceType = file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("image/")
            ? "image"
            : "raw";

        const auth = await getSignature.mutateAsync({
          folder,
          resourceType,
        });

        if (!auth) {
          throw new Error("Failed to get upload signature from server");
        }

        setStatus("uploading");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", auth.apiKey);
        formData.append("timestamp", String(auth.timestamp));
        formData.append("signature", auth.signature);
        formData.append("folder", auth.folder);
        formData.append("access_mode", auth.accessMode);
        if (auth.publicId) formData.append("public_id", auth.publicId);

        const result = await new Promise<CloudinaryUploadResult>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;

            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 100));
              }
            });

            xhr.addEventListener("load", () => {
              let data: any;
              try {
                data = JSON.parse(xhr.responseText);
              } catch {
                reject(new Error("Cloudinary returned an unreadable response"));
                return;
              }

              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({
                  publicId: data.public_id,
                  secureUrl: data.secure_url,
                  url: data.url,
                  format: data.format,
                  width: data.width,
                  height: data.height,
                  resourceType: data.resource_type,
                  bytes: data.bytes,
                  thumbnailUrl: data.thumbnail_url,
                });
              } else {
                reject(
                  new Error(
                    data?.error?.message ??
                      `Cloudinary upload failed: ${xhr.status} ${xhr.statusText}`,
                  ),
                );
              }
            });

            xhr.addEventListener("error", () =>
              reject(new Error("Network error during upload")),
            );
            xhr.addEventListener("abort", () =>
              reject(new Error("Upload cancelled")),
            );
            xhr.addEventListener("timeout", () =>
              reject(new Error("Upload timed out")),
            );

            xhr.timeout = 5 * 60 * 1000; // 5 min, adjust for large files
            xhr.open("POST", auth.uploadUrl);
            xhr.send(formData);
          },
        );

        if (!isMountedRef.current) return null;

        setStatus("done");
        setProgress(100);
        return result;
      } catch (err) {
        if (!isMountedRef.current) return null;
        const message = err instanceof Error ? err.message : "Upload failed";
        setStatus("error");
        setError(message);
        return null;
      } finally {
        xhrRef.current = null;
      }
    },
    [getSignature, options?.maxFileSize],
  );

  return { upload, cancel, status, progress, error, reset };
}
