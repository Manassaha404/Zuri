import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { debtEntries } from "./debt-entries";

export const debtRepayments = pgTable(
  "debt_repayments",
  {
    repaymentId: uuid("repayment_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => debtEntries.entryId, { onDelete: "cascade" }),
    entryDate: text("entry_date").notNull(), // 'YYYY-MM-DD'
    amount: doublePrecision("amount").notNull(),
    note: text("note"),
    proofUrl: text("proof_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("debt_repayments_user_idx").on(t.userId),
    index("debt_repayments_entry_idx").on(t.entryId),
    index("debt_repayments_date_idx").on(t.entryDate),
  ],
);

export type DebtRepayment = typeof debtRepayments.$inferSelect;
export type NewDebtRepayment = typeof debtRepayments.$inferInsert;
