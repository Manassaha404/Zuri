// Habit Tracker Zustand Store
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Habit,
  CheckInRecord,
  StreakFreeze,
  MoodType,
  HabitTimeOfDay,
} from "@/components/habits/types";
import { getTodayKey } from "@/lib/habitUtils";

export type HabitFilter =
  | "all"
  | "morning"
  | "afternoon"
  | "evening"
  | "negative"
  | "paused"
  | "archived";

export type HabitWorkspaceTab = "tracker" | "routines" | "heatmap" | "reports";

export type HabitViewMode = "grid" | "list";

export interface HabitState {
  habits: Habit[];
  checkIns: Record<string, CheckInRecord>;
  streakFreezes: StreakFreeze[];
  selectedDate: string; // YYYY-MM-DD
  activeFilter: HabitFilter;
  activeTab: HabitWorkspaceTab;
  viewMode: HabitViewMode;

  // Actions
  setSelectedDate: (date: string) => void;
  setActiveFilter: (filter: HabitFilter) => void;
  setActiveTab: (tab: HabitWorkspaceTab) => void;
  setViewMode: (mode: HabitViewMode) => void;

  toggleCheckIn: (
    habitId: string,
    date?: string,
    note?: string,
    mood?: MoodType,
  ) => void;
  setNumericValue: (
    habitId: string,
    value: number,
    date?: string,
    note?: string,
    mood?: MoodType,
  ) => void;
  resetCleanStreak: (
    habitId: string,
    date?: string,
    slipReason?: string,
  ) => void;

  createHabit: (habitData: Omit<Habit, "id" | "createdAt">) => Habit;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  archiveHabit: (habitId: string) => void;
  pauseHabit: (habitId: string) => void;
  resumeHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;

  createHabitStack: (title: string, habitIds: string[]) => void;
  reorderRoutineStack: (routineTitle: string, habitIds: string[]) => void;
  deleteHabitStack: (routineTitle: string) => void;

  applyStreakFreeze: (habitId: string, date: string) => void;
  addCheckInNote: (
    habitId: string,
    date: string,
    note: string,
    mood?: MoodType,
    skipReason?: string,
  ) => void;

  clearAllHabits: () => void;
}

