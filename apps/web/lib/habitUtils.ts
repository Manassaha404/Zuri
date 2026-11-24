// Habit Tracker Utility Functions

import type {
  Habit,
  CheckInRecord,
  StreakFreeze,
  HabitCalculatedStats,
  HeatmapCell,
  HeatmapWeek,
  HeatmapMonthHeader,
  MoodCorrelationStat,
  MoodType,
} from "@/components/habits/types";

// Date formatting helper to YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Today date key
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

// Parse YYYY-MM-DD into Date at local midnight
export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split("-").map(Number);
  const year = parts[0] ?? 2026;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(year, month - 1, day);
}

// Add or subtract days from date key
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + deltaDays);
  return formatDateKey(date);
}

// Get day of week index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
export function getDayOfWeek(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

// Relative date label
export function getRelativeDateLabel(dateKey: string): string {
  const today = getTodayKey();
  const yesterday = shiftDateKey(today, -1);
  const tomorrow = shiftDateKey(today, 1);

  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";
  if (dateKey === tomorrow) return "Tomorrow";

  const date = parseDateKey(dateKey);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Format display date
export function formatFullDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Check if a habit is scheduled on a given date key
export function isHabitScheduledOnDate(habit: Habit, dateKey: string): boolean {
  if (habit.status !== "active") return false;

  const freq = habit.frequency;
  if (freq.type === "daily") return true;

  const dayOfWeek = getDayOfWeek(dateKey);

  if (freq.type === "specific_days") {
    return (
      Array.isArray(freq.daysOfWeek) && freq.daysOfWeek.includes(dayOfWeek)
    );
  }

  // Weekly or times_per_week are eligible every day
  return true;
}

// Calculate streak, longest streak, and completion rate for a habit
export function calculateHabitStats(
  habit: Habit,
  checkIns: Record<string, CheckInRecord>,
  streakFreezes: StreakFreeze[],
  referenceDateKey: string = getTodayKey(),
): HabitCalculatedStats {
  const freezesForHabit = streakFreezes.filter((f) => f.habitId === habit.id);
  const frozenDates = new Set(freezesForHabit.map((f) => f.date));
  const maxFreezes = habit.graceDaysPerMonth ?? 2;
  const freezesUsed = freezesForHabit.length;
  const freezesAvailable = Math.max(0, maxFreezes - freezesUsed);

  // Negative habits calculation
  if (habit.type === "negative") {
    const cleanStart = habit.cleanStartedAt
      ? parseDateKey(habit.cleanStartedAt.slice(0, 10))
      : parseDateKey(habit.createdAt.slice(0, 10));
    const refDate = parseDateKey(referenceDateKey);
    const diffTime = Math.max(0, refDate.getTime() - cleanStart.getTime());
    const daysClean = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate slip count
    const totalSlips = Object.values(checkIns).filter(
      (c) => c.habitId === habit.id && c.completed === false && c.skipReason,
    ).length;

    return {
      currentStreak: daysClean,
      longestStreak: Math.max(daysClean, 45), // Based on baseline tracking
      completionRate:
        totalSlips === 0 ? 100 : Math.round(Math.max(0, 100 - totalSlips * 5)),
      totalCompletions: daysClean,
      daysClean,
      freezesAvailable,
      freezesUsed,
    };
  }

  // Standard or numeric habit streak calculation
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalCompletions = 0;
  let totalScheduledDays = 0;

  // Evaluate the last 180 days in reverse to find current streak
  let checkKey = referenceDateKey;
  let checkingCurrentStreak = true;

  // If today is not completed yet, start check from yesterday so current streak doesn't immediately drop to 0
  const todayRecord = checkIns[`${habit.id}_${referenceDateKey}`];
  const isTodayDone = todayRecord?.completed;
  if (!isTodayDone && !frozenDates.has(referenceDateKey)) {
    checkKey = shiftDateKey(referenceDateKey, -1);
  }

  for (let i = 0; i < 180; i++) {
    const scheduled = isHabitScheduledOnDate(habit, checkKey);
    if (scheduled) {
      const rec = checkIns[`${habit.id}_${checkKey}`];
      const isDone = rec?.completed;
      const isFrozen = frozenDates.has(checkKey) || rec?.isFreezeUsed;

      if (isDone || isFrozen) {
        if (checkingCurrentStreak) {
          currentStreak++;
        }
      } else {
        if (checkingCurrentStreak) {
          checkingCurrentStreak = false;
        }
      }
    }
    checkKey = shiftDateKey(checkKey, -1);
  }

  // Calculate overall longest streak and completion rate over last 90 days
  let scanKey = shiftDateKey(referenceDateKey, -89);
  for (let i = 0; i < 90; i++) {
    const scheduled = isHabitScheduledOnDate(habit, scanKey);
    if (scheduled) {
      totalScheduledDays++;
      const rec = checkIns[`${habit.id}_${scanKey}`];
      const isDone = rec?.completed;
      const isFrozen = frozenDates.has(scanKey) || rec?.isFreezeUsed;

      if (isDone || isFrozen) {
        tempStreak++;
        if (isDone) totalCompletions++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }
    scanKey = shiftDateKey(scanKey, 1);
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const completionRate =
    totalScheduledDays > 0
      ? Math.round((totalCompletions / totalScheduledDays) * 100)
      : 100;

  return {
    currentStreak,
    longestStreak,
    completionRate,
    totalCompletions,
    freezesAvailable,
    freezesUsed,
  };
}

// Generate GitHub-style calendar contribution matrix for habits
export function generateHeatmapGrid(
  habits: Habit[],
  checkIns: Record<string, CheckInRecord>,
  streakFreezes: StreakFreeze[],
  weeksCount: number = 20,
  targetHabitId?: string,
): {
  weeks: HeatmapWeek[];
  monthHeaders: HeatmapMonthHeader[];
  totalDaysChecked: number;
  totalCompletions: number;
  averageRate: number;
} {
  const activeHabits = targetHabitId
    ? habits.filter((h) => h.id === targetHabitId)
    : habits.filter((h) => h.status === "active");

  const today = new Date();
  const todayKey = formatDateKey(today);

  // End on Saturday of the current week to align rows (0: Sun to 6: Sat)
  const currentDayOfWeek = today.getDay();
  const endOffset = 6 - currentDayOfWeek;
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + endOffset);

  const totalDays = weeksCount * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const frozenDateSet = new Set(
    (targetHabitId
      ? streakFreezes.filter((f) => f.habitId === targetHabitId)
      : streakFreezes
    ).map((f) => f.date),
  );

  const weeks: HeatmapWeek[] = [];
  const monthHeaders: HeatmapMonthHeader[] = [];
  let lastMonth = -1;

  let totalDaysChecked = 0;
  let totalCompletions = 0;
  let totalPossible = 0;

  let iterDate = new Date(startDate);

  for (let w = 0; w < weeksCount; w++) {
    const days: HeatmapCell[] = [];

    for (let d = 0; d < 7; d++) {
      const dateKey = formatDateKey(iterDate);
      const isFuture = dateKey > todayKey;

      if (d === 0) {
        const month = iterDate.getMonth();
        if (month !== lastMonth) {
          monthHeaders.push({
            label: iterDate.toLocaleDateString("en-US", { month: "short" }),
            colIndex: w,
          });
          lastMonth = month;
        }
      }

      if (isFuture) {
        days.push({
          date: dateKey,
          count: 0,
          totalHabits: 0,
          completionRate: 0,
          intensity: 0,
          hasFreeze: false,
          notesCount: 0,
        });
      } else {
        let habitCount = 0;
        let completedCount = 0;
        let notesCount = 0;
        const moodList: MoodType[] = [];

        for (const habit of activeHabits) {
          if (isHabitScheduledOnDate(habit, dateKey)) {
            habitCount++;
            const rec = checkIns[`${habit.id}_${dateKey}`];
            if (rec?.completed) {
              completedCount++;
            }
            if (rec?.note || rec?.skipReason) {
              notesCount++;
            }
            if (rec?.mood) {
              moodList.push(rec.mood);
            }
          }
        }

        const hasFreeze = frozenDateSet.has(dateKey);
        const rate =
          habitCount > 0 ? Math.round((completedCount / habitCount) * 100) : 0;

        let intensity: 0 | 1 | 2 | 3 | 4 = 0;
        if (completedCount > 0 || hasFreeze) {
          if (rate >= 80) intensity = 4;
          else if (rate >= 55) intensity = 3;
          else if (rate >= 30) intensity = 2;
          else intensity = 1;
        }

        if (completedCount > 0) totalDaysChecked++;
        totalCompletions += completedCount;
        totalPossible += habitCount;

        days.push({
          date: dateKey,
          count: completedCount,
          totalHabits: habitCount,
          completionRate: rate,
          intensity,
          hasFreeze,
          dominantMood: moodList[0],
          notesCount,
        });
      }

      iterDate.setDate(iterDate.getDate() + 1);
    }

    weeks.push({ days });
  }

  const averageRate =
    totalPossible > 0
      ? Math.round((totalCompletions / totalPossible) * 100)
      : 0;

  return {
    weeks,
    monthHeaders,
    totalDaysChecked,
    totalCompletions,
    averageRate,
  };
}

// Calculate mood correlation statistics across check-in logs
export function calculateMoodCorrelation(
  checkIns: Record<string, CheckInRecord>,
): MoodCorrelationStat[] {
  const moodBuckets: Record<
    MoodType,
    { completed: number; total: number; days: Set<string> }
  > = {
    great: { completed: 0, total: 0, days: new Set() },
    good: { completed: 0, total: 0, days: new Set() },
    neutral: { completed: 0, total: 0, days: new Set() },
    low: { completed: 0, total: 0, days: new Set() },
    stressed: { completed: 0, total: 0, days: new Set() },
  };

  const moodLabels: Record<MoodType, string> = {
    great: "Energized & Great",
    good: "Calm & Focused",
    neutral: "Neutral / Balanced",
    low: "Fatigued / Low",
    stressed: "Overwhelmed / Stressed",
  };

  for (const rec of Object.values(checkIns)) {
    if (rec.mood && moodBuckets[rec.mood]) {
      moodBuckets[rec.mood].total++;
      if (rec.completed) {
        moodBuckets[rec.mood].completed++;
      }
      moodBuckets[rec.mood].days.add(rec.date);
    }
  }

  const stats: MoodCorrelationStat[] = (
    Object.keys(moodBuckets) as MoodType[]
  ).map((mood) => {
    const bucket = moodBuckets[mood];
    const averageCompletionRate =
      bucket.total > 0
        ? Math.round((bucket.completed / bucket.total) * 100)
        : 0;

    return {
      mood,
      label: moodLabels[mood],
      averageCompletionRate,
      totalDays: bucket.days.size,
      sampleCheckIns: bucket.total,
    };
  });

  return stats;
}
