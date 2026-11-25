import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { taskProjects } from "../tasks/task-projects";

export const boardSprints = pgTable(
  "board_sprints",
  {
    sprintId: uuid("sprint_id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => taskProjects.projectId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goal: text("goal"),
    startDate: text("start_date").notNull(), // 'YYYY-MM-DD'
    endDate: text("end_date").notNull(), // 'YYYY-MM-DD'
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("board_sprints_project_idx").on(t.projectId),
    index("board_sprints_user_idx").on(t.userId),
  ],
);

export type BoardSprintRecord = typeof boardSprints.$inferSelect;
export type NewBoardSprintRecord = typeof boardSprints.$inferInsert;
