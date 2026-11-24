import {
  pgTable,
  uuid,
  doublePrecision,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { billSplits } from "./bill-splits";
import { debtPeople } from "./debt-people";

export const billSplitItems = pgTable(
  "bill_split_items",
  {
    itemId: uuid("item_id").primaryKey().defaultRandom(),
    splitId: uuid("split_id")
      .notNull()
      .references(() => billSplits.splitId, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => debtPeople.personId, { onDelete: "cascade" }),
    amount: doublePrecision("amount").notNull(),
    percentage: doublePrecision("percentage"),
    isPaid: boolean("is_paid").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("bill_split_items_split_idx").on(t.splitId),
    index("bill_split_items_person_idx").on(t.personId),
    uniqueIndex("bill_split_item_unique_idx").on(t.splitId, t.personId),
  ],
);

export type BillSplitItem = typeof billSplitItems.$inferSelect;
export type NewBillSplitItem = typeof billSplitItems.$inferInsert;
