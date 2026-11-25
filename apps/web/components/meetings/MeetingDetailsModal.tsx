// Meeting Details Modal / Drawer: Full agenda, Markdown notes, attendees, convertible action items
"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRight,
  ListTodo,
  Tag,
  Bell,
  Check,
  Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useMeetingStore } from "@/store/meetingStore";
import type { MeetingItem } from "./types";

interface MeetingDetailsModalProps {
  isOpen: boolean;
  meeting: MeetingItem | null;
  onClose: () => void;
  onEdit: (meeting: MeetingItem) => void;
}

export function MeetingDetailsModal({
  isOpen,
  meeting,
  onClose,
  onEdit,
}: MeetingDetailsModalProps) {
  const {
    meetings,
    deleteMeeting,
    toggleActionItem,
    addActionItem,
    deleteActionItem,
    convertActionItemToTask,
  } = useMeetingStore();

  const [activeSubTab, setActiveSubTab] = useState<"notes" | "agenda">("notes");
  const [newActionText, setNewActionText] = useState("");
  const [newActionOwner, setNewActionOwner] = useState("");
  const [newActionDueDate, setNewActionDueDate] = useState("");
  const [taskConvertedAlert, setTaskConvertedAlert] = useState<string | null>(
    null,
  );

  if (!isOpen || !meeting) return null;

  // Read latest live meeting from store to reflect toggles and edits immediately
  const liveMeeting = meetings.find((m) => m.id === meeting.id) || meeting;

  const isLink =
    liveMeeting.locationOrLink?.startsWith("http://") ||
    liveMeeting.locationOrLink?.startsWith("https://");

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    addActionItem(liveMeeting.id, {
      text: newActionText.trim(),
      owner: newActionOwner.trim() || undefined,
      dueDate: newActionDueDate || undefined,
    });

    setNewActionText("");
    setNewActionOwner("");
    setNewActionDueDate("");
  };

  const handleConvert = (actionItemId: string, actionText: string) => {
    convertActionItemToTask(liveMeeting.id, actionItemId);
    setTaskConvertedAlert(`Converted "${actionText}" to a tracked task!`);
    setTimeout(() => {
      setTaskConvertedAlert(null);
    }, 3000);
  };

  const completedCount = liveMeeting.actionItems.filter(
    (a) => a.completed,
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl shadow-2xl flex flex-col overflow-hidden min-w-0 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-[var(--h)] bg-[var(--bg)] shrink-0 gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5 min-w-0">
              <span className="badge-pill bg-[var(--s)] text-[var(--m)] border border-[var(--h)] uppercase text-[10px] font-semibold tracking-wider shrink-0">
                {liveMeeting.type}
              </span>

              {liveMeeting.reminders && liveMeeting.reminders.length > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)] flex items-center gap-1 shrink-0">
                  <Bell size={11} />
                  <span>Remind: {liveMeeting.reminders.join(", ")}</span>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[var(--i)] leading-snug break-words">
              {liveMeeting.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--m)] min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar size={13} className="text-[var(--m)]" />
                <span>{liveMeeting.date}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock size={13} className="text-[var(--m)]" />
                <span>
                  {liveMeeting.startTime} – {liveMeeting.endTime}
                </span>
              </div>
              {liveMeeting.locationOrLink && (
                <div className="flex items-center gap-1 max-w-full sm:max-w-md min-w-0 truncate">
                  {isLink ? (
                    <a
                      href={liveMeeting.locationOrLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline max-w-[180px] sm:max-w-[220px] truncate"
                    >
                      <ExternalLink size={12} className="shrink-0" />
                      <span className="truncate">
                        {liveMeeting.locationOrLink}
                      </span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 truncate text-[var(--m)] max-w-[180px] sm:max-w-[220px]">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {liveMeeting.locationOrLink}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(liveMeeting)}
              title="Edit meeting"
              className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete meeting "${liveMeeting.title}"?`)) {
                  deleteMeeting(liveMeeting.id);
                  onClose();
                }
              }}
              title="Delete meeting"
              className="p-1.5 rounded-lg text-[var(--m)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 styled-scrollbar min-w-0">
          {/* Notification banner for task conversion */}
          {taskConvertedAlert && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between">
              <span>{taskConvertedAlert}</span>
              <button
                type="button"
                onClick={() => setTaskConvertedAlert(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:opacity-80"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Attendees Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-[var(--i)] uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-[var(--accent)]" />
              <span>Attendees ({liveMeeting.attendees.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {liveMeeting.attendees.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-[var(--h)] bg-[var(--bg)]"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--p)] text-[var(--pt)] text-xs font-bold grid place-items-center shrink-0">
                    {att.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--i)] truncate">
                      {att.name}
                    </p>
                    <p className="text-[11px] text-[var(--m)] truncate">
                      {att.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda & Notes Segmented Tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[var(--h)] pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("notes")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    activeSubTab === "notes"
                      ? "bg-[var(--p)] text-[var(--pt)]"
                      : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
                  }`}
                >
                  Meeting Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("agenda")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    activeSubTab === "agenda"
                      ? "bg-[var(--p)] text-[var(--pt)]"
                      : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
                  }`}
                >
                  Agenda Outline
                </button>
              </div>

              <span className="text-[11px] text-[var(--m)]">
                Markdown Rendered
              </span>
            </div>

            {/* Markdown Display Area */}
            <div className="p-4 rounded-xl border border-[var(--h)] bg-[var(--bg)] min-h-[140px] text-xs sm:text-sm text-[var(--b)] prose dark:prose-invert max-w-none styled-scrollbar overflow-y-auto max-h-[300px] break-words">
              {activeSubTab === "notes" ? (
                liveMeeting.notesMarkdown ? (
                  <ReactMarkdown>{liveMeeting.notesMarkdown}</ReactMarkdown>
                ) : (
                  <p className="text-[var(--m)] italic text-xs">
                    No notes recorded yet. Click Edit to document meeting notes.
                  </p>
                )
              ) : liveMeeting.agendaMarkdown ? (
                <ReactMarkdown>{liveMeeting.agendaMarkdown}</ReactMarkdown>
              ) : (
                <p className="text-[var(--m)] italic text-xs">
                  No agenda outline specified. Click Edit to add meeting topics.
                </p>
              )}
            </div>
          </div>

          {/* Action Items Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo size={15} className="text-purple-500" />
                <h3 className="text-xs font-semibold text-[var(--i)] uppercase tracking-wider">
                  Action Items
                </h3>
                <span className="badge-pill bg-[var(--s)] text-[var(--m)] text-[10px]">
                  {completedCount}/{liveMeeting.actionItems.length} completed
                </span>
              </div>
            </div>

            {/* Action Items Checklist */}
            <div className="divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl bg-[var(--bg)] overflow-hidden">
              {liveMeeting.actionItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--m)] italic">
                  No action items captured yet. Add actionable takeaways below.
                </div>
              ) : (
                liveMeeting.actionItems.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2.5 hover:bg-[var(--s)]/50 transition-colors"
                  >
                    {/* Left: Checkbox + Text */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleActionItem(liveMeeting.id, act.id)}
                        className="mt-0.5 text-[var(--m)] hover:text-[var(--i)] transition-colors focus:outline-none"
                      >
                        {act.completed ? (
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                          />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-medium ${
                            act.completed
                              ? "line-through text-[var(--m)]"
                              : "text-[var(--i)]"
                          }`}
                        >
                          {act.text}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[var(--m)]">
                          {act.owner && (
                            <span className="px-1.5 py-0.2 rounded bg-[var(--s)] border border-[var(--h)] font-medium">
                              Owner: {act.owner}
                            </span>
                          )}
                          {act.dueDate && <span>Due: {act.dueDate}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Convert to Task & Delete */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {act.convertedToTask ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check size={11} />
                          <span>Tracked Task</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConvert(act.id, act.text)}
                          className="bt text-xs px-2.5 py-1 font-medium flex items-center gap-1 text-[var(--accent)] hover:border-[var(--accent)]"
                          title="Convert this action item to a tracked task"
                        >
                          <ArrowRight size={12} />
                          <span>Convert to Task</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteActionItem(liveMeeting.id, act.id)}
                        className="p-1 rounded text-[var(--m)] hover:text-red-500 transition-colors"
                        title="Delete action item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Action Item form */}
            <form
              onSubmit={handleCreateAction}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 mt-1 w-full min-w-0"
            >
              <div className="sm:col-span-6 min-w-0">
                <input
                  type="text"
                  placeholder="Capture new action item..."
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
                />
              </div>

              <div className="sm:col-span-3 min-w-0">
                <input
                  type="text"
                  placeholder="Owner"
                  value={newActionOwner}
                  onChange={(e) => setNewActionOwner(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
                />
              </div>

              <div className="sm:col-span-2 min-w-0">
                <input
                  type="date"
                  value={newActionDueDate}
                  onChange={(e) => setNewActionDueDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                />
              </div>

              <div className="sm:col-span-1 flex items-center justify-end">
                <button
                  type="submit"
                  className="bt p text-xs px-2.5 py-1.5 font-semibold w-full justify-center"
                  title="Add Action Item"
                >
                  <Plus size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Tags */}
          {liveMeeting.tags && liveMeeting.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--h)]/60">
              <span className="text-xs text-[var(--m)] mr-1">Tags:</span>
              {liveMeeting.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-md bg-[var(--s)] text-[var(--b)] border border-[var(--h)] flex items-center gap-1"
                >
                  <Tag size={11} className="text-[var(--m)]" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
