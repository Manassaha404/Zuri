// Streak Freeze / Grace Days Modal
"use client";

import { X, Shield, Sparkles, Check } from "lucide-react";
import type { Habit } from "@/components/habits/types";
import { useHabits } from "@/hook/habits";
import { useHabitStore } from "@/store/habitStore";
import { formatFullDate, calculateHabitStats } from "@/lib/habitUtils";

interface HabitFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
}

export function HabitFreezeModal({
  isOpen,
  onClose,
  habit,
}: HabitFreezeModalProps) {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const { checkIns, streakFreezes, applyStreakFreeze } = useHabits();

  if (!isOpen || !habit) return null;

  const stats = calculateHabitStats(
    habit,
    checkIns,
    streakFreezes,
    selectedDate,
  );

  const key = `${habit.id}_${selectedDate}`;
  const record = checkIns[key];
  const isAlreadyFrozen = Boolean(record?.isFreezeUsed);

  const handleApply = () => {
    applyStreakFreeze(habit.id, selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--h)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#38bdf8]/15 text-[#0284c7]">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--i)] tracking-tight">
                Streak Freeze Protection
              </h3>
              <p className="text-xs text-[var(--m)]">{habit.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 mt-4">
          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--i)]">
                Grace Shields Available
              </span>
              <span className="text-xs font-bold text-[#0284c7]">
                {stats.freezesAvailable} of {habit.graceDaysPerMonth || 2}{" "}
                remaining
              </span>
            </div>

            <p className="text-xs text-[var(--m)] leading-relaxed">
              Streak freezes protect your ongoing consistency when life gets in
              the way. Applying a freeze on a missed day preserves your{" "}
              <strong>{stats.currentStreak} day streak</strong> without counting
              as a broken habit.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--s)]">
            <span className="text-xs text-[var(--m)]">Target Date:</span>
            <span className="text-xs font-semibold text-[var(--i)]">
              {formatFullDate(selectedDate)}
            </span>
          </div>

          {isAlreadyFrozen ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#38bdf8]/10 text-[#0284c7] text-xs font-medium">
              <Check size={14} />
              <span>A streak freeze is already active on this date.</span>
            </div>
          ) : stats.freezesAvailable <= 0 ? (
            <div className="p-3 rounded-xl bg-[var(--surface-card)] text-[var(--error)] text-xs font-medium">
              You have used all available grace shields for this month.
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs font-medium px-4 py-2"
            >
              Close
            </button>
            {!isAlreadyFrozen && stats.freezesAvailable > 0 && (
              <button
                type="button"
                onClick={handleApply}
                className="bt p text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
              >
                <Shield size={14} />
                <span>Apply Streak Freeze</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
