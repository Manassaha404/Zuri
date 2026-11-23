import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";
import { oauthClients } from "./clients";
export const oauthCodes = pgTable(
  "oauth_codes",
  {
    code: varchar("code", { length: 255 }).primaryKey(),
    clientId: varchar("client_id", { length: 255 })
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    redirectUri: varchar("redirect_uri", { length: 1024 }).notNull(),
    codeChallenge: varchar("code_challenge", { length: 255 }).notNull(),
    codeChallengeMethod: varchar("code_challenge_method", { length: 32 })
      .default("S256")
      .notNull(),
    scope: varchar("scope", { length: 255 })
      .default("mcp:tools mcp:resources mcp:prompts")
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    used: boolean("used").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("oauth_codes_client_idx").on(table.clientId),
    index("oauth_codes_user_idx").on(table.userId),
  ],
);
