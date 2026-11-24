// Habit Check-in Reflection and Mood Modal
"use client";

import { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Smile,
  Frown,
  Meh,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type { Habit, MoodType } from "@/components/habits/types";
import { useHabits } from "@/hook/habits";
import { useHabitStore } from "@/store/habitStore";
import { formatFullDate } from "@/lib/habitUtils";

interface HabitCheckinNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
}

export function HabitCheckinNoteModal({
  isOpen,
  onClose,
  habit,
}: HabitCheckinNoteModalProps) {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const { checkIns, addCheckInNote } = useHabits();

  const [note, setNote] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [mood, setMood] = useState<MoodType | undefined>("great");

  useEffect(() => {
    if (habit) {
      const rec = checkIns[`${habit.id}_${selectedDate}`];
      setNote(rec?.note || "");
      setSkipReason(rec?.skipReason || "");
      setMood(rec?.mood || "great");
    }
  }, [habit, selectedDate, checkIns, isOpen]);

  if (!isOpen || !habit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCheckInNote(
      habit.id,
      selectedDate,
      note.trim(),
      mood,
      skipReason.trim() || undefined,
    );
    onClose();
  };

  const moods: Array<{
    type: MoodType;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      type: "great",
      label: "Energized",
      icon: <Sparkles size={16} className="text-[#10b981]" />,
      color: "#10b981",
    },
    {
      type: "good",
      label: "Focused",
      icon: <Smile size={16} className="text-[#3b82f6]" />,
      color: "#3b82f6",
    },
    {
      type: "neutral",
      label: "Neutral",
      icon: <Meh size={16} className="text-[var(--m)]" />,
      color: "#a1a1aa",
    },
    {
      type: "low",
      label: "Fatigued",
      icon: <Frown size={16} className="text-[#f59e0b]" />,
      color: "#f59e0b",
    },
    {
      type: "stressed",
      label: "Stressed",
      icon: <AlertCircle size={16} className="text-[#ef4444]" />,
      color: "#ef4444",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--h)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--i)] tracking-tight">
              Reflection & Mood Log
            </h3>
            <p className="text-xs text-[var(--m)]">
              {habit.name} · {formatFullDate(selectedDate)}
            </p>
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
          {/* Mood Selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1.5">
              How did you feel during/after this habit?
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {moods.map((m) => {
                const isSelected = mood === m.type;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMood(m.type)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)] shadow-xs"
                        : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--b)] hover:border-[var(--m)]"
                    }`}
                  >
                    <div className="mb-1">{m.icon}</div>
                    <span className="text-[10px] font-medium leading-tight">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Check-in Note */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1">
              Check-in Note / Reflection
            </label>
            <textarea
              rows={3}
              placeholder="What went well? Insights, PRs, energy levels, or thoughts..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:ring-2 focus:ring-[var(--p)] resize-none"
            />
          </div>

          {/* Why did I skip? */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1">
              Why did I skip? (If skipped or delayed)
            </label>
            <input
              type="text"
              placeholder="e.g. Travel, illness, fatigue, unplanned meeting..."
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs font-medium px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bt p text-xs font-semibold px-4 py-2"
            >
              Save Reflection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
