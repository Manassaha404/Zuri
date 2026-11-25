import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessWaterLogs = pgTable(
  "fitness_water_logs",
  {
    waterLogId: uuid("water_log_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    date: text("date").notNull(),
    amountMl: integer("amount_ml").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("fitness_water_user_idx").on(t.userId),
    index("fitness_water_date_idx").on(t.date),
  ],
);

export type FitnessWaterLogRow = typeof fitnessWaterLogs.$inferSelect;
export type NewFitnessWaterLogRow = typeof fitnessWaterLogs.$inferInsert;
