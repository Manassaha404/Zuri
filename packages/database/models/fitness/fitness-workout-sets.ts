import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
import { fitnessWorkoutExercises } from "./fitness-workout-exercises";

export const fitnessWorkoutSets = pgTable(
  "fitness_workout_sets",
  {
    setId: uuid("set_id").primaryKey().defaultRandom(),
    workoutExerciseId: uuid("workout_exercise_id")
      .notNull()
      .references(() => fitnessWorkoutExercises.workoutExerciseId, {
        onDelete: "cascade",
      }),
    setNumber: integer("set_number").notNull().default(1),
    type: text("type").notNull().default("working"),
    weight: doublePrecision("weight").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    rpe: doublePrecision("rpe"),
    rir: integer("rir"),
    tempo: text("tempo"),
    restSeconds: integer("rest_seconds").notNull().default(90),
    completed: boolean("completed").notNull().default(false),
    prs: text("prs").array(),
  },
  (t) => [index("fitness_sets_we_idx").on(t.workoutExerciseId)],
);

export type FitnessWorkoutSetRow = typeof fitnessWorkoutSets.$inferSelect;
export type NewFitnessWorkoutSetRow = typeof fitnessWorkoutSets.$inferInsert;
