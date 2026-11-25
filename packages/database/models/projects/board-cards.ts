import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { taskProjects } from "../tasks/task-projects";
import { boardColumns } from "./board-columns";
import { boardSprints } from "./board-sprints";
import { boardMilestones } from "./board-milestones";

export interface BoardCardLabelData {
  id: string;
  name: string;
  color: string;
}

export const boardCards = pgTable(
  "board_cards",
  {
    cardId: uuid("card_id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => taskProjects.projectId, { onDelete: "cascade" }),
    columnId: uuid("column_id")
      .notNull()
      .references(() => boardColumns.columnId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    sprintId: uuid("sprint_id").references(() => boardSprints.sprintId, {
      onDelete: "set null",
    }),
    milestoneId: uuid("milestone_id").references(
      () => boardMilestones.milestoneId,
      { onDelete: "set null" },
    ),
    position: text("position").notNull().default("a0"),
    title: text("title").notNull(),
    description: text("description"),
    labels: jsonb("labels").$type<BoardCardLabelData[]>().notNull().default([]),
    priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
    startDate: text("start_date"), // 'YYYY-MM-DD'
    dueDate: text("due_date"), // 'YYYY-MM-DD'
    assignee: text("assignee"),
    storyPoints: integer("story_points").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("board_cards_project_idx").on(t.projectId),
    index("board_cards_column_idx").on(t.columnId),
    index("board_cards_user_idx").on(t.userId),
    index("board_cards_sprint_idx").on(t.sprintId),
    index("board_cards_milestone_idx").on(t.milestoneId),
  ],
);

export type BoardCardRecord = typeof boardCards.$inferSelect;
export type NewBoardCardRecord = typeof boardCards.$inferInsert;
