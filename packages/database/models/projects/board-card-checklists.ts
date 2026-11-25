import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { boardCards } from "./board-cards";

export const boardCardChecklists = pgTable(
  "board_card_checklists",
  {
    itemId: uuid("item_id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => boardCards.cardId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    text: text("text").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("board_card_checklists_card_idx").on(t.cardId),
    index("board_card_checklists_user_idx").on(t.userId),
  ],
);

export type BoardCardChecklistRecord = typeof boardCardChecklists.$inferSelect;
export type NewBoardCardChecklistRecord =
  typeof boardCardChecklists.$inferInsert;
