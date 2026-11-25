import { z } from "zod";

export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusSchema = z.enum(["todo", "doing", "done"]);
export const taskRecurrenceSchema = z.enum([
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);
export const taskReminderSchema = z.enum([
  "none",
  "at_time",
  "10m",
  "30m",
  "1h",
  "1d",
]);
export const projectStatusSchema = z.enum([
  "planning",
  "active",
  "on_hold",
  "completed",
]);

export const createProjectDto = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  color: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: projectStatusSchema.optional(),
  deadline: z.string().trim().optional(),
});

export const updateProjectDto = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  name: z.string().trim().min(1).optional(),
  color: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  status: projectStatusSchema.optional(),
  deadline: z.string().trim().nullable().optional(),
});

export const projectIdDto = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

export const createTaskDto = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Task title is required"),
  description: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  dueTime: z.string().trim().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  recurrence: taskRecurrenceSchema.optional(),
  reminder: taskReminderSchema.optional(),
  estimateMinutes: z.number().int().positive().optional(),
  subtasks: z
    .array(
      z.object({
        text: z.string().trim().min(1),
        completed: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const updateTaskDto = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  projectId: z.string().uuid().optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  dueDate: z.string().trim().nullable().optional(),
  dueTime: z.string().trim().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  recurrence: taskRecurrenceSchema.optional(),
  reminder: taskReminderSchema.optional(),
  estimateMinutes: z.number().int().positive().nullable().optional(),
  loggedMinutes: z.number().int().min(0).optional(),
  subtasks: z
    .array(
      z.object({
        text: z.string().trim().min(1),
        completed: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const taskIdDto = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

export const addSubtaskDto = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  text: z.string().trim().min(1, "Subtask text is required"),
});

export const subtaskIdDto = z.object({
  subtaskId: z.string().uuid("Invalid subtask ID"),
});
