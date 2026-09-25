import { v2 as cloudinary } from "cloudinary";
import { GetUploadSignatureInput, UploadSignatureResult } from "./model";
import { env } from "../env";

export default class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }

  getUploadSignature(input: GetUploadSignatureInput): UploadSignatureResult {
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      );
    }

    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder: input.folder,
      access_mode: "public",
    };
    if (input.publicId) paramsToSign.public_id = input.publicId;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return {
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder: input.folder,
      publicId: input.publicId,
      accessMode: "public",
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${input.resourceType}/upload`,
    };
  }

  async getFileFromUrl(fileUrl: string): Promise<{
    buffer: Buffer;
    contentType: string | null;
    contentLength: number | null;
    fileName: string;
  }> {
    if (!fileUrl) {
      throw new Error("A valid fileUrl must be provided.");
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from URL: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const fileName = decodeURIComponent(
      new URL(fileUrl).pathname.split("/").pop() ?? "download",
    );

    return {
      buffer,
      contentType,
      contentLength: contentLength ? parseInt(contentLength, 10) : null,
      fileName,
    };
  }
}
