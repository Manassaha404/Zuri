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

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunk threshold for large file upload (e.g. 26MB PPTX)

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
        throw new Error(message);
      }

      try {
        setStatus("signing");
        setProgress(0);
        setError(null);

        // Determine resource type: images -> image, videos -> video, documents/other -> auto
        const resourceType = file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("image/")
            ? "image"
            : "auto";

        const auth = await getSignature.mutateAsync({
          folder,
          resourceType,
        });

        if (!auth) {
          throw new Error("Failed to get upload signature from server");
        }

        setStatus("uploading");

        let result: CloudinaryUploadResult;

        if (file.size <= CHUNK_SIZE) {
          // Standard single-request upload for files <= 10MB
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", auth.apiKey);
          formData.append("timestamp", String(auth.timestamp));
          formData.append("signature", auth.signature);
          formData.append("folder", auth.folder);
          if (auth.accessMode) formData.append("access_mode", auth.accessMode);
          if (auth.publicId) formData.append("public_id", auth.publicId);

          result = await new Promise<CloudinaryUploadResult>(
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
                  reject(
                    new Error("Cloudinary returned an unreadable response"),
                  );
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

              xhr.timeout = 10 * 60 * 1000;
              xhr.open("POST", auth.uploadUrl);
              xhr.send(formData);
            },
          );
        } else {
          // Chunked upload for large files (> 10MB, e.g. 26MB PPTX, large videos)
          const uniqueUploadId = `cld_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          let start = 0;
          let lastData: any = null;

          while (start < file.size) {
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const chunkFormData = new FormData();
            chunkFormData.append("file", chunk, file.name);
            chunkFormData.append("api_key", auth.apiKey);
            chunkFormData.append("timestamp", String(auth.timestamp));
            chunkFormData.append("signature", auth.signature);
            chunkFormData.append("folder", auth.folder);
            if (auth.accessMode)
              chunkFormData.append("access_mode", auth.accessMode);
            if (auth.publicId) chunkFormData.append("public_id", auth.publicId);

            lastData = await new Promise<any>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhrRef.current = xhr;

              xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                  const uploaded = start + e.loaded;
                  setProgress(
                    Math.min(99, Math.round((uploaded / file.size) * 100)),
                  );
                }
              });

              xhr.addEventListener("load", () => {
                let data: any;
                try {
                  data = JSON.parse(xhr.responseText);
                } catch {
                  reject(
                    new Error(
                      "Cloudinary returned an unreadable response during chunked upload",
                    ),
                  );
                  return;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve(data);
                } else {
                  reject(
                    new Error(
                      data?.error?.message ??
                        `Cloudinary chunk upload failed: ${xhr.status} ${xhr.statusText}`,
                    ),
                  );
                }
              });

              xhr.addEventListener("error", () =>
                reject(new Error("Network error during chunk upload")),
              );
              xhr.addEventListener("abort", () =>
                reject(new Error("Upload cancelled")),
              );
              xhr.addEventListener("timeout", () =>
                reject(new Error("Upload timed out")),
              );

              xhr.timeout = 10 * 60 * 1000;
              xhr.open("POST", auth.uploadUrl);
              xhr.setRequestHeader(
                "Content-Range",
                `bytes ${start}-${end - 1}/${file.size}`,
              );
              xhr.setRequestHeader("X-Unique-Upload-Id", uniqueUploadId);
              xhr.send(chunkFormData);
            });

            start = end;
          }

          result = {
            publicId: lastData.public_id,
            secureUrl: lastData.secure_url,
            url: lastData.url,
            format: lastData.format,
            width: lastData.width,
            height: lastData.height,
            resourceType: lastData.resource_type,
            bytes: lastData.bytes || file.size,
            thumbnailUrl: lastData.thumbnail_url,
          };
        }

        if (!isMountedRef.current) return null;

        setStatus("done");
        setProgress(100);
        return result;
      } catch (err) {
        if (!isMountedRef.current) return null;
        const message = err instanceof Error ? err.message : "Upload failed";
        setStatus("error");
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        xhrRef.current = null;
      }
    },
    [getSignature, options?.maxFileSize],
  );

  return { upload, cancel, status, progress, error, reset };
}
