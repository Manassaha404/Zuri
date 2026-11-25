import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessFoods = pgTable(
  "fitness_foods",
  {
    foodId: uuid("food_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    barcode: text("barcode"),
    servingSize: text("serving_size").notNull().default("100g"),
    calories: doublePrecision("calories").notNull().default(0),
    protein: doublePrecision("protein").notNull().default(0),
    carbs: doublePrecision("carbs").notNull().default(0),
    fat: doublePrecision("fat").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fitness_foods_user_idx").on(t.userId),
    index("fitness_foods_barcode_idx").on(t.barcode),
  ],
);

export type FitnessFoodRow = typeof fitnessFoods.$inferSelect;
export type NewFitnessFoodRow = typeof fitnessFoods.$inferInsert;
