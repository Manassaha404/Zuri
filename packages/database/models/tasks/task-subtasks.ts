import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { tasks } from "./tasks";

export const taskSubtasks = pgTable(
  "task_subtasks",
  {
    subtaskId: uuid("subtask_id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.taskId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    text: text("text").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("task_subtasks_task_idx").on(t.taskId),
    index("task_subtasks_user_idx").on(t.userId),
  ],
);

export type TaskSubtaskRecord = typeof taskSubtasks.$inferSelect;
export type NewTaskSubtaskRecord = typeof taskSubtasks.$inferInsert;
