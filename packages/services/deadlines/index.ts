// Deadline Service - Core business logic for deadlines, reminders, countdowns, categories, and recurrence
import db, { eq, and, desc, asc, inArray } from "@repo/database";
import {
  deadlines,
  deadlineReminders,
  deadlineCategories,
  type Deadline,
  type NewDeadline,
  type DeadlineReminder,
  type DeadlineCategoryRecord,
  type NewDeadlineCategoryRecord,
} from "@repo/database/models";
import { AppError } from "@repo/error";

export type DeadlinePriority = "low" | "medium" | "high" | "urgent";

export type DeadlineStatus = "upcoming" | "in_progress" | "done" | "missed";

export type ReminderOffset =
  | "1_hour"
  | "1_day"
  | "3_days"
  | "1_week"
  | "2_weeks";

export type RecurrenceType =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export interface CreateDeadlineInput {
  title: string;
  description?: string;
  category?: string;
  priority?: DeadlinePriority;
  status?: DeadlineStatus;
  dueDate: string | Date;
  softDueDate?: string | Date;
  recurrence?: RecurrenceType;
  reminders?: ReminderOffset[];
}

export interface UpdateDeadlineInput {
  deadlineId: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: DeadlinePriority;
  status?: DeadlineStatus;
  dueDate?: string | Date;
  softDueDate?: string | Date | null;
  recurrence?: RecurrenceType;
  reminders?: ReminderOffset[];
}

export interface CreateDeadlineCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface DeadlineWithReminders extends Deadline {
  reminders: ReminderOffset[];
}

const DEFAULT_SYSTEM_CATEGORIES = [
  { name: "Assignment", color: "#3b82f6", icon: "BookOpen" },
  { name: "Exam", color: "#ef4444", icon: "GraduationCap" },
  { name: "Project", color: "#8b5cf6", icon: "FolderGit2" },
  { name: "Bill", color: "#10b981", icon: "Receipt" },
  { name: "Application", color: "#f59e0b", icon: "FileText" },
];

export class DeadlineService {
  // Ensure default categories exist for the user
  private async ensureDefaultCategories(
    userId: string,
  ): Promise<DeadlineCategoryRecord[]> {
    const existing = await db
      .select()
      .from(deadlineCategories)
      .where(eq(deadlineCategories.userId, userId))
      .orderBy(asc(deadlineCategories.createdAt));

    if (existing.length === 0) {
      const seeded = await db
        .insert(deadlineCategories)
        .values(
          DEFAULT_SYSTEM_CATEGORIES.map((cat) => ({
            userId,
            name: cat.name,
            color: cat.color,
            icon: cat.icon,
            isSystem: true,
          })),
        )
        .returning();
      return seeded;
    }

    return existing;
  }

