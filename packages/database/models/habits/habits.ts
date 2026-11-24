import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const habits = pgTable(
  "habits",
  {
    habitId: uuid("habit_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon").notNull().default("Sparkles"),
    color: text("color").notNull().default("#3b82f6"),
    type: text("type").notNull().default("boolean"), // 'boolean' | 'numeric' | 'negative'
    frequencyType: text("frequency_type").notNull().default("daily"), // 'daily' | 'weekly' | 'specific_days' | 'times_per_week'
    frequencyDaysOfWeek: integer("frequency_days_of_week").array(),
    frequencyTimesPerWeek: integer("frequency_times_per_week"),
    targetValue: doublePrecision("target_value"),
    unit: text("unit"),
    timeOfDay: text("time_of_day").notNull().default("morning"), // 'morning' | 'afternoon' | 'evening' | 'anytime'
    reminderTime: text("reminder_time"),
    status: text("status").notNull().default("active"), // 'active' | 'paused' | 'archived'
    cleanStartedAt: timestamp("clean_started_at", { withTimezone: true }),
    stackedAfterHabitId: uuid("stacked_after_habit_id").references(
      (): AnyPgColumn => habits.habitId,
      { onDelete: "set null" },
    ),
    stackRoutineTitle: text("stack_routine_title"),
    graceDaysPerMonth: integer("grace_days_per_month").notNull().default(2),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("habits_user_idx").on(t.userId),
    index("habits_status_idx").on(t.status),
    index("habits_time_of_day_idx").on(t.timeOfDay),
    index("habits_stacked_after_idx").on(t.stackedAfterHabitId),
  ],
);

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
