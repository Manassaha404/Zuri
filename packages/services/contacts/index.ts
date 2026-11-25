// Contact Service - Core business logic for shared contacts directory
import db, { eq, and, asc } from "@repo/database";
import { contacts, type ContactRecord } from "@repo/database/models";
import { AppError } from "@repo/error";

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  notes?: string;
  avatarColor?: string;
}

export interface UpdateContactInput {
  contactId: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  company?: string | null;
  notes?: string | null;
  avatarColor?: string;
}

export class ContactService {
  // Get all contacts for user
  async getContacts(userId: string): Promise<ContactRecord[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(asc(contacts.name));
  }

  // Create contact
  async createContact(
    userId: string,
    input: CreateContactInput,
  ): Promise<ContactRecord> {
    const name = input.name.trim();
    if (!name) {
      throw new AppError("BAD_REQUEST", "Contact name is required");
    }

    const [created] = await db
      .insert(contacts)
      .values({
        userId,
        name,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        role: input.role?.trim() || null,
        company: input.company?.trim() || null,
        notes: input.notes?.trim() || null,
        avatarColor: input.avatarColor || "#3b82f6",
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create contact");
    }
    return created;
  }

  // Update contact
  async updateContact(
    userId: string,
    input: UpdateContactInput,
  ): Promise<ContactRecord> {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, input.contactId),
          eq(contacts.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Contact not found");
    }

    const updateValues: Partial<typeof contacts.$inferInsert> = {};
    if (input.name !== undefined) updateValues.name = input.name.trim();
    if (input.email !== undefined)
      updateValues.email = input.email ? input.email.trim() : null;
    if (input.phone !== undefined)
      updateValues.phone = input.phone ? input.phone.trim() : null;
    if (input.role !== undefined)
      updateValues.role = input.role ? input.role.trim() : null;
    if (input.company !== undefined)
      updateValues.company = input.company ? input.company.trim() : null;
    if (input.notes !== undefined)
      updateValues.notes = input.notes ? input.notes.trim() : null;
    if (input.avatarColor !== undefined)
      updateValues.avatarColor = input.avatarColor;

    const [updated] = await db
      .update(contacts)
      .set(updateValues)
      .where(
        and(
          eq(contacts.contactId, input.contactId),
          eq(contacts.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to update contact");
    }
    return updated;
  }

  // Delete contact
  async deleteContact(
    contactId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.contactId, contactId), eq(contacts.userId, userId)),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Contact not found");
    }

    await db
      .delete(contacts)
      .where(
        and(eq(contacts.contactId, contactId), eq(contacts.userId, userId)),
      );

    return { success: true };
  }
}

export default ContactService;
