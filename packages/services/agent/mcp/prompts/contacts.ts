import { type InputPrompt } from "fastmcp";

export const CONTACTS_GUIDELINES_PROMPT = `# Shared Contacts Directory Guidelines
Comprehensive guide for managing the shared contacts directory used across Projects and Expenses via MCP tools.

## 1. Pillars
1. Shared Directory: Stores people the user collaborates with or tracks expenses/projects alongside.
2. Contact Fields:
   - \`name\` (required, trimmed)
   - \`email\` (optional)
   - \`phone\` (optional)
   - \`role\` (optional, e.g. "Designer", "Frontend Lead")
   - \`company\` (optional)
   - \`notes\` (optional)
   - \`avatarColor\` (optional hex color, defaults to "#3b82f6")

## 2. Tools & Workflows
- Discovery: \`contacts_get_contacts\` (returns all contacts ordered alphabetically by name).
- Create: \`contacts_create_contact\` (creates a new contact with required \`name\` and optional details).
- Update: \`contacts_update_contact\` (updates any field by \`contactId\`; pass \`null\` to clear optional nullable fields).
- Delete: \`contacts_delete_contact\` (permanently removes a contact by \`contactId\`).

## 3. General Principles & Rules
- Always call \`contacts_get_contacts\` first before creating, updating, or deleting to avoid duplicate entries and to discover valid \`contactId\` values.
- Confirm before deleting a contact if the user's request is ambiguous.
`;

export const contactPrompts: InputPrompt[] = [
  {
    name: "contacts_guidelines",
    description:
      "Guidelines and workflows for managing shared contacts (lookup, creation, updates, and deletion).",
    load: async () => CONTACTS_GUIDELINES_PROMPT,
  },
];

export function registerContactPrompts(server: any) {
  for (const prompt of contactPrompts) {
    server.addPrompt(prompt);
  }
}
