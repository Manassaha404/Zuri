// GitHub-Style Calendar Heatmap Component
"use client";

import { useState, useMemo } from "react";
import {
  Flame,
  Calendar,
  Shield,
  MessageSquare,
  Smile,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useHabitStore } from "@/store/habitStore";
import { generateHeatmapGrid, formatFullDate } from "@/lib/habitUtils";
import type { HeatmapCell } from "./types";

export function HabitHeatmap() {
  const { habits, checkIns, streakFreezes, selectedDate, setSelectedDate } =
    useHabitStore();

  const [selectedHabitId, setSelectedHabitId] = useState<string>("all");
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const activeHabits = useMemo(
    () => habits.filter((h) => h.status === "active"),
    [habits],
  );

  const heatmap = useMemo(() => {
    return generateHeatmapGrid(
      habits,
      checkIns,
      streakFreezes,
      24, // 24 weeks of history
      selectedHabitId === "all" ? undefined : selectedHabitId,
    );
  }, [habits, checkIns, streakFreezes, selectedHabitId]);

  const targetHabit = useMemo(
    () => habits.find((h) => h.id === selectedHabitId),
    [habits, selectedHabitId],
  );

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Cell color based on intensity and dark/light mode
  const getCellBg = (cell: HeatmapCell) => {
    if (cell.count === 0 && !cell.hasFreeze) {
      return "bg-[var(--s)] border-[var(--h)]";
    }

    if (cell.hasFreeze) {
      return "bg-[#38bdf8] border-[#0284c7]";
    }

    switch (cell.intensity) {
      case 1:
        return "bg-[#10b981]/25 border-[#10b981]/40";
      case 2:
        return "bg-[#10b981]/50 border-[#10b981]/60";
      case 3:
        return "bg-[#10b981]/75 border-[#10b981]/80";
      case 4:
        return "bg-[#10b981] border-[#059669]";
      default:
        return "bg-[var(--s)] border-[var(--h)]";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
      {/* Top Controls: Filter Dropdown & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
              Habit Consistency Heatmap
            </h2>
          </div>
          <p className="text-xs text-[var(--m)] mt-0.5">
            Visualizing daily habit completions across the last 24 weeks.
          </p>
        </div>

        {/* Habit Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--m)]" />
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]"
          >
            <option value="all">All Habits (Combined Activity)</option>
            {activeHabits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="relative overflow-x-auto habits-scrollbar pb-2">
        <div className="inline-flex flex-col gap-1 min-w-[720px]">
          {/* Month Header Row */}
          <div className="flex text-[11px] text-[var(--m)] font-medium mb-1 pl-7 relative h-4">
            {heatmap.monthHeaders.map((header, idx) => (
              <span
                key={`${header.label}-${idx}`}
                className="absolute"
                style={{ left: `${header.colIndex * 15 + 28}px` }}
              >
                {header.label}
              </span>
            ))}
          </div>

          {/* Grid Rows: 7 Day Rows */}
          <div className="flex gap-1.5">
            {/* Weekday Row Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] text-[var(--m)] font-medium w-6 py-0.5">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1">
              {heatmap.weeks.map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="flex flex-col gap-1">
                  {week.days.map((cell) => {
                    const isSelected = cell.date === selectedDate;

                    return (
                      <div
                        key={cell.date}
                        onClick={() => setSelectedDate(cell.date)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-3.5 h-3.5 rounded-sm border cursor-pointer transition-transform hover:scale-130 hover:z-10 relative ${getCellBg(
                          cell,
                        )} ${
                          isSelected
                            ? "ring-2 ring-[var(--i)] ring-offset-1 z-10"
                            : ""
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Tooltip or Selected Date Inspector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)] text-xs">
        {hoveredCell ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-[var(--i)]">
              {formatFullDate(hoveredCell.date)}
            </span>
            <span className="text-[var(--m)]">
              <strong>{hoveredCell.count}</strong> of{" "}
              <strong>{hoveredCell.totalHabits}</strong> completed (
              {hoveredCell.completionRate}%)
            </span>
            {hoveredCell.hasFreeze && (
              <span className="badge-pill bg-[#38bdf8]/10 text-[#0284c7] border-[#38bdf8]/30">
                <Shield size={10} className="mr-1 inline" /> Streak Freeze
              </span>
            )}
            {hoveredCell.notesCount > 0 && (
              <span className="badge-pill bg-[var(--s)] text-[var(--m)]">
                <MessageSquare size={10} className="mr-1 inline" /> Reflection
                logged
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--m)]">
            <span>Hover over any square to inspect details</span>
            <span>·</span>
            <span>Click to select date for daily tracking</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--m)] self-end sm:self-auto">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-xs bg-[var(--s)] border border-[var(--h)]" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#10b981]/25 border border-[#10b981]/40" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#10b981]/50 border border-[#10b981]/60" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#10b981]/75 border border-[#10b981]/80" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#10b981] border border-[#059669]" />
          <span>More</span>
          <span className="ml-2">·</span>
          <div className="w-2.5 h-2.5 rounded-xs bg-[#38bdf8] border border-[#0284c7] ml-1" />
          <span>Freeze</span>
        </div>
      </div>

      {/* Heatmap Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
          <span className="text-[11px] text-[var(--m)] block">
            Total Check-Ins
          </span>
          <span className="text-lg font-bold text-[var(--i)] mt-0.5 block">
            {heatmap.totalCompletions}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
          <span className="text-[11px] text-[var(--m)] block">Active Days</span>
          <span className="text-lg font-bold text-[var(--i)] mt-0.5 block">
            {heatmap.totalDaysChecked}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
          <span className="text-[11px] text-[var(--m)] block">
            Completion Rate
          </span>
          <span className="text-lg font-bold text-[#10b981] mt-0.5 block">
            {heatmap.averageRate}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
          <span className="text-[11px] text-[var(--m)] block">
            Freezes Protected
          </span>
          <span className="text-lg font-bold text-[#38bdf8] mt-0.5 block">
            {streakFreezes.length}
          </span>
        </div>
      </div>
    </div>
  );
}
