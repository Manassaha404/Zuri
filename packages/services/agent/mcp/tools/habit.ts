import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import HabitService from "../../../habits";

const habitService = new HabitService();

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

export const habitTools = [
  // Workspace
  {
    name: "habits_get_workspace",
    description:
      "Retrieve the complete habit workspace data including all habits, check-ins, and streak freezes for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.getUserHabitWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get habit workspace");
      }
    },
  },

  // Habits Query
  {
    name: "habits_get_habits",
    description:
      "Get all habits for the authenticated user ordered by creation date descending.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.getHabits(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get habits");
      }
    },
  },
  {
    name: "habits_get_habit_by_id",
    description: "Get details of a specific habit by its ID.",
    parameters: z.object({
      habitId: z.string().uuid().describe("Unique identifier of the habit"),
    }),
    execute: async (args: { habitId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.getHabitById(args.habitId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get habit");
      }
    },
  },

  // Habit Mutation
  {
    name: "habits_create_habit",
    description:
      "Create a new habit with schedule, target metrics, and routine stack configuration.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Name of the habit"),
      description: z
        .string()
        .trim()
        .optional()
        .describe("Optional description of the habit"),
      icon: z
        .string()
        .optional()
        .describe(
          "Icon name (Lucide icon, e.g. 'Sparkles', 'Activity', 'Book')",
        ),
      color: z.string().optional().describe("Hex color code for the habit"),
      type: z
        .enum(["boolean", "numeric", "negative"])
        .optional()
        .describe(
          "Type of habit: 'boolean' (done/not done), 'numeric' (with numeric target), or 'negative' (clean days tracker)",
        ),
      frequencyType: z
        .enum(["daily", "weekly", "specific_days", "times_per_week"])
        .optional()
        .describe("Frequency cadence for the habit"),
      frequencyDaysOfWeek: z
        .array(z.number().int().min(0).max(6))
        .optional()
        .describe(
          "Days of the week (0 for Sunday to 6 for Saturday) when frequencyType is 'specific_days'",
        ),
      frequencyTimesPerWeek: z
        .number()
        .int()
        .min(1)
        .max(7)
        .optional()
        .describe(
          "Number of times per week required when frequencyType is 'times_per_week'",
        ),
      targetValue: z
        .number()
        .positive()
        .optional()
        .describe(
          "Target numeric value for numeric habits (e.g. 8 for glasses of water)",
        ),
      unit: z
        .string()
        .trim()
        .optional()
        .describe(
          "Unit of measurement for numeric habits (e.g. 'pages', 'minutes', 'glasses')",
        ),
      timeOfDay: z
        .enum(["morning", "afternoon", "evening", "anytime"])
        .optional()
        .describe("Preferred time of day for performing the habit"),
      reminderTime: z
        .string()
        .trim()
        .optional()
        .describe(
          "Time of day for habit reminder in HH:mm format (e.g. '08:00')",
        ),
      stackedAfterHabitId: z
        .string()
        .uuid()
        .optional()
        .describe("ID of the predecessor habit this habit is stacked after"),
      stackRoutineTitle: z
        .string()
        .trim()
        .optional()
        .describe(
          "Routine stack title grouping this habit into a sequence (e.g. 'Morning Routine')",
        ),
      graceDaysPerMonth: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          "Allowed monthly streak freeze protection days (defaults to 2)",
        ),
    }),
    execute: async (
      args: {
        name: string;
        description?: string;
        icon?: string;
        color?: string;
        type?: "boolean" | "numeric" | "negative";
        frequencyType?: "daily" | "weekly" | "specific_days" | "times_per_week";
        frequencyDaysOfWeek?: number[];
        frequencyTimesPerWeek?: number;
        targetValue?: number;
        unit?: string;
        timeOfDay?: "morning" | "afternoon" | "evening" | "anytime";
        reminderTime?: string;
        stackedAfterHabitId?: string;
        stackRoutineTitle?: string;
        graceDaysPerMonth?: number;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.createHabit(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create habit");
      }
    },
  },
  {
    name: "habits_update_habit",
    description:
      "Update existing habit properties such as name, schedule, target value, or routine stacking.",
    parameters: z.object({
      habitId: z.string().uuid().describe("Unique identifier of the habit"),
      name: z.string().trim().min(1).optional().describe("Updated habit name"),
      description: z
        .string()
        .trim()
        .optional()
        .describe("Updated habit description"),
      icon: z.string().optional().describe("Updated icon name"),
      color: z.string().optional().describe("Updated hex color code"),
      type: z
        .enum(["boolean", "numeric", "negative"])
        .optional()
        .describe("Updated habit type"),
      frequencyType: z
        .enum(["daily", "weekly", "specific_days", "times_per_week"])
        .optional()
        .describe("Updated frequency cadence"),
      frequencyDaysOfWeek: z
        .array(z.number().int().min(0).max(6))
        .optional()
        .describe("Updated days of week for specific_days"),
      frequencyTimesPerWeek: z
        .number()
        .int()
        .min(1)
        .max(7)
        .optional()
        .describe("Updated times per week"),
      targetValue: z
        .number()
        .positive()
        .optional()
        .describe("Updated target value for numeric habits"),
      unit: z
        .string()
        .trim()
        .optional()
        .describe("Updated unit of measurement"),
      timeOfDay: z
        .enum(["morning", "afternoon", "evening", "anytime"])
        .optional()
        .describe("Updated time of day"),
      reminderTime: z
        .string()
        .trim()
        .optional()
        .describe("Updated reminder time in HH:mm"),
      status: z
        .enum(["active", "paused", "archived"])
        .optional()
        .describe("Updated habit lifecycle status"),
      stackedAfterHabitId: z
        .string()
        .uuid()
        .nullable()
        .optional()
        .describe("Updated predecessor habit ID, or null to unlink"),
      stackRoutineTitle: z
        .string()
        .trim()
        .nullable()
        .optional()
        .describe(
          "Updated routine stack title, or null to remove from routine",
        ),
      graceDaysPerMonth: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Updated monthly streak freeze days"),
    }),
    execute: async (
      args: {
        habitId: string;
        name?: string;
        description?: string;
        icon?: string;
        color?: string;
        type?: "boolean" | "numeric" | "negative";
        frequencyType?: "daily" | "weekly" | "specific_days" | "times_per_week";
        frequencyDaysOfWeek?: number[];
        frequencyTimesPerWeek?: number;
        targetValue?: number;
        unit?: string;
        timeOfDay?: "morning" | "afternoon" | "evening" | "anytime";
        reminderTime?: string;
        status?: "active" | "paused" | "archived";
        stackedAfterHabitId?: string | null;
        stackRoutineTitle?: string | null;
        graceDaysPerMonth?: number;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      const { habitId, stackedAfterHabitId, ...rest } = args;
      try {
        const result = await habitService.updateHabit(habitId, userId, {
          ...rest,
          stackedAfterHabitId:
            stackedAfterHabitId === null ? undefined : stackedAfterHabitId,
          stackRoutineTitle:
            rest.stackRoutineTitle === null
              ? undefined
              : rest.stackRoutineTitle,
        });
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update habit");
      }
    },
  },
  {
    name: "habits_archive_habit",
    description: "Archive (soft-delete) a habit.",
    parameters: z.object({
      habitId: z
        .string()
        .uuid()
        .describe("Unique identifier of the habit to archive"),
    }),
    execute: async (args: { habitId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.archiveHabit(args.habitId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to archive habit");
      }
    },
  },
  {
    name: "habits_pause_habit",
    description: "Pause an active habit temporarily.",
    parameters: z.object({
      habitId: z
        .string()
        .uuid()
        .describe("Unique identifier of the habit to pause"),
    }),
    execute: async (args: { habitId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.pauseHabit(args.habitId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to pause habit");
      }
    },
  },
  {
    name: "habits_resume_habit",
    description: "Resume a paused or archived habit back to active status.",
    parameters: z.object({
      habitId: z
        .string()
        .uuid()
        .describe("Unique identifier of the habit to resume"),
    }),
    execute: async (args: { habitId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.resumeHabit(args.habitId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to resume habit");
      }
    },
  },
  {
    name: "habits_delete_habit",
    description:
      "Permanently delete a habit and all associated check-ins and streak freezes.",
    parameters: z.object({
      habitId: z
        .string()
        .uuid()
        .describe("Unique identifier of the habit to permanently delete"),
    }),
    execute: async (args: { habitId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.deleteHabit(args.habitId, userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete habit");
      }
    },
  },

  // Check-Ins & Streaks
  {
    name: "habits_toggle_check_in",
    description:
      "Toggle daily completion status for a habit on a specific date (YYYY-MM-DD), with optional reflection note and mood.",
    parameters: z.object({
      habitId: z.string().uuid().describe("Unique identifier of the habit"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Target date in YYYY-MM-DD format"),
      note: z
        .string()
        .trim()
        .optional()
        .describe("Optional reflection note for this check-in"),
      mood: z
        .enum(["great", "good", "neutral", "low", "stressed"])
        .optional()
        .describe("Optional mood log for this check-in"),
    }),
    execute: async (
      args: {
        habitId: string;
        date: string;
        note?: string;
        mood?: "great" | "good" | "neutral" | "low" | "stressed";
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.toggleCheckIn(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to toggle check-in");
      }
    },
  },
  {
    name: "habits_set_numeric_value",
    description:
      "Record or update progress value for a numeric habit on a specific date (YYYY-MM-DD). Automatically marks completed when target is met.",
    parameters: z.object({
      habitId: z.string().uuid().describe("Unique identifier of the habit"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Target date in YYYY-MM-DD format"),
      value: z
        .number()
        .min(0)
        .describe("Recorded progress value (e.g. 5 for 5 km run)"),
      note: z
        .string()
        .trim()
        .optional()
        .describe("Optional reflection note for this check-in"),
      mood: z
        .enum(["great", "good", "neutral", "low", "stressed"])
        .optional()
        .describe("Optional mood log for this check-in"),
    }),
    execute: async (
      args: {
        habitId: string;
        date: string;
        value: number;
        note?: string;
        mood?: "great" | "good" | "neutral" | "low" | "stressed";
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.setNumericValue(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to set numeric value");
      }
    },
  },
  {
    name: "habits_reset_clean_streak",
    description:
      "Reset the clean counter for a negative habit upon relapse, recording the slip event and reason.",
    parameters: z.object({
      habitId: z
        .string()
        .uuid()
        .describe("Unique identifier of the negative habit"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Date of relapse in YYYY-MM-DD format"),
      slipReason: z
        .string()
        .trim()
        .optional()
        .describe(
          "Optional explanation or trigger description for the relapse",
        ),
    }),
    execute: async (
      args: { habitId: string; date: string; slipReason?: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.resetCleanStreak(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to reset clean streak");
      }
    },
  },
  {
    name: "habits_apply_streak_freeze",
    description:
      "Protect a streak on a missed day by consuming one of the allowed monthly grace days.",
    parameters: z.object({
      habitId: z.string().uuid().describe("Unique identifier of the habit"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Missed date to freeze in YYYY-MM-DD format"),
      reason: z
        .string()
        .trim()
        .optional()
        .describe(
          "Optional reason for applying streak freeze (e.g. 'Traveling')",
        ),
    }),
    execute: async (
      args: { habitId: string; date: string; reason?: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.applyStreakFreeze(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to apply streak freeze");
      }
    },
  },
  {
    name: "habits_add_check_in_note",
    description:
      "Add or update a reflection note, mood, or skip reason on a check-in for a specific date.",
    parameters: z.object({
      habitId: z.string().uuid().describe("Unique identifier of the habit"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .describe("Check-in date in YYYY-MM-DD format"),
      note: z
        .string()
        .trim()
        .optional()
        .describe("Reflection note for the check-in"),
      mood: z
        .enum(["great", "good", "neutral", "low", "stressed"])
        .optional()
        .describe("Mood rating for the check-in"),
      skipReason: z
        .string()
        .trim()
        .optional()
        .describe("Reason for skipping habit on this date"),
    }),
    execute: async (
      args: {
        habitId: string;
        date: string;
        note?: string;
        mood?: "great" | "good" | "neutral" | "low" | "stressed";
        skipReason?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.addCheckInNote(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add check-in note");
      }
    },
  },

  // Routines & Habit Stacking
  {
    name: "habits_create_habit_stack",
    description:
      "Create a sequential habit stack routine chaining multiple habits in an ordered sequence.",
    parameters: z.object({
      title: z
        .string()
        .trim()
        .min(1)
        .describe("Routine stack title (e.g. 'Morning Launchpad')"),
      habitIds: z
        .array(z.string().uuid())
        .min(1)
        .describe("Ordered array of habit IDs from first to last in sequence"),
    }),
    execute: async (
      args: { title: string; habitIds: string[] },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.createHabitStack(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create habit stack");
      }
    },
  },
  {
    name: "habits_reorder_routine_stack",
    description: "Reorder habits within an existing routine stack.",
    parameters: z.object({
      title: z
        .string()
        .trim()
        .min(1)
        .describe("Routine stack title to reorder"),
      habitIds: z
        .array(z.string().uuid())
        .min(1)
        .describe("New sequential ordering of habit IDs for the routine"),
    }),
    execute: async (
      args: { title: string; habitIds: string[] },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.reorderRoutineStack(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to reorder routine stack");
      }
    },
  },
  {
    name: "habits_delete_habit_stack",
    description:
      "Unlink and delete a habit routine stack by title without deleting individual habits.",
    parameters: z.object({
      routineTitle: z
        .string()
        .trim()
        .min(1)
        .describe("Routine stack title to unlink and delete"),
    }),
    execute: async (args: { routineTitle: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await habitService.deleteHabitStack(
          userId,
          args.routineTitle,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete habit stack");
      }
    },
  },
];

// Register all habit tools to a FastMCP server instance
export function registerHabitTools(server: FastMCP<any>) {
  for (const tool of habitTools) {
    server.addTool(tool as any);
  }
}

export default registerHabitTools;
