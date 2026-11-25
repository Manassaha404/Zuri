// Types for File Dock & Saved Files Workspace
export type FileViewMode = "grid" | "list";
export type FileCategoryFilter =
  | "all"
  | "image"
  | "video"
  | "document"
  | "other";
export type FileSortBy = "newest" | "name" | "size";

export interface FileDockItem {
  fileDockId: string;
  userId: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FileDockFolderItem {
  folderId: string;
  fileDockId: string;
  parentFolderId: string | null;
  name: string;
  position: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FileDockFileItem {
  fileId: string;
  fileDockId: string;
  folderId: string | null;
  name: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  resourceType: "image" | "video" | "raw";
  format: string | null;
  mimeType: string | null;
  bytes: number | null;
  position: string;
  createdAt: string | Date;
}

export interface PreviewFileState {
  fileId: string;
  name: string;
  url: string;
  mimeType?: string | null;
  bytes?: number | null;
  type: "image" | "video" | "pdf";
}

export interface UploadQueueState {
  total: number;
  current: number;
  fileName: string;
}
