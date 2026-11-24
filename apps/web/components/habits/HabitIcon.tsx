// Habit Icon Renderer
"use client";

import {
  Brain,
  Droplets,
  Dumbbell,
  BookOpen,
  Footprints,
  Sparkles,
  Moon,
  Sun,
  Flame,
  Shield,
  Target,
  Snowflake,
  Heart,
  Smile,
  Coffee,
  Clock,
  CheckCircle2,
  Zap,
  Bike,
  Activity,
  Award,
  type LucideIcon,
} from "lucide-react";

export const HABIT_ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  Droplets,
  Dumbbell,
  BookOpen,
  Footprints,
  Sparkles,
  Moon,
  Sun,
  Flame,
  Shield,
  Target,
  Snowflake,
  Heart,
  Smile,
  Coffee,
  Clock,
  CheckCircle2,
  Zap,
  Bike,
  Activity,
  Award,
};

export const AVAILABLE_HABIT_ICONS = Object.keys(HABIT_ICON_MAP);

export const AVAILABLE_HABIT_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#ef4444", // Rose/Red
  "#eab308", // Amber
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

interface HabitIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export function HabitIcon({
  name,
  size = 18,
  className = "",
  color,
}: HabitIconProps) {
  const IconComponent = HABIT_ICON_MAP[name] || Sparkles;

  return (
    <IconComponent
      size={size}
      className={className}
      style={color ? { color } : undefined}
    />
  );
}
