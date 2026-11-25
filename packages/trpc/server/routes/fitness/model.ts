import { z } from "zod";

export const createCustomExerciseDto = z.object({
  name: z.string().trim().min(1),
  muscleGroup: z.string().trim().min(1),
  equipment: z.string().trim().min(1),
  defaultRestSeconds: z.number().int().min(10).max(600).optional(),
  secondaryMuscles: z.array(z.string()).optional(),
});

export const saveWorkoutSessionDto = z.object({
  title: z.string().trim().min(1),
  templateId: z.string().uuid().optional(),
  date: z.string().trim().min(1),
  startedAt: z.string().trim().min(1),
  completedAt: z.string().optional(),
  durationMinutes: z.number().int().min(0),
  isDeload: z.boolean().optional(),
  notes: z.string().optional(),
  exercises: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      exerciseName: z.string().trim().min(1),
      muscleGroup: z.string().trim().min(1),
      equipment: z.string().trim().min(1),
      supersetGroupId: z.string().optional(),
      notes: z.string().optional(),
      sets: z.array(
        z.object({
          setNumber: z.number().int().min(1),
          type: z.string().trim().min(1),
          weight: z.number().min(0),
          reps: z.number().int().min(0),
          rpe: z.number().optional(),
          rir: z.number().int().optional(),
          tempo: z.string().optional(),
          restSeconds: z.number().int().min(0),
          completed: z.boolean(),
          prs: z.array(z.string()).optional(),
        }),
      ),
    }),
  ),
});

export const createProgramDto = z.object({
  name: z.string().trim().min(1),
  style: z.string().trim().min(1),
  description: z.string().optional(),
  totalWeeks: z.number().int().min(1).max(52),
  deloadEveryWeeks: z.number().int().min(1).max(12).optional(),
  progressionRule: z.string().optional(),
  templateIds: z.array(z.string()).optional(),
});

export const programIdDto = z.object({
  programId: z.string().uuid(),
});

export const addCardioDto = z.object({
  type: z.string().trim().min(1),
  date: z.string().trim().min(1),
  distanceKm: z.number().min(0),
  durationMinutes: z.number().int().min(1),
  heartRateAvg: z.number().int().optional(),
  calories: z.number().int().min(0),
  notes: z.string().optional(),
});

export const createSkillDto = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  stages: z.array(z.string().trim().min(1)).min(1),
  targetHoldOrReps: z.string().trim().min(1),
});

export const advanceSkillDto = z.object({
  skillId: z.string().uuid(),
  date: z.string().trim().min(1),
});

export const addFoodDto = z.object({
  name: z.string().trim().min(1),
  barcode: z.string().optional(),
  servingSize: z.string().trim().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const addFoodLogDto = z.object({
  date: z.string().trim().min(1),
  meal: z.string().trim().min(1),
  foodId: z.string().optional(),
  name: z.string().trim().min(1),
  servings: z.number().min(0.1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const foodLogIdDto = z.object({
  foodLogId: z.string().uuid(),
});

export const addSavedMealDto = z.object({
  name: z.string().trim().min(1),
  description: z.string(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const setNutritionTargetsDto = z.object({
  calories: z.number().int().min(500),
  protein: z.number().int().min(0),
  carbs: z.number().int().min(0),
  fat: z.number().int().min(0),
  waterMl: z.number().int().min(0),
  goalMode: z.enum(["cut", "maintain", "bulk"]),
});

export const addWaterDto = z.object({
  date: z.string().trim().min(1),
  amountMl: z.number().int(),
});

export const addBodyMetricDto = z.object({
  date: z.string().trim().min(1),
  weight: z.number().min(1),
  bodyFatPct: z.number().optional(),
  chestCm: z.number().optional(),
  waistCm: z.number().optional(),
  armsCm: z.number().optional(),
  thighsCm: z.number().optional(),
});

export const addProgressPhotoDto = z.object({
  date: z.string().trim().min(1),
  pose: z.enum(["Front", "Side", "Back"]),
  weight: z.number().optional(),
  dataUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const saveRecoveryLogDto = z.object({
  date: z.string().trim().min(1),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().int().min(1).max(5),
  soreness: z.number().int().min(1).max(10),
  fatigue: z.number().int().min(1).max(10),
  restingHeartRate: z.number().int().optional(),
  steps: z.number().int().optional(),
  notes: z.string().optional(),
});

export const addInjuryDto = z.object({
  title: z.string().trim().min(1),
  bodyPart: z.string().trim().min(1),
  severity: z.enum(["Mild", "Moderate", "Severe"]),
  status: z.enum(["Active", "Recovering", "Resolved"]),
  startedAt: z.string().trim().min(1),
  avoidExerciseIds: z.array(z.string()),
  notes: z.string().optional(),
});

export const injuryIdDto = z.object({
  injuryId: z.string().uuid(),
});

export const addGoalDto = z.object({
  title: z.string().trim().min(1),
  category: z.enum(["Strength", "Bodyweight", "Cardio", "Consistency"]),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string().trim().min(1),
  targetDate: z.string().trim().min(1),
  completed: z.boolean().optional(),
});

export const updateGoalProgressDto = z.object({
  goalId: z.string().uuid(),
  currentValue: z.number(),
});

export const goalIdDto = z.object({
  goalId: z.string().uuid(),
});
