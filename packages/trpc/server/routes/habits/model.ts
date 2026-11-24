import { z } from "zod";

// Habit DTO schemas
export const createHabitDto = z.object({
  name: z.string().trim().min(1, "Habit name is required"),
  description: z.string().trim().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["boolean", "numeric", "negative"]).optional(),
  frequencyType: z
    .enum(["daily", "weekly", "specific_days", "times_per_week"])
    .optional(),
  frequencyDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  frequencyTimesPerWeek: z.number().int().min(1).max(7).optional(),
  targetValue: z.number().positive().optional(),
  unit: z.string().trim().optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "anytime"]).optional(),
  reminderTime: z.string().trim().optional(),
  stackedAfterHabitId: z.string().uuid().optional(),
  stackRoutineTitle: z.string().trim().optional(),
  graceDaysPerMonth: z.number().int().min(0).optional(),
});
export type CreateHabitDto = z.infer<typeof createHabitDto>;

export const updateHabitDto = z.object({
  habitId: z.string().uuid(),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["boolean", "numeric", "negative"]).optional(),
  frequencyType: z
    .enum(["daily", "weekly", "specific_days", "times_per_week"])
    .optional(),
  frequencyDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  frequencyTimesPerWeek: z.number().int().min(1).max(7).optional(),
  targetValue: z.number().positive().optional(),
  unit: z.string().trim().optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "anytime"]).optional(),
  reminderTime: z.string().trim().optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
  stackedAfterHabitId: z.string().uuid().nullable().optional(),
  stackRoutineTitle: z.string().trim().nullable().optional(),
  graceDaysPerMonth: z.number().int().min(0).optional(),
});
export type UpdateHabitDto = z.infer<typeof updateHabitDto>;

export const habitIdDto = z.object({
  habitId: z.string().uuid(),
});
export type HabitIdDto = z.infer<typeof habitIdDto>;

export const toggleCheckInDto = z.object({
  habitId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  note: z.string().trim().optional(),
  mood: z.enum(["great", "good", "neutral", "low", "stressed"]).optional(),
});
export type ToggleCheckInDto = z.infer<typeof toggleCheckInDto>;

export const setNumericValueDto = z.object({
  habitId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  value: z.number().min(0),
  note: z.string().trim().optional(),
  mood: z.enum(["great", "good", "neutral", "low", "stressed"]).optional(),
});
export type SetNumericValueDto = z.infer<typeof setNumericValueDto>;

export const resetCleanStreakDto = z.object({
  habitId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  slipReason: z.string().trim().optional(),
});
export type ResetCleanStreakDto = z.infer<typeof resetCleanStreakDto>;

export const applyStreakFreezeDto = z.object({
  habitId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  reason: z.string().trim().optional(),
});
export type ApplyStreakFreezeDto = z.infer<typeof applyStreakFreezeDto>;

export const addCheckInNoteDto = z.object({
  habitId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  note: z.string().trim().optional(),
  mood: z.enum(["great", "good", "neutral", "low", "stressed"]).optional(),
  skipReason: z.string().trim().optional(),
});
export type AddCheckInNoteDto = z.infer<typeof addCheckInNoteDto>;

export const createHabitStackDto = z.object({
  title: z.string().trim().min(1, "Routine title is required"),
  habitIds: z
    .array(z.string().uuid())
    .min(1, "At least one habit must be selected"),
});
export type CreateHabitStackDto = z.infer<typeof createHabitStackDto>;

export const reorderRoutineStackDto = z.object({
  title: z.string().trim().min(1, "Routine title is required"),
  habitIds: z.array(z.string().uuid()).min(1),
});
export type ReorderRoutineStackDto = z.infer<typeof reorderRoutineStackDto>;

export const deleteHabitStackDto = z.object({
  routineTitle: z.string().trim().min(1),
});
export type DeleteHabitStackDto = z.infer<typeof deleteHabitStackDto>;
