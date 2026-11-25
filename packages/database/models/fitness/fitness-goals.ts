import {
  pgTable,
  uuid,
  text,
  boolean,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessGoals = pgTable(
  "fitness_goals",
  {
    goalId: uuid("goal_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull().default("Strength"),
    currentValue: doublePrecision("current_value").notNull().default(0),
    targetValue: doublePrecision("target_value").notNull().default(100),
    unit: text("unit").notNull().default("kg"),
    targetDate: text("target_date").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("fitness_goals_user_idx").on(t.userId)],
);

export type FitnessGoalRow = typeof fitnessGoals.$inferSelect;
export type NewFitnessGoalRow = typeof fitnessGoals.$inferInsert;
