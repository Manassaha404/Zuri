import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { oauthClients } from "./clients";
export const oauthTokens = pgTable(
  "oauth_tokens",
  {
    tokenId: uuid("token_id").primaryKey().defaultRandom(),
    refreshToken: varchar("refresh_token", { length: 512 }).unique(),
    clientId: varchar("client_id", { length: 255 })
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    scope: varchar("scope", { length: 255 })
      .default("mcp:tools mcp:resources mcp:prompts")
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("oauth_tokens_user_idx").on(table.userId),
    index("oauth_tokens_refresh_idx").on(table.refreshToken),
  ],
);
