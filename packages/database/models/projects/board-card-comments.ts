import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../users";
import { boardCards } from "./board-cards";

export const boardCardComments = pgTable(
  "board_card_comments",
  {
    commentId: uuid("comment_id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => boardCards.cardId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    author: text("author").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("board_card_comments_card_idx").on(t.cardId),
    index("board_card_comments_user_idx").on(t.userId),
  ],
);

export type BoardCardCommentRecord = typeof boardCardComments.$inferSelect;
export type NewBoardCardCommentRecord = typeof boardCardComments.$inferInsert;
