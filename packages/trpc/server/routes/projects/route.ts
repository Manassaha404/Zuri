import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { projectBoardService } from "../../services";
import {
  addColumnDto,
  updateColumnDto,
  columnIdDto,
  addCardDto,
  updateCardDto,
  moveCardDto,
  cardIdDto,
  addChecklistItemDto,
  checklistItemIdDto,
  addCommentDto,
  addSprintDto,
  sprintIdDto,
  addMilestoneDto,
  milestoneIdDto,
} from "./model";

export const projectsRouter = router({
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await projectBoardService.getUserProjectBoardWorkspace(
        ctx.user.id,
      );
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  addColumn: protectedProcedure
    .input(addColumnDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.addColumn(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  updateColumn: protectedProcedure
    .input(updateColumnDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.updateColumn(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteColumn: protectedProcedure
    .input(columnIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.deleteColumn(
          input.columnId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addCard: protectedProcedure
    .input(addCardDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.addCard(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  updateCard: protectedProcedure
    .input(updateCardDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.updateCard(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  moveCard: protectedProcedure
    .input(moveCardDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.moveCard(
          ctx.user.id,
          input.cardId,
          input.targetColumnId,
          input.position,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteCard: protectedProcedure
    .input(cardIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.deleteCard(input.cardId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addChecklistItem: protectedProcedure
    .input(addChecklistItemDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.addChecklistItem(
          ctx.user.id,
          input.cardId,
          input.text,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  toggleChecklistItem: protectedProcedure
    .input(checklistItemIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.toggleChecklistItem(
          ctx.user.id,
          input.itemId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteChecklistItem: protectedProcedure
    .input(checklistItemIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.deleteChecklistItem(
          ctx.user.id,
          input.itemId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addComment: protectedProcedure
    .input(addCommentDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.addComment(
          ctx.user.id,
          input.cardId,
          input.author,
          input.text,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addSprint: protectedProcedure
    .input(addSprintDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.addSprint(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteSprint: protectedProcedure
    .input(sprintIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.deleteSprint(
          input.sprintId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addMilestone: protectedProcedure
    .input(addMilestoneDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.addMilestone(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteMilestone: protectedProcedure
    .input(milestoneIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await projectBoardService.deleteMilestone(
          input.milestoneId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
