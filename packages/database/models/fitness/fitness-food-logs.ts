import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessFoodLogs = pgTable(
  "fitness_food_logs",
  {
    foodLogId: uuid("food_log_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    foodId: text("food_id"),
    date: text("date").notNull(),
    meal: text("meal").notNull().default("Lunch"),
    name: text("name").notNull(),
    servings: doublePrecision("servings").notNull().default(1),
    calories: doublePrecision("calories").notNull().default(0),
    protein: doublePrecision("protein").notNull().default(0),
    carbs: doublePrecision("carbs").notNull().default(0),
    fat: doublePrecision("fat").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fitness_food_logs_user_idx").on(t.userId),
    index("fitness_food_logs_date_idx").on(t.date),
  ],
);

export type FitnessFoodLogRow = typeof fitnessFoodLogs.$inferSelect;
export type NewFitnessFoodLogRow = typeof fitnessFoodLogs.$inferInsert;
