import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessProgressPhotos = pgTable(
  "fitness_progress_photos",
  {
    photoId: uuid("photo_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    date: text("date").notNull(),
    pose: text("pose").notNull().default("Front"),
    weight: doublePrecision("weight"),
    dataUrl: text("data_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("fitness_photos_user_idx").on(t.userId)],
);

export type FitnessProgressPhotoRow = typeof fitnessProgressPhotos.$inferSelect;
export type NewFitnessProgressPhotoRow =
  typeof fitnessProgressPhotos.$inferInsert;
