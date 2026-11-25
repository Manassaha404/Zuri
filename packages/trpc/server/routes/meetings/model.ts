import { z } from "zod";

export const meetingTypeSchema = z.enum([
  "class",
  "standup",
  "1:1",
  "interview",
  "other",
]);

export const meetingReminderOffsetSchema = z.enum([
  "none",
  "5m",
  "10m",
  "15m",
  "30m",
  "1h",
]);

export const meetingAttendeeSchema = z.object({
  name: z.string().trim().min(1, "Attendee name is required"),
  email: z.string().trim().min(1, "Attendee email is required"),
  avatar: z.string().trim().optional(),
});

export const meetingActionItemInputSchema = z.object({
  text: z.string().trim().min(1, "Action item text is required"),
  completed: z.boolean().optional(),
  owner: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  convertedToTask: z.boolean().optional(),
});

export const createMeetingDto = z.object({
  title: z.string().trim().min(1, "Meeting title is required"),
  date: z.string().trim().min(1, "Meeting date is required"),
  startTime: z.string().trim().min(1, "Start time is required"),
  endTime: z.string().trim().min(1, "End time is required"),
  locationOrLink: z.string().trim().optional(),
  type: meetingTypeSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  agendaMarkdown: z.string().optional(),
  notesMarkdown: z.string().optional(),
  attendees: z.array(meetingAttendeeSchema).optional(),
  reminders: z.array(meetingReminderOffsetSchema).optional(),
  actionItems: z.array(meetingActionItemInputSchema).optional(),
});
export type CreateMeetingDto = z.infer<typeof createMeetingDto>;

export const updateMeetingDto = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
  title: z.string().trim().min(1).optional(),
  date: z.string().trim().min(1).optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
  locationOrLink: z.string().trim().nullable().optional(),
  type: meetingTypeSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  agendaMarkdown: z.string().optional(),
  notesMarkdown: z.string().optional(),
  isArchived: z.boolean().optional(),
  attendees: z.array(meetingAttendeeSchema).optional(),
  reminders: z.array(meetingReminderOffsetSchema).optional(),
  actionItems: z.array(meetingActionItemInputSchema).optional(),
});
export type UpdateMeetingDto = z.infer<typeof updateMeetingDto>;

export const meetingIdDto = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
});
export type MeetingIdDto = z.infer<typeof meetingIdDto>;

export const addActionItemDto = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
  text: z.string().trim().min(1, "Action item text is required"),
  owner: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
});
export type AddActionItemDto = z.infer<typeof addActionItemDto>;

export const actionItemIdDto = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
  actionItemId: z.string().uuid("Invalid action item ID"),
});
export type ActionItemIdDto = z.infer<typeof actionItemIdDto>;
