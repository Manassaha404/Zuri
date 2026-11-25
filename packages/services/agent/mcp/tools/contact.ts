import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import ContactService from "../../../contacts";

const contactService = new ContactService();

// Extract authenticated user ID from FastMCP session context
function requireUserId(context: any): string {
  const userId = context?.session?.userId;
  if (!userId) {
    throw new UserError(
      "Unauthorized: This tool requires an authenticated user session.",
    );
  }
  return userId;
}

export const contactTools = [
  {
    name: "contacts_get_contacts",
    description:
      "Retrieve all shared contacts (ordered alphabetically by name) for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await contactService.getContacts(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get contacts");
      }
    },
  },

  {
    name: "contacts_create_contact",
    description:
      "Create a new contact in the shared contacts directory (used across Projects and Expenses).",
    parameters: z.object({
      name: z.string().trim().min(1).describe("Contact's full name"),
      email: z.string().optional().describe("Optional email address"),
      phone: z.string().optional().describe("Optional phone number"),
      role: z.string().optional().describe("Optional role or job title"),
      company: z
        .string()
        .optional()
        .describe("Optional company or organization"),
      notes: z.string().optional().describe("Optional notes about the contact"),
      avatarColor: z
        .string()
        .optional()
        .describe("Optional hex avatar color (default: '#3b82f6')"),
    }),
    execute: async (
      args: {
        name: string;
        email?: string;
        phone?: string;
        role?: string;
        company?: string;
        notes?: string;
        avatarColor?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await contactService.createContact(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create contact");
      }
    },
  },

  {
    name: "contacts_update_contact",
    description:
      "Update an existing contact's name, email, phone, role, company, notes, or avatar color.",
    parameters: z.object({
      contactId: z
        .string()
        .uuid()
        .describe("Unique identifier of the contact to update"),
      name: z.string().trim().min(1).optional().describe("New name"),
      email: z
        .string()
        .nullable()
        .optional()
        .describe("New email or null to clear"),
      phone: z
        .string()
        .nullable()
        .optional()
        .describe("New phone or null to clear"),
      role: z
        .string()
        .nullable()
        .optional()
        .describe("New role or null to clear"),
      company: z
        .string()
        .nullable()
        .optional()
        .describe("New company or null to clear"),
      notes: z
        .string()
        .nullable()
        .optional()
        .describe("New notes or null to clear"),
      avatarColor: z.string().optional().describe("New hex avatar color"),
    }),
    execute: async (
      args: {
        contactId: string;
        name?: string;
        email?: string | null;
        phone?: string | null;
        role?: string | null;
        company?: string | null;
        notes?: string | null;
        avatarColor?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await contactService.updateContact(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update contact");
      }
    },
  },

  {
    name: "contacts_delete_contact",
    description: "Permanently delete a contact by contactId.",
    parameters: z.object({
      contactId: z
        .string()
        .uuid()
        .describe("Unique identifier of the contact to delete"),
    }),
    execute: async (args: { contactId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await contactService.deleteContact(
          args.contactId,
          userId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete contact");
      }
    },
  },
];

export function registerContactTools(server: FastMCP<any>) {
  for (const tool of contactTools) {
    server.addTool(tool as any);
  }
}
