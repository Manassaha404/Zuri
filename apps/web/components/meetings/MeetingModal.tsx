// Meeting Creation & Edit Modal
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  ListTodo,
  Bell,
  Plus,
  Trash2,
  FileText,
  AlignLeft,
} from "lucide-react";
import { useMeetingStore } from "@/store/meetingStore";
import type {
  MeetingItem,
  MeetingType,
  ReminderOffset,
  Attendee,
  ActionItem,
} from "./types";

interface MeetingModalProps {
  isOpen: boolean;
  initialMeeting: MeetingItem | null;
  onClose: () => void;
}

export function MeetingModal({
  isOpen,
  initialMeeting,
  onClose,
}: MeetingModalProps) {
  const { addMeeting, updateMeeting } = useMeetingStore();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:45");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [type, setType] = useState<MeetingType>("standup");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [agendaMarkdown, setAgendaMarkdown] = useState("");
  const [notesMarkdown, setNotesMarkdown] = useState("");
  const [reminders, setReminders] = useState<ReminderOffset[]>(["15m"]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  // Action item quick entry state
  const [newActionText, setNewActionText] = useState("");
  const [newActionOwner, setNewActionOwner] = useState("");
  const [newActionDue, setNewActionDue] = useState("");

  useEffect(() => {
    if (initialMeeting) {
      setTitle(initialMeeting.title);
      setDate(initialMeeting.date);
      setStartTime(initialMeeting.startTime);
      setEndTime(initialMeeting.endTime);
      setLocationOrLink(initialMeeting.locationOrLink || "");
      setType(initialMeeting.type);
      setTags([...initialMeeting.tags]);
      setAttendees([...initialMeeting.attendees]);
      setAgendaMarkdown(initialMeeting.agendaMarkdown || "");
      setNotesMarkdown(initialMeeting.notesMarkdown || "");
      setReminders(
        initialMeeting.reminders.length > 0
          ? [...initialMeeting.reminders]
          : ["15m"],
      );
      setActionItems([...initialMeeting.actionItems]);
    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setTitle("");
      setDate(dateStr);
      setStartTime("10:00");
      setEndTime("10:45");
      setLocationOrLink("");
      setType("standup");
      setTags(["Sprint"]);
      setAttendees([{ name: "Alex Rivers", email: "alex@zuri.app" }]);
      setAgendaMarkdown(
        "### Agenda\n- Discussion point 1\n- Discussion point 2",
      );
      setNotesMarkdown("");
      setReminders(["15m"]);
      setActionItems([]);
    }
  }, [initialMeeting, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddAttendee = () => {
    const trimmedName = attendeeName.trim();
    const trimmedEmail = attendeeEmail.trim();
    if (trimmedName) {
      setAttendees([
        ...attendees,
        {
          name: trimmedName,
          email:
            trimmedEmail ||
            `${trimmedName.toLowerCase().replace(/\s+/g, ".")}@team.local`,
        },
      ]);
      setAttendeeName("");
      setAttendeeEmail("");
    }
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleAddActionItem = () => {
    const trimmed = newActionText.trim();
    if (trimmed) {
      const newItem: ActionItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: trimmed,
        completed: false,
        owner: newActionOwner.trim() || undefined,
        dueDate: newActionDue || undefined,
        convertedToTask: false,
      };
      setActionItems([...actionItems, newItem]);
      setNewActionText("");
      setNewActionOwner("");
      setNewActionDue("");
    }
  };

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter((a) => a.id !== id));
  };

  const handleToggleReminder = (offset: ReminderOffset) => {
    if (reminders.includes(offset)) {
      setReminders(reminders.filter((r) => r !== offset));
    } else {
      setReminders([...reminders, offset]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    if (initialMeeting) {
      updateMeeting(initialMeeting.id, {
        title: title.trim(),
        date,
        startTime,
        endTime,
        locationOrLink: locationOrLink.trim() || undefined,
        type,
        tags,
        attendees,
        agendaMarkdown: agendaMarkdown.trim() || undefined,
        notesMarkdown: notesMarkdown.trim() || undefined,
        reminders,
        actionItems,
      });
    } else {
      addMeeting({
        title: title.trim(),
        date,
        startTime,
        endTime,
        locationOrLink: locationOrLink.trim() || undefined,
        type,
        tags,
        attendees,
        agendaMarkdown: agendaMarkdown.trim() || undefined,
        notesMarkdown: notesMarkdown.trim() || undefined,
        reminders,
        actionItems,
      });
    }

    onClose();
  };

  const reminderOptions: { value: ReminderOffset; label: string }[] = [
    { value: "5m", label: "5 min before" },
    { value: "10m", label: "10 min before" },
    { value: "15m", label: "15 min before" },
    { value: "30m", label: "30 min before" },
    { value: "1h", label: "1 hour before" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl shadow-2xl flex flex-col overflow-hidden min-w-0 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--h)] bg-[var(--bg)] shrink-0 gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[var(--i)] truncate">
              {initialMeeting ? "Edit Meeting" : "Schedule New Meeting"}
            </h2>
            <p className="text-xs text-[var(--m)] truncate">
              Set details, Markdown agenda, attendees, and action items.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 styled-scrollbar min-w-0"
        >
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint Sync, Architecture Review, 1:1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
            />
          </div>

          {/* Date, Start Time, End Time & Meeting Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--i)] mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--i)] mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--i)] mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--i)] mb-1">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MeetingType)}
                className="styled-select w-full px-3 py-2 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] font-medium focus:outline-none focus:border-[var(--p)] cursor-pointer"
              >
                <option value="standup">Standup</option>
                <option value="1:1">1:1 Meeting</option>
                <option value="class">Class / Lecture</option>
                <option value="interview">Interview</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Location or Video Link */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1">
              Location or Meeting URL
            </label>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)]"
              />
              <input
                type="text"
                placeholder="https://meet.jit.si/... or Room 402"
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1">
              Attendees
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 rounded-lg border border-[var(--h)] bg-[var(--bg)]">
                {attendees.map((att, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-[var(--s)] text-[var(--i)] border border-[var(--h)]"
                  >
                    <span className="font-medium">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(index)}
                      className="text-[var(--m)] hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {attendees.length === 0 && (
                  <span className="text-xs text-[var(--m)] italic">
                    No attendees added yet.
                  </span>
                )}
              </div>

              {/* Add Attendee Input Group */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
                <input
                  type="text"
                  placeholder="Attendee name"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                  className="w-full sm:flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                  className="w-full sm:flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
                />
                <button
                  type="button"
                  onClick={handleAddAttendee}
                  className="bt text-xs px-3 py-1.5 font-medium shrink-0 self-end sm:self-auto"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-[var(--s)] text-[var(--i)] border border-[var(--h)]"
                >
                  <Tag size={11} className="text-[var(--m)]" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[var(--m)] hover:text-red-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bt text-xs px-3 py-1.5 font-medium shrink-0"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Reminders Pill Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1.5 flex items-center gap-1.5">
              <Bell size={13} className="text-[var(--m)]" />
              <span>Reminders Before Start</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {reminderOptions.map((opt) => {
                const isSelected = reminders.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleReminder(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)] font-medium"
                        : "bg-[var(--bg)] text-[var(--b)] border-[var(--h)] hover:border-[var(--m)]"
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Markdown */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1 flex items-center gap-1.5">
              <AlignLeft size={13} className="text-[var(--m)]" />
              <span>Agenda (Markdown supported)</span>
            </label>
            <textarea
              rows={3}
              placeholder="### Topics to discuss..."
              value={agendaMarkdown}
              onChange={(e) => setAgendaMarkdown(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)] font-mono resize-y"
            />
          </div>

          {/* Notes Markdown */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1 flex items-center gap-1.5">
              <FileText size={13} className="text-[var(--m)]" />
              <span>Meeting Notes (Markdown supported)</span>
            </label>
            <textarea
              rows={3}
              placeholder="### Meeting summary & discussion takeaways..."
              value={notesMarkdown}
              onChange={(e) => setNotesMarkdown(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)] font-mono resize-y"
            />
          </div>

          {/* Action Items Capture */}
          <div>
            <label className="block text-xs font-semibold text-[var(--i)] mb-1.5 flex items-center gap-1.5">
              <ListTodo size={13} className="text-[var(--m)]" />
              <span>Action Items Captured During Meeting</span>
            </label>

            {/* List of current action items */}
            {actionItems.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2.5">
                {actionItems.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--h)] bg-[var(--bg)] text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium text-[var(--i)] truncate">
                        {act.text}
                      </span>
                      {act.owner && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--s)] text-[var(--m)] border border-[var(--h)] shrink-0">
                          {act.owner}
                        </span>
                      )}
                      {act.dueDate && (
                        <span className="text-[10px] text-[var(--m)] shrink-0">
                          Due: {act.dueDate}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveActionItem(act.id)}
                      className="text-[var(--m)] hover:text-red-500 p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick action item input row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 w-full min-w-0">
              <div className="sm:col-span-6 min-w-0">
                <input
                  type="text"
                  placeholder="Action item description..."
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddActionItem();
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
                />
              </div>

              <div className="sm:col-span-3 min-w-0">
                <input
                  type="text"
                  placeholder="Owner (optional)"
                  value={newActionOwner}
                  onChange={(e) => setNewActionOwner(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
                />
              </div>

              <div className="sm:col-span-2 min-w-0">
                <input
                  type="date"
                  value={newActionDue}
                  onChange={(e) => setNewActionDue(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                />
              </div>

              <div className="sm:col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleAddActionItem}
                  className="bt text-xs px-2.5 py-1.5 font-medium w-full justify-center"
                  title="Add Action Item"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--h)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs px-4 py-2 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bt p text-xs px-5 py-2 font-semibold"
            >
              {initialMeeting ? "Save Changes" : "Create Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
