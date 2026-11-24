import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { debtPeople } from "./debt-people";
import { expenseGroups } from "./expense-groups";

export const billSplits = pgTable(
  "bill_splits",
  {
    splitId: uuid("split_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    totalAmount: doublePrecision("total_amount").notNull(),
    paidByPersonId: uuid("paid_by_person_id")
      .notNull()
      .references(() => debtPeople.personId, { onDelete: "restrict" }),
    groupId: uuid("group_id").references(() => expenseGroups.groupId, {
      onDelete: "set null",
    }),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    splitMethod: text("split_method").notNull().default("equal"), // 'equal' | 'exact' | 'percentage'
    note: text("note"),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("bill_splits_user_idx").on(t.userId),
    index("bill_splits_group_idx").on(t.groupId),
    index("bill_splits_paid_by_idx").on(t.paidByPersonId),
    index("bill_splits_date_idx").on(t.date),
  ],
);

export type BillSplit = typeof billSplits.$inferSelect;
export type NewBillSplit = typeof billSplits.$inferInsert;
