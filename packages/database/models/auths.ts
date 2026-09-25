import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const userRolesEnum = pgEnum("user_roles", ["admin", "user"]);
export const auths = pgTable(
  "auths",
  {
    authId: uuid("auth_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    password: varchar("password", { length: 255 }),
    role: userRolesEnum("role").default("user").notNull(),
    googleAccountId: varchar("google_account_id", { length: 255 }),
    googleRefreshToken: varchar("google_refresh_token", { length: 512 }),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    isVerified: boolean("is_verified").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (auths) => [index("auth_user_id_idx").on(auths.userId)],
);
