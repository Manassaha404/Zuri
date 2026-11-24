import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { habits } from "./habits";

export const habitStreakFreezes = pgTable(
  "habit_streak_freezes",
  {
    freezeId: uuid("freeze_id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.habitId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    reason: text("reason"),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("habit_streak_freezes_habit_date_idx").on(t.habitId, t.date),
    index("habit_streak_freezes_user_idx").on(t.userId),
    index("habit_streak_freezes_date_idx").on(t.date),
  ],
);

export type HabitStreakFreeze = typeof habitStreakFreezes.$inferSelect;
export type NewHabitStreakFreeze = typeof habitStreakFreezes.$inferInsert;
