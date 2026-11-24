// Interactive Date Navigation Strip
"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useHabitStore } from "@/store/habitStore";
import {
  shiftDateKey,
  getTodayKey,
  parseDateKey,
  getRelativeDateLabel,
} from "@/lib/habitUtils";

export function HabitDateNav() {
  const { selectedDate, setSelectedDate, habits, checkIns } = useHabitStore();
  const todayKey = getTodayKey();

  // Generate 7-day window centered or ending on today/selectedDate
  const days = useMemo(() => {
    const list: Array<{
      dateKey: string;
      dayOfWeek: string;
      dayOfMonth: number;
      isToday: boolean;
      isSelected: boolean;
      completedCount: number;
      totalCount: number;
    }> = [];

    // 4 days before selectedDate, selectedDate, 2 days after
    for (let offset = -4; offset <= 2; offset++) {
      const dateKey = shiftDateKey(selectedDate, offset);
      const dateObj = parseDateKey(dateKey);
      const isToday = dateKey === todayKey;
      const isSelected = dateKey === selectedDate;

      // Count scheduled active habits and completed
      let totalCount = 0;
      let completedCount = 0;

      for (const h of habits) {
        if (h.status === "active") {
          totalCount++;
          const rec = checkIns[`${h.id}_${dateKey}`];
          if (rec?.completed) completedCount++;
        }
      }

      list.push({
        dateKey,
        dayOfWeek: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        dayOfMonth: dateObj.getDate(),
        isToday,
        isSelected,
        completedCount,
        totalCount,
      });
    }

    return list;
  }, [selectedDate, todayKey, habits, checkIns]);

  const handlePrevDay = () => {
    setSelectedDate(shiftDateKey(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(shiftDateKey(selectedDate, 1));
  };

  const handleJumpToToday = () => {
    setSelectedDate(todayKey);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
      {/* Date Header & Jump to Today */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-[var(--s)] border border-[var(--h)] text-[var(--i)]">
          <Calendar size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--i)] tracking-tight">
              {getRelativeDateLabel(selectedDate)}
            </span>
            {selectedDate !== todayKey && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--p)] text-[var(--pt)] hover:opacity-90 transition-opacity"
              >
                Go to Today
              </button>
            )}
          </div>
          <p className="text-xs text-[var(--m)]">
            {parseDateKey(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Day Selector Strip */}
      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        <button
          type="button"
          onClick={handlePrevDay}
          title="Previous day"
          className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto habits-scrollbar py-1">
          {days.map((item) => {
            const hasActivity = item.completedCount > 0;
            const isFull =
              item.totalCount > 0 && item.completedCount >= item.totalCount;

            return (
              <button
                key={item.dateKey}
                type="button"
                onClick={() => setSelectedDate(item.dateKey)}
                className={`flex flex-col items-center justify-center w-11 h-14 rounded-xl border transition-all ${
                  item.isSelected
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)] shadow-xs scale-102"
                    : "bg-[var(--s)] text-[var(--b)] border-[var(--h)] hover:border-[var(--m)] hover:bg-[var(--bg)]"
                }`}
              >
                <span className="text-[10px] font-medium uppercase opacity-75">
                  {item.dayOfWeek}
                </span>
                <span className="text-sm font-semibold">{item.dayOfMonth}</span>

                {/* Completion Indicator Dot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    item.isSelected
                      ? "bg-[var(--pt)]"
                      : isFull
                        ? "bg-[#10b981]"
                        : hasActivity
                          ? "bg-[var(--accent)]"
                          : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          title="Next day"
          className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
