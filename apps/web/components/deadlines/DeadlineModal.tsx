// Modal for creating and editing deadlines
"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, Repeat, Bell } from "lucide-react";
import { useDeadlines } from "@/hook/deadlines";
import type {
  DeadlineItem,
  DeadlineCategoryItem,
  DeadlinePriority,
  DeadlineStatus,
  ReminderOffset,
  RecurrenceType,
} from "./types";

interface DeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: DeadlineItem | null;
}

export function DeadlineModal({
  isOpen,
  onClose,
  editingItem,
}: DeadlineModalProps) {
  const { createDeadline, updateDeadline, categories } = useDeadlines();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("assignment");
  const [priority, setPriority] = useState<DeadlinePriority>("high");
  const [status, setStatus] = useState<DeadlineStatus>("upcoming");

  // Dates
  const [dueDate, setDueDate] = useState("");
  const [hasSoftDeadline, setHasSoftDeadline] = useState(false);
  const [softDueDate, setSoftDueDate] = useState("");

  // Reminders
  const [reminders, setReminders] = useState<ReminderOffset[]>([
    "1_day",
    "1_hour",
  ]);

  // Recurrence
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || "");
      setCategory(editingItem.category);
      setPriority(editingItem.priority);
      setStatus(editingItem.status);
      setDueDate(editingItem.dueDate.slice(0, 16));
      setHasSoftDeadline(!!editingItem.softDueDate);
      setSoftDueDate(
        editingItem.softDueDate ? editingItem.softDueDate.slice(0, 16) : "",
      );
      setReminders(editingItem.reminders);
      setRecurrence(editingItem.recurrence);
    } else {
      // Default: Due 3 days from now at 23:59
      const defaultDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      defaultDue.setHours(23, 59, 0, 0);
      const isoLocal = defaultDue.toISOString().slice(0, 16);

      setTitle("");
      setDescription("");
      setCategory("assignment");
      setPriority("high");
      setStatus("upcoming");
      setDueDate(isoLocal);
      setHasSoftDeadline(false);
      setSoftDueDate("");
      setReminders(["1_day", "1_hour"]);
      setRecurrence("none");
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const toggleReminder = (offset: ReminderOffset) => {
    if (reminders.includes(offset)) {
      setReminders(reminders.filter((r) => r !== offset));
    } else {
      setReminders([...reminders, offset]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      status,
      dueDate: new Date(dueDate).toISOString(),
      softDueDate:
        hasSoftDeadline && softDueDate
          ? new Date(softDueDate).toISOString()
          : undefined,
      reminders,
      recurrence,
    };

    if (editingItem) {
      updateDeadline(editingItem.id, payload);
    } else {
      createDeadline(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--h)]">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--i)]">
              {editingItem ? "Edit Deadline" : "Create New Deadline"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto styled-scrollbar p-6 flex flex-col gap-5 text-xs"
        >
          {/* Title & Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--i)]">
              Deadline Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems Lab 3 Submission"
              className="px-3 py-2 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-[var(--i)] focus:outline-hidden focus:border-[var(--p)] text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--m)]">
              Description & Context (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, rubrics, or notes..."
              className="px-3 py-2 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-[var(--i)] focus:outline-hidden focus:border-[var(--p)] text-xs resize-none"
            />
          </div>

          {/* Category, Priority & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[var(--i)]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="styled-select text-xs w-full"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name.toLowerCase()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[var(--i)]">Priority</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as DeadlinePriority)
                }
                className="styled-select text-xs w-full"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[var(--i)]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeadlineStatus)}
                className="styled-select text-xs w-full"
              >
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done / Completed</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>

          {/* Hard Due Date vs Soft Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-[var(--s)] rounded-xl border border-[var(--h)]">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-red-500 flex items-center gap-1.5">
                <Calendar size={13} />
                Hard Due Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-[var(--i)] focus:outline-hidden focus:border-[var(--p)]"
              />
              <span className="text-[10px] text-[var(--m)]">
                The absolute real submission deadline.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Clock size={13} />
                  Soft Target Deadline
                </label>
                <input
                  type="checkbox"
                  checked={hasSoftDeadline}
                  onChange={(e) => setHasSoftDeadline(e.target.checked)}
                  className="styled-checkbox"
                />
              </div>

              {hasSoftDeadline ? (
                <>
                  <input
                    type="datetime-local"
                    value={softDueDate}
                    onChange={(e) => setSoftDueDate(e.target.value)}
                    className="px-3 py-2 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-[var(--i)] focus:outline-hidden focus:border-[var(--p)]"
                  />
                  <span className="text-[10px] text-[var(--m)]">
                    Target completion to allow buffer before real deadline.
                  </span>
                </>
              ) : (
                <div className="py-2.5 px-3 rounded-lg border border-dashed border-[var(--h)] text-[var(--m)] text-[11px]">
                  Check to set an early personal goal date.
                </div>
              )}
            </div>
          </div>

          {/* Reminders at Set Offsets */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[var(--i)] flex items-center gap-1.5">
              <Bell size={13} className="text-[var(--accent)]" />
              Reminders at Set Offsets
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  ["1_hour", "1 hour before"],
                  ["1_day", "1 day before"],
                  ["3_days", "3 days before"],
                  ["1_week", "1 week before"],
                  ["2_weeks", "2 weeks before"],
                ] as [ReminderOffset, string][]
              ).map(([offset, label]) => {
                const active = reminders.includes(offset);
                return (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => toggleReminder(offset)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                        : "bg-[var(--bg)] text-[var(--m)] border-[var(--h)] hover:border-[var(--i)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurrence Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--i)] flex items-center gap-1.5">
              <Repeat size={13} className="text-[var(--accent)]" />
              Recurrence (Recurring Deadlines)
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="styled-select text-xs w-full"
            >
              <option value="none">One-off (No recurrence)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (Weekly submissions)</option>
              <option value="biweekly">Bi-weekly (Fortnightly)</option>
              <option value="monthly">
                Monthly (Monthly bills / invoices)
              </option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--h)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--h)] bg-[var(--bg)] hover:bg-[var(--s)] text-[var(--b)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--p)] text-[var(--pt)] hover:opacity-90 transition-opacity shadow-xs"
            >
              {editingItem ? "Save Changes" : "Create Deadline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
