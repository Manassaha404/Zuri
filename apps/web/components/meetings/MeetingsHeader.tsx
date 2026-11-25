// Meetings Header with quick metrics, view pill navigation, search, and type filters
"use client";

import { useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ListTodo,
  Plus,
  Search,
  Filter,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import { useMeetingStore } from "@/store/meetingStore";
import type { MeetingType, MeetingViewTab } from "./types";

interface MeetingsHeaderProps {
  onOpenCreateModal: () => void;
}

export function MeetingsHeader({ onOpenCreateModal }: MeetingsHeaderProps) {
  const { darkMode, toggleTheme } = useUIStore();
  const {
    meetings,
    activeTab,
    filters,
    setActiveTab,
    setSearchQuery,
    setTypeFilter,
    setTagFilter,
    resetFilters,
  } = useMeetingStore();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;

  // Quick Stats
  const stats = useMemo(() => {
    let upcomingCount = 0;
    let todayCount = 0;
    let pendingActionItems = 0;

    meetings.forEach((m) => {
      if (m.date >= todayStr) {
        upcomingCount += 1;
        if (m.date === todayStr) {
          todayCount += 1;
        }
      }
      m.actionItems.forEach((act) => {
        if (!act.completed) {
          pendingActionItems += 1;
        }
      });
    });

    return {
      total: meetings.length,
      upcomingCount,
      todayCount,
      pendingActionItems,
    };
  }, [meetings, todayStr]);

  const viewTabs: { id: MeetingViewTab; label: string; count?: number }[] = [
    { id: "upcoming", label: "Upcoming", count: stats.upcomingCount },
    { id: "past", label: "Past", count: stats.total - stats.upcomingCount },
    { id: "calendar", label: "Calendar" },
  ];

  const typeOptions: { value: "all" | MeetingType; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "standup", label: "Standup" },
    { value: "1:1", label: "1:1 Meeting" },
    { value: "class", label: "Class / Lecture" },
    { value: "interview", label: "Interview" },
    { value: "other", label: "Other" },
  ];

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.typeFilter !== "all" ||
    Boolean(filters.tagFilter);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      {/* Top row: Title, Subtitle, Dark Mode, Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--i)] break-words">
              Meetings Tracker
            </h1>
            <span className="badge-pill bg-[var(--s)] text-[var(--m)] border border-[var(--h)] shrink-0">
              {stats.total} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--m)] mt-1 break-words">
            Organize agendas, Markdown notes, attendees, and convertible action
            items across your schedule.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <ThemeToggle
            darkMode={darkMode}
            onToggle={toggleTheme}
            className="w-9 h-9 border border-[var(--h)] bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)]"
            size={18}
          />

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="bt p text-xs sm:text-sm font-semibold flex items-center gap-2 px-3.5 py-2 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>New Meeting</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              Upcoming
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.upcomingCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              Today
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.todayCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <ListTodo size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              Open Action Items
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.pendingActionItems}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              All Records
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.total}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation tabs & filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 w-full min-w-0">
        {/* Nav Pill Group with overflow-x-auto */}
        <div className="nav-pill-group flex max-w-full overflow-x-auto styled-scrollbar self-start sm:self-auto shrink-0 p-1">
          {viewTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nav-pill-item flex items-center gap-1.5 transition-colors shrink-0 ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)]"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? "bg-[var(--pt)] text-[var(--p)] opacity-90"
                        : "bg-[var(--h)] text-[var(--m)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Select Controls */}
        <div className="flex flex-wrap sm:flex-nowrap flex-1 sm:justify-end items-center gap-2.5 min-w-0 w-full sm:w-auto">
          {/* Search Input: person, tag, or keyword */}
          <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by person, tag, keyword..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--surface-card)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] hover:text-[var(--i)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Type Select Dropdown */}
          <div className="relative shrink-0">
            <select
              value={filters.typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | MeetingType)
              }
              className="styled-select text-xs py-1.5 pl-3 pr-8 rounded-lg border border-[var(--h)] bg-[var(--surface-card)] text-[var(--i)] font-medium focus:outline-none focus:border-[var(--p)] cursor-pointer"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Chip */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              title="Reset search and filters"
              className="bt text-xs px-2.5 py-1.5 text-[var(--m)] hover:text-red-500 hover:border-red-500/30 shrink-0"
            >
              <X size={13} />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
