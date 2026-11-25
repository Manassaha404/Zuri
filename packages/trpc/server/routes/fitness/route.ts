import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { fitnessService } from "../../services";
import {
  addBodyMetricDto,
  addCardioDto,
  addFoodDto,
  addFoodLogDto,
  addGoalDto,
  addInjuryDto,
  addProgressPhotoDto,
  addSavedMealDto,
  addWaterDto,
  advanceSkillDto,
  createCustomExerciseDto,
  createProgramDto,
  createSkillDto,
  foodLogIdDto,
  goalIdDto,
  injuryIdDto,
  programIdDto,
  saveRecoveryLogDto,
  saveWorkoutSessionDto,
  setNutritionTargetsDto,
  updateGoalProgressDto,
} from "./model";

export const fitnessRouter = router({
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await fitnessService.getWorkspace(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  createCustomExercise: protectedProcedure
    .input(createCustomExerciseDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.createCustomExercise(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  saveWorkoutSession: protectedProcedure
    .input(saveWorkoutSessionDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.saveWorkoutSession(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  createProgram: protectedProcedure
    .input(createProgramDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.createProgram(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  advanceProgramWeek: protectedProcedure
    .input(programIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.advanceProgramWeek(
          ctx.user.id,
          input.programId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteProgram: protectedProcedure
    .input(programIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.deleteProgram(ctx.user.id, input.programId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addCardioSession: protectedProcedure
    .input(addCardioDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addCardioSession(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  createSkill: protectedProcedure
    .input(createSkillDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.createSkill(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  advanceSkillStage: protectedProcedure
    .input(advanceSkillDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.advanceSkillStage(
          ctx.user.id,
          input.skillId,
          input.date,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addFood: protectedProcedure
    .input(addFoodDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addFood(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addFoodLog: protectedProcedure
    .input(addFoodLogDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addFoodLog(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  removeFoodLog: protectedProcedure
    .input(foodLogIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.removeFoodLog(ctx.user.id, input.foodLogId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addSavedMeal: protectedProcedure
    .input(addSavedMealDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addSavedMeal(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  setNutritionTargets: protectedProcedure
    .input(setNutritionTargetsDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.setNutritionTargets(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addWaterMl: protectedProcedure
    .input(addWaterDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addWaterMl(
          ctx.user.id,
          input.date,
          input.amountMl,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addBodyMetric: protectedProcedure
    .input(addBodyMetricDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addBodyMetric(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addProgressPhoto: protectedProcedure
    .input(addProgressPhotoDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addProgressPhoto(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  saveRecoveryLog: protectedProcedure
    .input(saveRecoveryLogDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.saveRecoveryLog(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addInjury: protectedProcedure
    .input(addInjuryDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addInjury(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  toggleInjuryStatus: protectedProcedure
    .input(injuryIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.toggleInjuryStatus(
          ctx.user.id,
          input.injuryId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addGoal: protectedProcedure
    .input(addGoalDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.addGoal(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  updateGoalProgress: protectedProcedure
    .input(updateGoalProgressDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.updateGoalProgress(
          ctx.user.id,
          input.goalId,
          input.currentValue,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteGoal: protectedProcedure
    .input(goalIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await fitnessService.deleteGoal(ctx.user.id, input.goalId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
