// Meetings List View: Handles Upcoming and Past views with comprehensive search and filters
"use client";

import { useMemo } from "react";
import { Calendar, Search, Plus, Users, Inbox, FilterX } from "lucide-react";
import { useMeetingStore } from "@/store/meetingStore";
import { MeetingCard } from "./MeetingCard";
import type { MeetingItem } from "./types";

interface MeetingsListViewProps {
  viewMode: "upcoming" | "past";
  onEdit: (item: MeetingItem) => void;
  onViewDetails: (item: MeetingItem) => void;
  onOpenCreate: () => void;
}

export function MeetingsListView({
  viewMode,
  onEdit,
  onViewDetails,
  onOpenCreate,
}: MeetingsListViewProps) {
  const { meetings, filters, resetFilters } = useMeetingStore();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;

  // Filter and sort meetings
  const filteredMeetings = useMemo(() => {
    return meetings
      .filter((m) => {
        // Mode separation: upcoming vs past
        if (viewMode === "upcoming") {
          if (m.date < todayStr) return false;
        } else {
          if (m.date >= todayStr) return false;
        }

        // Type filter
        if (filters.typeFilter !== "all" && m.type !== filters.typeFilter) {
          return false;
        }

        // Tag filter
        if (
          filters.tagFilter &&
          !m.tags.some(
            (t) => t.toLowerCase() === filters.tagFilter?.toLowerCase(),
          )
        ) {
          return false;
        }

        // Search query: Person/Attendee, Tag, or Keyword (title, agenda, notes, location)
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = m.title.toLowerCase().includes(q);
          const matchLocation =
            m.locationOrLink?.toLowerCase().includes(q) ?? false;
          const matchAgenda =
            m.agendaMarkdown?.toLowerCase().includes(q) ?? false;
          const matchNotes =
            m.notesMarkdown?.toLowerCase().includes(q) ?? false;
          const matchTags = m.tags.some((t) => t.toLowerCase().includes(q));
          const matchAttendees = m.attendees.some(
            (att) =>
              att.name.toLowerCase().includes(q) ||
              att.email.toLowerCase().includes(q),
          );

          if (
            !matchTitle &&
            !matchLocation &&
            !matchAgenda &&
            !matchNotes &&
            !matchTags &&
            !matchAttendees
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Upcoming: Nearest first (ascending date + time)
        // Past: Most recent first (descending date + time)
        const dtA = `${a.date}T${a.startTime}`;
        const dtB = `${b.date}T${b.startTime}`;
        if (viewMode === "upcoming") {
          return dtA.localeCompare(dtB);
        }
        return dtB.localeCompare(dtA);
      });
  }, [meetings, viewMode, todayStr, filters]);

  // Group by Date for cleaner presentation
  const groupedMeetings = useMemo(() => {
    const groups: { date: string; items: MeetingItem[] }[] = [];
    filteredMeetings.forEach((meeting) => {
      let grp = groups.find((g) => g.date === meeting.date);
      if (!grp) {
        grp = { date: meeting.date, items: [] };
        groups.push(grp);
      }
      grp.items.push(meeting);
    });
    return groups;
  }, [filteredMeetings]);

  const formatDateHeader = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(`${dateStr}T00:00:00`);
    const diffTime = itemDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    const formatted = itemDate.toLocaleDateString("en-US", options);

    if (diffDays === 0) return `Today – ${formatted}`;
    if (diffDays === 1) return `Tomorrow – ${formatted}`;
    if (diffDays === -1) return `Yesterday – ${formatted}`;
    return formatted;
  };

  const hasSearch =
    Boolean(filters.searchQuery) || filters.typeFilter !== "all";

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* Empty State */}
      {filteredMeetings.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl w-full min-w-0">
          <div className="w-12 h-12 rounded-full bg-[var(--s)] border border-[var(--h)] flex items-center justify-center text-[var(--m)] mb-3">
            {hasSearch ? <FilterX size={22} /> : <Inbox size={22} />}
          </div>

          <h3 className="text-base font-semibold text-[var(--i)] mb-1">
            {hasSearch
              ? "No matching meetings found"
              : viewMode === "upcoming"
                ? "No upcoming meetings scheduled"
                : "No past meetings on record"}
          </h3>

          <p className="text-xs text-[var(--m)] max-w-md mb-4">
            {hasSearch
              ? "Try adjusting your search keywords, clearing filters, or searching for attendee names."
              : viewMode === "upcoming"
                ? "Plan ahead by scheduling your next standup, 1:1, lecture, or interview."
                : "Meetings you hold will be preserved here along with historical agendas and notes."}
          </p>

          <div className="flex items-center gap-2">
            {hasSearch ? (
              <button
                type="button"
                onClick={resetFilters}
                className="bt text-xs px-3 py-1.5 font-medium"
              >
                Clear all filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreate}
                className="bt p text-xs px-3.5 py-1.5 font-semibold flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Schedule Meeting</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grouped Day-by-Day List */}
      {groupedMeetings.map((group) => (
        <div key={group.date} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <Calendar size={14} className="text-[var(--accent)]" />
            <h3 className="text-xs font-semibold text-[var(--i)] uppercase tracking-wider">
              {formatDateHeader(group.date)}
            </h3>
            <span className="badge-pill bg-[var(--s)] text-[var(--m)] text-[10px] ml-1">
              {group.items.length}{" "}
              {group.items.length === 1 ? "meeting" : "meetings"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.items.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
