// Calculation and formatting helpers for Fitness Tracker
import type {
  BodyMetricEntry,
  Exercise,
  MuscleGroup,
  PRType,
  RecoveryLog,
  WorkoutSession,
  WorkoutSet,
} from "@/components/fitness/types";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Biceps",
  "Triceps",
  "Core",
  "Calves",
  "Full Body",
];

// Format ISO date string YYYY-MM-DD
export function toDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Estimate 1RM using Epley formula
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight * 10) / 10;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Calculate set volume
export function calcSetVolume(weight: number, reps: number): number {
  return Math.max(0, weight) * Math.max(0, reps);
}

// Calculate total session volume across working sets
export function calcSessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((acc, ex) => {
    const exVol = ex.sets
      .filter((s) => s.completed && s.type !== "warmup")
      .reduce((sum, s) => sum + calcSetVolume(s.weight, s.reps), 0);
    return acc + exVol;
  }, 0);
}

// Compute all-time bests for a given exercise from completed sessions
export function getExerciseRecords(
  exerciseId: string,
  sessions: WorkoutSession[],
): {
  maxWeight: number;
  best1RM: number;
  maxReps: number;
  maxSetVolume: number;
} {
  let maxWeight = 0;
  let best1RM = 0;
  let maxReps = 0;
  let maxSetVolume = 0;

  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const s of ex.sets) {
        if (!s.completed || s.type === "warmup") continue;
        if (s.weight > maxWeight) maxWeight = s.weight;
        if (s.reps > maxReps) maxReps = s.reps;
        const est = estimate1RM(s.weight, s.reps);
        if (est > best1RM) best1RM = est;
        const vol = calcSetVolume(s.weight, s.reps);
        if (vol > maxSetVolume) maxSetVolume = vol;
      }
    }
  }

  return { maxWeight, best1RM, maxReps, maxSetVolume };
}

// Detect which PR types a candidate set achieves compared to historical sessions
export function detectSetPRs(
  exerciseId: string,
  weight: number,
  reps: number,
  sessions: WorkoutSession[],
): PRType[] {
  if (weight <= 0 && reps <= 0) return [];
  const prev = getExerciseRecords(exerciseId, sessions);
  const prs: PRType[] = [];

  if (weight > 0 && weight > prev.maxWeight) prs.push("weight");
  const est = estimate1RM(weight, reps);
  if (est > 0 && est > prev.best1RM) prs.push("1rm");
  if (reps > 0 && reps > prev.maxReps) prs.push("reps");
  const vol = calcSetVolume(weight, reps);
  if (vol > 0 && vol > prev.maxSetVolume) prs.push("volume");

  return prs;
}

// Get previous performance summary string for inline display
export function getPreviousExercisePerformance(
  exerciseId: string,
  sessions: WorkoutSession[],
): {
  label: string;
  bestSet: WorkoutSet | null;
  allWorkingSets: WorkoutSet[];
} | null {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const session of sorted) {
    const match = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!match) continue;
    const completed = match.sets.filter(
      (s) => s.completed && s.type !== "warmup",
    );
    if (completed.length === 0) continue;
    const best = [...completed].sort(
      (a, b) => estimate1RM(b.weight, b.reps) - estimate1RM(a.weight, a.reps),
    )[0];
    if (!best) continue;
    return {
      label: `${best.weight} kg × ${best.reps}`,
      bestSet: best,
      allWorkingSets: completed,
    };
  }
  return null;
}

// Progressive overload suggestion based on previous session
export function getProgressiveOverloadSuggestion(
  exerciseId: string,
  sessions: WorkoutSession[],
  isDeload: boolean = false,
): { message: string; suggestedWeight: number; suggestedReps: number } | null {
  const prev = getPreviousExercisePerformance(exerciseId, sessions);
  if (!prev || !prev.bestSet) return null;

  const sets = prev.allWorkingSets;
  const minReps = Math.min(...sets.map((s) => s.reps));
  const topWeight = Math.max(...sets.map((s) => s.weight));

  if (isDeload) {
    const deloadWeight = Math.round((topWeight * 0.65) / 2.5) * 2.5;
    return {
      message: `Deload week active — aim for ${deloadWeight} kg × ${minReps} (65%)`,
      suggestedWeight: deloadWeight,
      suggestedReps: minReps,
    };
  }

  if (sets.length >= 3 && minReps >= 10) {
    const nextWeight = topWeight + 2.5;
    return {
      message: `You hit ${sets.length}×${minReps}+ at ${topWeight} kg — try +2.5 kg (${nextWeight} kg)`,
      suggestedWeight: nextWeight,
      suggestedReps: 8,
    };
  }

  if (minReps >= 8) {
    const nextWeight = topWeight + 2.5;
    return {
      message: `Solid ${topWeight} kg × ${minReps} — try ${nextWeight} kg or +1 rep`,
      suggestedWeight: nextWeight,
      suggestedReps: minReps,
    };
  }

  return {
    message: `Last best: ${prev.bestSet.weight} kg × ${prev.bestSet.reps} — aim for +1 rep (${prev.bestSet.reps + 1})`,
    suggestedWeight: prev.bestSet.weight,
    suggestedReps: prev.bestSet.reps + 1,
  };
}

