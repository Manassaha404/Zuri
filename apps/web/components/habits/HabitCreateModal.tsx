// Create and Edit Habit Dialog
"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Plus, Check } from "lucide-react";
import type {
  Habit,
  HabitType,
  HabitFrequencyType,
  HabitTimeOfDay,
} from "@/components/habits/types";
import {
  AVAILABLE_HABIT_ICONS,
  AVAILABLE_HABIT_COLORS,
  HabitIcon,
} from "./HabitIcon";
import { useHabitStore } from "@/store/habitStore";

interface HabitCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editHabit?: Habit | null;
}

export function HabitCreateModal({
  isOpen,
  onClose,
  editHabit,
}: HabitCreateModalProps) {
  const { createHabit, updateHabit, habits } = useHabitStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Brain");
  const [color, setColor] = useState("#3b82f6");
  const [type, setType] = useState<HabitType>("boolean");
  const [frequencyType, setFrequencyType] =
    useState<HabitFrequencyType>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [targetValue, setTargetValue] = useState(8);
  const [unit, setUnit] = useState("glasses");
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>("morning");
  const [reminderTime, setReminderTime] = useState("");
  const [stackedAfterHabitId, setStackedAfterHabitId] = useState("");
  const [stackRoutineTitle, setStackRoutineTitle] = useState("");

  useEffect(() => {
    if (editHabit) {
      setName(editHabit.name);
      setDescription(editHabit.description || "");
      setIcon(editHabit.icon);
      setColor(editHabit.color);
      setType(editHabit.type);
      setFrequencyType(editHabit.frequency.type);
      setDaysOfWeek(editHabit.frequency.daysOfWeek || [1, 2, 3, 4, 5]);
      setTimesPerWeek(editHabit.frequency.timesPerWeek || 3);
      setTargetValue(editHabit.targetValue || 8);
      setUnit(editHabit.unit || "units");
      setTimeOfDay(editHabit.timeOfDay);
      setReminderTime(editHabit.reminderTime || "");
      setStackedAfterHabitId(editHabit.stackedAfterHabitId || "");
      setStackRoutineTitle(editHabit.stackRoutineTitle || "");
    } else {
      setName("");
      setDescription("");
      setIcon("Brain");
      setColor("#3b82f6");
      setType("boolean");
      setFrequencyType("daily");
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setTimesPerWeek(3);
      setTargetValue(8);
      setUnit("glasses");
      setTimeOfDay("morning");
      setReminderTime("");
      setStackedAfterHabitId("");
      setStackRoutineTitle("");
    }
  }, [editHabit, isOpen]);

  if (!isOpen) return null;

  const weekdayNames = [
    { label: "S", value: 0 },
    { label: "M", value: 1 },
    { label: "T", value: 2 },
    { label: "W", value: 3 },
    { label: "T", value: 4 },
    { label: "F", value: 5 },
    { label: "S", value: 6 },
  ];

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      type,
      frequency: {
        type: frequencyType,
        daysOfWeek: frequencyType === "specific_days" ? daysOfWeek : undefined,
        timesPerWeek:
          frequencyType === "times_per_week" ? timesPerWeek : undefined,
      },
      targetValue: type === "numeric" ? Number(targetValue) : undefined,
      unit: type === "numeric" ? unit.trim() || "units" : undefined,
      timeOfDay,
      reminderTime: reminderTime.trim() || undefined,
      status: editHabit ? editHabit.status : ("active" as const),
      stackedAfterHabitId: stackedAfterHabitId || undefined,
      stackRoutineTitle: stackRoutineTitle.trim() || undefined,
      graceDaysPerMonth: 2,
    };

    if (editHabit) {
      updateHabit(editHabit.id, habitPayload);
    } else {
      createHabit(habitPayload);
    }

    onClose();
  };

  const otherHabits = habits.filter(
    (h) => h.status === "active" && (!editHabit || h.id !== editHabit.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xl p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--h)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--i)] tracking-tight">
              {editHabit ? "Edit Habit" : "Create New Habit"}
            </h3>
            <p className="text-xs text-[var(--m)]">
              Configure frequency, targets, time of day, and stacking.
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
          {/* Name & Description */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Morning Meditation, Read 25 Pages, No Sugar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="Why does this habit matter to you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]"
            />
          </div>

          {/* Habit Type (Standard, Numeric, Negative) */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1.5">
              Habit Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("boolean")}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  type === "boolean"
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                Standard (Yes/No)
              </button>
              <button
                type="button"
                onClick={() => setType("numeric")}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  type === "numeric"
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                Numeric Target
              </button>
              <button
                type="button"
                onClick={() => setType("negative")}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  type === "negative"
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                Avoid / Clean
              </button>
            </div>
          </div>

          {/* Numeric Target Inputs */}
          {type === "numeric" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]">
              <div>
                <label className="text-[11px] font-semibold text-[var(--i)] block mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--i)] block mb-1">
                  Unit Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. glasses, km, pages"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)]"
                />
              </div>
            </div>
          )}

          {/* Icon and Color Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--i)] block mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto habit-icon-scrollbar p-2 pr-2.5 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]">
                {AVAILABLE_HABIT_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                      icon === iconName
                        ? "bg-[var(--p)] text-[var(--pt)] shadow-xs"
                        : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
                    }`}
                  >
                    <HabitIcon name={iconName} size={15} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--i)] block mb-1.5">
                Color Swatch
              </label>
              <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-[var(--h)] bg-[var(--surface-card)]">
                {AVAILABLE_HABIT_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                      color === hex
                        ? "scale-115 ring-2 ring-[var(--i)] ring-offset-1"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {color === hex && (
                      <Check size={12} className="text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Frequency Type */}
          <div>
            <label className="text-xs font-semibold text-[var(--i)] block mb-1.5">
              Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFrequencyType("daily")}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center ${
                  frequencyType === "daily"
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--m)]"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType("specific_days")}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center ${
                  frequencyType === "specific_days"
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--m)]"
                }`}
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType("times_per_week")}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center ${
                  frequencyType === "times_per_week"
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--m)]"
                }`}
              >
                X Times / Wk
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType("weekly")}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center ${
                  frequencyType === "weekly"
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--surface-card)] border-[var(--h)] text-[var(--m)]"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Specific Weekdays Selector */}
          {frequencyType === "specific_days" && (
            <div className="flex items-center gap-1.5 justify-between p-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]">
              {weekdayNames.map((d) => {
                const isSelected = daysOfWeek.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-[var(--p)] text-[var(--pt)]"
                        : "bg-[var(--s)] text-[var(--m)] border border-[var(--h)]"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Times Per Week Stepper */}
          {frequencyType === "times_per_week" && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]">
              <span className="text-xs text-[var(--m)]">Target frequency:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs text-center rounded-lg bg-[var(--bg)] border border-[var(--h)]"
                />
                <span className="text-xs text-[var(--i)] font-medium">
                  times per week
                </span>
              </div>
            </div>
          )}

          {/* Time of Day & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--i)] block mb-1">
                Time of Day
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as HabitTimeOfDay)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)]"
              >
                <option value="morning">Morning Routine</option>
                <option value="afternoon">Afternoon Focus</option>
                <option value="evening">Evening Wind-Down</option>
                <option value="anytime">Anytime & Flexible</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--i)] block mb-1">
                Reminder Time (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 08:00 AM"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--h)] text-[var(--i)]"
              ></input>
            </div>
          </div>

          {/* Habit Stacking (Routine Chaining) */}
          <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]">
            <span className="text-xs font-semibold text-[var(--i)] block mb-1">
              Habit Stacking (Link into a Routine)
            </span>
            <p className="text-[11px] text-[var(--m)] mb-2">
              Automatically trigger this habit right after finishing another
              habit.
            </p>

            <select
              value={stackedAfterHabitId}
              onChange={(e) => setStackedAfterHabitId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] mb-2"
            >
              <option value="">No predecessor (Standalone Habit)</option>
              {otherHabits.map((h) => (
                <option key={h.id} value={h.id}>
                  Stack after: {h.name}
                </option>
              ))}
            </select>

            {stackedAfterHabitId && (
              <input
                type="text"
                placeholder="Routine Name (e.g. Morning Awakening Routine)"
                value={stackRoutineTitle}
                onChange={(e) => setStackRoutineTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)]"
              />
            )}
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
              {editHabit ? "Save Changes" : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
