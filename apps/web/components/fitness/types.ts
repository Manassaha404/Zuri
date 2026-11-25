// Core TypeScript types for Fitness Tracker workspace

export type FitnessWorkspaceTab =
  | "workout"
  | "library"
  | "nutrition"
  | "body"
  | "insights";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Biceps"
  | "Triceps"
  | "Core"
  | "Calves"
  | "Full Body";

export type EquipmentType =
  | "Barbell"
  | "Dumbbell"
  | "Cable"
  | "Machine"
  | "Bodyweight"
  | "Kettlebell"
  | "Band";

export type SetType = "working" | "warmup" | "dropset" | "amrap";

export type WeightUnit = "kg" | "lbs";

export type PRType = "weight" | "1rm" | "reps" | "volume";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: EquipmentType;
  defaultRestSeconds: number;
  isCustom?: boolean;
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
  tempo?: string;
  restSeconds: number;
  completed: boolean;
  prs?: PRType[];
}

export interface WorkoutExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  supersetGroupId?: string;
  notes?: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  templateId?: string;
  date: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes: number;
  isDeload?: boolean;
  notes?: string;
  exercises: WorkoutExerciseLog[];
}

export interface WorkoutTemplateExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  supersetGroupId?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category:
    | "Push/Pull/Legs"
    | "Upper/Lower"
    | "Full Body"
    | "Program"
    | "Custom";
  description: string;
  estimatedMinutes: number;
  exercises: WorkoutTemplateExercise[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  style: "5/3/1" | "PPL 6-Day" | "Starting Strength";
  description: string;
  totalWeeks: number;
  currentWeek: number;
  deloadEveryWeeks: number;
  progressionRule: string;
  templateIds: string[];
}

export type CardioActivityType = "run" | "cycle" | "swim" | "walk";

export interface CardioSession {
  id: string;
  type: CardioActivityType;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  heartRateAvg?: number;
  calories: number;
  notes?: string;
}

export interface BodyweightSkill {
  id: string;
  name: string;
  category: "Skill" | "Mobility";
  currentStage: string;
  stages: string[];
  stageIndex: number;
  targetHoldOrReps: string;
  lastPracticed?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  barcode?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealSlot = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

export interface FoodLogEntry {
  id: string;
  date: string;
  meal: MealSlot;
  foodId: string;
  name: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  goalMode: "cut" | "maintain" | "bulk";
}

export interface BodyMetricEntry {
  id: string;
  date: string;
  weight: number;
  bodyFatPct?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  thighsCm?: number;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  pose: "Front" | "Side" | "Back";
  weight?: number;
  dataUrl?: string;
  notes?: string;
}

export interface RecoveryLog {
  id: string;
  date: string;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  soreness: number;
  fatigue: number;
  restingHeartRate?: number;
  steps?: number;
  notes?: string;
}

export interface InjuryLog {
  id: string;
  title: string;
  bodyPart: string;
  severity: "Mild" | "Moderate" | "Severe";
  status: "Active" | "Recovering" | "Resolved";
  startedAt: string;
  avoidExerciseIds: string[];
  notes?: string;
}

export interface FitnessGoal {
  id: string;
  title: string;
  category: "Strength" | "Bodyweight" | "Cardio" | "Consistency";
  currentValue: number;
  targetValue: number;
  unit: string;
  targetDate: string;
  completed: boolean;
}
