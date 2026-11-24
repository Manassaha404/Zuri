// Hook managing habit tracking query, mutations, and synchronization with habitStore
"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useHabitStore } from "@/store/habitStore";
import type {
  Habit,
  CheckInRecord,
  StreakFreeze,
  HabitFrequencyType,
  HabitType,
  HabitTimeOfDay,
  MoodType,
} from "@/components/habits/types";

export function useHabits() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);

  const {
    habits: storeHabits,
    checkIns: storeCheckIns,
    streakFreezes: storeFreezes,
    toggleCheckIn: storeToggleCheckIn,
    setNumericValue: storeSetNumericValue,
    resetCleanStreak: storeResetCleanStreak,
    createHabit: storeCreateHabit,
    updateHabit: storeUpdateHabit,
    archiveHabit: storeArchiveHabit,
    pauseHabit: storePauseHabit,
    resumeHabit: storeResumeHabit,
    deleteHabit: storeDeleteHabit,
    applyStreakFreeze: storeApplyStreakFreeze,
    addCheckInNote: storeAddCheckInNote,
    createHabitStack: storeCreateHabitStack,
    reorderRoutineStack: storeReorderRoutineStack,
    deleteHabitStack: storeDeleteHabitStack,
  } = useHabitStore();

  const utils = trpc.useUtils();

  // Query habit workspace hierarchy and logs
  const workspaceQuery = trpc.habits.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  // Sync server data into Zustand store when logged in
  useEffect(() => {
    if (workspaceQuery.data && "habits" in workspaceQuery.data) {
      const serverHabits = (workspaceQuery.data.habits ||
        []) as unknown as Habit[];
      const serverCheckIns = (workspaceQuery.data.checkIns ||
        {}) as unknown as Record<string, CheckInRecord>;
      const serverFreezes = (workspaceQuery.data.streakFreezes ||
        []) as unknown as StreakFreeze[];

      // Sync server records to local store
      useHabitStore.setState({
        habits: serverHabits,
        checkIns: serverCheckIns,
        streakFreezes: serverFreezes,
      });
    }
  }, [workspaceQuery.data]);

  // Mutations
  const createMutation = trpc.habits.createHabit.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const updateMutation = trpc.habits.updateHabit.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const archiveMutation = trpc.habits.archiveHabit.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const pauseMutation = trpc.habits.pauseHabit.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const resumeMutation = trpc.habits.resumeHabit.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const deleteMutation = trpc.habits.deleteHabit.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const toggleCheckInMutation = trpc.habits.toggleCheckIn.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const setNumericMutation = trpc.habits.setNumericValue.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const resetCleanStreakMutation = trpc.habits.resetCleanStreak.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const applyFreezeMutation = trpc.habits.applyStreakFreeze.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const addNoteMutation = trpc.habits.addCheckInNote.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const createStackMutation = trpc.habits.createHabitStack.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const reorderStackMutation = trpc.habits.reorderRoutineStack.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  const deleteStackMutation = trpc.habits.deleteHabitStack.useMutation({
    onSuccess: () => {
      utils.habits.getWorkspace.invalidate();
    },
  });

  // Dual dispatch handlers (optimistic local update + server persistence when logged in)
  const createHabit = useCallback(
    (habitData: Omit<Habit, "id" | "createdAt">) => {
      const localHabit = storeCreateHabit(habitData);

      if (userId) {
        createMutation.mutate({
          name: habitData.name,
          description: habitData.description,
          icon: habitData.icon,
          color: habitData.color,
          type: habitData.type,
          frequencyType: habitData.frequency.type,
          frequencyDaysOfWeek: habitData.frequency.daysOfWeek,
          frequencyTimesPerWeek: habitData.frequency.timesPerWeek,
          targetValue: habitData.targetValue,
          unit: habitData.unit,
          timeOfDay: habitData.timeOfDay,
          reminderTime: habitData.reminderTime,
          stackedAfterHabitId: habitData.stackedAfterHabitId,
          stackRoutineTitle: habitData.stackRoutineTitle,
          graceDaysPerMonth: habitData.graceDaysPerMonth,
        });
      }

      return localHabit;
    },
    [userId, storeCreateHabit, createMutation],
  );

  const updateHabit = useCallback(
    (habitId: string, updates: Partial<Habit>) => {
      storeUpdateHabit(habitId, updates);

      if (userId) {
        updateMutation.mutate({
          habitId,
          name: updates.name,
          description: updates.description,
          icon: updates.icon,
          color: updates.color,
          type: updates.type,
          frequencyType: updates.frequency?.type,
          frequencyDaysOfWeek: updates.frequency?.daysOfWeek,
          frequencyTimesPerWeek: updates.frequency?.timesPerWeek,
          targetValue: updates.targetValue,
          unit: updates.unit,
          timeOfDay: updates.timeOfDay,
          reminderTime: updates.reminderTime,
          status: updates.status,
          stackedAfterHabitId: updates.stackedAfterHabitId,
          stackRoutineTitle: updates.stackRoutineTitle,
          graceDaysPerMonth: updates.graceDaysPerMonth,
        });
      }
    },
    [userId, storeUpdateHabit, updateMutation],
  );

  const archiveHabit = useCallback(
    (habitId: string) => {
      storeArchiveHabit(habitId);
      if (userId) {
        archiveMutation.mutate({ habitId });
      }
    },
    [userId, storeArchiveHabit, archiveMutation],
  );

  const pauseHabit = useCallback(
    (habitId: string) => {
      storePauseHabit(habitId);
      if (userId) {
        pauseMutation.mutate({ habitId });
      }
    },
    [userId, storePauseHabit, pauseMutation],
  );

  const resumeHabit = useCallback(
    (habitId: string) => {
      storeResumeHabit(habitId);
      if (userId) {
        resumeMutation.mutate({ habitId });
      }
    },
    [userId, storeResumeHabit, resumeMutation],
  );

  const deleteHabit = useCallback(
    (habitId: string) => {
      storeDeleteHabit(habitId);
      if (userId) {
        deleteMutation.mutate({ habitId });
      }
    },
    [userId, storeDeleteHabit, deleteMutation],
  );

  const toggleCheckIn = useCallback(
    (habitId: string, date?: string, note?: string, mood?: MoodType) => {
      storeToggleCheckIn(habitId, date, note, mood);
      if (userId) {
        toggleCheckInMutation.mutate({
          habitId,
          date: date || useHabitStore.getState().selectedDate,
          note,
          mood,
        });
      }
    },
    [userId, storeToggleCheckIn, toggleCheckInMutation],
  );

  const setNumericValue = useCallback(
    (
      habitId: string,
      value: number,
      date?: string,
      note?: string,
      mood?: MoodType,
    ) => {
      storeSetNumericValue(habitId, value, date, note, mood);
      if (userId) {
        setNumericMutation.mutate({
          habitId,
          date: date || useHabitStore.getState().selectedDate,
          value,
          note,
          mood,
        });
      }
    },
    [userId, storeSetNumericValue, setNumericMutation],
  );

  const resetCleanStreak = useCallback(
    (habitId: string, date?: string, slipReason?: string) => {
      storeResetCleanStreak(habitId, date, slipReason);
      if (userId) {
        resetCleanStreakMutation.mutate({
          habitId,
          date: date || useHabitStore.getState().selectedDate,
          slipReason,
        });
      }
    },
    [userId, storeResetCleanStreak, resetCleanStreakMutation],
  );

  const applyStreakFreeze = useCallback(
    (habitId: string, date: string, reason?: string) => {
      storeApplyStreakFreeze(habitId, date);
      if (userId) {
        applyFreezeMutation.mutate({
          habitId,
          date,
          reason,
        });
      }
    },
    [userId, storeApplyStreakFreeze, applyFreezeMutation],
  );

  const addCheckInNote = useCallback(
    (
      habitId: string,
      date: string,
      note: string,
      mood?: MoodType,
      skipReason?: string,
    ) => {
      storeAddCheckInNote(habitId, date, note, mood, skipReason);
      if (userId) {
        addNoteMutation.mutate({
          habitId,
          date,
          note,
          mood,
          skipReason,
        });
      }
    },
    [userId, storeAddCheckInNote, addNoteMutation],
  );

  const createHabitStack = useCallback(
    (title: string, habitIds: string[]) => {
      storeCreateHabitStack(title, habitIds);
      if (userId) {
        createStackMutation.mutate({ title, habitIds });
      }
    },
    [userId, storeCreateHabitStack, createStackMutation],
  );

  const reorderRoutineStack = useCallback(
    (title: string, habitIds: string[]) => {
      storeReorderRoutineStack(title, habitIds);
      if (userId) {
        reorderStackMutation.mutate({ title, habitIds });
      }
    },
    [userId, storeReorderRoutineStack, reorderStackMutation],
  );

  const deleteHabitStack = useCallback(
    (routineTitle: string) => {
      storeDeleteHabitStack(routineTitle);
      if (userId) {
        deleteStackMutation.mutate({ routineTitle });
      }
    },
    [userId, storeDeleteHabitStack, deleteStackMutation],
  );

  return {
    habits: storeHabits,
    checkIns: storeCheckIns,
    streakFreezes: storeFreezes,
    isLoading: workspaceQuery.isLoading,
    isRefetching: workspaceQuery.isRefetching,
    refetch: workspaceQuery.refetch,
    createHabit,
    updateHabit,
    archiveHabit,
    pauseHabit,
    resumeHabit,
    deleteHabit,
    toggleCheckIn,
    setNumericValue,
    resetCleanStreak,
    applyStreakFreeze,
    addCheckInNote,
    createHabitStack,
    reorderRoutineStack,
    deleteHabitStack,
  };
}
