import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const meetings = pgTable(
  "meetings",
  {
    meetingId: uuid("meeting_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    startTime: text("start_time").notNull(), // 'HH:mm' (24h)
    endTime: text("end_time").notNull(), // 'HH:mm' (24h)
    locationOrLink: text("location_or_link"),
    type: text("type").notNull().default("other"), // 'class' | 'standup' | '1:1' | 'interview' | 'other'
    tags: text("tags").array().notNull().default([]),
    agendaMarkdown: text("agenda_markdown").notNull().default(""),
    notesMarkdown: text("notes_markdown").notNull().default(""),
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
    index("meetings_user_idx").on(t.userId),
    index("meetings_date_idx").on(t.date),
    index("meetings_type_idx").on(t.type),
  ],
);

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
