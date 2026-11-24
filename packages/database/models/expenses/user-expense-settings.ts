import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const userExpenseSettings = pgTable(
  "user_expense_settings",
  {
    settingsId: uuid("settings_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    currency: text("currency").notNull().default("USD"), // 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("user_expense_settings_user_idx").on(t.userId)],
);

export type UserExpenseSetting = typeof userExpenseSettings.$inferSelect;
export type NewUserExpenseSetting = typeof userExpenseSettings.$inferInsert;
