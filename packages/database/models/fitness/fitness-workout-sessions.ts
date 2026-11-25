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
import { fitnessWorkoutTemplates } from "./fitness-workout-templates";

export const fitnessWorkoutSessions = pgTable(
  "fitness_workout_sessions",
  {
    sessionId: uuid("session_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(
      () => fitnessWorkoutTemplates.templateId,
      { onDelete: "set null" },
    ),
    title: text("title").notNull(),
    date: text("date").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    isDeload: boolean("is_deload").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fitness_sessions_user_idx").on(t.userId),
    index("fitness_sessions_date_idx").on(t.date),
  ],
);

export type FitnessWorkoutSessionRow =
  typeof fitnessWorkoutSessions.$inferSelect;
export type NewFitnessWorkoutSessionRow =
  typeof fitnessWorkoutSessions.$inferInsert;
