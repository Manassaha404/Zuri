import { type InputPrompt } from "fastmcp";

export const PROJECTS_GUIDELINES_PROMPT = `# Project Board & Kanban Guidelines
Comprehensive guide for managing Kanban boards, columns, WIP limits, cards, sprints, and milestones via MCP tools.

## 1. Pillars
1. Shared Projects: Boards are attached to shared projects (managed via \`tasks_get_workspace\` / \`tasks_create_project\`). Every project automatically receives default columns ("To Do", "In Progress" with WIP limit 3, "Done") when fetched.
2. Columns: Ordered by fractional index \`position\` strings (e.g. "a0", "a1", "a2"). Support optional \`wipLimit\` and \`isDoneColumn\`.
3. Cards: Represent deliverables or work items with \`title\`, \`description\`, \`priority\` ("low" | "medium" | "high" | "urgent"), \`labels\` (\`{ id, name, color }[]\`), \`startDate\` / \`dueDate\` (YYYY-MM-DD), \`assignee\`, \`storyPoints\`, \`sprintId\`, \`milestoneId\`, \`checklist\`, and \`comments\`.
4. Sprints & Milestones: Time-boxed iterations (\`startDate\`, \`endDate\`, \`goal\`, \`isActive\`) and target checkpoints (\`title\`, \`dueDate\`).

## 2. Tools & Workflows
- Discovery: \`projects_get_workspace\` (returns all columns, hydrated cards with checklists and comments, sprints, and milestones). Also call \`tasks_get_workspace\` if you need project metadata (\`projectId\`, names, statuses).
- Columns: \`projects_add_column\`, \`projects_update_column\`, \`projects_delete_column\`.
- Cards: \`projects_add_card\`, \`projects_update_card\`, \`projects_move_card\`, \`projects_delete_card\`.
- Checklists & Comments: \`projects_add_checklist_item\`, \`projects_toggle_checklist_item\`, \`projects_delete_checklist_item\`, \`projects_add_comment\`.
- Sprints & Milestones: \`projects_add_sprint\`, \`projects_delete_sprint\`, \`projects_add_milestone\`, \`projects_delete_milestone\`.

## 3. General Principles & Rules
- Always call \`projects_get_workspace\` first to discover valid \`projectId\`, \`columnId\`, \`cardId\`, \`sprintId\`, and \`milestoneId\` values.
- Use lexicographical fractional index strings for \`position\` (e.g. "a0", "a1", "a2", or "a0V" between "a0" and "a1").
- Respect column WIP limits: warn the user if moving or adding a card exceeds a column's \`wipLimit\`.
- Dates must use strict \`YYYY-MM-DD\` format.
`;

export const PROJECTS_CARD_GUIDELINES_PROMPT = `# Project Card & Sprint Planning Guidelines
Workflows for creating, structuring, and moving Kanban cards, checklists, and sprint assignments.

## 1. Creating & Organizing Cards
- Provide clear, action-oriented titles and concise descriptions.
- Set appropriate \`priority\` ("low" | "medium" | "high" | "urgent") and \`storyPoints\` (integer >= 0, default 1).
- When assigning \`labels\`, pass objects with \`id\`, \`name\`, and hex \`color\`.
- When updating \`labels\` via \`projects_update_card\`, pass the complete desired array since labels are replaced atomically.

## 2. Moving Cards & Checklists
- Use \`projects_move_card\` with \`cardId\`, \`targetColumnId\`, and a new \`position\` string to move a card across columns or reorder within a column.
- Break multi-step cards into checklist items using \`projects_add_checklist_item\` and toggle progress with \`projects_toggle_checklist_item\`.
- Record status updates or decisions on cards via \`projects_add_comment\`.
`;

export const projectPrompts: InputPrompt[] = [
  {
    name: "projects_guidelines",
    description:
      "Comprehensive guidelines and workflows for Kanban project boards, columns, WIP limits, cards, sprints, and milestones.",
    load: async () => PROJECTS_GUIDELINES_PROMPT,
  },
  {
    name: "projects_card_guidelines",
    description:
      "Guidelines for creating, updating, moving Kanban cards, managing checklists, comments, and sprint assignments.",
    load: async () => PROJECTS_CARD_GUIDELINES_PROMPT,
  },
];

export function registerProjectPrompts(server: any) {
  for (const prompt of projectPrompts) {
    server.addPrompt(prompt);
  }
}
