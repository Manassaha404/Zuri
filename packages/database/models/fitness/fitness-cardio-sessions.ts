import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessCardioSessions = pgTable(
  "fitness_cardio_sessions",
  {
    cardioId: uuid("cardio_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    type: text("type").notNull().default("run"),
    date: text("date").notNull(),
    distanceKm: doublePrecision("distance_km").notNull().default(0),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    heartRateAvg: integer("heart_rate_avg"),
    calories: integer("calories").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fitness_cardio_user_idx").on(t.userId),
    index("fitness_cardio_date_idx").on(t.date),
  ],
);

export type FitnessCardioSessionRow = typeof fitnessCardioSessions.$inferSelect;
export type NewFitnessCardioSessionRow =
  typeof fitnessCardioSessions.$inferInsert;