  // Get full deadline workspace for user
  async getUserDeadlineWorkspace(userId: string): Promise<{
    deadlines: DeadlineWithReminders[];
    categories: DeadlineCategoryRecord[];
    stats: {
      total: number;
      completed: number;
      onTimeCount: number;
      missedCount: number;
      onTimeRate: number;
      urgentCount: number;
    };
  }> {
    const userCategories = await this.ensureDefaultCategories(userId);

    const userDeadlines = await db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.userId, userId), eq(deadlines.isArchived, false)))
      .orderBy(asc(deadlines.dueDate));

    const deadlineIds = userDeadlines.map((d) => d.deadlineId);
    let allReminders: DeadlineReminder[] = [];

    if (deadlineIds.length > 0) {
      allReminders = await db
        .select()
        .from(deadlineReminders)
        .where(inArray(deadlineReminders.deadlineId, deadlineIds));
    }

    const reminderMap = new Map<string, ReminderOffset[]>();
    for (const r of allReminders) {
      if (!reminderMap.has(r.deadlineId)) {
        reminderMap.set(r.deadlineId, []);
      }
      reminderMap.get(r.deadlineId)!.push(r.offset as ReminderOffset);
    }

    const deadlinesWithReminders: DeadlineWithReminders[] = userDeadlines.map(
      (d) => ({
        ...d,
        reminders: reminderMap.get(d.deadlineId) || [],
      }),
    );

    // Compute stats
    const total = deadlinesWithReminders.length;
    const completed = deadlinesWithReminders.filter(
      (d) => d.status === "done",
    ).length;
    const now = new Date();

    const missedCount = deadlinesWithReminders.filter((d) => {
      if (d.status === "missed") return true;
      if (
        d.status !== "done" &&
        new Date(d.dueDate).getTime() < now.getTime()
      ) {
        return true;
      }
      return false;
    }).length;

    const onTimeCount = completed;
    const evaluatedCount = completed + missedCount;
    const onTimeRate =
      evaluatedCount > 0
        ? Math.round((onTimeCount / evaluatedCount) * 1000) / 10
        : 100;

    const urgentCount = deadlinesWithReminders.filter((d) => {
      if (d.status === "done") return false;
      const diffMs = new Date(d.dueDate).getTime() - now.getTime();
      return diffMs <= 24 * 60 * 60 * 1000;
    }).length;

    return {
      deadlines: deadlinesWithReminders,
      categories: userCategories,
      stats: {
        total,
        completed,
        onTimeCount,
        missedCount,
        onTimeRate,
        urgentCount,
      },
    };
  }

  // Get categories list
  async getCategories(userId: string): Promise<DeadlineCategoryRecord[]> {
    return await this.ensureDefaultCategories(userId);
  }

  // Add new deadline category
  async addCategory(
    userId: string,
    input: CreateDeadlineCategoryInput,
  ): Promise<DeadlineCategoryRecord> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new AppError("BAD_REQUEST", "Category name is required");
    }

    // Check duplicate
    const [existing] = await db
      .select()
      .from(deadlineCategories)
      .where(
        and(
          eq(deadlineCategories.userId, userId),
          eq(deadlineCategories.name, trimmedName),
        ),
      );

    if (existing) {
      return existing;
    }

    const [newCategory] = await db
      .insert(deadlineCategories)
      .values({
        userId,
        name: trimmedName,
        color: input.color || "#3b82f6",
        icon: input.icon || "Tag",
        isSystem: false,
      })
      .returning();

    if (!newCategory) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create category");
    }

    return newCategory;
  }

  // Delete deadline category
  async deleteCategory(
    userId: string,
    categoryId: string,
  ): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(deadlineCategories)
      .where(
        and(
          eq(deadlineCategories.categoryId, categoryId),
          eq(deadlineCategories.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Category not found");
    }

    if (existing.isSystem) {
      throw new AppError("FORBIDDEN", "System categories cannot be deleted");
    }

    await db
      .delete(deadlineCategories)
      .where(eq(deadlineCategories.categoryId, categoryId));

    return { success: true };
  }

  // Get single deadline
  async getDeadlineById(
    deadlineId: string,
    userId: string,
  ): Promise<DeadlineWithReminders> {
    const [deadline] = await db
      .select()
      .from(deadlines)
      .where(
        and(
          eq(deadlines.deadlineId, deadlineId),
          eq(deadlines.userId, userId),
          eq(deadlines.isArchived, false),
        ),
      );

    if (!deadline) {
      throw new AppError("NOT_FOUND", "Deadline not found");
    }

    const remindersList = await db
      .select()
      .from(deadlineReminders)
      .where(eq(deadlineReminders.deadlineId, deadlineId));

    return {
      ...deadline,
      reminders: remindersList.map((r) => r.offset as ReminderOffset),
    };
  }

  // Create new deadline
  async createDeadline(
    userId: string,
    input: CreateDeadlineInput,
  ): Promise<DeadlineWithReminders> {
    const dueDateObj = new Date(input.dueDate);
    if (isNaN(dueDateObj.getTime())) {
      throw new AppError("BAD_REQUEST", "Invalid due date format");
    }

    const softDueDateObj = input.softDueDate
      ? new Date(input.softDueDate)
      : undefined;

    const [newDeadline] = await db
      .insert(deadlines)
      .values({
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category ? input.category.toLowerCase() : "assignment",
        priority: input.priority || "medium",
        status: input.status || "upcoming",
        dueDate: dueDateObj,
        softDueDate: softDueDateObj || null,
        recurrence: input.recurrence || "none",
        isArchived: false,
      })
      .returning();

    if (!newDeadline) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create deadline");
    }

    // Insert reminder offsets if provided
    const reminderOffsets = input.reminders || [];
    if (reminderOffsets.length > 0) {
      await db.insert(deadlineReminders).values(
        reminderOffsets.map((offset) => ({
          deadlineId: newDeadline.deadlineId,
          offset,
        })),
      );
    }

    return {
      ...newDeadline,
      reminders: reminderOffsets,
    };
  }

  // Update existing deadline
  async updateDeadline(
    userId: string,
    input: UpdateDeadlineInput,
  ): Promise<DeadlineWithReminders> {
    const [existing] = await db
      .select()
      .from(deadlines)
      .where(
        and(
          eq(deadlines.deadlineId, input.deadlineId),
          eq(deadlines.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Deadline not found");
    }

    const updateData: Partial<NewDeadline> = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined)
      updateData.description = input.description.trim() || null;
    if (input.category !== undefined)
      updateData.category = input.category.toLowerCase();
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === "done" && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (input.status !== "done") {
        updateData.completedAt = null;
      }
    }
    if (input.dueDate !== undefined)
      updateData.dueDate = new Date(input.dueDate);
    if (input.softDueDate !== undefined)
      updateData.softDueDate = input.softDueDate
        ? new Date(input.softDueDate)
        : null;
    if (input.recurrence !== undefined)
      updateData.recurrence = input.recurrence;

    const [updated] = await db
      .update(deadlines)
      .set(updateData)
      .where(eq(deadlines.deadlineId, input.deadlineId))
      .returning();

    if (!updated) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to update deadline");
    }

    // Update reminders if provided
    let currentReminders: ReminderOffset[] = [];
    if (input.reminders !== undefined) {
      await db
        .delete(deadlineReminders)
        .where(eq(deadlineReminders.deadlineId, input.deadlineId));

      if (input.reminders.length > 0) {
        await db.insert(deadlineReminders).values(
          input.reminders.map((offset) => ({
            deadlineId: input.deadlineId,
            offset,
          })),
        );
      }
      currentReminders = input.reminders;
    } else {
      const remindersList = await db
        .select()
        .from(deadlineReminders)
        .where(eq(deadlineReminders.deadlineId, input.deadlineId));
      currentReminders = remindersList.map((r) => r.offset as ReminderOffset);
    }

    return {
      ...updated,
      reminders: currentReminders,
    };
  }

  // Toggle completion status
  async toggleStatus(
    deadlineId: string,
    userId: string,
  ): Promise<DeadlineWithReminders> {
    const [existing] = await db
      .select()
      .from(deadlines)
      .where(
        and(eq(deadlines.deadlineId, deadlineId), eq(deadlines.userId, userId)),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Deadline not found");
    }

    const nextStatus = existing.status === "done" ? "in_progress" : "done";
    const completedAt = nextStatus === "done" ? new Date() : null;

    const [updated] = await db
      .update(deadlines)
      .set({
        status: nextStatus,
        completedAt,
      })
      .where(eq(deadlines.deadlineId, deadlineId))
      .returning();

    if (!updated) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to toggle deadline");
    }

    const remindersList = await db
      .select()
      .from(deadlineReminders)
      .where(eq(deadlineReminders.deadlineId, deadlineId));

    return {
      ...updated,
      reminders: remindersList.map((r) => r.offset as ReminderOffset),
    };
  }

  // Delete deadline permanently
  async deleteDeadline(deadlineId: string, userId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(deadlines)
      .where(
        and(eq(deadlines.deadlineId, deadlineId), eq(deadlines.userId, userId)),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Deadline not found");
    }

    await db.delete(deadlines).where(eq(deadlines.deadlineId, deadlineId));
    return true;
  }
}

export default DeadlineService;
