import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { noteService } from "../../services";
import {
  createNotebookDto,
  updateNotebookDto,
  notebookIdDto,
  reorderNotebookDto,
  getChaptersDto,
  createChapterDto,
  updateChapterDto,
  chapterIdDto,
  reorderChapterDto,
  getPagesDto,
  pageIdDto,
  createPageDto,
  updatePageDto,
  movePageDto,
  reorderPageDto,
  createBlockDto,
  updateBlockDto,
  blockIdDto,
  autosavePageDto,
  saveDiagramDto,
  diagramIdDto,
  getChapterFileDockDto,
  addDockFileDto,
  fileIdDto,
  createDockFolderDto,
  folderIdDto,
  searchNotesDto,
  getLinkPreviewDto,
} from "./model";

export const notesRouter = router({
  // Workspace initialization
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await noteService.getWorkspace(ctx.user.id);
    } catch (error) {
      handleRouteError(error);
    }
  }),

  // Notebooks
  getNotebooks: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await noteService.getNotebooks(ctx.user.id);
    } catch (error) {
      handleRouteError(error);
    }
  }),

  createNotebook: protectedProcedure
    .input(createNotebookDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.createNotebook(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  updateNotebook: protectedProcedure
    .input(updateNotebookDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { notebookId, ...data } = input;
        return await noteService.updateNotebook(notebookId, ctx.user.id, data);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  archiveNotebook: protectedProcedure
    .input(notebookIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.archiveNotebook(input.notebookId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  restoreNotebook: protectedProcedure
    .input(notebookIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.restoreNotebook(input.notebookId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  deleteNotebookPermanently: protectedProcedure
    .input(notebookIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.deleteNotebookPermanently(
          input.notebookId,
          ctx.user.id,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  reorderNotebook: protectedProcedure
    .input(reorderNotebookDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.reorderNotebook(
          input.notebookId,
          ctx.user.id,
          input.position,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  // Chapters
  getChapters: protectedProcedure
    .input(getChaptersDto)
    .query(async ({ input, ctx }) => {
      try {
        return await noteService.getChapters(input.notebookId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  createChapter: protectedProcedure
    .input(createChapterDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.createChapter(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  updateChapter: protectedProcedure
    .input(updateChapterDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { chapterId, ...data } = input;
        return await noteService.updateChapter(chapterId, ctx.user.id, data);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  toggleFavoriteChapter: protectedProcedure
    .input(chapterIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.toggleFavoriteChapter(
          input.chapterId,
          ctx.user.id,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  archiveChapter: protectedProcedure
    .input(chapterIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.archiveChapter(input.chapterId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  restoreChapter: protectedProcedure
    .input(chapterIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.restoreChapter(input.chapterId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  deleteChapterPermanently: protectedProcedure
    .input(chapterIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.deleteChapterPermanently(
          input.chapterId,
          ctx.user.id,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  reorderChapter: protectedProcedure
    .input(reorderChapterDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.reorderChapter(
          input.chapterId,
          ctx.user.id,
          input.position,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  // Pages
  getPages: protectedProcedure
    .input(getPagesDto)
    .query(async ({ input, ctx }) => {
      try {
        return await noteService.getPages(input.chapterId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  getPageById: protectedProcedure
    .input(pageIdDto)
    .query(async ({ input, ctx }) => {
      try {
        return await noteService.getPageById(input.pageId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  createPage: protectedProcedure
    .input(createPageDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.createPage(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  updatePage: protectedProcedure
    .input(updatePageDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { pageId, ...data } = input;
        return await noteService.updatePage(pageId, ctx.user.id, data);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  togglePinPage: protectedProcedure
    .input(pageIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.togglePinPage(input.pageId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  movePage: protectedProcedure
    .input(movePageDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.movePage(
          input.pageId,
          ctx.user.id,
          input.targetNotebookId,
          input.targetChapterId,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  archivePage: protectedProcedure
    .input(pageIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.archivePage(input.pageId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  restorePage: protectedProcedure
    .input(pageIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.restorePage(input.pageId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  deletePagePermanently: protectedProcedure
    .input(pageIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.deletePagePermanently(
          input.pageId,
          ctx.user.id,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  reorderPage: protectedProcedure
    .input(reorderPageDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.reorderPage(
          input.pageId,
          ctx.user.id,
          input.position,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  // Blocks
  getBlocks: protectedProcedure
    .input(pageIdDto)
    .query(async ({ input, ctx }) => {
      try {
        return await noteService.getBlocks(input.pageId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  createBlock: protectedProcedure
    .input(createBlockDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.createBlock(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  updateBlock: protectedProcedure
    .input(updateBlockDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { blockId, ...data } = input;
        return await noteService.updateBlock(blockId, ctx.user.id, data);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  deleteBlock: protectedProcedure
    .input(blockIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.deleteBlock(input.blockId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  // Autosave Page (Page metadata + blocks in atomic batch)
  autosavePage: protectedProcedure
    .input(autosavePageDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.autosavePage(input.pageId, ctx.user.id, {
          title: input.title,
          summary: input.summary,
          blocks: input.blocks,
        });
      } catch (error) {
        handleRouteError(error);
      }
    }),

  // Diagrams
  getDiagram: protectedProcedure
    .input(pageIdDto)
    .query(async ({ input, ctx }) => {
      try {
        return await noteService.getDiagram(input.pageId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  saveDiagram: protectedProcedure
    .input(saveDiagramDto)
    .mutation(async ({ input, ctx }) => {
      try {
        const { pageId, ...data } = input;
        return await noteService.saveDiagram(pageId, ctx.user.id, data);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  deleteDiagram: protectedProcedure
    .input(diagramIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.deleteDiagram(input.diagramId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  // Chapter File Dock & Files
  getChapterFileDock: protectedProcedure
    .input(getChapterFileDockDto)
    .query(async ({ input, ctx }) => {
      try {
        return await noteService.getChapterFileDock(
          input.chapterId,
          ctx.user.id,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  addDockFile: protectedProcedure
    .input(addDockFileDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.addDockFile(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  deleteDockFile: protectedProcedure
    .input(fileIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.deleteDockFile(input.fileId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  createDockFolder: protectedProcedure
    .input(createDockFolderDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.createDockFolder(ctx.user.id, input);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  deleteDockFolder: protectedProcedure
    .input(folderIdDto)
    .mutation(async ({ input, ctx }) => {
      try {
        return await noteService.deleteDockFolder(input.folderId, ctx.user.id);
      } catch (error) {
        handleRouteError(error);
      }
    }),

  // Search & Trash
  searchNotes: protectedProcedure
    .input(searchNotesDto)
    .query(async ({ input, ctx }) => {
      try {
        return await noteService.searchNotes(
          ctx.user.id,
          input.query,
          input.notebookId,
        );
      } catch (error) {
        handleRouteError(error);
      }
    }),

  getTrash: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await noteService.getTrash(ctx.user.id);
    } catch (error) {
      handleRouteError(error);
    }
  }),

  // Bookmark link preview
  getLinkPreview: protectedProcedure
    .input(getLinkPreviewDto)
    .mutation(async ({ input }) => {
      try {
        return await noteService.fetchBookmarkMetadata(input.url);
      } catch (error) {
        handleRouteError(error);
      }
    }),
});
