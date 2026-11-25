import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessSavedMeals = pgTable(
  "fitness_saved_meals",
  {
    savedMealId: uuid("saved_meal_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    calories: doublePrecision("calories").notNull().default(0),
    protein: doublePrecision("protein").notNull().default(0),
    carbs: doublePrecision("carbs").notNull().default(0),
    fat: doublePrecision("fat").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("fitness_saved_meals_user_idx").on(t.userId)],
);

export type FitnessSavedMealRow = typeof fitnessSavedMeals.$inferSelect;
export type NewFitnessSavedMealRow = typeof fitnessSavedMeals.$inferInsert;
