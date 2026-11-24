import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const deadlines = pgTable(
  "deadlines",
  {
    deadlineId: uuid("deadline_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull().default("assignment"), // 'assignment' | 'exam' | 'project' | 'bill' | 'application'
    priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
    status: text("status").notNull().default("upcoming"), // 'upcoming' | 'in_progress' | 'done' | 'missed'
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    softDueDate: timestamp("soft_due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    recurrence: text("recurrence").notNull().default("none"), // 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
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
    index("deadlines_user_idx").on(t.userId),
    index("deadlines_status_idx").on(t.status),
    index("deadlines_category_idx").on(t.category),
    index("deadlines_due_date_idx").on(t.dueDate),
  ],
);

export type Deadline = typeof deadlines.$inferSelect;
export type NewDeadline = typeof deadlines.$inferInsert;
