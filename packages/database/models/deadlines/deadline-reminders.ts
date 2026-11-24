import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { deadlines } from "./deadlines";

export const deadlineReminders = pgTable(
  "deadline_reminders",
  {
    reminderId: uuid("reminder_id").primaryKey().defaultRandom(),
    deadlineId: uuid("deadline_id")
      .notNull()
      .references(() => deadlines.deadlineId, { onDelete: "cascade" }),
    offset: text("offset").notNull(), // '1_hour' | '1_day' | '3_days' | '1_week' | '2_weeks'
    isTriggered: boolean("is_triggered").notNull().default(false),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("deadline_reminders_deadline_idx").on(t.deadlineId),
    index("deadline_reminders_offset_idx").on(t.offset),
  ],
);

export type DeadlineReminder = typeof deadlineReminders.$inferSelect;
export type NewDeadlineReminder = typeof deadlineReminders.$inferInsert;
