import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import TaskService, {
  type ProjectStatus,
  type TaskPriority,
  type TaskRecurrence,
  type TaskReminderOffset,
  type TaskStatus,
} from "../../../tasks";

const taskService = new TaskService();

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

const subtaskInputSchema = z.object({
  text: z.string().trim().min(1),
  completed: z.boolean().optional(),
});

export const taskTools = [
  // Workspace
  {
    name: "tasks_get_workspace",
    description:
      "Retrieve the complete task workspace including shared projects (auto-seeding 'Inbox' if empty) and all hydrated tasks with their subtasks for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.getUserTaskWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get task workspace");
      }
    },
  },

  // Projects
  {
    name: "tasks_create_project",
    description:
      "Create a new shared project (used by both Tasks and Kanban Project Boards).",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Project name"),
      color: z
        .string()
        .optional()
        .describe("Hex color string (default: '#3b82f6')"),
      description: z
        .string()
        .optional()
        .describe("Optional project description"),
      status: z
        .enum(["planning", "active", "on_hold", "completed"])
        .optional()
        .describe("Project status (default: 'active')"),
      deadline: z
        .string()
        .optional()
        .describe("Optional project deadline (YYYY-MM-DD)"),
    }),
    execute: async (
      args: {
        name: string;
        color?: string;
        description?: string;
        status?: ProjectStatus;
        deadline?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.createProject(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create project");
      }
    },
  },

  {
    name: "tasks_update_project",
    description:
      "Update an existing shared project's name, color, description, status, or deadline.",
    parameters: z.object({
      projectId: z
        .string()
        .uuid()
        .describe("Unique identifier of the project to update"),
      name: z.string().trim().min(1).optional().describe("New project name"),
      color: z.string().optional().describe("New hex color string"),
      description: z
        .string()
        .nullable()
        .optional()
        .describe("New description or null to clear"),
      status: z
        .enum(["planning", "active", "on_hold", "completed"])
        .optional()
        .describe("New project status"),
      deadline: z
        .string()
        .nullable()
        .optional()
        .describe("New deadline (YYYY-MM-DD) or null to clear"),
    }),
    execute: async (
      args: {
        projectId: string;
        name?: string;
        color?: string;
        description?: string | null;
        status?: ProjectStatus;
        deadline?: string | null;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.updateProject(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update project");
      }
    },
  },

  {
    name: "tasks_delete_project",
    description: "Permanently delete a shared project by projectId.",
    parameters: z.object({
      projectId: z
        .string()
        .uuid()
        .describe("Unique identifier of the project to delete"),
    }),
    execute: async (args: { projectId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.deleteProject(args.projectId, userId);
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete project");
      }
    },
  },

  // Tasks
  {
    name: "tasks_create_task",
    description:
      "Create a new task with optional project assignment (defaults to Inbox), due date/time, priority, status, tags, recurrence, reminder, time estimate, and subtasks.",
    parameters: z.object({
      projectId: z
        .string()
        .uuid()
        .optional()
        .describe("Optional project ID (defaults to default Inbox project)"),
      title: z.string().trim().min(1).describe("Task title"),
      description: z
        .string()
        .optional()
        .describe("Optional task description or notes"),
      dueDate: z.string().optional().describe("Optional due date (YYYY-MM-DD)"),
      dueTime: z
        .string()
        .optional()
        .describe("Optional due time (HH:mm 24h format)"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("Task priority (default: 'medium')"),
      status: z
        .enum(["todo", "doing", "done"])
        .optional()
        .describe("Task status (default: 'todo')"),
      tags: z.array(z.string()).optional().describe("Optional array of tags"),
      recurrence: z
        .enum(["none", "daily", "weekly", "biweekly", "monthly"])
        .optional()
        .describe("Recurrence rule (default: 'none')"),
      reminder: z
        .enum(["none", "at_time", "10m", "30m", "1h", "1d"])
        .optional()
        .describe("Reminder offset (default: 'none')"),
      estimateMinutes: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Estimated duration in minutes"),
      subtasks: z
        .array(subtaskInputSchema)
        .optional()
        .describe("Optional initial list of subtasks"),
    }),
    execute: async (
      args: {
        projectId?: string;
        title: string;
        description?: string;
        dueDate?: string;
        dueTime?: string;
        priority?: TaskPriority;
        status?: TaskStatus;
        tags?: string[];
        recurrence?: TaskRecurrence;
        reminder?: TaskReminderOffset;
        estimateMinutes?: number;
        subtasks?: Array<{ text: string; completed?: boolean }>;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.createTask(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create task");
      }
    },
  },

  {
    name: "tasks_update_task",
    description:
      "Update an existing task's project, title, description, due date/time, priority, status, tags, recurrence, reminder, time estimates/logged minutes, or subtasks (replaces subtasks atomically when provided).",
    parameters: z.object({
      taskId: z
        .string()
        .uuid()
        .describe("Unique identifier of the task to update"),
      projectId: z.string().uuid().optional().describe("New project ID"),
      title: z.string().trim().min(1).optional().describe("New title"),
      description: z
        .string()
        .nullable()
        .optional()
        .describe("New description or null to clear"),
      dueDate: z
        .string()
        .nullable()
        .optional()
        .describe("New due date (YYYY-MM-DD) or null to clear"),
      dueTime: z
        .string()
        .nullable()
        .optional()
        .describe("New due time (HH:mm) or null to clear"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("New priority"),
      status: z
        .enum(["todo", "doing", "done"])
        .optional()
        .describe("New status ('todo' | 'doing' | 'done')"),
      tags: z.array(z.string()).optional().describe("Replacement tags array"),
      recurrence: z
        .enum(["none", "daily", "weekly", "biweekly", "monthly"])
        .optional()
        .describe("New recurrence rule"),
      reminder: z
        .enum(["none", "at_time", "10m", "30m", "1h", "1d"])
        .optional()
        .describe("New reminder offset"),
      estimateMinutes: z
        .number()
        .int()
        .min(0)
        .nullable()
        .optional()
        .describe("New estimate in minutes or null to clear"),
      loggedMinutes: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Total logged minutes"),
      subtasks: z
        .array(subtaskInputSchema)
        .optional()
        .describe("Complete replacement array of subtasks"),
    }),
    execute: async (
      args: {
        taskId: string;
        projectId?: string;
        title?: string;
        description?: string | null;
        dueDate?: string | null;
        dueTime?: string | null;
        priority?: TaskPriority;
        status?: TaskStatus;
        tags?: string[];
        recurrence?: TaskRecurrence;
        reminder?: TaskReminderOffset;
        estimateMinutes?: number | null;
        loggedMinutes?: number;
        subtasks?: Array<{ text: string; completed?: boolean }>;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.updateTask(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update task");
      }
    },
  },

  {
    name: "tasks_delete_task",
    description: "Permanently delete a task and its subtasks by taskId.",
    parameters: z.object({
      taskId: z
        .string()
        .uuid()
        .describe("Unique identifier of the task to delete"),
    }),
    execute: async (args: { taskId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.deleteTask(args.taskId, userId);
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete task");
      }
    },
  },

  // Subtasks
  {
    name: "tasks_add_subtask",
    description: "Add a new subtask to an existing task.",
    parameters: z.object({
      taskId: z.string().uuid().describe("Parent task ID"),
      text: z.string().trim().min(1).describe("Subtask text"),
    }),
    execute: async (args: { taskId: string; text: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.addSubtask(
          userId,
          args.taskId,
          args.text,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add subtask");
      }
    },
  },

  {
    name: "tasks_toggle_subtask",
    description: "Toggle completion status of a subtask by subtaskId.",
    parameters: z.object({
      subtaskId: z.string().uuid().describe("Unique identifier of the subtask"),
    }),
    execute: async (args: { subtaskId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.toggleSubtask(userId, args.subtaskId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to toggle subtask");
      }
    },
  },

  {
    name: "tasks_delete_subtask",
    description: "Delete a subtask by subtaskId.",
    parameters: z.object({
      subtaskId: z
        .string()
        .uuid()
        .describe("Unique identifier of the subtask to delete"),
    }),
    execute: async (args: { subtaskId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await taskService.deleteSubtask(userId, args.subtaskId);
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete subtask");
      }
    },
  },
];

export function registerTaskTools(server: FastMCP<any>) {
  for (const tool of taskTools) {
    server.addTool(tool as any);
  }
}
