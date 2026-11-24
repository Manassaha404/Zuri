// Interactive monthly calendar view with color-coded deadline badges
"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { useDeadlineStore } from "@/store/deadlineStore";
import type { DeadlineItem } from "./types";

interface CalendarDeadlineViewProps {
  onEdit: (item: DeadlineItem) => void;
  onOpenCreate: () => void;
}

export function CalendarDeadlineView({
  onEdit,
  onOpenCreate,
}: CalendarDeadlineViewProps) {
  const { deadlines } = useDeadlineStore();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const { daysArray, monthName } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOffset = firstDay.getDay();

    const monthName = firstDay.toLocaleString("default", {
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
      monthName,
    };
  }, [year, month]);

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, DeadlineItem[]>();
    deadlines.forEach((item) => {
      const datePart = item.dueDate.split("T")[0] || "";
      if (datePart) {
        if (!map.has(datePart)) {
          map.set(datePart, []);
        }
        map.get(datePart)?.push(item);
      }
    });
    return map;
  }, [deadlines]);

  const selectedDayItems = selectedDay
    ? deadlinesByDate.get(selectedDay) || []
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Calendar Controls Bar */}
      <div className="flex items-center justify-between bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--i)]">
            {monthName}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--h)] hover:bg-[var(--s)] text-[var(--b)] transition-colors mr-1"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-[var(--h)] hover:bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)] transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-[var(--h)] hover:bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)] transition-colors"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl overflow-hidden p-4">
        {/* Day Header */}
        <div className="grid grid-cols-7 gap-1 text-center pb-2 border-b border-[var(--h)] text-xs font-semibold text-[var(--m)]">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-2">
          {daysArray.map((cell, idx) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[90px] p-1.5 rounded-xl bg-[var(--s)]/30 border border-transparent"
                />
              );
            }

            const isToday =
              new Date().toISOString().split("T")[0] === cell.dateStr;
            const items = deadlinesByDate.get(cell.dateStr) || [];
            const isSelected = selectedDay === cell.dateStr;

            return (
              <div
                key={cell.dateStr}
                onClick={() => setSelectedDay(cell.dateStr)}
                className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--s)] border-[var(--p)] shadow-xs"
                    : isToday
                      ? "bg-blue-500/5 border-blue-500/30"
                      : "bg-[var(--bg)] border-[var(--h)] hover:border-[var(--m)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? "w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold"
                        : "text-[var(--i)]"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)]">
                      {items.length}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                  {items.slice(0, 2).map((item) => {
                    const isDone = item.status === "done";
                    const isUrgent =
                      item.priority === "urgent" || item.priority === "high";

                    return (
                      <div
                        key={item.id}
                        title={item.title}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                          isDone
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 line-through"
                            : isUrgent
                              ? "bg-red-500/15 text-red-600 dark:text-red-400 font-semibold"
                              : "bg-[var(--s)] text-[var(--b)] border border-[var(--h)]"
                        }`}
                      >
                        {item.title}
                      </div>
                    );
                  })}
                  {items.length > 2 && (
                    <span className="text-[9px] text-[var(--m)] font-semibold">
                      +{items.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <div className="p-5 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl flex flex-col gap-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-[var(--h)] pb-3">
            <h3 className="text-sm font-semibold text-[var(--i)] flex items-center gap-2">
              <Clock size={16} className="text-[var(--accent)]" />
              <span>Deadlines on {selectedDay}</span>
            </h3>
            <span className="text-xs text-[var(--m)] font-medium">
              {selectedDayItems.length} items
            </span>
          </div>

          {selectedDayItems.length === 0 ? (
            <p className="text-xs text-[var(--m)] py-2">
              No deadlines scheduled for this day.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onEdit(item)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)] hover:border-[var(--p)] cursor-pointer transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-[var(--i)]">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[var(--m)]">
                      Due at{" "}
                      {new Date(item.dueDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • Category: {item.category}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--s)] text-[var(--b)]">
                    {item.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
