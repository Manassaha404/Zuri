// Interactive monthly calendar view with color-coded meeting pills and side panel inspection
"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  MapPin,
  Users,
  Plus,
  ListTodo,
} from "lucide-react";
import { useMeetingStore } from "@/store/meetingStore";
import type { MeetingItem, MeetingType } from "./types";

interface MeetingCalendarViewProps {
  onEdit: (item: MeetingItem) => void;
  onViewDetails: (item: MeetingItem) => void;
  onOpenCreate: () => void;
}

export function MeetingCalendarView({
  onEdit,
  onViewDetails,
  onOpenCreate,
}: MeetingCalendarViewProps) {
  const { meetings } = useMeetingStore();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const d = new Date();
    setCurrentDate(d);
    setSelectedDay(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  };

  const { daysArray, monthName } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOffset = firstDay.getDay();

    const mName = firstDay.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const days = [];
    for (let i = 0; i < startDayOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d,
      ).padStart(2, "0")}`;
      days.push({ day: d, dateStr });
    }

    return {
      daysArray: days,
      monthName: mName,
    };
  }, [year, month]);

  // Index meetings by Date (YYYY-MM-DD)
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingItem[]>();
    meetings.forEach((m) => {
      if (!map.has(m.date)) {
        map.set(m.date, []);
      }
      map.get(m.date)?.push(m);
    });
    return map;
  }, [meetings]);

  const selectedDayItems = selectedDay
    ? meetingsByDate.get(selectedDay) || []
    : [];

  const typeColorClasses: Record<MeetingType, string> = {
    standup:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    "1:1":
      "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    class:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    interview:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    other: "bg-[var(--s)] text-[var(--b)] border-[var(--h)]",
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* Calendar Header Bar */}
      <div className="flex flex-wrap items-center justify-between bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-4 gap-3 w-full min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon size={18} className="text-[var(--accent)] shrink-0" />
          <h2 className="text-base font-semibold text-[var(--i)] truncate">
            {monthName}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToday}
            className="bt text-xs font-medium px-2.5 py-1 whitespace-nowrap"
          >
            Today
          </button>
          <div className="flex items-center gap-1 border border-[var(--h)] rounded-lg bg-[var(--bg)] p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)] transition-colors"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid + Side Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Calendar Grid (2 cols on desktop) */}
        <div className="lg:col-span-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-3 sm:p-5 flex flex-col gap-3 min-w-0 w-full overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] sm:text-xs text-[var(--m)] pb-2 border-b border-[var(--h)]">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid with horizontal scroll protection */}
          <div className="w-full overflow-x-auto styled-scrollbar">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[320px]">
              {daysArray.map((dayObj, index) => {
                if (!dayObj) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[68px] sm:min-h-[85px] rounded-xl bg-transparent opacity-30"
                    />
                  );
                }

                const items = meetingsByDate.get(dayObj.dateStr) || [];
                const isToday = dayObj.dateStr === todayStr;
                const isSelected = dayObj.dateStr === selectedDay;

                return (
                  <div
                    key={dayObj.dateStr}
                    onClick={() => setSelectedDay(dayObj.dateStr)}
                    className={`min-h-[68px] sm:min-h-[85px] p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden min-w-0 ${
                      isSelected
                        ? "border-[var(--p)] bg-[var(--s)] ring-2 ring-[var(--p)]/20"
                        : isToday
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-[var(--h)] bg-[var(--bg)] hover:border-[var(--m)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <span
                        className={`text-[11px] sm:text-xs font-semibold ${
                          isToday
                            ? "w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white grid place-items-center text-[10px] sm:text-xs"
                            : isSelected
                              ? "text-[var(--i)] font-bold"
                              : "text-[var(--b)]"
                        }`}
                      >
                        {dayObj.day}
                      </span>

                      {items.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-[var(--m)]">
                          {items.length}
                        </span>
                      )}
                    </div>

                    {/* Micro chips for meetings on this day */}
                    <div className="flex flex-col gap-0.5 sm:gap-1 mt-1 overflow-hidden min-w-0">
                      {items.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate border leading-tight ${
                            typeColorClasses[item.type] ||
                            typeColorClasses.other
                          }`}
                          title={`${item.startTime} - ${item.title}`}
                        >
                          {item.title}
                        </div>
                      ))}
                      {items.length > 2 && (
                        <span className="text-[8px] sm:text-[9px] text-[var(--m)] font-semibold pl-0.5 truncate">
                          +{items.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Agenda Side Panel */}
        <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0 w-full">
          <div className="flex items-center justify-between border-b border-[var(--h)] pb-3 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-[var(--m)] uppercase tracking-wider font-medium truncate">
                Day Schedule
              </p>
              <h3 className="text-base font-bold text-[var(--i)] truncate">
                {selectedDay
                  ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "Select a date"}
              </h3>
            </div>

            <button
              type="button"
              onClick={onOpenCreate}
              className="bt p text-xs font-semibold px-2.5 py-1.5 flex items-center gap-1 shrink-0"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          {/* List of meetings on selected date */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] styled-scrollbar pr-1 min-w-0">
            {selectedDayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--m)]">
                <CalendarIcon size={24} className="mb-2 opacity-60" />
                <p className="text-xs font-medium">No meetings scheduled</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  Click &apos;Add&apos; to schedule a meeting for this day.
                </p>
              </div>
            ) : (
              selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetails(item)}
                  className="p-3 rounded-xl border border-[var(--h)] bg-[var(--bg)] hover:border-[var(--p)] transition-all cursor-pointer flex flex-col gap-2 group min-w-0 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h4 className="text-xs font-semibold text-[var(--i)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 break-words flex-1 min-w-0">
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.2 rounded-full border shrink-0 ${
                        typeColorClasses[item.type] || typeColorClasses.other
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--m)] min-w-0">
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock size={11} />
                      {item.startTime} – {item.endTime}
                    </span>

                    {item.locationOrLink && (
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{item.locationOrLink}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
