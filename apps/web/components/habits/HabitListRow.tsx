// Single Habit Compact List Row Component
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
  Pause,
  Play,
  Archive,
  Trash2,
  Edit2,
  Link2,
} from "lucide-react";
import type { Habit } from "@/components/habits/types";
import { HabitIcon } from "./HabitIcon";
import { useHabitStore } from "@/store/habitStore";
import { calculateHabitStats } from "@/lib/habitUtils";

interface HabitListRowProps {
  habit: Habit;
  onOpenNoteModal: (habit: Habit) => void;
  onOpenEditModal: (habit: Habit) => void;
  onOpenFreezeModal: (habit: Habit) => void;
}

export function HabitListRow({
  habit,
  onOpenNoteModal,
  onOpenEditModal,
  onOpenFreezeModal,
}: HabitListRowProps) {
  const {
    selectedDate,
    checkIns,
    streakFreezes,
    toggleCheckIn,
    setNumericValue,
    resetCleanStreak,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
    habits,
  } = useHabitStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRelapse, setConfirmRelapse] = useState(false);

  const checkInKey = `${habit.id}_${selectedDate}`;
  const record = checkIns[checkInKey];
  const isCompleted = Boolean(record?.completed);
  const numericValue = record?.value ?? 0;
  const targetValue = habit.targetValue ?? 1;

  const stats = calculateHabitStats(
    habit,
    checkIns,
    streakFreezes,
    selectedDate,
  );

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
      className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
        isCompleted
          ? "bg-[var(--surface-card)] border-[var(--h)] shadow-2xs"
          : "bg-[var(--bg)] border-[var(--h)] hover:border-[var(--m)]"
      }`}
    >
      {/* Left Column: Icon & Identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${habit.color}15`,
            color: habit.color,
            border: `1px solid ${habit.color}30`,
          }}
        >
          <HabitIcon name={habit.icon} size={18} color={habit.color} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--i)] truncate">
              {habit.name}
            </h3>
            {habit.status === "paused" && (
              <span className="badge-pill text-[10px] text-[var(--m)] border-[var(--h)] bg-[var(--s)] py-0.5">
                Paused
              </span>
            )}
            {habit.status === "archived" && (
              <span className="badge-pill text-[10px] text-[var(--m)] border-[var(--h)] bg-[var(--s)] py-0.5">
                Archived
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--m)] mt-0.5 flex-wrap">
            {predecessor ? (
              <span className="flex items-center gap-1 text-[var(--accent)]">
                <Link2 size={11} />
                <span>Triggers after: {predecessor.name}</span>
              </span>
            ) : habit.description ? (
              <span className="truncate max-w-xs">{habit.description}</span>
            ) : (
              <span className="capitalize">{habit.timeOfDay}</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Column: Interactive Control */}
      <div className="flex items-center justify-between md:justify-center gap-3 py-1 md:py-0 border-t md:border-t-0 border-[var(--h)]/60">
        {habit.type === "numeric" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={numericValue <= 0}
              className="ib w-7 h-7 flex items-center justify-center text-[var(--i)] disabled:opacity-40"
              title="Decrement"
            >
              <Minus size={13} />
            </button>

            <div className="flex flex-col items-center min-w-[70px]">
              <span className="text-xs font-semibold text-[var(--i)]">
                {numericValue} / {targetValue}
              </span>
              <span className="text-[10px] text-[var(--m)]">
                {habit.unit || "units"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleIncrement}
              className={`ib w-7 h-7 flex items-center justify-center text-white ${
                isCompleted ? "bg-[#10b981] border-[#10b981]" : "bg-[var(--p)]"
              }`}
              title="Increment"
            >
              <Plus size={13} />
            </button>
          </div>
        )}

        {habit.type === "negative" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--i)]">
              {stats.daysClean} Days Clean
            </span>

            {confirmRelapse ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLogRelapse}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--error)] text-white"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRelapse(false)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium border border-[var(--h)] text-[var(--m)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRelapse(true)}
                className="px-2 py-0.5 rounded text-[10px] font-medium border border-[var(--h)] hover:border-[var(--error)] text-[var(--m)] hover:text-[var(--error)]"
              >
                Log Slip
              </button>
            )}
          </div>
        )}

        {habit.type === "boolean" && (
          <span className="text-xs text-[var(--m)] hidden md:inline">
            {isCompleted ? "Done today" : "Pending"}
          </span>
        )}
      </div>

      {/* Right Column: Stats, Notes, Menu & Primary Check-in */}
      <div className="flex items-center justify-between md:justify-end gap-3 pt-1 md:pt-0 border-t md:border-t-0 border-[var(--h)]/60">
        {/* Streak & Rate Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 font-semibold text-[var(--i)]">
            <Flame
              size={13}
              className={
                stats.currentStreak > 0 ? "text-[#f97316]" : "text-[var(--m)]"
              }
            />
            <span>{stats.currentStreak}d</span>
          </div>

          <span className="px-1.5 py-0.5 rounded-md bg-[var(--s)] text-[var(--b)] font-medium text-[11px]">
            {stats.completionRate}%
          </span>
        </div>

        {/* Note / Freeze Status */}
        <div className="flex items-center gap-1">
          {record?.isFreezeUsed && (
            <span
              className="text-[#38bdf8] p-1 rounded-md bg-[#38bdf8]/10"
              title="Protected with streak freeze"
            >
              <Shield size={13} />
            </span>
          )}

          {record?.note && (
            <button
              type="button"
              onClick={() => onOpenNoteModal(habit)}
              className="text-[var(--accent)] p-1 rounded-md hover:bg-[var(--s)]"
              title={record.note}
            >
              <MessageSquare size={13} />
            </button>
          )}

          {record?.mood && (
            <span
              className="text-[var(--m)] p-1"
              title={`Mood: ${record.mood}`}
            >
              <Smile size={13} />
            </span>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="ib w-7 h-7 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
            title="Habit actions"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-[var(--bg)] border border-[var(--h)] shadow-lg py-1 flex flex-col text-xs">
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
                    className="flex items-center gap-2.5 px-3 py-2 text-[var(--m)] hover:bg-[var(--s)] text-left"
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

        {/* Primary Check-in Button (for boolean or quick complete) */}
        {habit.type === "boolean" && (
          <button
            type="button"
            onClick={handleToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isCompleted
                ? "bg-[#10b981] text-white shadow-xs scale-105"
                : "border-2 border-[var(--h)] hover:border-[var(--m)] bg-[var(--s)] text-transparent hover:text-[var(--m)]"
            }`}
            title={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
