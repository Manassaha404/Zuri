import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessNutritionSettings = pgTable("fitness_nutrition_settings", {
  settingId: uuid("setting_id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.userId, { onDelete: "cascade" }),
  calories: integer("calories").notNull().default(2200),
  protein: integer("protein").notNull().default(150),
  carbs: integer("carbs").notNull().default(240),
  fat: integer("fat").notNull().default(70),
  waterMl: integer("water_ml").notNull().default(3000),
  goalMode: text("goal_mode").notNull().default("maintain"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type FitnessNutritionSettingRow =
  typeof fitnessNutritionSettings.$inferSelect;
export type NewFitnessNutritionSettingRow =
  typeof fitnessNutritionSettings.$inferInsert;
