// Task Tracker Types and Interfaces

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "todo" | "doing" | "done";

export type TaskViewTab =
  | "today"
  | "upcoming"
  | "overdue"
  | "completed"
  | "all";

export type TaskRecurrence =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly";

export type TaskReminderOffset =
  | "none"
  | "at_time"
  | "10m"
  | "30m"
  | "1h"
  | "1d";

export interface SubtaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface TaskProject {
  id: string;
  name: string;
  color: string;
  description?: string;
  status?: ProjectStatus;
  deadline?: string; // YYYY-MM-DD
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  tags: string[];
  subtasks: SubtaskItem[];
  recurrence: TaskRecurrence;
  reminder: TaskReminderOffset;
  estimateMinutes?: number;
  loggedMinutes: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilterState {
  searchQuery: string;
  projectId: string | "all";
  priorityFilter: TaskPriority | "all";
  statusFilter: TaskStatus | "all";
  tagFilter: string | null;
}

export type PomodoroMode = "focus" | "short_break" | "long_break";
