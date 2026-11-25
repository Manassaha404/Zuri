import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import FitnessService from "../../../fitness";

const fitnessService = new FitnessService();

// Extract authenticated user ID from FastMCP session context
function requireUserId(context: any): string {
  const userId = context?.session?.userId;
  if (!userId) {
    throw new UserError(
      "Unauthorized: This tool requires an authenticated user session.",
    );
  }
  return userId;
}

const workoutSetSchema = z.object({
  setNumber: z.number().int().min(1).describe("1-based set index"),
  type: z
    .string()
    .trim()
    .min(1)
    .describe("Set type, e.g. 'working', 'warmup', 'dropset', 'failure'"),
  weight: z.number().min(0).describe("Weight used (0 for bodyweight)"),
  reps: z.number().int().min(0).describe("Repetitions completed"),
  rpe: z.number().optional().describe("Rate of Perceived Exertion (1-10)"),
  rir: z.number().int().optional().describe("Reps in Reserve"),
  tempo: z.string().optional().describe("Optional tempo e.g. '3-1-1-0'"),
  restSeconds: z.number().int().min(0).describe("Rest duration in seconds"),
  completed: z.boolean().describe("Whether the set was completed"),
  prs: z.array(z.string()).optional().describe("Optional PR tags achieved"),
});

const workoutExerciseSchema = z.object({
  exerciseId: z
    .string()
    .uuid()
    .describe("Valid exerciseId UUID from fitness_get_workspace"),
  exerciseName: z.string().trim().min(1).describe("Exercise display name"),
  muscleGroup: z.string().trim().min(1).describe("Primary muscle group"),
  equipment: z.string().trim().min(1).describe("Equipment used"),
  supersetGroupId: z.string().optional().describe("Optional superset group ID"),
  notes: z.string().optional().describe("Optional exercise notes"),
  sets: z.array(workoutSetSchema).describe("Array of sets performed"),
});

