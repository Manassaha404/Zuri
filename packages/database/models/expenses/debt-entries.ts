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
import { debtPeople } from "./debt-people";

export const debtEntries = pgTable(
  "debt_entries",
  {
    entryId: uuid("entry_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => debtPeople.personId, { onDelete: "cascade" }),
    type: text("type").notNull().default("lent"), // 'lent' (they owe me) | 'borrowed' (I owe them)
    principalAmount: doublePrecision("principal_amount").notNull(),
    interestRateAnnual: doublePrecision("interest_rate_annual").default(0), // annual interest %
    startDate: text("start_date").notNull(), // 'YYYY-MM-DD'
    dueDate: text("due_date"), // 'YYYY-MM-DD'
    note: text("note"),
    proofUrl: text("proof_url"),
    isSettled: boolean("is_settled").notNull().default(false),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("debt_entries_user_idx").on(t.userId),
    index("debt_entries_person_idx").on(t.personId),
    index("debt_entries_type_idx").on(t.type),
    index("debt_entries_settled_idx").on(t.isSettled),
    index("debt_entries_due_date_idx").on(t.dueDate),
  ],
);

export type DebtEntry = typeof debtEntries.$inferSelect;
export type NewDebtEntry = typeof debtEntries.$inferInsert;
