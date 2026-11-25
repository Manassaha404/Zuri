// Project Board Service - Core business logic for Kanban boards, columns, cards, sprints, and milestones
import db, { eq, and, asc, inArray } from "@repo/database";
import {
  taskProjects,
  boardColumns,
  boardSprints,
  boardMilestones,
  boardCards,
  boardCardChecklists,
  boardCardComments,
  type BoardColumnRecord,
  type BoardSprintRecord,
  type BoardMilestoneRecord,
  type BoardCardRecord,
  type BoardCardChecklistRecord,
  type BoardCardCommentRecord,
  type BoardCardLabelData,
} from "@repo/database/models";
import { AppError } from "@repo/error";

export type CardPriority = "low" | "medium" | "high" | "urgent";

export interface HydratedBoardCard extends BoardCardRecord {
  checklist: BoardCardChecklistRecord[];
  comments: BoardCardCommentRecord[];
}

export class ProjectBoardService {
  // Ensure default columns exist for a project
  async ensureDefaultColumns(
    userId: string,
    projectId: string,
  ): Promise<BoardColumnRecord[]> {
    const existing = await db
      .select()
      .from(boardColumns)
      .where(
        and(
          eq(boardColumns.projectId, projectId),
          eq(boardColumns.userId, userId),
        ),
      )
      .orderBy(asc(boardColumns.position));

    if (existing.length > 0) return existing;

    return await db
      .insert(boardColumns)
      .values([
        {
          projectId,
          userId,
          title: "To Do",
          position: "a0",
          isDoneColumn: false,
        },
        {
          projectId,
          userId,
          title: "In Progress",
          position: "a1",
          wipLimit: 3,
          isDoneColumn: false,
        },
        {
          projectId,
          userId,
          title: "Done",
          position: "a2",
          isDoneColumn: true,
        },
      ])
      .returning();
  }

  // Get full project board workspace
  async getUserProjectBoardWorkspace(userId: string): Promise<{
    columns: BoardColumnRecord[];
    cards: HydratedBoardCard[];
    sprints: BoardSprintRecord[];
    milestones: BoardMilestoneRecord[];
  }> {
    const projects = await db
      .select()
      .from(taskProjects)
      .where(eq(taskProjects.userId, userId));

    for (const p of projects) {
      await this.ensureDefaultColumns(userId, p.projectId);
    }

    const [columns, cardRows, sprints, milestones] = await Promise.all([
      db
        .select()
        .from(boardColumns)
        .where(eq(boardColumns.userId, userId))
        .orderBy(asc(boardColumns.position)),
      db
        .select()
        .from(boardCards)
        .where(eq(boardCards.userId, userId))
        .orderBy(asc(boardCards.position)),
      db
        .select()
        .from(boardSprints)
        .where(eq(boardSprints.userId, userId))
        .orderBy(asc(boardSprints.startDate)),
      db
        .select()
        .from(boardMilestones)
        .where(eq(boardMilestones.userId, userId))
        .orderBy(asc(boardMilestones.dueDate)),
    ]);

    const cardIds = cardRows.map((c) => c.cardId);
    let checklists: BoardCardChecklistRecord[] = [];
    let comments: BoardCardCommentRecord[] = [];

    if (cardIds.length > 0) {
      [checklists, comments] = await Promise.all([
        db
          .select()
          .from(boardCardChecklists)
          .where(inArray(boardCardChecklists.cardId, cardIds))
          .orderBy(asc(boardCardChecklists.createdAt)),
        db
          .select()
          .from(boardCardComments)
          .where(inArray(boardCardComments.cardId, cardIds))
          .orderBy(asc(boardCardComments.createdAt)),
      ]);
    }

    const checkMap = new Map<string, BoardCardChecklistRecord[]>();
    for (const chk of checklists) {
      const list = checkMap.get(chk.cardId) || [];
      list.push(chk);
      checkMap.set(chk.cardId, list);
    }

    const commentMap = new Map<string, BoardCardCommentRecord[]>();
    for (const cmt of comments) {
      const list = commentMap.get(cmt.cardId) || [];
      list.push(cmt);
      commentMap.set(cmt.cardId, list);
    }

    const cards: HydratedBoardCard[] = cardRows.map((c) => ({
      ...c,
      checklist: checkMap.get(c.cardId) || [],
      comments: commentMap.get(c.cardId) || [],
    }));

    return { columns, cards, sprints, milestones };
  }

