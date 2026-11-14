import { z } from "zod";

// Notebook DTOs
export const createNotebookDto = z.object({
  title: z.string().trim().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  coverUrl: z.string().optional(),
  position: z.string().optional(),
});
export type CreateNotebookDto = z.infer<typeof createNotebookDto>;

export const updateNotebookDto = z.object({
  notebookId: z.string().uuid(),
  title: z.string().trim().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  coverUrl: z.string().optional(),
  position: z.string().optional(),
});
export type UpdateNotebookDto = z.infer<typeof updateNotebookDto>;

export const notebookIdDto = z.object({
  notebookId: z.string().uuid(),
});
export type NotebookIdDto = z.infer<typeof notebookIdDto>;

export const reorderNotebookDto = z.object({
  notebookId: z.string().uuid(),
  position: z.string(),
});
export type ReorderNotebookDto = z.infer<typeof reorderNotebookDto>;

// Chapter DTOs
export const getChaptersDto = z.object({
  notebookId: z.string().uuid(),
});
export type GetChaptersDto = z.infer<typeof getChaptersDto>;

export const createChapterDto = z.object({
  notebookId: z.string().uuid(),
  title: z.string().trim().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  position: z.string().optional(),
  summary: z.string().optional(),
});
export type CreateChapterDto = z.infer<typeof createChapterDto>;

export const updateChapterDto = z.object({
  chapterId: z.string().uuid(),
  title: z.string().trim().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  position: z.string().optional(),
  summary: z.string().optional(),
  isFavorite: z.boolean().optional(),
});
export type UpdateChapterDto = z.infer<typeof updateChapterDto>;

export const chapterIdDto = z.object({
  chapterId: z.string().uuid(),
});
export type ChapterIdDto = z.infer<typeof chapterIdDto>;

export const reorderChapterDto = z.object({
  chapterId: z.string().uuid(),
  position: z.string(),
});
export type ReorderChapterDto = z.infer<typeof reorderChapterDto>;

// Page DTOs
export const getPagesDto = z.object({
  chapterId: z.string().uuid(),
});
export type GetPagesDto = z.infer<typeof getPagesDto>;

export const pageIdDto = z.object({
  pageId: z.string().uuid(),
});
export type PageIdDto = z.infer<typeof pageIdDto>;

export const createPageDto = z.object({
  notebookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  title: z.string().trim().optional(),
  summary: z.string().optional(),
  position: z.string().optional(),
});
export type CreatePageDto = z.infer<typeof createPageDto>;

export const updatePageDto = z.object({
  pageId: z.string().uuid(),
  title: z.string().trim().optional(),
  summary: z.string().optional(),
  position: z.string().optional(),
  isPinned: z.boolean().optional(),
});
export type UpdatePageDto = z.infer<typeof updatePageDto>;

export const movePageDto = z.object({
  pageId: z.string().uuid(),
  targetNotebookId: z.string().uuid(),
  targetChapterId: z.string().uuid(),
});
export type MovePageDto = z.infer<typeof movePageDto>;

export const reorderPageDto = z.object({
  pageId: z.string().uuid(),
  position: z.string(),
});
export type ReorderPageDto = z.infer<typeof reorderPageDto>;

// Block DTOs
export const createBlockDto = z.object({
  pageId: z.string().uuid(),
  parentBlockId: z.string().uuid().nullable().optional(),
  type: z.string(),
  content: z.any(),
  position: z.string(),
  plainText: z.string().optional(),
});
export type CreateBlockDto = z.infer<typeof createBlockDto>;

export const updateBlockDto = z.object({
  blockId: z.string().uuid(),
  parentBlockId: z.string().uuid().nullable().optional(),
  type: z.string().optional(),
  content: z.any().optional(),
  position: z.string().optional(),
  plainText: z.string().optional(),
});
export type UpdateBlockDto = z.infer<typeof updateBlockDto>;

export const blockIdDto = z.object({
  blockId: z.string().uuid(),
});
export type BlockIdDto = z.infer<typeof blockIdDto>;

export const autosavePageDto = z.object({
  pageId: z.string().uuid(),
  title: z.string().optional(),
  summary: z.string().optional(),
  blocks: z
    .array(
      z.object({
        blockId: z.string().optional(),
        parentBlockId: z.string().nullable().optional(),
        type: z.string(),
        content: z.any(),
        position: z.string(),
        plainText: z.string().optional(),
      }),
    )
    .optional(),
});
export type AutosavePageDto = z.infer<typeof autosavePageDto>;

// Diagram DTOs
export const saveDiagramDto = z.object({
  pageId: z.string().uuid(),
  title: z.string().optional(),
  kind: z.enum(["canvas", "mermaid", "diagram_as_code"]).optional(),
  source: z.string().optional(),
  scene: z.any().optional(),
});
export type SaveDiagramDto = z.infer<typeof saveDiagramDto>;

export const diagramIdDto = z.object({
  diagramId: z.string().uuid(),
});
export type DiagramIdDto = z.infer<typeof diagramIdDto>;

// File Dock & File DTOs
export const getChapterFileDockDto = z.object({
  chapterId: z.string().uuid(),
});
export type GetChapterFileDockDto = z.infer<typeof getChapterFileDockDto>;

export const addDockFileDto = z.object({
  chapterId: z.string().uuid().optional(),
  fileDockId: z.string().uuid().optional(),
  folderId: z.string().uuid().nullable().optional(),
  name: z.string(),
  cloudinaryPublicId: z.string(),
  cloudinaryUrl: z.string(),
  resourceType: z.enum(["image", "video", "raw"]),
  format: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  bytes: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
});
export type AddDockFileDto = z.infer<typeof addDockFileDto>;

export const fileIdDto = z.object({
  fileId: z.string().uuid(),
});
export type FileIdDto = z.infer<typeof fileIdDto>;

export const createDockFolderDto = z.object({
  fileDockId: z.string().uuid(),
  parentFolderId: z.string().uuid().nullable().optional(),
  name: z.string(),
  position: z.string().optional(),
});
export type CreateDockFolderDto = z.infer<typeof createDockFolderDto>;

export const folderIdDto = z.object({
  folderId: z.string().uuid(),
});
export type FolderIdDto = z.infer<typeof folderIdDto>;

// Search DTO
export const searchNotesDto = z.object({
  query: z.string(),
  notebookId: z.string().uuid().optional(),
});
export type SearchNotesDto = z.infer<typeof searchNotesDto>;

// Bookmark link preview DTO
export const getLinkPreviewDto = z.object({
  url: z.string().trim().min(1),
});
export type GetLinkPreviewDto = z.infer<typeof getLinkPreviewDto>;
