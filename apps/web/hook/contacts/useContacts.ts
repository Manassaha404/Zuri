// Hook managing shared contacts queries, mutations, and synchronization with contactStore
"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useContactStore } from "@/store/contactStore";
import type { ContactItem } from "@/components/contacts/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val: unknown): val is string =>
  typeof val === "string" && UUID_REGEX.test(val);

export function useContacts() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);

  const {
    contacts,
    searchQuery,
    roleFilter,
    setContacts: storeSetContacts,
    setSearchQuery,
    setRoleFilter,
    addContact: storeAddContact,
    updateContact: storeUpdateContact,
    deleteContact: storeDeleteContact,
  } = useContactStore();

  const utils = trpc.useUtils();

  const contactsQuery = trpc.contacts.getContacts.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (Array.isArray(contactsQuery.data)) {
      const normalized: ContactItem[] = (contactsQuery.data as any[]).map(
        (c) => ({
          id: c.contactId || c.id,
          name: c.name,
          email: c.email || undefined,
          phone: c.phone || undefined,
          role: c.role || undefined,
          company: c.company || undefined,
          notes: c.notes || undefined,
          avatarColor: c.avatarColor || "#3b82f6",
          createdAt:
            typeof c.createdAt === "string"
              ? c.createdAt
              : new Date(c.createdAt).toISOString(),
          updatedAt:
            typeof c.updatedAt === "string"
              ? c.updatedAt
              : new Date(c.updatedAt).toISOString(),
        }),
      );
      storeSetContacts(normalized);
    }
  }, [contactsQuery.data, storeSetContacts]);

  const createMutation = trpc.contacts.createContact.useMutation({
    onSuccess: () => utils.contacts.getContacts.invalidate(),
  });

  const addContact = useCallback(
    async (data: Omit<ContactItem, "id" | "createdAt" | "updatedAt">) => {
      const optimistic = storeAddContact(data);
      if (userId) {
        try {
          const res = await createMutation.mutateAsync({
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            company: data.company,
            notes: data.notes,
            avatarColor: data.avatarColor,
          });
          utils.contacts.getContacts.invalidate();
          return res;
        } catch (err) {
          console.error("Failed to create contact:", err);
          utils.contacts.getContacts.invalidate();
        }
      }
      return optimistic;
    },
    [userId, storeAddContact, createMutation, utils.contacts.getContacts],
  );

  const updateMutation = trpc.contacts.updateContact.useMutation({
    onSuccess: () => utils.contacts.getContacts.invalidate(),
  });

  const updateContact = useCallback(
    async (id: string, updates: Partial<ContactItem>) => {
      storeUpdateContact(id, updates);
      if (userId && isUuid(id)) {
        try {
          await updateMutation.mutateAsync({
            contactId: id,
            name: updates.name,
            email:
              updates.email !== undefined ? updates.email || null : undefined,
            phone:
              updates.phone !== undefined ? updates.phone || null : undefined,
            role: updates.role !== undefined ? updates.role || null : undefined,
            company:
              updates.company !== undefined
                ? updates.company || null
                : undefined,
            notes:
              updates.notes !== undefined ? updates.notes || null : undefined,
            avatarColor: updates.avatarColor,
          });
        } catch (err) {
          console.error("Failed to update contact:", err);
          utils.contacts.getContacts.invalidate();
        }
      }
    },
    [userId, storeUpdateContact, updateMutation, utils.contacts.getContacts],
  );

  const deleteMutation = trpc.contacts.deleteContact.useMutation({
    onSuccess: () => utils.contacts.getContacts.invalidate(),
  });

  const deleteContact = useCallback(
    async (id: string) => {
      storeDeleteContact(id);
      if (userId && isUuid(id)) {
        try {
          await deleteMutation.mutateAsync({ contactId: id });
        } catch (err) {
          console.error("Failed to delete contact:", err);
          utils.contacts.getContacts.invalidate();
        }
      }
    },
    [userId, storeDeleteContact, deleteMutation, utils.contacts.getContacts],
  );

  return {
    contacts,
    searchQuery,
    roleFilter,
    isLoading: contactsQuery.isLoading,
    setSearchQuery,
    setRoleFilter,
    addContact,
    updateContact,
    deleteContact,
  };
}
