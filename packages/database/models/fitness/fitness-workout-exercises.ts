import { pgTable, uuid, text, integer, index } from "drizzle-orm/pg-core";
import { fitnessWorkoutSessions } from "./fitness-workout-sessions";
import { fitnessExercises } from "./fitness-exercises";

export const fitnessWorkoutExercises = pgTable(
  "fitness_workout_exercises",
  {
    workoutExerciseId: uuid("workout_exercise_id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => fitnessWorkoutSessions.sessionId, {
        onDelete: "cascade",
      }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => fitnessExercises.exerciseId, {
        onDelete: "cascade",
      }),
    exerciseName: text("exercise_name").notNull(),
    muscleGroup: text("muscle_group").notNull(),
    equipment: text("equipment").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    supersetGroupId: text("superset_group_id"),
    notes: text("notes"),
  },
  (t) => [
    index("fitness_we_session_idx").on(t.sessionId),
    index("fitness_we_ex_idx").on(t.exerciseId),
  ],
);

export type FitnessWorkoutExerciseRow =
  typeof fitnessWorkoutExercises.$inferSelect;
export type NewFitnessWorkoutExerciseRow =
  typeof fitnessWorkoutExercises.$inferInsert;
