// Zustand UI & active-session store for Fitness Tracker (zero mock data)
"use client";

import { create } from "zustand";
import type {
  FitnessWorkspaceTab,
  WeightUnit,
  WorkoutSession,
} from "@/components/fitness/types";

interface FitnessStoreState {
  activeTab: FitnessWorkspaceTab;
  unit: WeightUnit;
  isDeloadWeek: boolean;
  showRpeTempo: boolean;
  activeWorkout: WorkoutSession | null;

  // Rest timer state
  restTimerSeconds: number;
  restTimerTotal: number;
  restTimerRunning: boolean;

  // UI & timer actions
  setActiveTab: (tab: FitnessWorkspaceTab) => void;
  setUnit: (unit: WeightUnit) => void;
  toggleDeloadWeek: () => void;
  toggleShowRpeTempo: () => void;
  setActiveWorkout: (workout: WorkoutSession | null) => void;

  startRestTimer: (seconds: number) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  resetRestTimer: () => void;
  tickRestTimer: () => void;
}

export const useFitnessStore = create<FitnessStoreState>()((set) => ({
  activeTab: "workout",
  unit: "kg",
  isDeloadWeek: false,
  showRpeTempo: true,
  activeWorkout: null,

  restTimerSeconds: 0,
  restTimerTotal: 90,
  restTimerRunning: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setUnit: (unit) => set({ unit }),
  toggleDeloadWeek: () => set((s) => ({ isDeloadWeek: !s.isDeloadWeek })),
  toggleShowRpeTempo: () => set((s) => ({ showRpeTempo: !s.showRpeTempo })),
  setActiveWorkout: (activeWorkout) => set({ activeWorkout }),

  startRestTimer: (seconds) =>
    set({
      restTimerSeconds: seconds,
      restTimerTotal: seconds,
      restTimerRunning: true,
    }),
  pauseRestTimer: () => set({ restTimerRunning: false }),
  resumeRestTimer: () =>
    set((s) => (s.restTimerSeconds > 0 ? { restTimerRunning: true } : s)),
  resetRestTimer: () =>
    set((s) => ({
      restTimerSeconds: s.restTimerTotal,
      restTimerRunning: false,
    })),
  tickRestTimer: () =>
    set((s) => {
      if (!s.restTimerRunning) return s;
      if (s.restTimerSeconds <= 1) {
        return { restTimerSeconds: 0, restTimerRunning: false };
      }
      return { restTimerSeconds: s.restTimerSeconds - 1 };
    }),
}));
