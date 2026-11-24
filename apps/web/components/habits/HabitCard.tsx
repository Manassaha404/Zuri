// Single Habit Card Component
"use client";

import { useState } from "react";
import {
  Check,
  Flame,
  Minus,
  Plus,
  MoreVertical,
  Shield,
  MessageSquare,
  Smile,
  AlertCircle,
  Pause,
  Play,
  Archive,
  Trash2,
  Edit2,
  Link2,
} from "lucide-react";
import type { Habit } from "@/components/habits/types";
import { HabitIcon } from "./HabitIcon";
import { useHabits } from "@/hook/habits";
import { useHabitStore } from "@/store/habitStore";
import { calculateHabitStats } from "@/lib/habitUtils";

interface HabitCardProps {
  habit: Habit;
  onOpenNoteModal: (habit: Habit) => void;
  onOpenEditModal: (habit: Habit) => void;
  onOpenFreezeModal: (habit: Habit) => void;
}

export function HabitCard({
  habit,
  onOpenNoteModal,
  onOpenEditModal,
  onOpenFreezeModal,
}: HabitCardProps) {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const {
    habits,
    checkIns,
    streakFreezes,
    toggleCheckIn,
    setNumericValue,
    resetCleanStreak,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
  } = useHabits();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRelapse, setConfirmRelapse] = useState(false);

  const checkInKey = `${habit.id}_${selectedDate}`;
  const record = checkIns[checkInKey];
  const isCompleted = Boolean(record?.completed);
  const numericValue = record?.value ?? 0;
  const targetValue = habit.targetValue ?? 1;

  // Calculate live stats for this habit
  const stats = calculateHabitStats(
    habit,
    checkIns,
    streakFreezes,
    selectedDate,
  );

  // Predecessor habit if stacked
  const predecessor = habit.stackedAfterHabitId
    ? habits.find((h) => h.id === habit.stackedAfterHabitId)
    : null;

  const handleToggle = () => {
    toggleCheckIn(habit.id, selectedDate);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNumericValue(habit.id, numericValue + 1, selectedDate);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (numericValue > 0) {
      setNumericValue(habit.id, numericValue - 1, selectedDate);
    }
  };

  const handleLogRelapse = () => {
    resetCleanStreak(habit.id, selectedDate, "Logged slip");
    setConfirmRelapse(false);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
        isCompleted
          ? "bg-[var(--surface-card)] border-[var(--h)] shadow-2xs"
          : "bg-[var(--bg)] border-[var(--h)] hover:border-[var(--m)]"
      }`}
    >
      {/* Top Row: Icon, Name, Routine Info & Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Color Icon Chip */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${habit.color}15`,
              color: habit.color,
              border: `1px solid ${habit.color}30`,
            }}
          >
            <HabitIcon name={habit.icon} size={20} color={habit.color} />
          </div>

          {/* Title and Description */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[var(--i)] truncate">
                {habit.name}
              </h3>
              {habit.status === "paused" && (
                <span className="badge-pill text-[10px] text-[var(--m)] border-[var(--h)] bg-[var(--s)]">
                  Paused
                </span>
              )}
              {habit.status === "archived" && (
                <span className="badge-pill text-[10px] text-[var(--m)] border-[var(--h)] bg-[var(--s)]">
                  Archived
                </span>
              )}
            </div>

            {habit.description && (
              <p className="text-xs text-[var(--m)] line-clamp-1 mt-0.5">
                {habit.description}
              </p>
            )}

            {/* Habit Stacking Chain Indicator */}
            {predecessor && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--m)]">
                <Link2 size={12} className="text-[var(--accent)]" />
                <span>
                  Triggers after:{" "}
                  <strong className="text-[var(--i)] font-medium">
                    {predecessor.name}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Menu Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)] opacity-60 group-hover:opacity-100 transition-opacity"
            title="Habit actions"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-9 z-30 w-48 rounded-xl bg-[var(--bg)] border border-[var(--h)] shadow-lg py-1 flex flex-col text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenNoteModal(habit);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-[var(--i)] hover:bg-[var(--s)] text-left"
                >
                  <MessageSquare size={14} className="text-[var(--m)]" />
                  <span>Add Note & Mood</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenFreezeModal(habit);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-[var(--i)] hover:bg-[var(--s)] text-left"
                >
                  <Shield size={14} className="text-[var(--accent)]" />
                  <span>Streak Freeze ({stats.freezesAvailable} left)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenEditModal(habit);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-[var(--i)] hover:bg-[var(--s)] text-left"
                >
                  <Edit2 size={14} className="text-[var(--m)]" />
                  <span>Edit Habit</span>
                </button>

                {habit.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      pauseHabit(habit.id);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-[var(--i)] hover:bg-[var(--s)] text-left"
                  >
                    <Pause size={14} className="text-[var(--m)]" />
                    <span>Pause Habit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      resumeHabit(habit.id);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-[var(--i)] hover:bg-[var(--s)] text-left"
                  >
                    <Play size={14} className="text-[var(--accent)]" />
                    <span>Resume Habit</span>
                  </button>
                )}

                {habit.status !== "archived" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      archiveHabit(habit.id);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-[var(--i)] hover:bg-[var(--s)] text-left"
                  >
                    <Archive size={14} className="text-[var(--m)]" />
                    <span>Archive</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (confirm("Delete this habit permanently?")) {
                      deleteHabit(habit.id);
                    }
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-[var(--error)] hover:bg-[var(--s)] text-left"
                >
                  <Trash2 size={14} />
                  <span>Delete Habit</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle Row: Interactive Check-in Controls */}
      <div className="my-3 py-2 border-y border-[var(--h)]/60 flex items-center justify-between gap-3">
        {habit.type === "boolean" && (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[var(--m)]">
              {isCompleted ? "Completed for today" : "Tap circle to complete"}
            </span>

            <button
              type="button"
              onClick={handleToggle}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isCompleted
                  ? "bg-[#10b981] text-white shadow-xs scale-105"
                  : "border-2 border-[var(--h)] hover:border-[var(--m)] bg-[var(--s)] text-transparent hover:text-[var(--m)]"
              }`}
              title={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
              <Check size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {habit.type === "numeric" && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--i)]">
                {numericValue} / {targetValue}{" "}
                <span className="text-[var(--m)] font-normal">
                  {habit.unit || "units"}
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={numericValue <= 0}
                  className="ib w-7 h-7 flex items-center justify-center text-[var(--i)] disabled:opacity-40"
                  title="Decrement"
                >
                  <Minus size={14} />
                </button>

                <button
                  type="button"
                  onClick={handleIncrement}
                  className={`ib w-7 h-7 flex items-center justify-center text-white ${
                    isCompleted
                      ? "bg-[#10b981] border-[#10b981]"
                      : "bg-[var(--p)]"
                  }`}
                  title="Increment"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Numeric Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-[var(--s)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((numericValue / targetValue) * 100))}%`,
                  backgroundColor: isCompleted ? "#10b981" : habit.color,
                }}
              />
            </div>
          </div>
        )}

        {habit.type === "negative" && (
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-xs font-semibold text-[var(--i)] block">
                {stats.daysClean} Days Clean
              </span>
              <span className="text-[11px] text-[var(--m)]">
                Streak unbroken
              </span>
            </div>

            {confirmRelapse ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLogRelapse}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--error)] text-white hover:opacity-90"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRelapse(false)}
                  className="px-2 py-1 rounded-lg text-xs font-medium border border-[var(--h)] text-[var(--m)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRelapse(true)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[var(--h)] hover:border-[var(--error)] text-[var(--m)] hover:text-[var(--error)] transition-colors"
              >
                Log Slip / Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row: Stats & Badges */}
      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-[var(--m)]">
        <div className="flex items-center gap-3">
          {/* Streak Counter */}
          <div className="flex items-center gap-1 font-medium text-[var(--i)]">
            <Flame
              size={13}
              className={
                stats.currentStreak > 0 ? "text-[#f97316]" : "text-[var(--m)]"
              }
            />
            <span>{stats.currentStreak}d streak</span>
          </div>

          {/* Longest Streak */}
          <span className="hidden sm:inline">Best: {stats.longestStreak}d</span>

          {/* Completion Rate */}
          <span className="px-1.5 py-0.5 rounded-md bg-[var(--s)] text-[var(--b)] font-medium">
            {stats.completionRate}%
          </span>
        </div>

        {/* Note / Mood Indicator Pill */}
        <div className="flex items-center gap-1.5">
          {record?.isFreezeUsed && (
            <span
              className="flex items-center gap-1 text-[10px] text-[#38bdf8] font-medium bg-[#38bdf8]/10 px-2 py-0.5 rounded-full"
              title="Protected with streak freeze"
            >
              <Shield size={11} />
              <span>Frozen</span>
            </span>
          )}

          {record?.note && (
            <button
              type="button"
              onClick={() => onOpenNoteModal(habit)}
              className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline"
              title={record.note}
            >
              <MessageSquare size={11} />
              <span className="hidden md:inline truncate max-w-[90px]">
                {record.note}
              </span>
            </button>
          )}

          {record?.mood && (
            <span
              className="flex items-center gap-0.5 text-[10px] text-[var(--m)]"
              title={`Mood: ${record.mood}`}
            >
              <Smile size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
