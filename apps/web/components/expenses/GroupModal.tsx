// Modal for creating and managing expense groups and their members
"use client";

import { useState } from "react";
import { X, Users, Plus, Check } from "lucide-react";
import { useExpenses } from "@/hook/expenses";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Rose
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

const GROUP_ICONS = ["Users", "Home", "Compass", "Briefcase", "Car"];

export function GroupModal({ isOpen, onClose }: GroupModalProps) {
  const { people, addGroup, addPerson } = useExpenses();

  // Combine You with other people and filter out any accidental "You" records from backend
  const allGroupPeopleOptions = [
    { id: "p_you", name: "You" },
    ...people.filter((p) => p.id !== "p_you" && p.name !== "You"),
  ];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [icon, setIcon] = useState(GROUP_ICONS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([
    "p_you",
  ]);

  // Quick inline add person
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length <= 1) {
        alert("A group must have at least one member");
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleQuickAddContact = async () => {
    if (!newContactName.trim()) return;
    const newPersonId = await addPerson({ name: newContactName.trim() });
    if (newPersonId) {
      setSelectedMemberIds((prev) => [...prev, newPersonId]);
      setNewContactName("");
      setIsAddingNewContact(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedMemberIds.length === 0) {
      alert("Please select at least one member");
      return;
    }

    await addGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      color: color || "#3b82f6",
      icon: icon || "Users",
      memberIds: selectedMemberIds,
    });

    onClose();
    setName("");
    setDescription("");
    setSelectedMemberIds(["p_you"]);
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
                Create Expense Group
              </h2>
              <p className="text-xs text-[var(--m)]">
                Organize shared costs for trips, flatmates, or teams
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 styled-scrollbar"
        >
          {/* Group Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Group Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hawaii Trip, Apartment 4B, Work Lunches"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] focus:outline-hidden focus:border-[var(--i)]"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Summer vacation expenses split evenly"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)] focus:outline-hidden focus:border-[var(--i)]"
            />
          </div>

          {/* Color & Icon Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Theme Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Icon
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] cursor-pointer"
              >
                {GROUP_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Members Checklist */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--i)]">
                Group Members ({selectedMemberIds.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNewContact(!isAddingNewContact)}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                + Add Person
              </button>
            </div>

            {/* Quick add contact row */}
            {isAddingNewContact && (
              <div className="flex items-center gap-2 pt-1 pb-2 border-b border-[var(--h)]">
                <input
                  type="text"
                  placeholder="Person's name..."
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-md text-xs text-[var(--i)]"
                />
                <button
                  type="button"
                  onClick={handleQuickAddContact}
                  className="bt p text-xs px-3 py-1.5 font-medium"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto styled-scrollbar pr-1">
              {allGroupPeopleOptions.map((p) => {
                const isSelected = selectedMemberIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleMember(p.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--h)] bg-[var(--bg)]"
                        : "border-transparent opacity-60 bg-transparent hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(p.id)}
                        className="rounded border-[var(--h)]"
                      />
                      <span className="text-xs font-medium text-[var(--i)]">
                        {p.name} {p.id === "p_you" ? "(You)" : ""}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-medium text-emerald-500">
                        Member
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs font-medium px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bt p text-xs font-semibold px-5 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} />
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
