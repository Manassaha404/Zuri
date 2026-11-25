import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../users";

export const taskProjects = pgTable(
  "task_projects",
  {
    projectId: uuid("project_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    description: text("description"),
    status: text("status").notNull().default("active"), // 'planning' | 'active' | 'on_hold' | 'completed'
    deadline: text("deadline"), // 'YYYY-MM-DD'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("task_projects_user_idx").on(t.userId),
    index("task_projects_status_idx").on(t.status),
  ],
);

export type TaskProjectRecord = typeof taskProjects.$inferSelect;
export type NewTaskProjectRecord = typeof taskProjects.$inferInsert;
