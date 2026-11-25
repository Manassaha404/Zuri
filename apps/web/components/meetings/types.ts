// Meeting Tracker Types and Interfaces

export type MeetingType = "class" | "standup" | "1:1" | "interview" | "other";

export type MeetingViewTab = "upcoming" | "past" | "calendar";

export type ReminderOffset = "none" | "5m" | "10m" | "15m" | "30m" | "1h";

export interface Attendee {
  name: string;
  email: string;
  avatar?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  owner?: string;
  dueDate?: string; // YYYY-MM-DD
  convertedToTask?: boolean;
}

export interface MeetingItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  locationOrLink?: string;
  attendees: Attendee[];
  type: MeetingType;
  tags: string[];
  agendaMarkdown?: string;
  notesMarkdown?: string;
  reminders: ReminderOffset[];
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingFilterState {
  searchQuery: string;
  typeFilter: "all" | MeetingType;
  tagFilter: string | null;
}
