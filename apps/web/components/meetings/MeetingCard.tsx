// Meeting Card Component displaying meeting preview, attendees, action item status, markdown snippet
"use client";

import { useMemo } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Users,
  CheckCircle2,
  ListTodo,
  Bell,
  Edit2,
  Trash2,
  Tag,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useMeetingStore } from "@/store/meetingStore";
import type { MeetingItem, MeetingType } from "./types";

interface MeetingCardProps {
  meeting: MeetingItem;
  onEdit: (item: MeetingItem) => void;
  onViewDetails: (item: MeetingItem) => void;
}

export function MeetingCard({
  meeting,
  onEdit,
  onViewDetails,
}: MeetingCardProps) {
  const { deleteMeeting, toggleActionItem } = useMeetingStore();

  const isLink = useMemo(() => {
    if (!meeting.locationOrLink) return false;
    return (
      meeting.locationOrLink.startsWith("http://") ||
      meeting.locationOrLink.startsWith("https://")
    );
  }, [meeting.locationOrLink]);

  const typeConfig: Record<
    MeetingType,
    { label: string; bg: string; text: string; border: string }
  > = {
    standup: {
      label: "Standup",
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20",
    },
    "1:1": {
      label: "1:1 Meeting",
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/20",
    },
    class: {
      label: "Class / Lecture",
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/20",
    },
    interview: {
      label: "Interview",
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
    },
    other: {
      label: "Other",
      bg: "bg-[var(--s)]",
      text: "text-[var(--m)]",
      border: "border-[var(--h)]",
    },
  };

  const currentType = typeConfig[meeting.type] || typeConfig.other;

  // Calculate day difference & relative timing label
  const timingBadge = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = new Date(`${meeting.date}T00:00:00`);
    const diffTime = meetingDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        label: "Today",
        color:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (diffDays === 1) {
      return {
        label: "Tomorrow",
        color:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    }
    if (diffDays > 1) {
      return {
        label: `In ${diffDays} days`,
        color: "bg-[var(--s)] text-[var(--b)] border-[var(--h)]",
      };
    }
    if (diffDays === -1) {
      return {
        label: "Yesterday",
        color: "bg-[var(--s)] text-[var(--m)] border-[var(--h)]",
      };
    }
    return {
      label: `${Math.abs(diffDays)} days ago`,
      color: "bg-[var(--s)] text-[var(--m)] border-[var(--h)]",
    };
  }, [meeting.date]);

  // Action items completed vs total
  const completedActions = meeting.actionItems.filter(
    (a) => a.completed,
  ).length;
  const totalActions = meeting.actionItems.length;

  // Attendee avatar initials helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="group relative flex flex-col bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[var(--m)]/40 hover:shadow-xs w-full min-w-0">
      <div className="p-4 sm:p-5 flex flex-col gap-3.5 min-w-0">
        {/* Top Header: Timing Badge, Type Pill, and Actions */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${timingBadge.color}`}
            >
              {timingBadge.label}
            </span>

            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${currentType.bg} ${currentType.text} ${currentType.border}`}
            >
              {currentType.label}
            </span>

            {meeting.reminders && meeting.reminders.length > 0 && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)] flex items-center gap-1"
                title={`Reminders: ${meeting.reminders.join(", ")}`}
              >
                <Bell size={11} />
                <span>{meeting.reminders[0]}</span>
              </span>
            )}
          </div>

          {/* Action cluster: Edit & Delete */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={() => onEdit(meeting)}
              title="Edit meeting"
              className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete meeting "${meeting.title}"?`)) {
                  deleteMeeting(meeting.id);
                }
              }}
              title="Delete meeting"
              className="p-1.5 rounded-lg text-[var(--m)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Meeting Title & Date/Time */}
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onViewDetails(meeting)}
            className="text-left font-semibold text-base sm:text-lg text-[var(--i)] hover:underline leading-snug line-clamp-2 break-words w-full"
          >
            {meeting.title}
          </button>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[var(--m)] min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar size={13} className="text-[var(--m)]" />
              <span>{meeting.date}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock size={13} className="text-[var(--m)]" />
              <span>
                {meeting.startTime} – {meeting.endTime}
              </span>
            </div>

            {meeting.locationOrLink && (
              <div className="flex items-center gap-1 text-[var(--b)] max-w-full sm:max-w-xs min-w-0 truncate">
                {isLink ? (
                  <a
                    href={meeting.locationOrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline max-w-[180px] sm:max-w-[200px] truncate"
                    title={meeting.locationOrLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} className="shrink-0" />
                    <span className="truncate">{meeting.locationOrLink}</span>
                  </a>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 truncate text-[var(--m)] max-w-[180px] sm:max-w-[200px]"
                    title={meeting.locationOrLink}
                  >
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{meeting.locationOrLink}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Markdown Notes or Agenda Preview */}
        {(meeting.notesMarkdown || meeting.agendaMarkdown) && (
          <div
            onClick={() => onViewDetails(meeting)}
            className="text-xs text-[var(--b)] bg-[var(--s)]/70 p-3 rounded-xl border border-[var(--h)]/80 line-clamp-2 cursor-pointer hover:border-[var(--h)] transition-colors prose dark:prose-invert max-w-none break-words overflow-hidden"
          >
            <ReactMarkdown>
              {meeting.notesMarkdown || meeting.agendaMarkdown || ""}
            </ReactMarkdown>
          </div>
        )}

        {/* Attendees and Action Items Status footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--h)]/60 text-xs min-w-0">
          {/* Attendees Avatars / Names */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {meeting.attendees.slice(0, 4).map((att, i) => (
                <div
                  key={i}
                  title={`${att.name} (${att.email})`}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--p)] text-[var(--pt)] text-[10px] font-semibold border-2 border-[var(--surface-card)]"
                >
                  {getInitials(att.name)}
                </div>
              ))}
            </div>

            <span className="text-[11px] text-[var(--m)] truncate">
              {meeting.attendees.length}{" "}
              {meeting.attendees.length === 1 ? "attendee" : "attendees"}
            </span>
          </div>

          {/* Action Items status pill & View Details link */}
          <div className="flex items-center gap-2.5 shrink-0">
            {totalActions > 0 && (
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  completedActions === totalActions
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-[var(--s)] text-[var(--m)] border-[var(--h)]"
                }`}
              >
                <ListTodo size={11} />
                <span>
                  {completedActions}/{totalActions} tasks
                </span>
              </span>
            )}

            <button
              type="button"
              onClick={() => onViewDetails(meeting)}
              className="text-xs font-semibold text-[var(--i)] hover:text-[var(--accent)] flex items-center gap-0.5 transition-colors"
            >
              <span>View</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Tags row */}
        {meeting.tags && meeting.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 min-w-0">
            {meeting.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--s)] text-[var(--m)] border border-[var(--h)] flex items-center gap-1 max-w-[150px] truncate"
              >
                <Tag size={9} className="shrink-0" />
                <span className="truncate">{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
