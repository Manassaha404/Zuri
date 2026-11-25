import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import DeadlineService from "../../../deadlines";

const deadlineService = new DeadlineService();

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

export const deadlineTools = [
  // Workspace & Stats
  {
    name: "deadlines_get_workspace",
    description:
      "Retrieve the complete deadline workspace data including active deadlines, custom/system categories, reminders, countdowns, and completion/punctuality statistics for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.getUserDeadlineWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to get deadline workspace",
        );
      }
    },
  },

  // Single Deadline Query
  {
    name: "deadlines_get_deadline_by_id",
    description: "Get a single deadline with reminders by its deadlineId.",
    parameters: z.object({
      deadlineId: z
        .string()
        .uuid()
        .describe("Unique identifier of the deadline"),
    }),
    execute: async (args: { deadlineId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.getDeadlineById(
          args.deadlineId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get deadline");
      }
    },
  },

  // Create Deadline
  {
    name: "deadlines_create_deadline",
    description:
      "Create a new commitment, assignment, exam, project deliverable, bill, or application deadline with due date/time, optional soft deadline target, priority, category, reminders, and recurrence.",
    parameters: z.object({
      title: z.string().min(1).describe("Title of the deadline"),
      description: z
        .string()
        .optional()
        .describe(
          "Optional detailed notes, guidelines, or submission instructions",
        ),
      category: z
        .string()
        .optional()
        .describe(
          "Category name (e.g. 'assignment', 'exam', 'project', 'bill', 'application', or custom category name)",
        ),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("Priority urgency level (default: 'medium')"),
      status: z
        .enum(["upcoming", "in_progress", "done", "missed"])
        .optional()
        .describe("Status of the deadline (default: 'upcoming')"),
      dueDate: z
        .string()
        .describe(
          "Due date and time in ISO format or valid date string (e.g. '2026-11-30T17:00:00Z')",
        ),
      softDueDate: z
        .string()
        .optional()
        .describe(
          "Optional early target/soft deadline in ISO format (e.g. '2026-11-28T23:59:00Z')",
        ),
      recurrence: z
        .enum(["none", "daily", "weekly", "biweekly", "monthly", "yearly"])
        .optional()
        .describe("Recurrence rule (default: 'none')"),
      reminders: z
        .array(z.enum(["1_hour", "1_day", "3_days", "1_week", "2_weeks"]))
        .optional()
        .describe(
          "Reminder offsets to trigger notifications prior to deadline",
        ),
    }),
    execute: async (
      args: {
        title: string;
        description?: string;
        category?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        status?: "upcoming" | "in_progress" | "done" | "missed";
        dueDate: string;
        softDueDate?: string;
        recurrence?:
          | "none"
          | "daily"
          | "weekly"
          | "biweekly"
          | "monthly"
          | "yearly";
        reminders?: ("1_hour" | "1_day" | "3_days" | "1_week" | "2_weeks")[];
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.createDeadline(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create deadline");
      }
    },
  },

  // Update Deadline
  {
    name: "deadlines_update_deadline",
    description:
      "Update an existing deadline: title, description, category, priority, status, due date, soft target date, recurrence, or reminder offsets.",
    parameters: z.object({
      deadlineId: z
        .string()
        .uuid()
        .describe("Unique identifier of the deadline to update"),
      title: z.string().min(1).optional().describe("New title"),
      description: z.string().optional().describe("New description or notes"),
      category: z.string().optional().describe("New category name"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("New priority level"),
      status: z
        .enum(["upcoming", "in_progress", "done", "missed"])
        .optional()
        .describe("New status"),
      dueDate: z.string().optional().describe("New due date/time (ISO format)"),
      softDueDate: z
        .string()
        .nullable()
        .optional()
        .describe("New soft target date (ISO format or null to clear)"),
      recurrence: z
        .enum(["none", "daily", "weekly", "biweekly", "monthly", "yearly"])
        .optional()
        .describe("New recurrence pattern"),
      reminders: z
        .array(z.enum(["1_hour", "1_day", "3_days", "1_week", "2_weeks"]))
        .optional()
        .describe("New reminder offsets list"),
    }),
    execute: async (
      args: {
        deadlineId: string;
        title?: string;
        description?: string;
        category?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        status?: "upcoming" | "in_progress" | "done" | "missed";
        dueDate?: string;
        softDueDate?: string | null;
        recurrence?:
          | "none"
          | "daily"
          | "weekly"
          | "biweekly"
          | "monthly"
          | "yearly";
        reminders?: ("1_hour" | "1_day" | "3_days" | "1_week" | "2_weeks")[];
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.updateDeadline(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update deadline");
      }
    },
  },

  // Toggle Completion Status
  {
    name: "deadlines_toggle_status",
    description:
      "Toggle completion status of a deadline between 'done' and 'in_progress', automatically updating completion timestamps and statistics.",
    parameters: z.object({
      deadlineId: z
        .string()
        .uuid()
        .describe("Unique identifier of the deadline"),
    }),
    execute: async (args: { deadlineId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.toggleStatus(
          args.deadlineId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to toggle deadline status",
        );
      }
    },
  },

  // Delete Deadline
  {
    name: "deadlines_delete_deadline",
    description:
      "Permanently delete a deadline record and its associated reminders.",
    parameters: z.object({
      deadlineId: z
        .string()
        .uuid()
        .describe("Unique identifier of the deadline to delete"),
    }),
    execute: async (args: { deadlineId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.deleteDeadline(
          args.deadlineId,
          userId,
        );
        return JSON.stringify({ success: result });
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete deadline");
      }
    },
  },

  // Categories Query
  {
    name: "deadlines_get_categories",
    description:
      "Get all system and custom deadline categories (names, icons, colors, and system status).",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.getCategories(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to get deadline categories",
        );
      }
    },
  },

  // Add Category
  {
    name: "deadlines_add_category",
    description:
      "Create a custom deadline category with a display name, hex color badge, and icon identifier.",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Name of the category"),
      color: z
        .string()
        .optional()
        .describe("Hex color string (e.g. '#3b82f6', '#10b981')"),
      icon: z
        .string()
        .optional()
        .describe("Icon identifier name (e.g. 'Tag', 'FolderGit2', 'Receipt')"),
    }),
    execute: async (
      args: { name: string; color?: string; icon?: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.addCategory(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create category");
      }
    },
  },

  // Delete Category
  {
    name: "deadlines_delete_category",
    description:
      "Delete a custom deadline category by categoryId (system categories cannot be deleted).",
    parameters: z.object({
      categoryId: z
        .string()
        .uuid()
        .describe("Unique identifier of the custom category"),
    }),
    execute: async (args: { categoryId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await deadlineService.deleteCategory(
          userId,
          args.categoryId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete category");
      }
    },
  },
];

export function registerDeadlineTools(server: FastMCP<any>) {
  for (const tool of deadlineTools) {
    server.addTool(tool as any);
  }
}
