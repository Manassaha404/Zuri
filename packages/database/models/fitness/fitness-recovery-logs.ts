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

export const fitnessRecoveryLogs = pgTable(
  "fitness_recovery_logs",
  {
    recoveryId: uuid("recovery_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    date: text("date").notNull(),
    sleepHours: doublePrecision("sleep_hours").notNull().default(7.5),
    sleepQuality: integer("sleep_quality").notNull().default(4),
    soreness: integer("soreness").notNull().default(3),
    fatigue: integer("fatigue").notNull().default(3),
    restingHeartRate: integer("resting_heart_rate"),
    steps: integer("steps"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("fitness_recovery_user_idx").on(t.userId),
    index("fitness_recovery_date_idx").on(t.date),
  ],
);

export type FitnessRecoveryLogRow = typeof fitnessRecoveryLogs.$inferSelect;
export type NewFitnessRecoveryLogRow = typeof fitnessRecoveryLogs.$inferInsert;
