import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessPrograms = pgTable(
  "fitness_programs",
  {
    programId: uuid("program_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    style: text("style").notNull().default("Custom"),
    description: text("description").notNull().default(""),
    totalWeeks: integer("total_weeks").notNull().default(4),
    currentWeek: integer("current_week").notNull().default(1),
    deloadEveryWeeks: integer("deload_every_weeks").notNull().default(4),
    progressionRule: text("progression_rule").notNull().default(""),
    templateIds: text("template_ids").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("fitness_programs_user_idx").on(t.userId)],
);

export type FitnessProgramRow = typeof fitnessPrograms.$inferSelect;
export type NewFitnessProgramRow = typeof fitnessPrograms.$inferInsert;
