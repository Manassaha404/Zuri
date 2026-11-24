// Habit Tracker Type Definitions

export type HabitType = "boolean" | "numeric" | "negative";

export type HabitFrequencyType =
  | "daily"
  | "weekly"
  | "specific_days"
  | "times_per_week";

export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  timesPerWeek?: number; // Target times per week (e.g. 3)
}

export type HabitTimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export type MoodType = "great" | "good" | "neutral" | "low" | "stressed";

export type HabitStatus = "active" | "paused" | "archived";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string; // Lucide icon identifier
  color: string; // Hex color string
  type: HabitType;
  frequency: HabitFrequency;
  targetValue?: number; // For numeric habits (e.g. 8)
  unit?: string; // For numeric habits (e.g. "glasses", "km", "pages")
  timeOfDay: HabitTimeOfDay;
  reminderTime?: string; // e.g. "08:00 AM"
  status: HabitStatus;
  createdAt: string; // ISO date string
  cleanStartedAt?: string; // For negative habits, date streak started
  stackedAfterHabitId?: string; // Habit stacking predecessor
  stackRoutineTitle?: string; // Routine group title (e.g. "Morning Awakening Routine")
  graceDaysPerMonth?: number; // Total streak freezes available
}

export interface CheckInRecord {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number; // For numeric habits
  targetValue?: number;
  note?: string; // Check-in note / reflection
  skipReason?: string; // "Why did I skip?"
  mood?: MoodType; // Mood rating
  isFreezeUsed?: boolean; // Streak freeze applied
  updatedAt: string;
}

export interface StreakFreeze {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  usedAt: string;
}

export interface HabitCalculatedStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-100 percentage
  totalCompletions: number;
  daysClean?: number; // For negative habits
  freezesAvailable: number;
  freezesUsed: number;
}

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  count: number;
  totalHabits: number;
  completionRate: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  hasFreeze: boolean;
  dominantMood?: MoodType;
  notesCount: number;
}

export interface HeatmapWeek {
  days: HeatmapCell[];
}

export interface HeatmapMonthHeader {
  label: string;
  colIndex: number;
}

export interface MoodCorrelationStat {
  mood: MoodType;
  label: string;
  averageCompletionRate: number;
  totalDays: number;
  sampleCheckIns: number;
}
