import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessInjuries = pgTable(
  "fitness_injuries",
  {
    injuryId: uuid("injury_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    bodyPart: text("body_part").notNull().default("General"),
    severity: text("severity").notNull().default("Mild"),
    status: text("status").notNull().default("Active"),
    startedAt: text("started_at").notNull(),
    avoidExerciseIds: text("avoid_exercise_ids").array().notNull().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("fitness_injuries_user_idx").on(t.userId)],
);

export type FitnessInjuryRow = typeof fitnessInjuries.$inferSelect;
export type NewFitnessInjuryRow = typeof fitnessInjuries.$inferInsert;