export const fitnessTools = [
  // Workspace Discovery
  {
    name: "fitness_get_workspace",
    description:
      "Retrieve the complete Fitness Tracker workspace for the authenticated user, including exercises catalog, workout templates, workout sessions, training programs, cardio sessions, bodyweight skills, foods, food logs, saved meals, nutrition targets, water logs, body metrics, progress photos, recovery logs, injuries, and fitness goals.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.getWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get fitness workspace");
      }
    },
  },

  // Exercises & Workouts
  {
    name: "fitness_create_custom_exercise",
    description: "Create a custom exercise in the user's exercise catalog.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Exercise name"),
      muscleGroup: z.string().trim().min(1).describe("Primary muscle group"),
      equipment: z
        .string()
        .trim()
        .min(1)
        .describe(
          "Equipment required (e.g. 'Barbell', 'Dumbbell', 'Bodyweight')",
        ),
      defaultRestSeconds: z
        .number()
        .int()
        .min(10)
        .max(600)
        .optional()
        .describe("Default rest time in seconds (10-600)"),
      secondaryMuscles: z
        .array(z.string())
        .optional()
        .describe("Optional secondary muscle groups"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.createCustomExercise(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to create custom exercise",
        );
      }
    },
  },

  {
    name: "fitness_save_workout_session",
    description:
      "Log a completed or in-progress workout session with exercises and sets.",
    parameters: z.object({
      title: z.string().trim().min(1).describe("Workout session title"),
      templateId: z
        .string()
        .uuid()
        .optional()
        .describe("Optional workout template UUID"),
      date: z.string().trim().min(1).describe("Workout date (YYYY-MM-DD)"),
      startedAt: z.string().trim().min(1).describe("ISO 8601 start timestamp"),
      completedAt: z
        .string()
        .optional()
        .describe("Optional ISO 8601 completion timestamp"),
      durationMinutes: z
        .number()
        .int()
        .min(0)
        .describe("Total workout duration in minutes"),
      isDeload: z
        .boolean()
        .optional()
        .describe("Whether this is a deload session"),
      notes: z.string().optional().describe("Optional session notes"),
      exercises: z
        .array(workoutExerciseSchema)
        .describe("Exercises and sets performed"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.saveWorkoutSession(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to save workout session");
      }
    },
  },

  // Programs
  {
    name: "fitness_create_program",
    description: "Create a structured multi-week training program.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Program name"),
      style: z
        .string()
        .trim()
        .min(1)
        .describe(
          "Training style (e.g. 'Push/Pull/Legs', 'Upper/Lower', 'Full Body')",
        ),
      description: z
        .string()
        .optional()
        .describe("Optional program description"),
      totalWeeks: z
        .number()
        .int()
        .min(1)
        .max(52)
        .describe("Total program duration in weeks (1-52)"),
      deloadEveryWeeks: z
        .number()
        .int()
        .min(1)
        .max(12)
        .optional()
        .describe("Optional deload frequency in weeks (1-12)"),
      progressionRule: z
        .string()
        .optional()
        .describe("Optional progressive overload rule"),
      templateIds: z
        .array(z.string())
        .optional()
        .describe("Optional workout template IDs included in the program"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.createProgram(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create program");
      }
    },
  },

  {
    name: "fitness_advance_program_week",
    description: "Advance an active training program to its next week.",
    parameters: z.object({
      programId: z.string().uuid().describe("Program UUID to advance"),
    }),
    execute: async (args: { programId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.advanceProgramWeek(
          userId,
          args.programId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to advance program week");
      }
    },
  },

  {
    name: "fitness_delete_program",
    description: "Delete a training program by its ID.",
    parameters: z.object({
      programId: z.string().uuid().describe("Program UUID to delete"),
    }),
    execute: async (args: { programId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.deleteProgram(
          userId,
          args.programId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete program");
      }
    },
  },

  // Cardio & Skills
  {
    name: "fitness_add_cardio_session",
    description: "Log a cardio session (running, cycling, rowing, HIIT, etc.).",
    parameters: z.object({
      type: z
        .string()
        .trim()
        .min(1)
        .describe("Cardio activity type (e.g. 'Running', 'Cycling', 'Rowing')"),
      date: z.string().trim().min(1).describe("Session date (YYYY-MM-DD)"),
      distanceKm: z.number().min(0).describe("Distance in kilometers"),
      durationMinutes: z.number().int().min(1).describe("Duration in minutes"),
      heartRateAvg: z
        .number()
        .int()
        .optional()
        .describe("Optional average heart rate (bpm)"),
      calories: z.number().int().min(0).describe("Estimated calories burned"),
      notes: z.string().optional().describe("Optional cardio notes"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addCardioSession(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add cardio session");
      }
    },
  },

  {
    name: "fitness_create_skill",
    description:
      "Create a bodyweight/calisthenics skill with progressive stages.",
    parameters: z.object({
      name: z
        .string()
        .trim()
        .min(1)
        .describe("Skill name (e.g. 'Muscle-Up', 'Handstand', 'Front Lever')"),
      category: z.string().trim().min(1).describe("Skill category"),
      stages: z
        .array(z.string().trim().min(1))
        .min(1)
        .describe("Ordered progression stage names"),
      targetHoldOrReps: z
        .string()
        .trim()
        .min(1)
        .describe("Target hold time or reps (e.g. '30s hold' or '5 reps')"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.createSkill(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create skill");
      }
    },
  },

  {
    name: "fitness_advance_skill_stage",
    description: "Advance a bodyweight skill to the next progression stage.",
    parameters: z.object({
      skillId: z.string().uuid().describe("Skill UUID to advance"),
      date: z.string().trim().min(1).describe("Date achieved (YYYY-MM-DD)"),
    }),
    execute: async (args: { skillId: string; date: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.advanceSkillStage(
          userId,
          args.skillId,
          args.date,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to advance skill stage");
      }
    },
  },

  // Nutrition & Hydration
  {
    name: "fitness_add_food",
    description: "Add a custom food item to the user's food catalog.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Food name"),
      barcode: z.string().optional().describe("Optional barcode"),
      servingSize: z
        .string()
        .trim()
        .min(1)
        .describe("Serving size description (e.g. '100g', '1 scoop')"),
      calories: z.number().min(0).describe("Calories per serving"),
      protein: z.number().min(0).describe("Protein grams per serving"),
      carbs: z.number().min(0).describe("Carbohydrate grams per serving"),
      fat: z.number().min(0).describe("Fat grams per serving"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addFood(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add food");
      }
    },
  },

  {
    name: "fitness_add_food_log",
    description: "Log a food entry for a specific date and meal.",
    parameters: z.object({
      date: z.string().trim().min(1).describe("Date (YYYY-MM-DD)"),
      meal: z
        .string()
        .trim()
        .min(1)
        .describe("Meal name (e.g. 'Breakfast', 'Lunch', 'Dinner', 'Snack')"),
      foodId: z.string().optional().describe("Optional food catalog ID"),
      name: z.string().trim().min(1).describe("Food display name"),
      servings: z.number().min(0.1).describe("Number of servings"),
      calories: z.number().min(0).describe("Total calories for this entry"),
      protein: z.number().min(0).describe("Total protein grams"),
      carbs: z.number().min(0).describe("Total carbohydrate grams"),
      fat: z.number().min(0).describe("Total fat grams"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addFoodLog(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add food log");
      }
    },
  },

  {
    name: "fitness_remove_food_log",
    description: "Remove a logged food entry by its ID.",
    parameters: z.object({
      foodLogId: z.string().uuid().describe("Food log UUID to remove"),
    }),
    execute: async (args: { foodLogId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.removeFoodLog(
          userId,
          args.foodLogId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to remove food log");
      }
    },
  },

  {
    name: "fitness_add_saved_meal",
    description: "Save a reusable meal preset with macro totals.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Saved meal name"),
      description: z.string().describe("Meal ingredients/description"),
      calories: z.number().min(0).describe("Total calories"),
      protein: z.number().min(0).describe("Protein grams"),
      carbs: z.number().min(0).describe("Carbohydrate grams"),
      fat: z.number().min(0).describe("Fat grams"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addSavedMeal(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add saved meal");
      }
    },
  },

  {
    name: "fitness_set_nutrition_targets",
    description:
      "Set daily calorie, macro, water targets, and goal mode (cut, maintain, bulk).",
    parameters: z.object({
      calories: z.number().int().min(500).describe("Daily calorie target"),
      protein: z.number().int().min(0).describe("Daily protein target (g)"),
      carbs: z.number().int().min(0).describe("Daily carbohydrate target (g)"),
      fat: z.number().int().min(0).describe("Daily fat target (g)"),
      waterMl: z.number().int().min(0).describe("Daily water target (ml)"),
      goalMode: z
        .enum(["cut", "maintain", "bulk"])
        .describe("Nutrition goal mode"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.setNutritionTargets(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to set nutrition targets");
      }
    },
  },

  {
    name: "fitness_add_water_ml",
    description: "Log water intake in milliliters for a given date.",
    parameters: z.object({
      date: z.string().trim().min(1).describe("Date (YYYY-MM-DD)"),
      amountMl: z.number().int().describe("Water amount in milliliters"),
    }),
    execute: async (args: { date: string; amountMl: number }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addWaterMl(
          userId,
          args.date,
          args.amountMl,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to log water intake");
      }
    },
  },

  // Body Metrics, Recovery, Injuries & Goals
  {
    name: "fitness_add_body_metric",
    description: "Log body weight and optional body composition measurements.",
    parameters: z.object({
      date: z.string().trim().min(1).describe("Measurement date (YYYY-MM-DD)"),
      weight: z.number().min(1).describe("Body weight"),
      bodyFatPct: z.number().optional().describe("Optional body fat %"),
      chestCm: z
        .number()
        .optional()
        .describe("Optional chest measurement (cm)"),
      waistCm: z
        .number()
        .optional()
        .describe("Optional waist measurement (cm)"),
      armsCm: z.number().optional().describe("Optional arms measurement (cm)"),
      thighsCm: z
        .number()
        .optional()
        .describe("Optional thighs measurement (cm)"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addBodyMetric(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add body metric");
      }
    },
  },

  {
    name: "fitness_save_recovery_log",
    description:
      "Save daily recovery metrics (sleep, soreness, fatigue, resting HR, steps).",
    parameters: z.object({
      date: z.string().trim().min(1).describe("Date (YYYY-MM-DD)"),
      sleepHours: z.number().min(0).max(24).describe("Hours slept (0-24)"),
      sleepQuality: z
        .number()
        .int()
        .min(1)
        .max(5)
        .describe("Sleep quality rating (1-5)"),
      soreness: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe("Muscle soreness rating (1-10)"),
      fatigue: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe("Fatigue rating (1-10)"),
      restingHeartRate: z
        .number()
        .int()
        .optional()
        .describe("Optional resting heart rate (bpm)"),
      steps: z.number().int().optional().describe("Optional daily step count"),
      notes: z.string().optional().describe("Optional recovery notes"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.saveRecoveryLog(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to save recovery log");
      }
    },
  },

  {
    name: "fitness_add_injury",
    description:
      "Record an injury or physical limitation and exercises to avoid.",
    parameters: z.object({
      title: z.string().trim().min(1).describe("Injury title"),
      bodyPart: z.string().trim().min(1).describe("Affected body part"),
      severity: z
        .enum(["Mild", "Moderate", "Severe"])
        .describe("Injury severity"),
      status: z
        .enum(["Active", "Recovering", "Resolved"])
        .describe("Current injury status"),
      startedAt: z.string().trim().min(1).describe("Start date (YYYY-MM-DD)"),
      avoidExerciseIds: z
        .array(z.string())
        .describe("Exercise IDs to avoid while injured (can be empty array)"),
      notes: z.string().optional().describe("Optional injury notes"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addInjury(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add injury");
      }
    },
  },

  {
    name: "fitness_toggle_injury_status",
    description:
      "Cycle/toggle an injury's status (Active -> Recovering -> Resolved).",
    parameters: z.object({
      injuryId: z.string().uuid().describe("Injury UUID to update"),
    }),
    execute: async (args: { injuryId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.toggleInjuryStatus(
          userId,
          args.injuryId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to toggle injury status");
      }
    },
  },

  {
    name: "fitness_add_goal",
    description: "Create a new fitness goal.",
    parameters: z.object({
      title: z.string().trim().min(1).describe("Goal title"),
      category: z
        .enum(["Strength", "Bodyweight", "Cardio", "Consistency"])
        .describe("Goal category"),
      currentValue: z.number().describe("Starting/current numeric value"),
      targetValue: z.number().describe("Target numeric value"),
      unit: z
        .string()
        .trim()
        .min(1)
        .describe("Unit (e.g. 'kg', 'lbs', 'km', 'days')"),
      targetDate: z.string().trim().min(1).describe("Target date (YYYY-MM-DD)"),
      completed: z.boolean().optional().describe("Optional completion flag"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.addGoal(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add goal");
      }
    },
  },

  {
    name: "fitness_update_goal_progress",
    description: "Update the current numeric progress of a fitness goal.",
    parameters: z.object({
      goalId: z.string().uuid().describe("Goal UUID to update"),
      currentValue: z.number().describe("Updated current value"),
    }),
    execute: async (
      args: { goalId: string; currentValue: number },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.updateGoalProgress(
          userId,
          args.goalId,
          args.currentValue,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update goal progress");
      }
    },
  },

  {
    name: "fitness_delete_goal",
    description: "Delete a fitness goal by its ID.",
    parameters: z.object({
      goalId: z.string().uuid().describe("Goal UUID to delete"),
    }),
    execute: async (args: { goalId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await fitnessService.deleteGoal(userId, args.goalId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete goal");
      }
    },
  },
];

export function registerFitnessTools(server: FastMCP<any>) {
  for (const tool of fitnessTools) {
    server.addTool(tool as any);
  }
}

export default registerFitnessTools;
