import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../users";
import { taskProjects } from "../tasks/task-projects";

export const boardMilestones = pgTable(
  "board_milestones",
  {
    milestoneId: uuid("milestone_id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => taskProjects.projectId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueDate: text("due_date").notNull(), // 'YYYY-MM-DD'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("board_milestones_project_idx").on(t.projectId),
    index("board_milestones_user_idx").on(t.userId),
  ],
);

export type BoardMilestoneRecord = typeof boardMilestones.$inferSelect;
export type NewBoardMilestoneRecord = typeof boardMilestones.$inferInsert;
