import { create } from "zustand";
import type { ContactItem } from "../components/contacts/types";

interface ContactStore {
  contacts: ContactItem[];
  searchQuery: string;
  roleFilter: string | "all";

  setContacts: (contacts: ContactItem[]) => void;
  setSearchQuery: (q: string) => void;
  setRoleFilter: (role: string | "all") => void;

  addContact: (
    contact: Omit<ContactItem, "id" | "createdAt" | "updatedAt">,
  ) => ContactItem;
  updateContact: (id: string, updates: Partial<ContactItem>) => void;
  deleteContact: (id: string) => void;
}

export const useContactStore = create<ContactStore>()((set) => ({
  contacts: [],
  searchQuery: "",
  roleFilter: "all",

  setContacts: (contacts) => set({ contacts }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),

  addContact: (data) => {
    const now = new Date().toISOString();
    const newContact: ContactItem = {
      ...data,
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ contacts: [newContact, ...s.contacts] }));
    return newContact;
  },

  updateContact: (id, updates) => {
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c,
      ),
    }));
  },

  deleteContact: (id) => {
    set((s) => ({
      contacts: s.contacts.filter((c) => c.id !== id),
    }));
  },
}));
