import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { habitService } from "../../services";
import {
  createHabitDto,
  updateHabitDto,
  habitIdDto,
  toggleCheckInDto,
  setNumericValueDto,
  resetCleanStreakDto,
  applyStreakFreezeDto,
  addCheckInNoteDto,
  createHabitStackDto,
  reorderRoutineStackDto,
  deleteHabitStackDto,
} from "./model";

export const habitsRouter = router({
  // Get full habit workspace (habits, check-ins, freezes)
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await habitService.getUserHabitWorkspace(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  // Get habits list
  getHabits: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await habitService.getHabits(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  // Get single habit
  getHabitById: protectedProcedure
    .input(habitIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return await habitService.getHabitById(input.habitId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Create habit
  createHabit: protectedProcedure
    .input(createHabitDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.createHabit(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Update habit
  updateHabit: protectedProcedure
    .input(updateHabitDto)
    .mutation(async ({ ctx, input }) => {
      try {
        const { habitId, ...updates } = input;
        return await habitService.updateHabit(habitId, ctx.user.id, {
          ...updates,
          stackedAfterHabitId: updates.stackedAfterHabitId ?? undefined,
          stackRoutineTitle: updates.stackRoutineTitle ?? undefined,
        });
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Archive habit
  archiveHabit: protectedProcedure
    .input(habitIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.archiveHabit(input.habitId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Pause habit
  pauseHabit: protectedProcedure
    .input(habitIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.pauseHabit(input.habitId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Resume habit
  resumeHabit: protectedProcedure
    .input(habitIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.resumeHabit(input.habitId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Delete habit permanently
  deleteHabit: protectedProcedure
    .input(habitIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.deleteHabit(input.habitId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Toggle daily check-in
  toggleCheckIn: protectedProcedure
    .input(toggleCheckInDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.toggleCheckIn(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Set numeric habit value
  setNumericValue: protectedProcedure
    .input(setNumericValueDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.setNumericValue(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Reset clean streak for negative habits
  resetCleanStreak: protectedProcedure
    .input(resetCleanStreakDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.resetCleanStreak(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Apply streak freeze
  applyStreakFreeze: protectedProcedure
    .input(applyStreakFreezeDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.applyStreakFreeze(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Add reflection note or mood
  addCheckInNote: protectedProcedure
    .input(addCheckInNoteDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.addCheckInNote(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Create routine stack
  createHabitStack: protectedProcedure
    .input(createHabitStackDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.createHabitStack(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Reorder steps in routine stack
  reorderRoutineStack: protectedProcedure
    .input(reorderRoutineStackDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.reorderRoutineStack(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Delete / unlink routine stack
  deleteHabitStack: protectedProcedure
    .input(deleteHabitStackDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await habitService.deleteHabitStack(
          ctx.user.id,
          input.routineTitle,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
