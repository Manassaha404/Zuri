import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { fileDockService } from "../../services";
import {
  createDockDto,
  renameDockDto,
  dockIdDto,
  createFolderDto,
  renameFolderDto,
  moveFolderDto,
  folderIdDto,
  addFileDto,
  renameFileDto,
  moveFileDto,
  fileIdDto,
} from "./model";

export const fileDockRouter = router({
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await fileDockService.getWorkspace(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  createDock: protectedProcedure
    .input(createDockDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.createDock(ctx.user.id, input.name);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  renameDock: protectedProcedure
    .input(renameDockDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.renameDock(
          ctx.user.id,
          input.fileDockId,
          input.name,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteDock: protectedProcedure
    .input(dockIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.deleteDock(ctx.user.id, input.fileDockId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  createFolder: protectedProcedure
    .input(createFolderDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.createFolder(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  renameFolder: protectedProcedure
    .input(renameFolderDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.renameFolder(
          ctx.user.id,
          input.folderId,
          input.name,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  moveFolder: protectedProcedure
    .input(moveFolderDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.moveFolder(
          ctx.user.id,
          input.folderId,
          input.parentFolderId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteFolder: protectedProcedure
    .input(folderIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.deleteFolder(ctx.user.id, input.folderId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addFile: protectedProcedure
    .input(addFileDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.addFile(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  renameFile: protectedProcedure
    .input(renameFileDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.renameFile(
          ctx.user.id,
          input.fileId,
          input.name,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  moveFile: protectedProcedure
    .input(moveFileDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.moveFile(
          ctx.user.id,
          input.fileId,
          input.targetDockId,
          input.targetFolderId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteFile: protectedProcedure
    .input(fileIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fileDockService.deleteFile(ctx.user.id, input.fileId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
