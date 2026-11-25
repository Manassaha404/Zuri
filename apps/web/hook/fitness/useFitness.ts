// Hook managing Fitness Tracker queries, mutations, and active workout state
"use client";

import { useCallback, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useFitnessStore } from "@/store/fitnessStore";
import { detectSetPRs, toDateKey } from "@/lib/fitnessUtils";
import type {
  BodyMetricEntry,
  BodyweightSkill,
  CardioSession,
  EquipmentType,
  Exercise,
  FitnessGoal,
  FoodItem,
  FoodLogEntry,
  InjuryLog,
  MealSlot,
  MuscleGroup,
  NutritionTargets,
  ProgressPhoto,
  RecoveryLog,
  SavedMeal,
  SetType,
  TrainingProgram,
  WorkoutExerciseLog,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
} from "@/components/fitness/types";

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2200,
  protein: 150,
  carbs: 240,
  fat: 70,
  waterMl: 3000,
  goalMode: "maintain",
};

export function useFitness() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);

  const {
    activeTab,
    unit,
    isDeloadWeek,
    showRpeTempo,
    activeWorkout,
    setActiveTab,
    setUnit,
    toggleDeloadWeek,
    toggleShowRpeTempo,
    setActiveWorkout,
    startRestTimer,
  } = useFitnessStore();

  const utils = trpc.useUtils();

  const workspaceQuery = trpc.fitness.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const data = workspaceQuery.data;

  const exercises: Exercise[] = useMemo(
    () => (data?.exercises as Exercise[]) ?? [],
    [data?.exercises],
  );
  const templates: WorkoutTemplate[] = useMemo(
    () => (data?.templates as WorkoutTemplate[]) ?? [],
    [data?.templates],
  );
  const programs: TrainingProgram[] = useMemo(
    () => (data?.programs as TrainingProgram[]) ?? [],
    [data?.programs],
  );
  const sessions: WorkoutSession[] = useMemo(
    () => (data?.sessions as WorkoutSession[]) ?? [],
    [data?.sessions],
  );
  const cardioSessions: CardioSession[] = useMemo(
    () => (data?.cardioSessions as CardioSession[]) ?? [],
    [data?.cardioSessions],
  );
  const skills: BodyweightSkill[] = useMemo(
    () => (data?.skills as BodyweightSkill[]) ?? [],
    [data?.skills],
  );
  const foodDatabase: FoodItem[] = useMemo(
    () => (data?.foodDatabase as FoodItem[]) ?? [],
    [data?.foodDatabase],
  );
  const foodLogs: FoodLogEntry[] = useMemo(
    () => (data?.foodLogs as FoodLogEntry[]) ?? [],
    [data?.foodLogs],
  );
  const savedMeals: SavedMeal[] = useMemo(
    () => (data?.savedMeals as SavedMeal[]) ?? [],
    [data?.savedMeals],
  );
  const nutritionTargets: NutritionTargets = useMemo(
    () => (data?.nutritionTargets as NutritionTargets) ?? DEFAULT_TARGETS,
    [data?.nutritionTargets],
  );
  const waterIntakeByDate: Record<string, number> = useMemo(
    () => data?.waterIntakeByDate ?? {},
    [data?.waterIntakeByDate],
  );
  const bodyMetrics: BodyMetricEntry[] = useMemo(
    () => (data?.bodyMetrics as BodyMetricEntry[]) ?? [],
    [data?.bodyMetrics],
  );
  const progressPhotos: ProgressPhoto[] = useMemo(
    () => (data?.progressPhotos as ProgressPhoto[]) ?? [],
    [data?.progressPhotos],
  );
  const recoveryLogs: RecoveryLog[] = useMemo(
    () => (data?.recoveryLogs as RecoveryLog[]) ?? [],
    [data?.recoveryLogs],
  );
  const injuries: InjuryLog[] = useMemo(
    () => (data?.injuries as InjuryLog[]) ?? [],
    [data?.injuries],
  );
  const goals: FitnessGoal[] = useMemo(
    () => (data?.goals as FitnessGoal[]) ?? [],
    [data?.goals],
  );

  const invalidate = useCallback(
    () => utils.fitness.getWorkspace.invalidate(),
    [utils],
  );

  // Mutations
  const createExerciseMut = trpc.fitness.createCustomExercise.useMutation({
    onSuccess: invalidate,
  });
  const saveSessionMut = trpc.fitness.saveWorkoutSession.useMutation({
    onSuccess: invalidate,
  });
  const createProgramMut = trpc.fitness.createProgram.useMutation({
    onSuccess: invalidate,
  });
  const advanceProgramMut = trpc.fitness.advanceProgramWeek.useMutation({
    onSuccess: invalidate,
  });
  const deleteProgramMut = trpc.fitness.deleteProgram.useMutation({
    onSuccess: invalidate,
  });
  const addCardioMut = trpc.fitness.addCardioSession.useMutation({
    onSuccess: invalidate,
  });
  const createSkillMut = trpc.fitness.createSkill.useMutation({
    onSuccess: invalidate,
  });
  const advanceSkillMut = trpc.fitness.advanceSkillStage.useMutation({
    onSuccess: invalidate,
  });
  const addFoodMut = trpc.fitness.addFood.useMutation({
    onSuccess: invalidate,
  });
  const addFoodLogMut = trpc.fitness.addFoodLog.useMutation({
    onSuccess: invalidate,
  });
  const removeFoodLogMut = trpc.fitness.removeFoodLog.useMutation({
    onSuccess: invalidate,
  });
  const addSavedMealMut = trpc.fitness.addSavedMeal.useMutation({
    onSuccess: invalidate,
  });
  const setTargetsMut = trpc.fitness.setNutritionTargets.useMutation({
    onSuccess: invalidate,
  });
  const addWaterMut = trpc.fitness.addWaterMl.useMutation({
    onSuccess: invalidate,
  });
  const addBodyMetricMut = trpc.fitness.addBodyMetric.useMutation({
    onSuccess: invalidate,
  });
  const addPhotoMut = trpc.fitness.addProgressPhoto.useMutation({
    onSuccess: invalidate,
  });
  const saveRecoveryMut = trpc.fitness.saveRecoveryLog.useMutation({
    onSuccess: invalidate,
  });
  const addInjuryMut = trpc.fitness.addInjury.useMutation({
    onSuccess: invalidate,
  });
  const toggleInjuryMut = trpc.fitness.toggleInjuryStatus.useMutation({
    onSuccess: invalidate,
  });
  const addGoalMut = trpc.fitness.addGoal.useMutation({
    onSuccess: invalidate,
  });
  const updateGoalMut = trpc.fitness.updateGoalProgress.useMutation({
    onSuccess: invalidate,
  });
  const deleteGoalMut = trpc.fitness.deleteGoal.useMutation({
    onSuccess: invalidate,
  });

  // Active workout handlers
  const startBlankWorkout = useCallback(
    (title = "Custom Workout") => {
      setActiveTab("workout");
      setActiveWorkout({
        id: `sess-${Date.now()}`,
        title,
        date: toDateKey(),
        startedAt: new Date().toISOString(),
        durationMinutes: 0,
        isDeload: isDeloadWeek,
        exercises: [],
      });
    },
    [isDeloadWeek, setActiveTab, setActiveWorkout],
  );

  const startWorkoutFromTemplate = useCallback(
    (templateId: string) => {
      const tpl = templates.find((t) => t.id === templateId);
      if (!tpl) return;

      const exLogs: WorkoutExerciseLog[] = tpl.exercises
        .map((te, idx) => {
          const def = exercises.find((e) => e.id === te.exerciseId);
          if (!def) return null;
          const sets: WorkoutSet[] = Array.from(
            { length: te.targetSets },
            (_, i) => ({
              id: `set-${Date.now()}-${idx}-${i}`,
              setNumber: i + 1,
              type: "working" as SetType,
              weight: 0,
              reps: 0,
              restSeconds: te.restSeconds,
              completed: false,
            }),
          );
          return {
            id: `log-${Date.now()}-${idx}`,
            exerciseId: def.id,
            exerciseName: def.name,
            muscleGroup: def.muscleGroup,
            equipment: def.equipment,
            supersetGroupId: te.supersetGroupId,
            sets,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      setActiveTab("workout");
      setActiveWorkout({
        id: `sess-${Date.now()}`,
        title: tpl.name.split(" (")[0] || tpl.name,
        templateId: tpl.id,
        date: toDateKey(),
        startedAt: new Date().toISOString(),
        durationMinutes: 0,
        isDeload: isDeloadWeek,
        exercises: exLogs,
      });
    },
    [exercises, isDeloadWeek, setActiveTab, setActiveWorkout, templates],
  );

  const discardActiveWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, [setActiveWorkout]);

  const finishActiveWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    const started = new Date(activeWorkout.startedAt).getTime();
    const mins = Math.max(15, Math.round((Date.now() - started) / 60000));
    await saveSessionMut.mutateAsync({
      title: activeWorkout.title,
      templateId: activeWorkout.templateId,
      date: activeWorkout.date,
      startedAt: activeWorkout.startedAt,
      completedAt: new Date().toISOString(),
      durationMinutes: mins,
      isDeload: activeWorkout.isDeload,
      notes: activeWorkout.notes,
      exercises: activeWorkout.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        supersetGroupId: ex.supersetGroupId,
        notes: ex.notes,
        sets: ex.sets.map((st) => ({
          setNumber: st.setNumber,
          type: st.type,
          weight: st.weight,
          reps: st.reps,
          rpe: st.rpe,
          rir: st.rir,
          tempo: st.tempo,
          restSeconds: st.restSeconds,
          completed: st.completed,
          prs: st.prs,
        })),
      })),
    });
    setActiveWorkout(null);
    setActiveTab("insights");
  }, [activeWorkout, saveSessionMut, setActiveTab, setActiveWorkout]);

  const updateActiveWorkoutMeta = useCallback(
    (patch: Partial<Pick<WorkoutSession, "title" | "notes">>) => {
      if (!activeWorkout) return;
      setActiveWorkout({ ...activeWorkout, ...patch });
    },
    [activeWorkout, setActiveWorkout],
  );

  const addExerciseToWorkout = useCallback(
    (exerciseId: string, supersetGroupId?: string) => {
      if (!activeWorkout) return;
      const def = exercises.find((e) => e.id === exerciseId);
      if (!def) return;
      const newLog: WorkoutExerciseLog = {
        id: `log-${Date.now()}`,
        exerciseId: def.id,
        exerciseName: def.name,
        muscleGroup: def.muscleGroup,
        equipment: def.equipment,
        supersetGroupId,
        sets: [
          {
            id: `set-${Date.now()}-1`,
            setNumber: 1,
            type: "working",
            weight: 0,
            reps: 0,
            restSeconds: def.defaultRestSeconds,
            completed: false,
          },
        ],
      };
      setActiveWorkout({
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, newLog],
      });
    },
    [activeWorkout, exercises, setActiveWorkout],
  );

  const removeExerciseFromWorkout = useCallback(
    (logId: string) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter((e) => e.id !== logId),
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const updateExerciseNotes = useCallback(
    (logId: string, notes: string) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((e) =>
          e.id === logId ? { ...e, notes } : e,
        ),
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const toggleSupersetLink = useCallback(
    (logId: string, groupId?: string) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((e) =>
          e.id === logId
            ? {
                ...e,
                supersetGroupId: e.supersetGroupId
                  ? undefined
                  : groupId || "SS-A",
              }
            : e,
        ),
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const addSetToExercise = useCallback(
    (logId: string) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((e) => {
          if (e.id !== logId) return e;
          const last = e.sets[e.sets.length - 1];
          const newSet: WorkoutSet = {
            id: `set-${Date.now()}`,
            setNumber: e.sets.length + 1,
            type: last?.type || "working",
            weight: last?.weight || 0,
            reps: last?.reps || 0,
            restSeconds: last?.restSeconds || 90,
            completed: false,
          };
          return { ...e, sets: [...e.sets, newSet] };
        }),
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const updateSet = useCallback(
    (logId: string, setId: string, patch: Partial<WorkoutSet>) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((e) =>
          e.id === logId
            ? {
                ...e,
                sets: e.sets.map((st) =>
                  st.id === setId ? { ...st, ...patch } : st,
                ),
              }
            : e,
        ),
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const removeSet = useCallback(
    (logId: string, setId: string) => {
      if (!activeWorkout) return;
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((e) => {
          if (e.id !== logId) return e;
          const filtered = e.sets
            .filter((st) => st.id !== setId)
            .map((st, idx) => ({ ...st, setNumber: idx + 1 }));
          return { ...e, sets: filtered };
        }),
      });
    },
    [activeWorkout, setActiveWorkout],
  );

  const toggleSetComplete = useCallback(
    (logId: string, setId: string) => {
      if (!activeWorkout) return;
      let triggeredRest = 0;

      const updatedExercises = activeWorkout.exercises.map((ex) => {
        if (ex.id !== logId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((st) => {
            if (st.id !== setId) return st;
            const nextCompleted = !st.completed;
            if (nextCompleted) {
              triggeredRest = st.restSeconds || 90;
            }
            const prs =
              nextCompleted && st.type !== "warmup"
                ? detectSetPRs(ex.exerciseId, st.weight, st.reps, sessions)
                : undefined;
            return { ...st, completed: nextCompleted, prs };
          }),
        };
      });

      setActiveWorkout({
        ...activeWorkout,
        exercises: updatedExercises,
      });
      if (triggeredRest > 0) {
        startRestTimer(triggeredRest);
      }
    },
    [activeWorkout, sessions, setActiveWorkout, startRestTimer],
  );

  return {
    isLoading: workspaceQuery.isLoading,
    activeTab,
    unit,
    isDeloadWeek,
    showRpeTempo,
    activeWorkout,
    setActiveTab,
    setUnit,
    toggleDeloadWeek,
    toggleShowRpeTempo,

    exercises,
    templates,
    programs,
    sessions,
    cardioSessions,
    skills,
    foodDatabase,
    foodLogs,
    savedMeals,
    nutritionTargets,
    waterIntakeByDate,
    bodyMetrics,
    progressPhotos,
    recoveryLogs,
    injuries,
    goals,

    startBlankWorkout,
    startWorkoutFromTemplate,
    discardActiveWorkout,
    finishActiveWorkout,
    updateActiveWorkoutMeta,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateExerciseNotes,
    toggleSupersetLink,
    addSetToExercise,
    updateSet,
    removeSet,
    toggleSetComplete,

    addCustomExercise: (input: {
      name: string;
      muscleGroup: MuscleGroup;
      equipment: EquipmentType;
      defaultRestSeconds: number;
    }) => createExerciseMut.mutateAsync(input),

    createProgram: (input: {
      name: string;
      style: string;
      description?: string;
      totalWeeks: number;
      deloadEveryWeeks?: number;
      progressionRule?: string;
      templateIds?: string[];
    }) => createProgramMut.mutateAsync(input),

    advanceProgramWeek: (programId: string) =>
      advanceProgramMut.mutateAsync({ programId }),

    deleteProgram: (programId: string) =>
      deleteProgramMut.mutateAsync({ programId }),

    addCardioSession: (input: Omit<CardioSession, "id">) =>
      addCardioMut.mutateAsync(input),

    createSkill: (input: {
      name: string;
      category: "Skill" | "Mobility";
      stages: string[];
      targetHoldOrReps: string;
    }) => createSkillMut.mutateAsync(input),

    advanceSkillStage: (skillId: string) =>
      advanceSkillMut.mutateAsync({ skillId, date: toDateKey() }),

    addCustomFood: (input: Omit<FoodItem, "id">) =>
      addFoodMut.mutateAsync(input),

    addFoodLog: (input: Omit<FoodLogEntry, "id">) =>
      addFoodLogMut.mutateAsync(input),

    removeFoodLog: (foodLogId: string) =>
      removeFoodLogMut.mutateAsync({ foodLogId }),

    addSavedMeal: (input: Omit<SavedMeal, "id">) =>
      addSavedMealMut.mutateAsync(input),

    logSavedMeal: (mealId: string, date: string, slot: MealSlot) => {
      const meal = savedMeals.find((m) => m.id === mealId);
      if (!meal) return Promise.resolve();
      return addFoodLogMut.mutateAsync({
        date,
        meal: slot,
        foodId: meal.id,
        name: meal.name,
        servings: 1,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      });
    },

    addWaterMl: (date: string, amountMl: number) =>
      addWaterMut.mutateAsync({ date, amountMl }),

    setNutritionTargets: (targets: NutritionTargets) =>
      setTargetsMut.mutateAsync(targets),

    addBodyMetric: (input: Omit<BodyMetricEntry, "id">) =>
      addBodyMetricMut.mutateAsync(input),

    addProgressPhoto: (input: Omit<ProgressPhoto, "id">) =>
      addPhotoMut.mutateAsync(input),

    saveRecoveryLog: (input: Omit<RecoveryLog, "id">) =>
      saveRecoveryMut.mutateAsync(input),

    addInjury: (input: Omit<InjuryLog, "id">) =>
      addInjuryMut.mutateAsync(input),

    toggleInjuryStatus: (injuryId: string) =>
      toggleInjuryMut.mutateAsync({ injuryId }),

    addGoal: (input: Omit<FitnessGoal, "id">) => addGoalMut.mutateAsync(input),

    updateGoalProgress: (goalId: string, currentValue: number) =>
      updateGoalMut.mutateAsync({ goalId, currentValue }),

    deleteGoal: (goalId: string) => deleteGoalMut.mutateAsync({ goalId }),
  };
}
