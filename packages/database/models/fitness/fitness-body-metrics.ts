import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessBodyMetrics = pgTable(
  "fitness_body_metrics",
  {
    metricId: uuid("metric_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    date: text("date").notNull(),
    weight: doublePrecision("weight").notNull(),
    bodyFatPct: doublePrecision("body_fat_pct"),
    chestCm: doublePrecision("chest_cm"),
    waistCm: doublePrecision("waist_cm"),
    armsCm: doublePrecision("arms_cm"),
    thighsCm: doublePrecision("thighs_cm"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fitness_body_metrics_user_idx").on(t.userId),
    index("fitness_body_metrics_date_idx").on(t.date),
  ],
);

export type FitnessBodyMetricRow = typeof fitnessBodyMetrics.$inferSelect;
export type NewFitnessBodyMetricRow = typeof fitnessBodyMetrics.$inferInsert;
