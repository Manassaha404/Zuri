// Habit Service - Core business logic for habit tracking, routines, and streaks
import db, { eq, and, desc, asc, inArray, sql } from "@repo/database";
import {
  habits,
  habitCheckIns,
  habitStreakFreezes,
  type Habit,
  type NewHabit,
  type HabitCheckIn,
  type NewHabitCheckIn,
  type HabitStreakFreeze,
  type NewHabitStreakFreeze,
} from "@repo/database/models";
import { AppError } from "@repo/error";

export interface CreateHabitInput {
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
}

export interface UpdateHabitInput {
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
  stackedAfterHabitId?: string;
  stackRoutineTitle?: string;
  graceDaysPerMonth?: number;
}

export interface ToggleCheckInInput {
  habitId: string;
  date: string;
  note?: string;
  mood?: "great" | "good" | "neutral" | "low" | "stressed";
}

export interface SetNumericValueInput {
  habitId: string;
  date: string;
  value: number;
  note?: string;
  mood?: "great" | "good" | "neutral" | "low" | "stressed";
}

export interface ResetCleanStreakInput {
  habitId: string;
  date: string;
  slipReason?: string;
}

export interface ApplyStreakFreezeInput {
  habitId: string;
  date: string;
  reason?: string;
}

export interface AddCheckInNoteInput {
  habitId: string;
  date: string;
  note?: string;
  mood?: "great" | "good" | "neutral" | "low" | "stressed";
  skipReason?: string;
}

export interface CreateHabitStackInput {
  title: string;
  habitIds: string[];
}

export interface ReorderRoutineStackInput {
  title: string;
  habitIds: string[];
}

