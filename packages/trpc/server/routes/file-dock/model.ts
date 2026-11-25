import { z } from "zod";

export const createDockDto = z.object({
  name: z.string().trim().min(1).max(120),
});

export const renameDockDto = z.object({
  fileDockId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});

export const dockIdDto = z.object({
  fileDockId: z.string().uuid(),
});

export const createFolderDto = z.object({
  fileDockId: z.string().uuid(),
  parentFolderId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(120),
});

export const renameFolderDto = z.object({
  folderId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});

export const moveFolderDto = z.object({
  folderId: z.string().uuid(),
  parentFolderId: z.string().uuid().nullable(),
});

export const folderIdDto = z.object({
  folderId: z.string().uuid(),
});

export const addFileDto = z.object({
  fileDockId: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(255),
  cloudinaryPublicId: z.string().trim().min(1),
  cloudinaryUrl: z.string().url(),
  resourceType: z.enum(["image", "video", "raw"]),
  format: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  bytes: z.number().nonnegative().nullable().optional(),
  position: z.string().nullable().optional(),
});

export const renameFileDto = z.object({
  fileId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
});

export const moveFileDto = z.object({
  fileId: z.string().uuid(),
  targetDockId: z.string().uuid(),
  targetFolderId: z.string().uuid().nullable(),
});

export const fileIdDto = z.object({
  fileId: z.string().uuid(),
});
