// Modal to manage people/contacts (add, list, delete)
"use client";

import { useState } from "react";
import { X, UserPlus, Plus, Users, Trash2 } from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import { useContacts } from "@/hook/contacts";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonAdded?: (personId: string) => void;
}

export function PersonModal({
  isOpen,
  onClose,
  onPersonAdded,
}: PersonModalProps) {
  const { people, addPerson, deletePerson } = useExpenses();
  const { contacts } = useContacts();
  const unregisteredContacts = contacts.filter(
    (c) => !people.some((p) => p.name.toLowerCase() === c.name.toLowerCase()),
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please provide the person's name");
      return;
    }

    try {
      setIsSubmitting(true);
      const personId = await addPerson({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (onPersonAdded && personId) {
        onPersonAdded(personId);
      }

      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
    } catch (err) {
      console.error("Failed to add contact:", err);
      alert("Failed to add contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--h)] bg-[var(--s)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
                People & Contacts
              </h2>
              <p className="text-xs text-[var(--m)]">
                Add and manage contacts to track IOU debts and split bills
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 styled-scrollbar">
          {/* Quick Add from Shared Contacts */}
          {unregisteredContacts.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
                Quick Add from Contacts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unregisteredContacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      addPerson({
                        name: c.name,
                        phone: c.phone,
                        email: c.email,
                      })
                    }
                    className="badge-pill bg-[var(--surface-card)] border-[var(--h)] text-[var(--i)] hover:bg-[var(--s)] cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={11} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Existing People List */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              Existing People ({people.length})
            </span>
            {people.length === 0 ? (
              <div className="text-xs text-[var(--m)] py-2 text-center border border-dashed border-[var(--h)] rounded-xl">
                No people added yet. Add your first contact below!
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto styled-scrollbar pr-1">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--s)] border border-[var(--h)] flex items-center justify-center font-semibold text-xs text-[var(--i)]">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[var(--i)]">
                          {person.name}
                        </span>
                        {(person.phone || person.email) && (
                          <p className="text-[11px] text-[var(--m)]">
                            {person.phone || person.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deletePerson(person.id)}
                      className="text-[var(--m)] hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                      title="Delete person"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Person Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3.5 p-4 rounded-xl border border-[var(--h)] bg-[var(--s)]"
          >
            <span className="text-xs font-semibold text-[var(--i)] flex items-center gap-1.5">
              <UserPlus size={14} className="text-blue-500" />
              Add New Person
            </span>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--b)]">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[var(--b)]">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[var(--b)]">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. sarah@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--b)]">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Roommate, Colleague"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bt p text-xs font-semibold py-1.5 self-end flex items-center gap-1.5 disabled:opacity-50 mt-1"
            >
              <Plus size={14} />
              {isSubmitting ? "Adding..." : "Add Person"}
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-[var(--h)] bg-[var(--s)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bt p text-xs font-semibold px-4 py-1.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
