import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  text,
} from "drizzle-orm/pg-core";
export const oauthClients = pgTable("oauth_clients", {
  clientId: varchar("client_id", { length: 255 }).primaryKey(),
  clientSecret: varchar("client_secret", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  redirectUris: text("redirect_uris").notNull(), // JSON stringified array of strings
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
