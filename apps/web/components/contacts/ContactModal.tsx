// Create / Edit Contact Modal
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useContacts } from "@/hook/contacts";
import type { ContactItem } from "./types";

interface ContactModalProps {
  isOpen: boolean;
  initialContact: ContactItem | null;
  onClose: () => void;
}

const AVATAR_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
];

export function ContactModal({
  isOpen,
  initialContact,
  onClose,
}: ContactModalProps) {
  const { addContact, updateContact } = useContacts();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(
    AVATAR_COLORS[0] ?? "#3b82f6",
  );

  useEffect(() => {
    if (!isOpen) return;
    if (initialContact) {
      setName(initialContact.name);
      setEmail(initialContact.email || "");
      setPhone(initialContact.phone || "");
      setRole(initialContact.role || "");
      setCompany(initialContact.company || "");
      setNotes(initialContact.notes || "");
      setAvatarColor(initialContact.avatarColor);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setRole("");
      setCompany("");
      setNotes("");
      setAvatarColor(AVATAR_COLORS[0] ?? "#3b82f6");
    }
  }, [isOpen, initialContact]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role: role.trim() || undefined,
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
      avatarColor,
    };

    if (initialContact) {
      updateContact(initialContact.id, payload);
    } else {
      addContact(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)]">
          <h2 className="text-base font-semibold text-[var(--i)]">
            {initialContact ? "Edit Contact" : "New Contact"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 p-5">
          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivers"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0100"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Designer"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Company / Group
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Zuri Labs"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1.5">
              Avatar Color
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    avatarColor === c ? "scale-115 ring-2 ring-[var(--p)]" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt !w-auto !h-8 text-xs px-4"
            >
              Cancel
            </button>
            <button type="submit" className="bt p !w-auto !h-8 text-xs px-4">
              {initialContact ? "Save Contact" : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