export class HabitService {
  // Verify user owns the habit
  public async verifyHabitOwner(habitId: string, userId: string) {
    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.habitId, habitId), eq(habits.userId, userId)))
      .limit(1);

    if (!habit) {
      throw new AppError("NOT_FOUND", "Habit not found or unauthorized");
    }
    return habit;
  }

  // Get full habit workspace data (habits, check-ins, freezes)
  public async getUserHabitWorkspace(userId: string) {
    const userHabits = await db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(asc(habits.createdAt));

    const checkInsList = await db
      .select()
      .from(habitCheckIns)
      .where(eq(habitCheckIns.userId, userId));

    const freezesList = await db
      .select()
      .from(habitStreakFreezes)
      .where(eq(habitStreakFreezes.userId, userId))
      .orderBy(desc(habitStreakFreezes.usedAt));

    // Map check-ins by habitId_date for O(1) lookups
    const checkInsMap: Record<string, HabitCheckIn> = {};
    for (const record of checkInsList) {
      checkInsMap[`${record.habitId}_${record.date}`] = record;
    }

    return {
      habits: userHabits,
      checkIns: checkInsMap,
      streakFreezes: freezesList,
    };
  }

  // Get all habits for user
  public async getHabits(userId: string) {
    return await db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(desc(habits.createdAt));
  }

  // Get single habit by ID
  public async getHabitById(habitId: string, userId: string) {
    return await this.verifyHabitOwner(habitId, userId);
  }

  // Create a new habit
  public async createHabit(userId: string, input: CreateHabitInput) {
    const isNegative = input.type === "negative";
    const now = new Date();

    const [newHabit] = await db
      .insert(habits)
      .values({
        userId,
        name: input.name.trim(),
        description: input.description?.trim(),
        icon: input.icon || "Sparkles",
        color: input.color || "#3b82f6",
        type: input.type || "boolean",
        frequencyType: input.frequencyType || "daily",
        frequencyDaysOfWeek: input.frequencyDaysOfWeek,
        frequencyTimesPerWeek: input.frequencyTimesPerWeek,
        targetValue: input.targetValue,
        unit: input.unit?.trim(),
        timeOfDay: input.timeOfDay || "morning",
        reminderTime: input.reminderTime?.trim(),
        status: "active",
        cleanStartedAt: isNegative ? now : undefined,
        stackedAfterHabitId: input.stackedAfterHabitId,
        stackRoutineTitle: input.stackRoutineTitle?.trim(),
        graceDaysPerMonth: input.graceDaysPerMonth ?? 2,
      })
      .returning();

    return newHabit;
  }

  // Update existing habit
  public async updateHabit(
    habitId: string,
    userId: string,
    input: UpdateHabitInput,
  ) {
    await this.verifyHabitOwner(habitId, userId);

    const [updated] = await db
      .update(habits)
      .set({
        name: input.name !== undefined ? input.name.trim() : undefined,
        description:
          input.description !== undefined
            ? input.description.trim()
            : undefined,
        icon: input.icon,
        color: input.color,
        type: input.type,
        frequencyType: input.frequencyType,
        frequencyDaysOfWeek: input.frequencyDaysOfWeek,
        frequencyTimesPerWeek: input.frequencyTimesPerWeek,
        targetValue: input.targetValue,
        unit: input.unit !== undefined ? input.unit.trim() : undefined,
        timeOfDay: input.timeOfDay,
        reminderTime:
          input.reminderTime !== undefined
            ? input.reminderTime.trim()
            : undefined,
        status: input.status,
        stackedAfterHabitId: input.stackedAfterHabitId,
        stackRoutineTitle:
          input.stackRoutineTitle !== undefined
            ? input.stackRoutineTitle.trim()
            : undefined,
        graceDaysPerMonth: input.graceDaysPerMonth,
        updatedAt: new Date(),
      })
      .where(and(eq(habits.habitId, habitId), eq(habits.userId, userId)))
      .returning();

    return updated;
  }

  // Archive a habit
  public async archiveHabit(habitId: string, userId: string) {
    await this.verifyHabitOwner(habitId, userId);

    const [archived] = await db
      .update(habits)
      .set({
        status: "archived",
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(and(eq(habits.habitId, habitId), eq(habits.userId, userId)))
      .returning();

    return archived;
  }

  // Pause a habit
  public async pauseHabit(habitId: string, userId: string) {
    await this.verifyHabitOwner(habitId, userId);

    const [paused] = await db
      .update(habits)
      .set({
        status: "paused",
        updatedAt: new Date(),
      })
      .where(and(eq(habits.habitId, habitId), eq(habits.userId, userId)))
      .returning();

    return paused;
  }

  // Resume a paused or archived habit
  public async resumeHabit(habitId: string, userId: string) {
    await this.verifyHabitOwner(habitId, userId);

    const [resumed] = await db
      .update(habits)
      .set({
        status: "active",
        isArchived: false,
        updatedAt: new Date(),
      })
      .where(and(eq(habits.habitId, habitId), eq(habits.userId, userId)))
      .returning();

    return resumed;
  }

  // Delete habit permanently
  public async deleteHabit(habitId: string, userId: string) {
    await this.verifyHabitOwner(habitId, userId);

    await db
      .delete(habits)
      .where(and(eq(habits.habitId, habitId), eq(habits.userId, userId)));

    return { success: true };
  }

  // Toggle habit daily check-in
  public async toggleCheckIn(userId: string, input: ToggleCheckInInput) {
    const habit = await this.verifyHabitOwner(input.habitId, userId);

    const [existing] = await db
      .select()
      .from(habitCheckIns)
      .where(
        and(
          eq(habitCheckIns.habitId, input.habitId),
          eq(habitCheckIns.date, input.date),
        ),
      )
      .limit(1);

    const nextCompleted = !existing?.completed;

    if (existing) {
      const [updated] = await db
        .update(habitCheckIns)
        .set({
          completed: nextCompleted,
          note: input.note !== undefined ? input.note : existing.note,
          mood: input.mood !== undefined ? input.mood : existing.mood,
          updatedAt: new Date(),
        })
        .where(eq(habitCheckIns.checkInId, existing.checkInId))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(habitCheckIns)
      .values({
        habitId: input.habitId,
        userId,
        date: input.date,
        completed: nextCompleted,
        targetValue: habit.targetValue ?? undefined,
        note: input.note,
        mood: input.mood,
      })
      .returning();

    return created;
  }

  // Set numeric habit value
  public async setNumericValue(userId: string, input: SetNumericValueInput) {
    const habit = await this.verifyHabitOwner(input.habitId, userId);
    const target = habit.targetValue || 1;
    const safeValue = Math.max(0, input.value);
    const completed = safeValue >= target;

    const [existing] = await db
      .select()
      .from(habitCheckIns)
      .where(
        and(
          eq(habitCheckIns.habitId, input.habitId),
          eq(habitCheckIns.date, input.date),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(habitCheckIns)
        .set({
          value: safeValue,
          targetValue: target,
          completed,
          note: input.note !== undefined ? input.note : existing.note,
          mood: input.mood !== undefined ? input.mood : existing.mood,
          updatedAt: new Date(),
        })
        .where(eq(habitCheckIns.checkInId, existing.checkInId))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(habitCheckIns)
      .values({
        habitId: input.habitId,
        userId,
        date: input.date,
        value: safeValue,
        targetValue: target,
        completed,
        note: input.note,
        mood: input.mood,
      })
      .returning();

    return created;
  }

  // Reset clean streak for negative habits
  public async resetCleanStreak(userId: string, input: ResetCleanStreakInput) {
    await this.verifyHabitOwner(input.habitId, userId);
    const now = new Date();

    // Reset cleanStartedAt on habit
    await db
      .update(habits)
      .set({
        cleanStartedAt: now,
        updatedAt: now,
      })
      .where(and(eq(habits.habitId, input.habitId), eq(habits.userId, userId)));

    // Record relapse check-in
    const [existing] = await db
      .select()
      .from(habitCheckIns)
      .where(
        and(
          eq(habitCheckIns.habitId, input.habitId),
          eq(habitCheckIns.date, input.date),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(habitCheckIns)
        .set({
          completed: false,
          skipReason:
            input.slipReason || "Relapse recorded — resetting clean counter",
          updatedAt: now,
        })
        .where(eq(habitCheckIns.checkInId, existing.checkInId))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(habitCheckIns)
      .values({
        habitId: input.habitId,
        userId,
        date: input.date,
        completed: false,
        skipReason:
          input.slipReason || "Relapse recorded — resetting clean counter",
      })
      .returning();

    return created;
  }

  // Apply streak freeze on missed day
  public async applyStreakFreeze(
    userId: string,
    input: ApplyStreakFreezeInput,
  ) {
    const habit = await this.verifyHabitOwner(input.habitId, userId);

    // Check freeze count for the current month
    const targetDate = new Date(input.date);
    const startOfMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const usedFreezes = await db
      .select()
      .from(habitStreakFreezes)
      .where(
        and(
          eq(habitStreakFreezes.habitId, input.habitId),
          sql`${habitStreakFreezes.createdAt} >= ${startOfMonth} AND ${habitStreakFreezes.createdAt} <= ${endOfMonth}`,
        ),
      );

    if (usedFreezes.length >= (habit.graceDaysPerMonth || 2)) {
      throw new AppError(
        "BAD_REQUEST",
        "No streak freezes remaining for this month",
      );
    }

    // Insert freeze
    const [freeze] = await db
      .insert(habitStreakFreezes)
      .values({
        habitId: input.habitId,
        userId,
        date: input.date,
        reason: input.reason || "Streak freeze applied",
      })
      .returning();

    // Mark check-in record as frozen
    const [existingCheckIn] = await db
      .select()
      .from(habitCheckIns)
      .where(
        and(
          eq(habitCheckIns.habitId, input.habitId),
          eq(habitCheckIns.date, input.date),
        ),
      )
      .limit(1);

    if (existingCheckIn) {
      await db
        .update(habitCheckIns)
        .set({
          isFreezeUsed: true,
          updatedAt: new Date(),
        })
        .where(eq(habitCheckIns.checkInId, existingCheckIn.checkInId));
    } else {
      await db.insert(habitCheckIns).values({
        habitId: input.habitId,
        userId,
        date: input.date,
        completed: false,
        isFreezeUsed: true,
        note: "Streak freeze applied",
      });
    }

    return freeze;
  }

  // Add reflection note or mood to check-in
  public async addCheckInNote(userId: string, input: AddCheckInNoteInput) {
    await this.verifyHabitOwner(input.habitId, userId);

    const [existing] = await db
      .select()
      .from(habitCheckIns)
      .where(
        and(
          eq(habitCheckIns.habitId, input.habitId),
          eq(habitCheckIns.date, input.date),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(habitCheckIns)
        .set({
          note: input.note !== undefined ? input.note : existing.note,
          mood: input.mood !== undefined ? input.mood : existing.mood,
          skipReason:
            input.skipReason !== undefined
              ? input.skipReason
              : existing.skipReason,
          updatedAt: new Date(),
        })
        .where(eq(habitCheckIns.checkInId, existing.checkInId))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(habitCheckIns)
      .values({
        habitId: input.habitId,
        userId,
        date: input.date,
        completed: false,
        note: input.note,
        mood: input.mood,
        skipReason: input.skipReason,
      })
      .returning();

    return created;
  }

  // Create routine stack of chained habits
  public async createHabitStack(userId: string, input: CreateHabitStackInput) {
    if (input.habitIds.length === 0) {
      throw new AppError(
        "BAD_REQUEST",
        "At least one habit must be selected for the routine stack",
      );
    }

    // Verify ownership of all habits
    const userHabits = await db
      .select()
      .from(habits)
      .where(
        and(eq(habits.userId, userId), inArray(habits.habitId, input.habitIds)),
      );

    if (userHabits.length !== input.habitIds.length) {
      throw new AppError(
        "FORBIDDEN",
        "One or more habits are unauthorized or do not exist",
      );
    }

    // Sequentially link habits
    for (let i = 0; i < input.habitIds.length; i++) {
      const habitId = input.habitIds[i]!;
      const predecessorId = i === 0 ? null : input.habitIds[i - 1]!;

      await db
        .update(habits)
        .set({
          stackRoutineTitle: input.title.trim(),
          stackedAfterHabitId: predecessorId,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.habitId, habitId), eq(habits.userId, userId)));
    }

    return { success: true };
  }

  // Reorder steps in routine stack
  public async reorderRoutineStack(
    userId: string,
    input: ReorderRoutineStackInput,
  ) {
    return await this.createHabitStack(userId, input);
  }

  // Delete / unlink routine stack
  public async deleteHabitStack(userId: string, routineTitle: string) {
    await db
      .update(habits)
      .set({
        stackRoutineTitle: null,
        stackedAfterHabitId: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(habits.userId, userId),
          eq(habits.stackRoutineTitle, routineTitle.trim()),
        ),
      );

    return { success: true };
  }
}

export default HabitService;
