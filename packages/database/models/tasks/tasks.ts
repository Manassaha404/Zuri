import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { taskProjects } from "./task-projects";

export const tasks = pgTable(
  "tasks",
  {
    taskId: uuid("task_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => taskProjects.projectId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: text("due_date"), // 'YYYY-MM-DD'
    dueTime: text("due_time"), // 'HH:mm'
    priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
    status: text("status").notNull().default("todo"), // 'todo' | 'doing' | 'done'
    tags: text("tags").array().notNull().default([]),
    recurrence: text("recurrence").notNull().default("none"), // 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
    reminder: text("reminder").notNull().default("none"), // 'none' | 'at_time' | '10m' | '30m' | '1h' | '1d'
    estimateMinutes: integer("estimate_minutes"),
    loggedMinutes: integer("logged_minutes").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("tasks_user_idx").on(t.userId),
    index("tasks_project_idx").on(t.projectId),
    index("tasks_status_idx").on(t.status),
    index("tasks_due_date_idx").on(t.dueDate),
  ],
);

export type TaskRecord = typeof tasks.$inferSelect;
export type NewTaskRecord = typeof tasks.$inferInsert;
