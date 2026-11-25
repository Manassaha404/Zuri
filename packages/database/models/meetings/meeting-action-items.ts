import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { meetings } from "./meetings";

export const meetingActionItems = pgTable(
  "meeting_action_items",
  {
    actionItemId: uuid("action_item_id").primaryKey().defaultRandom(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.meetingId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    text: text("text").notNull(),
    completed: boolean("completed").notNull().default(false),
    owner: text("owner"),
    dueDate: text("due_date"), // 'YYYY-MM-DD'
    convertedToTask: boolean("converted_to_task").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("meeting_action_items_meeting_idx").on(t.meetingId),
    index("meeting_action_items_user_idx").on(t.userId),
    index("meeting_action_items_completed_idx").on(t.completed),
  ],
);

export type MeetingActionItem = typeof meetingActionItems.$inferSelect;
export type NewMeetingActionItem = typeof meetingActionItems.$inferInsert;
