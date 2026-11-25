import { type InputPrompt } from "fastmcp";

export const MEETINGS_GUIDELINES_PROMPT = `# Meetings Tracker Guidelines
Comprehensive guide for managing scheduled meetings, attendees, reminders, Markdown agendas/notes, and action items via MCP tools.

## 1. Core Concepts
1. Meeting Types: "class" | "standup" | "1:1" | "interview" | "other".
2. Date & Time Format:
   - \`date\`: Strict \`YYYY-MM-DD\` string (e.g. "2026-11-25").
   - \`startTime\` & \`endTime\`: Strict \`HH:mm\` 24-hour format (e.g. "10:00", "14:30").
3. Attendees: Array of \`{ name, email, avatar? }\` objects.
4. Reminders: Notification offsets before start time: "none" | "5m" | "10m" | "15m" | "30m" | "1h".
5. Tags: Short descriptive string tags (e.g. ["Engineering", "Sprint", "Sync"]).
6. Agenda & Notes: Rich Markdown strings (\`agendaMarkdown\`, \`notesMarkdown\`).
7. Action Items: Follow-up tasks tied to a meeting with \`text\`, \`completed\`, optional \`owner\`, optional \`dueDate\` (YYYY-MM-DD), and \`convertedToTask\`.

## 2. Tools & Workflows
- Discovery: \`meetings_get_workspace\` (returns all active meetings with attendees, action items, reminders, and summary stats).
- Single Lookup: \`meetings_get_meeting_by_id\` (inspects a specific meeting by \`meetingId\`).
- Create: \`meetings_create_meeting\` (schedules a new meeting with optional attendees, reminders, tags, markdown agenda/notes, and action items).
- Update: \`meetings_update_meeting\` (updates title, date, times, location/link, type, tags, markdown agenda/notes, attendees, reminders, or archive status).
- Delete: \`meetings_delete_meeting\` (permanently deletes a meeting and its attendees, action items, and reminders).
- Action Items: \`meetings_add_action_item\`, \`meetings_toggle_action_item\`, \`meetings_delete_action_item\`, \`meetings_convert_action_item_to_task\`.

## 3. General Principles & Rules
- Always call \`meetings_get_workspace\` first when referencing, updating, or summarizing existing meetings to discover valid \`meetingId\` and \`actionItemId\` values.
- Use strict \`YYYY-MM-DD\` for dates and \`HH:mm\` (24-hour) for start/end times.
- When updating \`attendees\`, \`reminders\`, or \`tags\` via \`meetings_update_meeting\`, pass the complete desired array since those collections are replaced atomically.
`;

export const MEETINGS_NOTES_AND_AGENDA_GUIDELINES_PROMPT = `# Meeting Agenda & Notes Guidelines
Workflows for drafting structured meeting agendas and summarizing discussion notes in Markdown.

## 1. Agenda Structure (\`agendaMarkdown\`)
- Use clean Markdown headings and bullet lists:
  - \`### Agenda\`
  - \`- **Topic**: Brief context or timebox\`
- Include clear discussion points, blockers, or decisions needed before the meeting starts.

## 2. Discussion Notes (\`notesMarkdown\`)
- Capture key decisions, technical findings, and owners concisely using Markdown headings and bullets:
  - \`### Discussion Notes\` or \`### Key Takeaways\`
- When asked to summarize a meeting or extract next steps from notes, update \`notesMarkdown\` via \`meetings_update_meeting\` and add concrete follow-ups via \`meetings_add_action_item\`.
`;

export const MEETINGS_ACTION_ITEMS_GUIDELINES_PROMPT = `# Meeting Action Items Guidelines
Workflows for tracking and completing follow-up action items from meetings.

## 1. Creating Action Items
- Use \`meetings_add_action_item\` with \`meetingId\`, clear \`text\`, optional \`owner\`, and optional \`dueDate\` (\`YYYY-MM-DD\`).
- Keep action items specific and actionable (starting with a verb, e.g., "Audit memory usage in background workers").

## 2. Completing & Converting Action Items
- Use \`meetings_toggle_action_item\` to mark an action item completed or reopen it.
- Use \`meetings_convert_action_item_to_task\` to mark an action item as converted to a standalone task.
- Use \`meetings_delete_action_item\` to remove obsolete or duplicate items.
`;

export const meetingPrompts: InputPrompt[] = [
  {
    name: "meetings_guidelines",
    description:
      "Comprehensive guidelines for managing meetings, schedules, attendees, reminders, and workspace discovery.",
    load: async () => MEETINGS_GUIDELINES_PROMPT,
  },
  {
    name: "meetings_notes_and_agenda_guidelines",
    description:
      "Guidelines for formatting Markdown meeting agendas, discussion notes, and extracting follow-ups.",
    load: async () => MEETINGS_NOTES_AND_AGENDA_GUIDELINES_PROMPT,
  },
  {
    name: "meetings_action_items_guidelines",
    description:
      "Guidelines for creating, assigning, completing, and converting meeting action items.",
    load: async () => MEETINGS_ACTION_ITEMS_GUIDELINES_PROMPT,
  },
];

export function registerMeetingPrompts(server: any) {
  for (const prompt of meetingPrompts) {
    server.addPrompt(prompt);
  }
}
