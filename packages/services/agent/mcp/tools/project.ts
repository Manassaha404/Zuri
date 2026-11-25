import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import ProjectBoardService, { type CardPriority } from "../../../projects";

const projectBoardService = new ProjectBoardService();

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

const labelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
});

export const projectTools = [
  // Workspace
  {
    name: "projects_get_workspace",
    description:
      "Retrieve the complete Kanban project board workspace including columns, hydrated cards (with checklists and comments), sprints, and milestones for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result =
          await projectBoardService.getUserProjectBoardWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to get project board workspace",
        );
      }
    },
  },

  // Columns
  {
    name: "projects_add_column",
    description:
      "Add a new Kanban column to a project board with fractional position ordering and optional WIP limit.",
    parameters: z.object({
      projectId: z.string().uuid().describe("Project ID to add the column to"),
      title: z.string().trim().min(1).describe("Column title"),
      position: z
        .string()
        .min(1)
        .describe("Fractional index position string (e.g. 'a0', 'a1', 'a3')"),
      wipLimit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Optional work-in-progress card limit"),
      isDoneColumn: z
        .boolean()
        .optional()
        .describe("Whether cards in this column count as completed"),
    }),
    execute: async (
      args: {
        projectId: string;
        title: string;
        position: string;
        wipLimit?: number;
        isDoneColumn?: boolean;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.addColumn(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create column");
      }
    },
  },

  {
    name: "projects_update_column",
    description:
      "Update an existing Kanban column's title, WIP limit, or done-column status.",
    parameters: z.object({
      columnId: z.string().uuid().describe("Unique identifier of the column"),
      title: z.string().trim().min(1).optional().describe("New column title"),
      wipLimit: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional()
        .describe("New WIP limit or null to clear"),
      isDoneColumn: z
        .boolean()
        .optional()
        .describe("Whether this column represents completed work"),
    }),
    execute: async (
      args: {
        columnId: string;
        title?: string;
        wipLimit?: number | null;
        isDoneColumn?: boolean;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.updateColumn(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update column");
      }
    },
  },

  {
    name: "projects_delete_column",
    description: "Delete a Kanban column and its cards by columnId.",
    parameters: z.object({
      columnId: z
        .string()
        .uuid()
        .describe("Unique identifier of the column to delete"),
    }),
    execute: async (args: { columnId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.deleteColumn(
          args.columnId,
          userId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete column");
      }
    },
  },

  // Cards
  {
    name: "projects_add_card",
    description:
      "Create a new Kanban card in a project column with optional description, labels, priority, dates, assignee, sprint, milestone, and story points.",
    parameters: z.object({
      projectId: z.string().uuid().describe("Project ID"),
      columnId: z.string().uuid().describe("Target column ID"),
      position: z
        .string()
        .min(1)
        .describe("Fractional index position string (e.g. 'a0', 'a1')"),
      title: z.string().trim().min(1).describe("Card title"),
      description: z.string().optional().describe("Optional card description"),
      labels: z
        .array(labelSchema)
        .optional()
        .describe("Optional array of { id, name, color } labels"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("Card priority (default: 'medium')"),
      startDate: z
        .string()
        .optional()
        .describe("Optional start date (YYYY-MM-DD)"),
      dueDate: z.string().optional().describe("Optional due date (YYYY-MM-DD)"),
      assignee: z.string().optional().describe("Optional assignee name"),
      sprintId: z.string().uuid().optional().describe("Optional sprint ID"),
      milestoneId: z
        .string()
        .uuid()
        .optional()
        .describe("Optional milestone ID"),
      storyPoints: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Story point estimate (default: 1)"),
    }),
    execute: async (
      args: {
        projectId: string;
        columnId: string;
        position: string;
        title: string;
        description?: string;
        labels?: Array<{ id: string; name: string; color: string }>;
        priority?: CardPriority;
        startDate?: string;
        dueDate?: string;
        assignee?: string;
        sprintId?: string;
        milestoneId?: string;
        storyPoints?: number;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.addCard(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create card");
      }
    },
  },

  {
    name: "projects_update_card",
    description:
      "Update an existing Kanban card's details, column, position, labels, priority, dates, assignee, sprint, milestone, or story points.",
    parameters: z.object({
      cardId: z.string().uuid().describe("Unique identifier of the card"),
      columnId: z.string().uuid().optional().describe("New column ID"),
      position: z.string().min(1).optional().describe("New position string"),
      title: z.string().trim().min(1).optional().describe("New title"),
      description: z
        .string()
        .nullable()
        .optional()
        .describe("New description or null to clear"),
      labels: z
        .array(labelSchema)
        .optional()
        .describe("Complete replacement array of labels"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("New priority"),
      startDate: z
        .string()
        .nullable()
        .optional()
        .describe("New start date (YYYY-MM-DD) or null"),
      dueDate: z
        .string()
        .nullable()
        .optional()
        .describe("New due date (YYYY-MM-DD) or null"),
      assignee: z
        .string()
        .nullable()
        .optional()
        .describe("New assignee or null to clear"),
      sprintId: z
        .string()
        .uuid()
        .nullable()
        .optional()
        .describe("New sprint ID or null to unassign"),
      milestoneId: z
        .string()
        .uuid()
        .nullable()
        .optional()
        .describe("New milestone ID or null to unassign"),
      storyPoints: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("New story point estimate"),
    }),
    execute: async (
      args: {
        cardId: string;
        columnId?: string;
        position?: string;
        title?: string;
        description?: string | null;
        labels?: Array<{ id: string; name: string; color: string }>;
        priority?: CardPriority;
        startDate?: string | null;
        dueDate?: string | null;
        assignee?: string | null;
        sprintId?: string | null;
        milestoneId?: string | null;
        storyPoints?: number;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.updateCard(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update card");
      }
    },
  },

  {
    name: "projects_move_card",
    description:
      "Move a Kanban card to a target column and fractional index position.",
    parameters: z.object({
      cardId: z.string().uuid().describe("Unique identifier of the card"),
      targetColumnId: z.string().uuid().describe("Destination column ID"),
      position: z
        .string()
        .min(1)
        .describe("Fractional index position string in target column"),
    }),
    execute: async (
      args: { cardId: string; targetColumnId: string; position: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.moveCard(
          userId,
          args.cardId,
          args.targetColumnId,
          args.position,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to move card");
      }
    },
  },

  {
    name: "projects_delete_card",
    description: "Permanently delete a Kanban card by cardId.",
    parameters: z.object({
      cardId: z
        .string()
        .uuid()
        .describe("Unique identifier of the card to delete"),
    }),
    execute: async (args: { cardId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.deleteCard(
          args.cardId,
          userId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete card");
      }
    },
  },

  // Checklists & Comments
  {
    name: "projects_add_checklist_item",
    description: "Add a checklist item to a Kanban card.",
    parameters: z.object({
      cardId: z.string().uuid().describe("Target card ID"),
      text: z.string().trim().min(1).describe("Checklist item text"),
    }),
    execute: async (args: { cardId: string; text: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.addChecklistItem(
          userId,
          args.cardId,
          args.text,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add checklist item");
      }
    },
  },

  {
    name: "projects_toggle_checklist_item",
    description: "Toggle completion status of a card checklist item.",
    parameters: z.object({
      itemId: z
        .string()
        .uuid()
        .describe("Unique identifier of the checklist item"),
    }),
    execute: async (args: { itemId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.toggleChecklistItem(
          userId,
          args.itemId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to toggle checklist item");
      }
    },
  },

  {
    name: "projects_delete_checklist_item",
    description: "Delete a checklist item from a Kanban card.",
    parameters: z.object({
      itemId: z
        .string()
        .uuid()
        .describe("Unique identifier of the checklist item"),
    }),
    execute: async (args: { itemId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.deleteChecklistItem(
          userId,
          args.itemId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete checklist item");
      }
    },
  },

  {
    name: "projects_add_comment",
    description: "Add a comment to a Kanban card.",
    parameters: z.object({
      cardId: z.string().uuid().describe("Target card ID"),
      author: z.string().trim().min(1).describe("Comment author name"),
      text: z.string().trim().min(1).describe("Comment body text"),
    }),
    execute: async (
      args: { cardId: string; author: string; text: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.addComment(
          userId,
          args.cardId,
          args.author,
          args.text,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add comment");
      }
    },
  },

  // Sprints & Milestones
  {
    name: "projects_add_sprint",
    description: "Create a new sprint for a project board.",
    parameters: z.object({
      projectId: z.string().uuid().describe("Project ID"),
      name: z.string().trim().min(1).describe("Sprint name"),
      goal: z.string().optional().describe("Optional sprint goal"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      isActive: z
        .boolean()
        .optional()
        .describe("Whether the sprint is active (default: true)"),
    }),
    execute: async (
      args: {
        projectId: string;
        name: string;
        goal?: string;
        startDate: string;
        endDate: string;
        isActive?: boolean;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.addSprint(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create sprint");
      }
    },
  },

  {
    name: "projects_delete_sprint",
    description: "Delete a sprint by sprintId.",
    parameters: z.object({
      sprintId: z
        .string()
        .uuid()
        .describe("Unique identifier of the sprint to delete"),
    }),
    execute: async (args: { sprintId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.deleteSprint(
          args.sprintId,
          userId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete sprint");
      }
    },
  },

  {
    name: "projects_add_milestone",
    description: "Create a new milestone for a project board.",
    parameters: z.object({
      projectId: z.string().uuid().describe("Project ID"),
      title: z.string().trim().min(1).describe("Milestone title"),
      dueDate: z.string().describe("Milestone due date (YYYY-MM-DD)"),
    }),
    execute: async (
      args: { projectId: string; title: string; dueDate: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.addMilestone(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create milestone");
      }
    },
  },

  {
    name: "projects_delete_milestone",
    description: "Delete a milestone by milestoneId.",
    parameters: z.object({
      milestoneId: z
        .string()
        .uuid()
        .describe("Unique identifier of the milestone to delete"),
    }),
    execute: async (args: { milestoneId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await projectBoardService.deleteMilestone(
          args.milestoneId,
          userId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete milestone");
      }
    },
  },
];

export function registerProjectTools(server: FastMCP<any>) {
  for (const tool of projectTools) {
    server.addTool(tool as any);
  }
}
