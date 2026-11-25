import { type InputPrompt } from "fastmcp";

export const TASKS_GUIDELINES_PROMPT = `# Tasks & Shared Projects Guidelines
Comprehensive guide for managing tasks, subtasks, and shared projects via MCP tools.

## 1. Pillars
1. Shared Projects: Tasks belong to a project (\`projectId\`). A default "Inbox" project is auto-created when needed, and \`tasks_create_task\` defaults to "Inbox" if \`projectId\` is omitted. Projects are shared with Kanban Project Boards.
2. Task Status & Priority:
   - Status: "todo" | "doing" | "done" (setting status to "done" automatically records \`completedAt\`).
   - Priority: "low" | "medium" | "high" | "urgent".
3. Scheduling & Reminders:
   - \`dueDate\`: \`YYYY-MM-DD\`
   - \`dueTime\`: \`HH:mm\` (24-hour format)
   - \`recurrence\`: "none" | "daily" | "weekly" | "biweekly" | "monthly"
   - \`reminder\`: "none" | "at_time" | "10m" | "30m" | "1h" | "1d"
4. Time Tracking & Tags:
   - \`estimateMinutes\` and \`loggedMinutes\` (non-negative integers).
   - \`tags\`: array of short lowercase strings.
5. Subtasks: Checklist items attached to a task (\`taskSubtasks\`).

## 2. Tools & Workflows
- Discovery: \`tasks_get_workspace\` (returns all shared projects and hydrated tasks with subtasks).
- Projects: \`tasks_create_project\`, \`tasks_update_project\`, \`tasks_delete_project\`.
- Tasks: \`tasks_create_task\`, \`tasks_update_task\`, \`tasks_delete_task\`.
- Subtasks: \`tasks_add_subtask\`, \`tasks_toggle_subtask\`, \`tasks_delete_subtask\`.

## 3. General Principles & Rules
- Always call \`tasks_get_workspace\` first when referencing, updating, or organizing existing tasks or projects to discover valid \`projectId\`, \`taskId\`, and \`subtaskId\` values.
- When updating \`subtasks\` or \`tags\` via \`tasks_update_task\`, pass the complete desired array since those collections are replaced atomically.
- Use strict \`YYYY-MM-DD\` for dates and \`HH:mm\` 24-hour format for times.
`;

export const TASKS_SUBTASKS_AND_PLANNING_GUIDELINES_PROMPT = `# Task Breakdown & Subtask Planning Guidelines
Workflows for breaking down tasks into subtasks, estimating effort, and organizing projects.

## 1. Breaking Down Work
- For multi-step deliverables, create the parent task with \`tasks_create_task\` (including initial \`subtasks\` if known) or append steps via \`tasks_add_subtask\`.
- Keep subtask text concise and actionable.
- Use \`tasks_toggle_subtask\` to mark individual steps complete without changing the parent task status until all work is done.

## 2. Project Organization
- Use \`tasks_create_project\` to group related work under dedicated projects with a \`status\` ("planning" | "active" | "on_hold" | "completed"), \`color\`, and optional \`deadline\` (\`YYYY-MM-DD\`).
- Keep standalone quick items in the default "Inbox" project.
`;

export const taskPrompts: InputPrompt[] = [
  {
    name: "tasks_guidelines",
    description:
      "Comprehensive guidelines and workflows for managing tasks, shared projects, statuses, priorities, recurrence, reminders, and subtasks.",
    load: async () => TASKS_GUIDELINES_PROMPT,
  },
  {
    name: "tasks_subtasks_and_planning_guidelines",
    description:
      "Guidelines for breaking tasks into subtasks, time estimation, and organizing shared projects.",
    load: async () => TASKS_SUBTASKS_AND_PLANNING_GUIDELINES_PROMPT,
  },
];

export function registerTaskPrompts(server: any) {
  for (const prompt of taskPrompts) {
    server.addPrompt(prompt);
  }
}
