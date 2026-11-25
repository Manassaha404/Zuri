import { type InputPrompt } from "fastmcp";

export const FITNESS_GUIDELINES_PROMPT = `# Fitness Tracker & Nutrition Guidelines
Comprehensive guide for managing workouts, training programs, cardio, bodyweight skills, nutrition, hydration, body metrics, recovery, injuries, and fitness goals via MCP tools.

## 1. Core Pillars
1. **Workouts & Exercises**: System catalog + user custom exercises (\`exerciseId\` UUIDs), workout templates, and logged workout sessions with set-level tracking (weight, reps, RPE/RIR, tempo, rest, PRs).
2. **Programs, Cardio & Skills**: Multi-week structured programs (with deload cadence), cardio sessions (distance, duration, heart rate, calories), and calisthenics skill stage progressions.
3. **Nutrition & Hydration**: Daily calorie/macro targets (\`cut\` | \`maintain\` | \`bulk\`), custom foods, meal logs, saved meal presets, and water intake in milliliters.
4. **Body Metrics, Recovery, Injuries & Goals**: Weight and circumference logs, daily sleep/soreness/fatigue/RHR/steps recovery logs, active injury tracking with \`avoidExerciseIds\`, and measurable goals.

## 2. Discovery & Safety Rules
- Always call \`fitness_get_workspace\` first when inspecting, logging, or updating workouts, foods, injuries, or goals so you use valid \`exerciseId\`, \`templateId\`, \`programId\`, \`skillId\`, \`foodLogId\`, \`injuryId\`, and \`goalId\` UUIDs.
- **Injury Awareness**: Check active/recovering \`injuries\` and \`avoidExerciseIds\` in the workspace before recommending or logging exercises. Never suggest an exercise listed in an active injury's \`avoidExerciseIds\`.
- **Date & Time Formats**: Use strict \`YYYY-MM-DD\` for \`date\`, \`startedAt\` (injuries), and \`targetDate\`. Use ISO 8601 timestamps for workout session \`startedAt\` and \`completedAt\`.
`;

export const FITNESS_WORKOUT_AND_PROGRAM_GUIDELINES_PROMPT = `# Workouts, Programs, Cardio & Skills Guidelines
Operational rules for logging strength training, programs, cardio, and bodyweight skills.

## 1. Logging Workout Sessions (\`fitness_save_workout_session\`)
- Every exercise in \`exercises\` must reference a valid \`exerciseId\` UUID from \`fitness_get_workspace\` (or from \`fitness_create_custom_exercise\` if the exercise does not exist yet).
- Each set requires \`setNumber\` (1-based), \`type\` ("working" | "warmup" | "dropset" | "failure"), \`weight\` (0 for bodyweight), \`reps\`, \`restSeconds\`, and \`completed\`. Optional: \`rpe\` (1-10), \`rir\`, \`tempo\`, \`prs\`.
- Provide \`date\` (\`YYYY-MM-DD\`), \`startedAt\` (ISO 8601), optional \`completedAt\` (ISO 8601), and \`durationMinutes\`.

## 2. Training Programs, Cardio & Skills
- **Programs**: Use \`fitness_create_program\` with \`totalWeeks\` (1-52) and optional \`deloadEveryWeeks\` (1-12). Advance weeks with \`fitness_advance_program_week\`.
- **Cardio**: Use \`fitness_add_cardio_session\` with \`type\`, \`date\` (\`YYYY-MM-DD\`), \`distanceKm\`, \`durationMinutes\`, \`calories\`, and optional \`heartRateAvg\`.
- **Bodyweight Skills**: Use \`fitness_create_skill\` with ordered \`stages\` and \`targetHoldOrReps\`, and progress stages via \`fitness_advance_skill_stage\`.
`;

export const FITNESS_NUTRITION_AND_RECOVERY_GUIDELINES_PROMPT = `# Nutrition, Body Metrics, Recovery & Goals Guidelines
Operational rules for tracking diet, hydration, body composition, recovery, injuries, and fitness goals.

## 1. Nutrition & Hydration
- **Targets**: Set daily \`calories\`, \`protein\`, \`carbs\`, \`fat\`, \`waterMl\`, and \`goalMode\` ("cut" | "maintain" | "bulk") using \`fitness_set_nutrition_targets\`.
- **Food Logging**: Add custom foods via \`fitness_add_food\`, log meals via \`fitness_add_food_log\` (\`meal\`: e.g. "Breakfast", "Lunch", "Dinner", "Snack"), remove entries via \`fitness_remove_food_log\`, or save reusable presets via \`fitness_add_saved_meal\`.
- **Hydration**: Log water intake with \`fitness_add_water_ml\` (\`date\`, \`amountMl\`).

## 2. Body Metrics, Recovery, Injuries & Goals
- **Body Metrics**: Log weight and optional body fat % / circumferences via \`fitness_add_body_metric\`.
- **Recovery**: Save daily recovery via \`fitness_save_recovery_log\` (\`sleepHours\` 0-24, \`sleepQuality\` 1-5, \`soreness\` 1-10, \`fatigue\` 1-10, optional \`restingHeartRate\`, \`steps\`).
- **Injuries**: Record injuries with \`fitness_add_injury\` (\`severity\`: "Mild" | "Moderate" | "Severe", \`status\`: "Active" | "Recovering" | "Resolved") and cycle status via \`fitness_toggle_injury_status\`.
- **Goals**: Create goals with \`fitness_add_goal\` (\`category\`: "Strength" | "Bodyweight" | "Cardio" | "Consistency"), update progress with \`fitness_update_goal_progress\`, or delete with \`fitness_delete_goal\`.
`;

export const fitnessPrompts: InputPrompt[] = [
  {
    name: "fitness_guidelines",
    description:
      "Comprehensive guidelines for Fitness Tracker workspace discovery, injury safety, date formats, and all fitness/nutrition workflows.",
    load: async () => FITNESS_GUIDELINES_PROMPT,
  },
  {
    name: "fitness_workout_and_program_guidelines",
    description:
      "Guidelines for logging workout sessions, custom exercises, multi-week training programs, cardio, and bodyweight skills.",
    load: async () => FITNESS_WORKOUT_AND_PROGRAM_GUIDELINES_PROMPT,
  },
  {
    name: "fitness_nutrition_and_recovery_guidelines",
    description:
      "Guidelines for nutrition targets, food/water logging, body metrics, recovery logs, injuries, and fitness goals.",
    load: async () => FITNESS_NUTRITION_AND_RECOVERY_GUIDELINES_PROMPT,
  },
];

export function registerFitnessPrompts(server: any) {
  for (const prompt of fitnessPrompts) {
    server.addPrompt(prompt);
  }
}

export default registerFitnessPrompts;
