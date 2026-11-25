import { z } from "zod";

export const createContactDto = z.object({
  name: z.string().trim().min(1, "Contact name is required"),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  role: z.string().trim().optional(),
  company: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  avatarColor: z.string().trim().optional(),
});

export const updateContactDto = z.object({
  contactId: z.string().uuid("Invalid contact ID"),
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  role: z.string().trim().nullable().optional(),
  company: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  avatarColor: z.string().trim().optional(),
});

export const contactIdDto = z.object({
  contactId: z.string().uuid("Invalid contact ID"),
});
