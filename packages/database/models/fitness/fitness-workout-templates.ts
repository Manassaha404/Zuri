import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessWorkoutTemplates = pgTable(
  "fitness_workout_templates",
  {
    templateId: uuid("template_id").primaryKey().defaultRandom(),
    slug: text("slug").unique(),
    userId: uuid("user_id").references(() => users.userId, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    category: text("category").notNull().default("Custom"),
    description: text("description").notNull().default(""),
    estimatedMinutes: integer("estimated_minutes").notNull().default(45),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("fitness_templates_user_idx").on(t.userId),
    index("fitness_templates_cat_idx").on(t.category),
  ],
);

export type FitnessWorkoutTemplateRow =
  typeof fitnessWorkoutTemplates.$inferSelect;
export type NewFitnessWorkoutTemplateRow =
  typeof fitnessWorkoutTemplates.$inferInsert;
