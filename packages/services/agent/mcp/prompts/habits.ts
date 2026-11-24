import { type InputPrompt } from "fastmcp";

export const HABITS_GUIDELINES_PROMPT = `# Habits Guidelines
Habit tracking & routines via MCP tools.

## 1. Pillars
1. Habits: Routine/behavior definitions.
2. Check-Ins: Daily completion/numeric progression/clean streak logs on date (YYYY-MM-DD).
3. Freezes: Monthly grace days (graceDaysPerMonth) saving streaks during emergencies/rest.
4. Stacking: Sequential chaining via stackedAfterHabitId & stackRoutineTitle.

## 2. Types
- boolean: Binary completion (habits_toggle_check_in).
- numeric: Progress toward targetValue & unit (habits_set_numeric_value; completed if value >= targetValue).
- negative: Clean counter from cleanStartedAt (habits_reset_clean_streak with slipReason on relapse).

## 3. Scheduling
- frequencyType: daily, weekly, specific_days (frequencyDaysOfWeek: 0=Sun..6=Sat), times_per_week (frequencyTimesPerWeek: 1..7).
- timeOfDay: morning, afternoon, evening, anytime.
- reminderTime: 24h format (e.g. "08:00").

## 4. Tools
- Discovery: habits_get_workspace (full dashboard), habits_get_habits (filter status/timeOfDay), habits_get_habit_by_id.
- Tracking: habits_toggle_check_in, habits_set_numeric_value, habits_reset_clean_streak, habits_apply_streak_freeze, habits_add_check_in_note.
- Lifecycle: habits_create_habit, habits_update_habit, habits_pause_habit, habits_resume_habit, habits_archive_habit, habits_delete_habit.
- Stacks: habits_create_habit_stack, habits_reorder_routine_stack, habits_delete_habit_stack.

## 5. Rules
- Dates: Strict YYYY-MM-DD format using current system date.
- Tone: Constructive & empathetic on misses/slips; suggest freezes when available.
- Stacking: Ensure anchor habit exists before setting stackedAfterHabitId.
`;

export const HABITS_TRACKING_PROMPT = `# Habits Tracking Guidelines
- boolean: habits_toggle_check_in({ habitId, date, note?, mood? })
- numeric: habits_set_numeric_value({ habitId, date, value, note?, mood? }) -> auto-completes if value >= targetValue
- negative: habits_reset_clean_streak({ habitId, date, slipReason? }) -> constructive reset
- freezes: habits_apply_streak_freeze({ habitId, date, reason? }) -> consumes monthly freeze to protect streak
- Format: date=YYYY-MM-DD; mood="great"|"good"|"neutral"|"low"|"stressed".
`;

export const habitPrompts: InputPrompt[] = [
  {
    name: "habits_guidelines",
    description:
      "Guidelines and workflows for habit creation, routines, tracking, streaks, and check-ins.",
    load: async () => HABITS_GUIDELINES_PROMPT,
  },
  {
    name: "habits_tracking_guidelines",
    description:
      "Guidelines for daily check-ins, numeric metrics, clean resets, and streak freezes.",
    load: async () => HABITS_TRACKING_PROMPT,
  },
  {
    name: "habits_routine_structure",
    description: "Template for structuring habit stacks and routines.",
    arguments: [
      {
        name: "focusArea",
        description: "Routine theme (e.g. morning, evening, deep work)",
        required: false,
      },
    ],
    load: async (args: { focusArea?: string }) => {
      const area = args?.focusArea || "general routine";
      return `${HABITS_GUIDELINES_PROMPT}\n\n## Routine Template ("${area}"):\nDesign anchor habit (cue) + 2-4 chained steps linked via stackedAfterHabitId with matching timeOfDay, frequency, and targets.`;
    },
  },
];

export function registerHabitPrompts(server: any) {
  for (const prompt of habitPrompts) {
    server.addPrompt(prompt);
  }
}
