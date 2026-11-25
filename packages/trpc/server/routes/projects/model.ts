import { z } from "zod";

export const cardPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const boardLabelSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  color: z.string().trim().min(1),
});

export const addColumnDto = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().trim().min(1, "Column title is required"),
  position: z.string().min(1),
  wipLimit: z.number().int().positive().optional(),
  isDoneColumn: z.boolean().optional(),
});

export const updateColumnDto = z.object({
  columnId: z.string().uuid("Invalid column ID"),
  title: z.string().trim().min(1).optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
  isDoneColumn: z.boolean().optional(),
});

export const columnIdDto = z.object({
  columnId: z.string().uuid("Invalid column ID"),
});

export const addCardDto = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  columnId: z.string().uuid("Invalid column ID"),
  position: z.string().min(1),
  title: z.string().trim().min(1, "Card title is required"),
  description: z.string().trim().optional(),
  labels: z.array(boardLabelSchema).optional(),
  priority: cardPrioritySchema.optional(),
  startDate: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  assignee: z.string().trim().optional(),
  sprintId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  storyPoints: z.number().int().min(1).optional(),
});

export const updateCardDto = z.object({
  cardId: z.string().uuid("Invalid card ID"),
  columnId: z.string().uuid().optional(),
  position: z.string().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  labels: z.array(boardLabelSchema).optional(),
  priority: cardPrioritySchema.optional(),
  startDate: z.string().trim().nullable().optional(),
  dueDate: z.string().trim().nullable().optional(),
  assignee: z.string().trim().nullable().optional(),
  sprintId: z.string().uuid().nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  storyPoints: z.number().int().min(1).optional(),
});

export const moveCardDto = z.object({
  cardId: z.string().uuid("Invalid card ID"),
  targetColumnId: z.string().uuid("Invalid column ID"),
  position: z.string().min(1),
});

export const cardIdDto = z.object({
  cardId: z.string().uuid("Invalid card ID"),
});

export const addChecklistItemDto = z.object({
  cardId: z.string().uuid("Invalid card ID"),
  text: z.string().trim().min(1),
});

export const checklistItemIdDto = z.object({
  itemId: z.string().uuid("Invalid checklist item ID"),
});

export const addCommentDto = z.object({
  cardId: z.string().uuid("Invalid card ID"),
  author: z.string().trim().min(1),
  text: z.string().trim().min(1),
});

export const addSprintDto = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  name: z.string().trim().min(1),
  goal: z.string().trim().optional(),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  isActive: z.boolean().optional(),
});

export const sprintIdDto = z.object({
  sprintId: z.string().uuid("Invalid sprint ID"),
});

export const addMilestoneDto = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
});

export const milestoneIdDto = z.object({
  milestoneId: z.string().uuid("Invalid milestone ID"),
});
