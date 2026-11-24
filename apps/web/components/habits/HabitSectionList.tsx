// Habit Grouped Section List (Grid & List View Supported)
"use client";

import { useMemo, useState } from "react";
import {
  Sun,
  Zap,
  Moon,
  Clock,
  Shield,
  Plus,
  CheckCheck,
  PauseCircle,
  Archive,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { Habit, HabitTimeOfDay } from "@/components/habits/types";
import { HabitCard } from "./HabitCard";
import { HabitListRow } from "./HabitListRow";
import { useHabitStore } from "@/store/habitStore";

interface HabitSectionListProps {
  onOpenNoteModal: (habit: Habit) => void;
  onOpenEditModal: (habit: Habit) => void;
  onOpenFreezeModal: (habit: Habit) => void;
  onOpenCreateModal: () => void;
}

interface SectionDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  habits: Habit[];
  timeOfDay?: HabitTimeOfDay;
}

export function HabitSectionList({
  onOpenNoteModal,
  onOpenEditModal,
  onOpenFreezeModal,
  onOpenCreateModal,
}: HabitSectionListProps) {
  const { habits, selectedDate, checkIns, toggleCheckIn, viewMode } =
    useHabitStore();

  const [showInactive, setShowInactive] = useState(false);

  // Group active habits into clean routine sections
  const sections: SectionDefinition[] = useMemo(() => {
    const active = habits.filter((h) => h.status === "active");

    const morning = active.filter(
      (h) => h.timeOfDay === "morning" && h.type !== "negative",
    );
    const afternoon = active.filter(
      (h) => h.timeOfDay === "afternoon" && h.type !== "negative",
    );
    const evening = active.filter(
      (h) => h.timeOfDay === "evening" && h.type !== "negative",
    );
    const anytime = active.filter(
      (h) => h.timeOfDay === "anytime" && h.type !== "negative",
    );
    const negative = active.filter((h) => h.type === "negative");

    const result: SectionDefinition[] = [];

    if (morning.length > 0) {
      result.push({
        id: "morning",
        title: "Morning Routine",
        description: "Kickstart your day with intention and clarity",
        icon: Sun,
        habits: morning,
        timeOfDay: "morning",
      });
    }

    if (afternoon.length > 0) {
      result.push({
        id: "afternoon",
        title: "Afternoon Focus",
        description: "Midday momentum, physical training, and productivity",
        icon: Zap,
        habits: afternoon,
        timeOfDay: "afternoon",
      });
    }

    if (evening.length > 0) {
      result.push({
        id: "evening",
        title: "Evening Wind-Down",
        description: "Reflect, decompress, and prepare for quality rest",
        icon: Moon,
        habits: evening,
        timeOfDay: "evening",
      });
    }

    if (anytime.length > 0) {
      result.push({
        id: "anytime",
        title: "Daily & Flexible",
        description: "Habits to accomplish anytime throughout the day",
        icon: Clock,
        habits: anytime,
        timeOfDay: "anytime",
      });
    }

    if (negative.length > 0) {
      result.push({
        id: "negative",
        title: "Avoid & Abstain (Clean Streaks)",
        description: "Habits you avoid with an active clean day counter",
        icon: Shield,
        habits: negative,
      });
    }

    return result;
  }, [habits]);

  // Inactive (paused/archived) habits
  const inactiveHabits = useMemo(() => {
    return habits.filter(
      (h) => h.status === "paused" || h.status === "archived",
    );
  }, [habits]);

  const handleCompleteAllSection = (sectionHabits: Habit[]) => {
    for (const h of sectionHabits) {
      const rec = checkIns[`${h.id}_${selectedDate}`];
      if (!rec?.completed) {
        toggleCheckIn(h.id, selectedDate);
      }
    }
  };

  const totalVisibleHabits = sections.reduce(
    (acc, s) => acc + s.habits.length,
    0,
  );

  if (totalVisibleHabits === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
        <div className="p-4 rounded-2xl bg-[var(--s)] text-[var(--m)] mb-3">
          <Clock size={28} />
        </div>
        <h3 className="text-base font-semibold text-[var(--i)]">
          No habits created yet
        </h3>
        <p className="text-xs text-[var(--m)] max-w-sm mt-1 mb-4">
          Create your first habit to start building positive daily routines and
          tracking momentum.
        </p>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bt p flex items-center gap-2 text-xs font-medium"
        >
          <Plus size={14} />
          <span>Create Habit</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => {
        const IconComponent = section.icon;

        // Count completed in this section for selectedDate
        const completedCount = section.habits.filter((h) => {
          if (h.type === "negative") return true;
          return checkIns[`${h.id}_${selectedDate}`]?.completed;
        }).length;
        const totalCount = section.habits.length;
        const isAllDone = totalCount > 0 && completedCount >= totalCount;

        return (
          <div key={section.id} className="flex flex-col gap-3">
            {/* Section Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[var(--surface-card)] text-[var(--i)] border border-[var(--h)]">
                  <IconComponent size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[var(--i)]">
                      {section.title}
                    </h2>
                    <span className="badge-pill text-[11px] bg-[var(--s)] text-[var(--b)] border-[var(--h)] font-medium">
                      {completedCount} / {totalCount} done
                    </span>
                  </div>
                  <p className="text-xs text-[var(--m)]">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Quick Action: Complete All (for positive routine sections) */}
              {section.id !== "negative" && !isAllDone && (
                <button
                  type="button"
                  onClick={() => handleCompleteAllSection(section.habits)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--surface-card)] transition-colors border border-transparent hover:border-[var(--h)]"
                >
                  <CheckCheck size={13} />
                  <span className="hidden sm:inline">Complete All</span>
                </button>
              )}
            </div>

            {/* Habit Items: Grid View or List View */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {section.habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onOpenNoteModal={onOpenNoteModal}
                    onOpenEditModal={onOpenEditModal}
                    onOpenFreezeModal={onOpenFreezeModal}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {section.habits.map((habit) => (
                  <HabitListRow
                    key={habit.id}
                    habit={habit}
                    onOpenNoteModal={onOpenNoteModal}
                    onOpenEditModal={onOpenEditModal}
                    onOpenFreezeModal={onOpenFreezeModal}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Collapsible Paused / Archived Habits Section */}
      {inactiveHabits.length > 0 && (
        <div className="pt-4 border-t border-[var(--h)]">
          <button
            type="button"
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-xs font-medium text-[var(--m)] hover:text-[var(--i)] transition-colors"
          >
            {showInactive ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            <span>Paused & Archived Habits ({inactiveHabits.length})</span>
          </button>

          {showInactive && (
            <div className="mt-3">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {inactiveHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onOpenNoteModal={onOpenNoteModal}
                      onOpenEditModal={onOpenEditModal}
                      onOpenFreezeModal={onOpenFreezeModal}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {inactiveHabits.map((habit) => (
                    <HabitListRow
                      key={habit.id}
                      habit={habit}
                      onOpenNoteModal={onOpenNoteModal}
                      onOpenEditModal={onOpenEditModal}
                      onOpenFreezeModal={onOpenFreezeModal}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
