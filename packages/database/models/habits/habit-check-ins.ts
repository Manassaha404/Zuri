import {
  pgTable,
  uuid,
  text,
  boolean,
  doublePrecision,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { habits } from "./habits";

export const habitCheckIns = pgTable(
  "habit_check_ins",
  {
    checkInId: uuid("check_in_id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.habitId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    completed: boolean("completed").notNull().default(true),
    value: doublePrecision("value"),
    targetValue: doublePrecision("target_value"),
    note: text("note"),
    skipReason: text("skip_reason"),
    mood: text("mood"), // 'great' | 'good' | 'neutral' | 'low' | 'stressed'
    isFreezeUsed: boolean("is_freeze_used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("habit_check_ins_habit_date_idx").on(t.habitId, t.date),
    index("habit_check_ins_user_idx").on(t.userId),
    index("habit_check_ins_date_idx").on(t.date),
  ],
);

export type HabitCheckIn = typeof habitCheckIns.$inferSelect;
export type NewHabitCheckIn = typeof habitCheckIns.$inferInsert;