// Calculate plate breakdown per side for barbell weight
export function calculatePlatesPerSide(
  targetWeight: number,
  barWeight: number = 20,
  unit: "kg" | "lbs" = "kg",
): { plates: number[]; remainder: number } {
  const available =
    unit === "kg" ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];
  let perSide = Math.max(0, (targetWeight - barWeight) / 2);
  const plates: number[] = [];

  for (const plate of available) {
    while (perSide >= plate - 0.001) {
      plates.push(plate);
      perSide -= plate;
    }
  }

  return {
    plates,
    remainder: Math.round(perSide * 2 * 100) / 100,
  };
}

// Calculate TDEE and macro targets
export function calculateTDEEAndMacros(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "male" | "female";
  activityMultiplier: number;
  goal: "cut" | "maintain" | "bulk";
}): {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const base = 10 * params.weightKg + 6.25 * params.heightCm - 5 * params.age;
  const bmr = Math.round(params.sex === "male" ? base + 5 : base - 161);
  const tdee = Math.round(bmr * params.activityMultiplier);

  const delta = params.goal === "cut" ? -450 : params.goal === "bulk" ? 300 : 0;
  const targetCalories = Math.max(1200, tdee + delta);

  const protein = Math.round(params.weightKg * 2.0);
  const fat = Math.round((targetCalories * 0.25) / 9);
  const carbs = Math.max(
    50,
    Math.round((targetCalories - protein * 4 - fat * 9) / 4),
  );

  return { bmr, tdee, targetCalories, protein, carbs, fat };
}

// Compute smoothed moving average for weight entries
export function computeSmoothedWeightTrend(
  entries: BodyMetricEntry[],
  windowSize: number = 5,
): Array<{ date: string; raw: number; smoothed: number }> {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((entry, idx) => {
    const start = Math.max(0, idx - windowSize + 1);
    const slice = sorted.slice(start, idx + 1);
    const avg =
      slice.reduce((sum, item) => sum + item.weight, 0) / slice.length;
    return {
      date: entry.date,
      raw: entry.weight,
      smoothed: Math.round(avg * 10) / 10,
    };
  });
}

// Compute weekly sets per muscle group for heatmap
export function getWeeklyMuscleVolume(
  sessions: WorkoutSession[],
  exercises: Exercise[],
  daysBack: number = 7,
): Record<MuscleGroup, number> {
  const counts: Record<MuscleGroup, number> = {
    Chest: 0,
    Back: 0,
    Shoulders: 0,
    Quads: 0,
    Hamstrings: 0,
    Glutes: 0,
    Biceps: 0,
    Triceps: 0,
    Core: 0,
    Calves: 0,
    "Full Body": 0,
  };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffKey = toDateKey(cutoff);

  const exMap = new Map(exercises.map((e) => [e.id, e]));

  for (const session of sessions) {
    if (session.date < cutoffKey) continue;
    for (const exLog of session.exercises) {
      const completedSets = exLog.sets.filter(
        (s) => s.completed && s.type !== "warmup",
      ).length;
      counts[exLog.muscleGroup] =
        (counts[exLog.muscleGroup] || 0) + completedSets;
      const def = exMap.get(exLog.exerciseId);
      if (def?.secondaryMuscles) {
        for (const sec of def.secondaryMuscles) {
          counts[sec] = (counts[sec] || 0) + Math.round(completedSets * 0.5);
        }
      }
    }
  }

  return counts;
}

// Compute daily readiness score (0-100) from recovery metrics
export function computeReadinessScore(log?: RecoveryLog): number {
  if (!log) return 78;
  const sleepScore = Math.min(
    40,
    (log.sleepHours / 8) * 30 + log.sleepQuality * 2,
  );
  const sorenessPenalty = log.soreness * 2.5;
  const fatiguePenalty = log.fatigue * 2.5;
  const raw = 60 + sleepScore - sorenessPenalty - fatiguePenalty;
  return Math.max(15, Math.min(100, Math.round(raw)));
}

// Format seconds to MM:SS
export function formatTimerSeconds(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
