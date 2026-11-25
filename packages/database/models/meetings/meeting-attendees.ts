import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";

export const meetingAttendees = pgTable(
  "meeting_attendees",
  {
    attendeeId: uuid("attendee_id").primaryKey().defaultRandom(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.meetingId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    avatar: text("avatar"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("meeting_attendees_meeting_idx").on(t.meetingId),
    index("meeting_attendees_email_idx").on(t.email),
  ],
);

export type MeetingAttendee = typeof meetingAttendees.$inferSelect;
export type NewMeetingAttendee = typeof meetingAttendees.$inferInsert;
