import { type InputPrompt } from "fastmcp";

export const DEADLINES_GUIDELINES_PROMPT = `# Deadline & Schedule Tracking Guidelines
Comprehensive guide for managing time-sensitive commitments, assignments, exams, project milestones, bills, and custom categories via MCP tools.

## 1. Pillars
1. Deadlines: Core commitments with title, due date/time (ISO format), priority, status, category, soft target deadline, and recurrence.
2. Categories: System defaults (assignment, exam, project, bill, application) or user-defined custom categories with colored badges and icons.
3. Priority & Urgency:
   - Priority: "low" | "medium" | "high" | "urgent"
   - Urgency countdown calculation:
     * critical (<= 24 hours left, or overdue)
     * red (<= 48 hours left)
     * amber (<= 7 days left)
     * green (> 7 days left)
4. Status Flow: "upcoming" -> "in_progress" -> "done" (or "missed" if past due without completion).
5. Soft vs. Hard Deadlines:
   - dueDate: The hard, authoritative deadline.
   - softDueDate: The user's aspirational or early submission target to stay ahead of schedule.
6. Reminders: Set notification offsets before due time ("1_hour", "1_day", "3_days", "1_week", "2_weeks").
7. Recurrence Rules: "none" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly".
8. Punctuality Stats: Tracks total count, completed, on-time submissions, missed deadlines, and on-time punctuality rate percentage.

## 2. Tools & Workflows
- Discovery: \`deadlines_get_workspace\` (returns complete workspace: active deadlines with reminders, system & custom categories, punctuality and urgency metrics).
- Single Lookup: \`deadlines_get_deadline_by_id\` (inspects a specific deadline and its reminder offsets).
- Create: \`deadlines_create_deadline\` (creates new deadline with dueDate, optional softDueDate, priority, category, reminders, recurrence).
- Update: \`deadlines_update_deadline\` (updates title, notes, dueDate, softDueDate, category, priority, status, recurrence, reminders).
- Toggle Status: \`deadlines_toggle_status\` (quick toggle between "done" and "in_progress", timestamps completion).
- Deletion: \`deadlines_delete_deadline\` (permanently removes deadline and its reminders).
- Categories: \`deadlines_get_categories\`, \`deadlines_add_category\`, \`deadlines_delete_category\`.

## 3. General Principles & Rules
- Dates & Times: Strict ISO 8601 strings (e.g. "2026-11-30T17:00:00Z" or "2026-12-05T23:59:00.000Z") using system UTC/local offset.
- Always check \`deadlines_get_workspace\` before updating or referencing existing deadlines to discover valid \`deadlineId\`s.
- Always match category names in lowercase (e.g. "assignment", "project", "bill").
- Clear & Actionable: Provide clear summaries indicating days/hours remaining, urgency color, and whether a soft target exists.
`;

export const DEADLINES_SCHEDULE_GUIDELINES_PROMPT = `# Deadline Scheduling & Pacing Guidelines
Workflows for creating, pacing, and organizing deadlines.

## 1. Setting Up Deadlines with Pacing
- When a user asks to track a project deliverable or exam:
  1. Set \`dueDate\` to the final hard deadline.
  2. Set \`softDueDate\` 2-3 days before the hard deadline as a personal target.
  3. Configure reminders (e.g. ["1_week", "1_day", "1_hour"]).
  4. Choose appropriate priority:
     - "urgent": Due within 48 hours or critical exam/bill.
     - "high": High-impact deliverables.
     - "medium": Standard homework, regular assignments.
     - "low": Casual reading, non-critical chores.

## 2. Recurring Deadlines
- Use recurrence rules for periodic obligations:
  - "monthly": Utility bills, rent, subscriptions.
  - "weekly": Weekly problem sets, status reports.
  - "daily": Daily reflections or submission logs.
  - "biweekly": Bi-weekly sprints or payroll submissions.
`;

export const DEADLINES_CATEGORY_GUIDELINES_PROMPT = `# Deadline Categories Guidelines
Workflows for managing system and custom categories.

## 1. System Default Categories
- "assignment": Academic homework, problem sets, lab reports (blue #3b82f6, icon: BookOpen).
- "exam": Midterms, finals, quizzes, standardized tests (red #ef4444, icon: GraduationCap).
- "project": Long-term projects, software releases, client milestones (purple #8b5cf6, icon: FolderGit2).
- "bill": Rent, utilities, credit card payments, renewals (green #10b981, icon: Receipt).
- "application": Job applications, internships, grants, conference submissions (amber #f59e0b, icon: FileText).

## 2. Custom Categories
- Users can create custom categories via \`deadlines_add_category\` with name, hex color, and icon name.
- System categories are protected and cannot be deleted via \`deadlines_delete_category\`.
`;

export const deadlinePrompts: InputPrompt[] = [
  {
    name: "deadlines_guidelines",
    description:
      "Comprehensive guidelines and workflows for deadlines, countdowns, urgency, soft vs. hard dates, and punctuality stats.",
    load: async () => DEADLINES_GUIDELINES_PROMPT,
  },
  {
    name: "deadlines_schedule_guidelines",
    description:
      "Guidelines for deadline scheduling, pacing with soft target dates, reminders, and recurrence rules.",
    load: async () => DEADLINES_SCHEDULE_GUIDELINES_PROMPT,
  },
  {
    name: "deadlines_category_guidelines",
    description:
      "Guidelines for deadline categories (system defaults and custom categories with colors and icons).",
    load: async () => DEADLINES_CATEGORY_GUIDELINES_PROMPT,
  },
];

export function registerDeadlinePrompts(server: any) {
  for (const prompt of deadlinePrompts) {
    server.addPrompt(prompt);
  }
}
