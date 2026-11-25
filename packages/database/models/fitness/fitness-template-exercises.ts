import { pgTable, uuid, text, integer, index } from "drizzle-orm/pg-core";
import { fitnessWorkoutTemplates } from "./fitness-workout-templates";
import { fitnessExercises } from "./fitness-exercises";

export const fitnessTemplateExercises = pgTable(
  "fitness_template_exercises",
  {
    templateExerciseId: uuid("template_exercise_id")
      .primaryKey()
      .defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => fitnessWorkoutTemplates.templateId, {
        onDelete: "cascade",
      }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => fitnessExercises.exerciseId, {
        onDelete: "cascade",
      }),
    sortOrder: integer("sort_order").notNull().default(0),
    targetSets: integer("target_sets").notNull().default(3),
    targetReps: text("target_reps").notNull().default("8-10"),
    restSeconds: integer("rest_seconds").notNull().default(90),
    supersetGroupId: text("superset_group_id"),
  },
  (t) => [
    index("fitness_tpl_ex_tpl_idx").on(t.templateId),
    index("fitness_tpl_ex_ex_idx").on(t.exerciseId),
  ],
);

export type FitnessTemplateExerciseRow =
  typeof fitnessTemplateExercises.$inferSelect;
export type NewFitnessTemplateExerciseRow =
  typeof fitnessTemplateExercises.$inferInsert;
