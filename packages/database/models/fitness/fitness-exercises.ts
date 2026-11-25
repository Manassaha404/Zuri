import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessExercises = pgTable(
  "fitness_exercises",
  {
    exerciseId: uuid("exercise_id").primaryKey().defaultRandom(),
    slug: text("slug").unique(),
    userId: uuid("user_id").references(() => users.userId, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    muscleGroup: text("muscle_group").notNull(),
    secondaryMuscles: text("secondary_muscles").array(),
    equipment: text("equipment").notNull(),
    defaultRestSeconds: integer("default_rest_seconds").notNull().default(90),
    isCustom: boolean("is_custom").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("fitness_exercises_user_idx").on(t.userId),
    index("fitness_exercises_muscle_idx").on(t.muscleGroup),
    index("fitness_exercises_equip_idx").on(t.equipment),
  ],
);

export type FitnessExerciseRow = typeof fitnessExercises.$inferSelect;
export type NewFitnessExerciseRow = typeof fitnessExercises.$inferInsert;
