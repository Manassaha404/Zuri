import { z } from "zod";

export const deadlineCategorySchema = z.string().trim().min(1);

export const deadlinePrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const deadlineStatusSchema = z.enum([
  "upcoming",
  "in_progress",
  "done",
  "missed",
]);

export const reminderOffsetSchema = z.enum([
  "1_hour",
  "1_day",
  "3_days",
  "1_week",
  "2_weeks",
]);

export const recurrenceTypeSchema = z.enum([
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
]);

// DTO Schemas
export const createDeadlineDto = z.object({
  title: z.string().trim().min(1, "Deadline title is required"),
  description: z.string().trim().optional(),
  category: deadlineCategorySchema.optional(),
  priority: deadlinePrioritySchema.optional(),
  status: deadlineStatusSchema.optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().min(1)),
  softDueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(1))
    .optional(),
  recurrence: recurrenceTypeSchema.optional(),
  reminders: z.array(reminderOffsetSchema).optional(),
});
export type CreateDeadlineDto = z.infer<typeof createDeadlineDto>;

export const updateDeadlineDto = z.object({
  deadlineId: z.string().uuid("Invalid deadline ID"),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  category: deadlineCategorySchema.optional(),
  priority: deadlinePrioritySchema.optional(),
  status: deadlineStatusSchema.optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(1))
    .optional(),
  softDueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(1))
    .nullable()
    .optional(),
  recurrence: recurrenceTypeSchema.optional(),
  reminders: z.array(reminderOffsetSchema).optional(),
});
export type UpdateDeadlineDto = z.infer<typeof updateDeadlineDto>;

export const deadlineIdDto = z.object({
  deadlineId: z.string().uuid("Invalid deadline ID"),
});
export type DeadlineIdDto = z.infer<typeof deadlineIdDto>;

export const createDeadlineCategoryDto = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
});
export type CreateDeadlineCategoryDto = z.infer<
  typeof createDeadlineCategoryDto
>;

export const categoryIdDto = z.object({
  categoryId: z.string().uuid("Invalid category ID"),
});
export type CategoryIdDto = z.infer<typeof categoryIdDto>;
