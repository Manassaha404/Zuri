import { z } from "zod";
export const getUploadSignatureDto = z.object({
  folder: z.string().min(1).default("quiz_media"),
  resourceType: z.enum(["image", "video", "raw", "auto"]).default("image"),
  publicId: z.string().optional(),
});

export type GetUploadSignatureInput = z.infer<typeof getUploadSignatureDto>;
export interface UploadSignatureResult {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  accessMode: string;
  uploadUrl: string;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  resourceType: string;
  bytes: number;
  thumbnailUrl?: string;
}
