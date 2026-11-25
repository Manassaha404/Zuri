import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { taskProjects } from "../tasks/task-projects";

export const boardColumns = pgTable(
  "board_columns",
  {
    columnId: uuid("column_id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => taskProjects.projectId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: text("position").notNull().default("a0"),
    wipLimit: integer("wip_limit"),
    isDoneColumn: boolean("is_done_column").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("board_columns_project_idx").on(t.projectId),
    index("board_columns_user_idx").on(t.userId),
  ],
);

export type BoardColumnRecord = typeof boardColumns.$inferSelect;
export type NewBoardColumnRecord = typeof boardColumns.$inferInsert;
