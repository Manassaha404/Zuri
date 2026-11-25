import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "../users";

export const fitnessBodyweightSkills = pgTable(
  "fitness_bodyweight_skills",
  {
    skillId: uuid("skill_id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("Skill"),
    stages: text("stages").array().notNull().default([]),
    stageIndex: integer("stage_index").notNull().default(0),
    currentStage: text("current_stage").notNull(),
    targetHoldOrReps: text("target_hold_or_reps").notNull().default(""),
    lastPracticed: text("last_practiced"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("fitness_skills_user_idx").on(t.userId)],
);

export type FitnessBodyweightSkillRow =
  typeof fitnessBodyweightSkills.$inferSelect;
export type NewFitnessBodyweightSkillRow =
  typeof fitnessBodyweightSkills.$inferInsert;
