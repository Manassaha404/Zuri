import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { meetings } from "./meetings";

export const meetingReminders = pgTable(
  "meeting_reminders",
  {
    reminderId: uuid("reminder_id").primaryKey().defaultRandom(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.meetingId, { onDelete: "cascade" }),
    offset: text("offset").notNull().default("none"), // 'none' | '5m' | '10m' | '15m' | '30m' | '1h'
    isTriggered: boolean("is_triggered").notNull().default(false),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("meeting_reminders_meeting_idx").on(t.meetingId),
    index("meeting_reminders_offset_idx").on(t.offset),
  ],
);

export type MeetingReminder = typeof meetingReminders.$inferSelect;
export type NewMeetingReminder = typeof meetingReminders.$inferInsert;
