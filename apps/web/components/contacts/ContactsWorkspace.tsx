// Contacts Workspace View
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Edit3,
  Trash2,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useInitUIStore, useUIStore } from "@/store/uiStore";
import { useContacts } from "@/hook/contacts";
import { ContactModal } from "./ContactModal";
import type { ContactItem } from "./types";

export function ContactsWorkspace() {
  useInitUIStore();
  const { darkMode, toggleTheme } = useUIStore();
  const { contacts, searchQuery, setSearchQuery, deleteContact } =
    useContacts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(
    null,
  );

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.role || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q),
    );
  }, [contacts, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full min-w-0">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--i)] truncate">
                  Contacts
                </h1>
                <span className="badge-pill bg-[var(--s)] text-[var(--m)] border border-[var(--h)]">
                  {contacts.length} total
                </span>
              </div>
              <p className="text-xs text-[var(--m)] mt-0.5 truncate">
                Shared contacts available for assigning project cards and
                tracking expenses &amp; splits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle
              darkMode={darkMode}
              onToggle={toggleTheme}
              className="w-9 h-9 border border-[var(--h)] bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)]"
              size={17}
            />
            <button
              type="button"
              onClick={() => {
                setEditingContact(null);
                setModalOpen(true);
              }}
              className="bt p !w-auto !h-9 whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 px-3.5"
            >
              <Plus size={15} />
              <span>New Contact</span>
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, role, or company..."
            className="w-full h-9 pl-8 pr-3 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
          />
        </div>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] text-center">
            <div className="w-11 h-11 rounded-xl bg-[var(--s)] border border-[var(--h)] flex items-center justify-center text-[var(--m)]">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--i)]">
                No contacts found
              </h3>
              <p className="text-xs text-[var(--m)] mt-1">
                Add a contact to assign them in Projects or split expenses.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => {
              const initials = contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={contact.id}
                  className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col gap-3 min-w-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: contact.avatarColor }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--i)] truncate">
                          {contact.name}
                        </h3>
                        {(contact.role || contact.company) && (
                          <p className="text-xs text-[var(--m)] truncate flex items-center gap-1">
                            {contact.role && <span>{contact.role}</span>}
                            {contact.role && contact.company && <span>·</span>}
                            {contact.company && (
                              <span className="inline-flex items-center gap-0.5">
                                <Building2 size={11} />
                                {contact.company}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingContact(contact);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
                        title="Edit contact"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteContact(contact.id)}
                        className="p-1.5 rounded-lg text-[var(--m)] hover:text-red-500 hover:bg-red-500/10"
                        title="Delete contact"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-[var(--b)] border-t border-[var(--h)] pt-2.5">
                    {contact.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-[var(--m)] shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone size={12} className="text-[var(--m)] shrink-0" />
                        <span className="truncate">{contact.phone}</span>
                      </div>
                    )}
                    {contact.notes && (
                      <p className="text-[11px] text-[var(--m)] line-clamp-2 pt-0.5">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ContactModal
        isOpen={modalOpen}
        initialContact={editingContact}
        onClose={() => {
          setModalOpen(false);
          setEditingContact(null);
        }}
      />
    </div>
  );
}
