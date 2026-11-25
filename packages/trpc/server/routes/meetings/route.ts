import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { meetingService } from "../../services";
import {
  createMeetingDto,
  updateMeetingDto,
  meetingIdDto,
  addActionItemDto,
  actionItemIdDto,
} from "./model";

export const meetingsRouter = router({
  // Get full meeting workspace (meetings and stats)
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await meetingService.getUserMeetingWorkspace(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  // Get single meeting by id
  getMeetingById: protectedProcedure
    .input(meetingIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return await meetingService.getMeetingById(
          input.meetingId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Create meeting
  createMeeting: protectedProcedure
    .input(createMeetingDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await meetingService.createMeeting(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Update meeting
  updateMeeting: protectedProcedure
    .input(updateMeetingDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await meetingService.updateMeeting(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Delete meeting permanently
  deleteMeeting: protectedProcedure
    .input(meetingIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await meetingService.deleteMeeting(input.meetingId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Add action item
  addActionItem: protectedProcedure
    .input(addActionItemDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await meetingService.addActionItem(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Toggle action item completion
  toggleActionItem: protectedProcedure
    .input(actionItemIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await meetingService.toggleActionItem(
          input.meetingId,
          input.actionItemId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Delete action item
  deleteActionItem: protectedProcedure
    .input(actionItemIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await meetingService.deleteActionItem(
          input.meetingId,
          input.actionItemId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Convert action item to task
  convertActionItemToTask: protectedProcedure
    .input(actionItemIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await meetingService.convertActionItemToTask(
          input.meetingId,
          input.actionItemId,
          ctx.user.id,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