// Clear legacy mock data cache from browser localStorage
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("zuri-habits-storage");
  } catch {
    // Ignore storage errors in non-browser environments
  }
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      checkIns: {},
      streakFreezes: [],
      selectedDate: getTodayKey(),
      activeFilter: "all",
      activeTab: "tracker",
      viewMode: "grid",

      setSelectedDate: (date: string) => set({ selectedDate: date }),
      setActiveFilter: (filter: HabitFilter) => set({ activeFilter: filter }),
      setActiveTab: (tab: HabitWorkspaceTab) => set({ activeTab: tab }),
      setViewMode: (mode: HabitViewMode) => set({ viewMode: mode }),

      toggleCheckIn: (habitId, customDate, note, mood) => {
        const date = customDate || get().selectedDate;
        const key = `${habitId}_${date}`;
        const existing = get().checkIns[key];
        const habit = get().habits.find((h) => h.id === habitId);

        const newCompleted = !existing?.completed;
        const newRecord: CheckInRecord = {
          id: existing?.id || `chk-${habitId}-${date}-${Date.now()}`,
          habitId,
          date,
          completed: newCompleted,
          value:
            habit?.type === "numeric"
              ? newCompleted
                ? habit.targetValue || 1
                : 0
              : undefined,
          targetValue: habit?.targetValue,
          note: note !== undefined ? note : existing?.note,
          mood: mood !== undefined ? mood : existing?.mood,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          checkIns: {
            ...state.checkIns,
            [key]: newRecord,
          },
        }));
      },

      setNumericValue: (habitId, value, customDate, note, mood) => {
        const date = customDate || get().selectedDate;
        const key = `${habitId}_${date}`;
        const existing = get().checkIns[key];
        const habit = get().habits.find((h) => h.id === habitId);
        const target = habit?.targetValue || 1;
        const safeValue = Math.max(0, value);
        const completed = safeValue >= target;

        const newRecord: CheckInRecord = {
          id: existing?.id || `chk-${habitId}-${date}-${Date.now()}`,
          habitId,
          date,
          completed,
          value: safeValue,
          targetValue: target,
          note: note !== undefined ? note : existing?.note,
          mood: mood !== undefined ? mood : existing?.mood,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          checkIns: {
            ...state.checkIns,
            [key]: newRecord,
          },
        }));
      },

      resetCleanStreak: (habitId, customDate, slipReason) => {
        const date = customDate || get().selectedDate;
        const key = `${habitId}_${date}`;
        const existing = get().checkIns[key];

        // Mark slip on this date and reset cleanStartedAt to now
        const newRecord: CheckInRecord = {
          id: existing?.id || `chk-${habitId}-${date}-${Date.now()}`,
          habitId,
          date,
          completed: false,
          skipReason:
            slipReason || "Relapse recorded — resetting clean counter",
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? { ...h, cleanStartedAt: new Date().toISOString() }
              : h,
          ),
          checkIns: {
            ...state.checkIns,
            [key]: newRecord,
          },
        }));
      },

      createHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
          cleanStartedAt:
            habitData.type === "negative"
              ? new Date().toISOString()
              : undefined,
          status: habitData.status || "active",
        };

        set((state) => ({
          habits: [newHabit, ...state.habits],
        }));

        return newHabit;
      },

      updateHabit: (habitId, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, ...updates } : h,
          ),
        }));
      },

      archiveHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, status: "archived" } : h,
          ),
        }));
      },

      pauseHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, status: "paused" } : h,
          ),
        }));
      },

      resumeHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, status: "active" } : h,
          ),
        }));
      },

      deleteHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
        }));
      },

      createHabitStack: (title, habitIds) => {
        set((state) => {
          const habitMap = new Map<string, number>();
          habitIds.forEach((id, idx) => habitMap.set(id, idx));

          return {
            habits: state.habits.map((h) => {
              if (habitMap.has(h.id)) {
                const idx = habitMap.get(h.id)!;
                return {
                  ...h,
                  stackRoutineTitle: title,
                  stackedAfterHabitId:
                    idx === 0 ? undefined : habitIds[idx - 1],
                };
              }
              return h;
            }),
          };
        });
      },

      reorderRoutineStack: (routineTitle, habitIds) => {
        set((state) => {
          const habitMap = new Map<string, number>();
          habitIds.forEach((id, idx) => habitMap.set(id, idx));

          return {
            habits: state.habits.map((h) => {
              if (habitMap.has(h.id)) {
                const idx = habitMap.get(h.id)!;
                return {
                  ...h,
                  stackRoutineTitle: routineTitle,
                  stackedAfterHabitId:
                    idx === 0 ? undefined : habitIds[idx - 1],
                };
              }
              return h;
            }),
          };
        });
      },

      deleteHabitStack: (routineTitle) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.stackRoutineTitle === routineTitle
              ? {
                  ...h,
                  stackRoutineTitle: undefined,
                  stackedAfterHabitId: undefined,
                }
              : h,
          ),
        }));
      },

      applyStreakFreeze: (habitId, date) => {
        const freezeId = `freeze-${habitId}-${date}-${Date.now()}`;
        const key = `${habitId}_${date}`;
        const existing = get().checkIns[key];

        const newRecord: CheckInRecord = {
          id: existing?.id || `chk-${habitId}-${date}-${Date.now()}`,
          habitId,
          date,
          completed: false,
          isFreezeUsed: true,
          note: "Streak freeze applied",
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          streakFreezes: [
            ...state.streakFreezes,
            { id: freezeId, habitId, date, usedAt: new Date().toISOString() },
          ],
          checkIns: {
            ...state.checkIns,
            [key]: newRecord,
          },
        }));
      },

      addCheckInNote: (habitId, date, note, mood, skipReason) => {
        const key = `${habitId}_${date}`;
        const existing = get().checkIns[key];

        const newRecord: CheckInRecord = {
          id: existing?.id || `chk-${habitId}-${date}-${Date.now()}`,
          habitId,
          date,
          completed: existing?.completed ?? false,
          value: existing?.value,
          targetValue: existing?.targetValue,
          note,
          mood: mood !== undefined ? mood : existing?.mood,
          skipReason:
            skipReason !== undefined ? skipReason : existing?.skipReason,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          checkIns: {
            ...state.checkIns,
            [key]: newRecord,
          },
        }));
      },

      clearAllHabits: () => {
        set({
          habits: [],
          checkIns: {},
          streakFreezes: [],
        });
      },
    }),
    {
      name: "zuri-habits-storage-v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