  // Add column
  async addColumn(
    userId: string,
    input: {
      projectId: string;
      title: string;
      position: string;
      wipLimit?: number;
      isDoneColumn?: boolean;
    },
  ): Promise<BoardColumnRecord> {
    const [created] = await db
      .insert(boardColumns)
      .values({
        userId,
        projectId: input.projectId,
        title: input.title.trim(),
        position: input.position,
        wipLimit: input.wipLimit ?? null,
        isDoneColumn: Boolean(input.isDoneColumn),
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create column");
    }
    return created;
  }

  // Update column
  async updateColumn(
    userId: string,
    input: {
      columnId: string;
      title?: string;
      wipLimit?: number | null;
      isDoneColumn?: boolean;
    },
  ): Promise<BoardColumnRecord> {
    const values: Partial<typeof boardColumns.$inferInsert> = {};
    if (input.title !== undefined) values.title = input.title.trim();
    if (input.wipLimit !== undefined) values.wipLimit = input.wipLimit;
    if (input.isDoneColumn !== undefined)
      values.isDoneColumn = input.isDoneColumn;

    const [updated] = await db
      .update(boardColumns)
      .set(values)
      .where(
        and(
          eq(boardColumns.columnId, input.columnId),
          eq(boardColumns.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new AppError("NOT_FOUND", "Column not found");
    }
    return updated;
  }

  // Delete column
  async deleteColumn(
    columnId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await db
      .delete(boardColumns)
      .where(
        and(
          eq(boardColumns.columnId, columnId),
          eq(boardColumns.userId, userId),
        ),
      );
    return { success: true };
  }

  // Add card
  async addCard(
    userId: string,
    input: {
      projectId: string;
      columnId: string;
      position: string;
      title: string;
      description?: string;
      labels?: BoardCardLabelData[];
      priority?: CardPriority;
      startDate?: string;
      dueDate?: string;
      assignee?: string;
      sprintId?: string;
      milestoneId?: string;
      storyPoints?: number;
    },
  ): Promise<HydratedBoardCard> {
    const [created] = await db
      .insert(boardCards)
      .values({
        userId,
        projectId: input.projectId,
        columnId: input.columnId,
        position: input.position,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        labels: input.labels || [],
        priority: input.priority || "medium",
        startDate: input.startDate || null,
        dueDate: input.dueDate || null,
        assignee: input.assignee?.trim() || null,
        sprintId: input.sprintId || null,
        milestoneId: input.milestoneId || null,
        storyPoints: input.storyPoints ?? 1,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create card");
    }
    return { ...created, checklist: [], comments: [] };
  }

  // Update card
  async updateCard(
    userId: string,
    input: {
      cardId: string;
      columnId?: string;
      position?: string;
      title?: string;
      description?: string | null;
      labels?: BoardCardLabelData[];
      priority?: CardPriority;
      startDate?: string | null;
      dueDate?: string | null;
      assignee?: string | null;
      sprintId?: string | null;
      milestoneId?: string | null;
      storyPoints?: number;
    },
  ): Promise<BoardCardRecord> {
    const values: Partial<typeof boardCards.$inferInsert> = {};
    if (input.columnId !== undefined) values.columnId = input.columnId;
    if (input.position !== undefined) values.position = input.position;
    if (input.title !== undefined) values.title = input.title.trim();
    if (input.description !== undefined)
      values.description = input.description ? input.description.trim() : null;
    if (input.labels !== undefined) values.labels = input.labels;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.startDate !== undefined) values.startDate = input.startDate;
    if (input.dueDate !== undefined) values.dueDate = input.dueDate;
    if (input.assignee !== undefined) values.assignee = input.assignee;
    if (input.sprintId !== undefined) values.sprintId = input.sprintId;
    if (input.milestoneId !== undefined) values.milestoneId = input.milestoneId;
    if (input.storyPoints !== undefined) values.storyPoints = input.storyPoints;

    const [updated] = await db
      .update(boardCards)
      .set(values)
      .where(
        and(eq(boardCards.cardId, input.cardId), eq(boardCards.userId, userId)),
      )
      .returning();

    if (!updated) {
      throw new AppError("NOT_FOUND", "Card not found");
    }
    return updated;
  }

  // Move card (fractional indexing)
  async moveCard(
    userId: string,
    cardId: string,
    targetColumnId: string,
    position: string,
  ): Promise<BoardCardRecord> {
    const [updated] = await db
      .update(boardCards)
      .set({ columnId: targetColumnId, position })
      .where(and(eq(boardCards.cardId, cardId), eq(boardCards.userId, userId)))
      .returning();

    if (!updated) {
      throw new AppError("NOT_FOUND", "Card not found");
    }
    return updated;
  }

  // Delete card
  async deleteCard(
    cardId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await db
      .delete(boardCards)
      .where(and(eq(boardCards.cardId, cardId), eq(boardCards.userId, userId)));
    return { success: true };
  }

  // Checklist CRUD
  async addChecklistItem(
    userId: string,
    cardId: string,
    text: string,
  ): Promise<BoardCardChecklistRecord> {
    const [created] = await db
      .insert(boardCardChecklists)
      .values({ userId, cardId, text: text.trim(), completed: false })
      .returning();
    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to add item");
    }
    return created;
  }

  async toggleChecklistItem(
    userId: string,
    itemId: string,
  ): Promise<BoardCardChecklistRecord> {
    const [existing] = await db
      .select()
      .from(boardCardChecklists)
      .where(
        and(
          eq(boardCardChecklists.itemId, itemId),
          eq(boardCardChecklists.userId, userId),
        ),
      );
    if (!existing) {
      throw new AppError("NOT_FOUND", "Checklist item not found");
    }
    const [updated] = await db
      .update(boardCardChecklists)
      .set({ completed: !existing.completed })
      .where(
        and(
          eq(boardCardChecklists.itemId, itemId),
          eq(boardCardChecklists.userId, userId),
        ),
      )
      .returning();
    return updated!;
  }

  async deleteChecklistItem(
    userId: string,
    itemId: string,
  ): Promise<{ success: boolean }> {
    await db
      .delete(boardCardChecklists)
      .where(
        and(
          eq(boardCardChecklists.itemId, itemId),
          eq(boardCardChecklists.userId, userId),
        ),
      );
    return { success: true };
  }

  // Comments
  async addComment(
    userId: string,
    cardId: string,
    author: string,
    text: string,
  ): Promise<BoardCardCommentRecord> {
    const [created] = await db
      .insert(boardCardComments)
      .values({ userId, cardId, author: author.trim(), text: text.trim() })
      .returning();
    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to add comment");
    }
    return created;
  }

  // Sprints
  async addSprint(
    userId: string,
    input: {
      projectId: string;
      name: string;
      goal?: string;
      startDate: string;
      endDate: string;
      isActive?: boolean;
    },
  ): Promise<BoardSprintRecord> {
    const [created] = await db
      .insert(boardSprints)
      .values({
        userId,
        projectId: input.projectId,
        name: input.name.trim(),
        goal: input.goal?.trim() || null,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive ?? true,
      })
      .returning();
    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create sprint");
    }
    return created;
  }

  async deleteSprint(
    sprintId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await db
      .delete(boardSprints)
      .where(
        and(
          eq(boardSprints.sprintId, sprintId),
          eq(boardSprints.userId, userId),
        ),
      );
    return { success: true };
  }

  // Milestones
  async addMilestone(
    userId: string,
    input: { projectId: string; title: string; dueDate: string },
  ): Promise<BoardMilestoneRecord> {
    const [created] = await db
      .insert(boardMilestones)
      .values({
        userId,
        projectId: input.projectId,
        title: input.title.trim(),
        dueDate: input.dueDate,
      })
      .returning();
    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create milestone");
    }
    return created;
  }

  async deleteMilestone(
    milestoneId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await db
      .delete(boardMilestones)
      .where(
        and(
          eq(boardMilestones.milestoneId, milestoneId),
          eq(boardMilestones.userId, userId),
        ),
      );
    return { success: true };
  }
}

export default ProjectBoardService;
