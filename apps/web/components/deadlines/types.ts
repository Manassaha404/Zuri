// Domain types for Deadline Tracker
export interface DeadlineCategoryItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  isSystem: boolean;
}

export type DeadlinePriority = "low" | "medium" | "high" | "urgent";

export type DeadlineStatus = "upcoming" | "in_progress" | "done" | "missed";

export type UrgencyLevel = "green" | "amber" | "red" | "critical";

export type ReminderOffset =
  | "1_hour"
  | "1_day"
  | "3_days"
  | "1_week"
  | "2_weeks";

export type RecurrenceType =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export interface DeadlineItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: DeadlinePriority;
  status: DeadlineStatus;

  // Dates & Times
  dueDate: string;
  softDueDate?: string;
  completedAt?: string;

  // Reminders
  reminders: ReminderOffset[];

  // Recurrence
  recurrence: RecurrenceType;

  // Audit
  createdAt: string;
  updatedAt: string;
}

export type DeadlineViewTab = "nearest" | "this_week" | "calendar" | "stats";

export interface DeadlineStats {
  total: number;
  completed: number;
  onTimeCount: number;
  missedCount: number;
  onTimeRate: number;
  atRiskCount: number;
}
