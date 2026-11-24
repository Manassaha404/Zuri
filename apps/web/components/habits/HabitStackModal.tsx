// Create and Edit Habit Stack / Routine Modal
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Link2,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";
import type { Habit } from "@/components/habits/types";
import { HabitIcon } from "./HabitIcon";
import { useHabits } from "@/hook/habits";

interface HabitStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoutineTitle?: string | null;
}

export function HabitStackModal({
  isOpen,
  onClose,
  initialRoutineTitle,
}: HabitStackModalProps) {
  const { habits, createHabitStack, reorderRoutineStack } = useHabits();

  const [title, setTitle] = useState("");
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialRoutineTitle) {
      setTitle(initialRoutineTitle);
      const stackHabits = habits.filter(
        (h) => h.stackRoutineTitle === initialRoutineTitle,
      );
      // Order by predecessor
      const ordered: string[] = [];
      const root = stackHabits.find((h) => !h.stackedAfterHabitId);
      if (root) {
        let curr: Habit | undefined = root;
        while (curr) {
          ordered.push(curr.id);
          curr = stackHabits.find((h) => h.stackedAfterHabitId === curr?.id);
        }
      } else {
        ordered.push(...stackHabits.map((h) => h.id));
      }
      setSelectedHabitIds(ordered);
    } else {
      setTitle("");
      setSelectedHabitIds([]);
    }
  }, [initialRoutineTitle, isOpen, habits]);

  if (!isOpen) return null;

  const activeHabits = habits.filter((h) => h.status === "active");

  const handleAddHabit = (habitId: string) => {
    if (!selectedHabitIds.includes(habitId)) {
      setSelectedHabitIds([...selectedHabitIds, habitId]);
    }
  };

  const handleRemoveHabit = (habitId: string) => {
    setSelectedHabitIds(selectedHabitIds.filter((id) => id !== habitId));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const next = [...selectedHabitIds];
      const temp = next[index - 1]!;
      next[index - 1] = next[index]!;
      next[index] = temp;
      setSelectedHabitIds(next);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedHabitIds.length - 1) {
      const next = [...selectedHabitIds];
      const temp = next[index + 1]!;
      next[index + 1] = next[index]!;
      next[index] = temp;
      setSelectedHabitIds(next);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedHabitIds.length === 0) return;

    if (initialRoutineTitle) {
      reorderRoutineStack(title.trim(), selectedHabitIds);
    } else {
      createHabitStack(title.trim(), selectedHabitIds);
    }

    onClose();
  };

  const availableToAdd = activeHabits.filter(
    (h) => !selectedHabitIds.includes(h.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xl p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--h)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Link2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--i)] tracking-tight">
                {initialRoutineTitle
                  ? "Edit Habit Stack"
                  : "Create New Habit Stack"}
              </h3>
              <p className="text-xs text-[var(--m)]">
                Link habits into an automated sequential routine.
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {/* Stack / Routine Title */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1">
              Routine Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Morning Awakening Routine, Evening Wind-Down"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]"
            />
          </div>

          {/* Sequential Routine Steps List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--i)]">
                Routine Sequence ({selectedHabitIds.length} steps)
              </label>
              <span className="text-[11px] text-[var(--m)]">
                Drag or use arrows to adjust order
              </span>
            </div>

            {selectedHabitIds.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-[var(--h)] text-xs text-[var(--m)]">
                No habits added to this routine yet. Pick from available habits
                below.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto habits-scrollbar p-1">
                {selectedHabitIds.map((habitId, index) => {
                  const habit = habits.find((h) => h.id === habitId);
                  if (!habit) return null;

                  return (
                    <div
                      key={habitId}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--h)] bg-[var(--surface-card)] text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Step Number */}
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[var(--p)] text-[var(--pt)]">
                          {index + 1}
                        </div>

                        {/* Icon */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${habit.color}15`,
                            color: habit.color,
                          }}
                        >
                          <HabitIcon
                            name={habit.icon}
                            size={14}
                            color={habit.color}
                          />
                        </div>

                        {/* Habit Name */}
                        <span className="font-medium text-[var(--i)] truncate">
                          {habit.name}
                        </span>
                      </div>

                      {/* Move Up/Down and Remove Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="ib w-6 h-6 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)] disabled:opacity-30"
                          title="Move step up"
                        >
                          <ArrowUp size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedHabitIds.length - 1}
                          className="ib w-6 h-6 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)] disabled:opacity-30"
                          title="Move step down"
                        >
                          <ArrowDown size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveHabit(habitId)}
                          className="ib w-6 h-6 flex items-center justify-center text-[var(--error)] hover:bg-[var(--s)]"
                          title="Remove from routine"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Habits to Add */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1.5">
              Available Habits to Add
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto habits-scrollbar p-2 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]">
              {availableToAdd.length === 0 ? (
                <span className="text-[11px] text-[var(--m)] p-2">
                  All active habits are included in this routine stack.
                </span>
              ) : (
                availableToAdd.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleAddHabit(h.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] hover:border-[var(--p)] transition-all"
                  >
                    <HabitIcon name={h.icon} size={13} color={h.color} />
                    <span>{h.name}</span>
                    <Plus size={12} className="text-[var(--m)] ml-0.5" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs font-medium px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedHabitIds.length === 0 || !title.trim()}
              className="bt p text-xs font-semibold px-4 py-2 disabled:opacity-50"
            >
              {initialRoutineTitle ? "Save Changes" : "Create Routine Stack"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
