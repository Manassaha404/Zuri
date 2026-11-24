import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { deadlineService } from "../../services";
import {
  createDeadlineDto,
  updateDeadlineDto,
  deadlineIdDto,
  createDeadlineCategoryDto,
  categoryIdDto,
} from "./model";

export const deadlinesRouter = router({
  // Get full deadline workspace (deadlines, categories, and stats)
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await deadlineService.getUserDeadlineWorkspace(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  // Get categories
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await deadlineService.getCategories(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  // Add category
  addCategory: protectedProcedure
    .input(createDeadlineCategoryDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deadlineService.addCategory(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Delete category
  deleteCategory: protectedProcedure
    .input(categoryIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deadlineService.deleteCategory(
          ctx.user.id,
          input.categoryId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Get single deadline by id
  getDeadlineById: protectedProcedure
    .input(deadlineIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return await deadlineService.getDeadlineById(
          input.deadlineId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Create deadline
  createDeadline: protectedProcedure
    .input(createDeadlineDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deadlineService.createDeadline(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Update deadline
  updateDeadline: protectedProcedure
    .input(updateDeadlineDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deadlineService.updateDeadline(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Toggle completion status
  toggleStatus: protectedProcedure
    .input(deadlineIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deadlineService.toggleStatus(
          input.deadlineId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Delete deadline permanently
  deleteDeadline: protectedProcedure
    .input(deadlineIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await deadlineService.deleteDeadline(
          input.deadlineId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
