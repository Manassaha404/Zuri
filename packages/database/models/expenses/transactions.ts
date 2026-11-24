import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { expenseCategories } from "./expense-categories";
import { expenseAccounts } from "./expense-accounts";

export const transactions = pgTable(
  "transactions",
  {
    transactionId: uuid("transaction_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    type: text("type").notNull().default("expense"), // 'expense' | 'income'
    amount: doublePrecision("amount").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => expenseCategories.categoryId, { onDelete: "restrict" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => expenseAccounts.accountId, { onDelete: "restrict" }),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    note: text("note"),
    receiptUrl: text("receipt_url"),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurrenceFrequency: text("recurrence_frequency").notNull().default("none"), // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transactions_user_idx").on(t.userId),
    index("transactions_date_idx").on(t.date),
    index("transactions_category_idx").on(t.categoryId),
    index("transactions_account_idx").on(t.accountId),
    index("transactions_type_idx").on(t.type),
  ],
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
