import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import MeetingService from "../../../meetings";

const meetingService = new MeetingService();

// Extract authenticated user ID from FastMCP session context
function requireUserId(context: any): string {
  const userId = context?.session?.userId;
  if (!userId) {
    throw new UserError(
      "Unauthorized: This tool requires an authenticated user session.",
    );
  }
  return userId;
}

const meetingTypeEnum = z.enum([
  "class",
  "standup",
  "1:1",
  "interview",
  "other",
]);

const reminderOffsetEnum = z.enum(["none", "5m", "10m", "15m", "30m", "1h"]);

const attendeeSchema = z.object({
  name: z.string().trim().min(1).describe("Attendee full name"),
  email: z.string().trim().min(1).describe("Attendee email address"),
  avatar: z.string().trim().optional().describe("Optional avatar URL"),
});

const actionItemInputSchema = z.object({
  text: z.string().trim().min(1).describe("Action item description"),
  completed: z.boolean().optional().describe("Whether it is completed"),
  owner: z.string().trim().optional().describe("Person responsible"),
  dueDate: z
    .string()
    .trim()
    .optional()
    .describe("Optional due date in YYYY-MM-DD format"),
  convertedToTask: z
    .boolean()
    .optional()
    .describe("Whether converted to a standalone task"),
});

export const meetingTools = [
  // Workspace & Stats
  {
    name: "meetings_get_workspace",
    description:
      "Retrieve the complete meetings workspace including all non-archived meetings (with attendees, action items, reminders, markdown agendas and notes) and workspace statistics for the authenticated user.",
    parameters: z.object({}),
    execute: async (_args: {}, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.getUserMeetingWorkspace(userId);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to get meetings workspace",
        );
      }
    },
  },

  // Single Meeting Lookup
  {
    name: "meetings_get_meeting_by_id",
    description:
      "Get a single meeting with its attendees, action items, and reminders by meetingId.",
    parameters: z.object({
      meetingId: z.string().uuid().describe("Unique identifier of the meeting"),
    }),
    execute: async (args: { meetingId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.getMeetingById(
          args.meetingId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to get meeting");
      }
    },
  },

  // Create Meeting
  {
    name: "meetings_create_meeting",
    description:
      "Schedule a new meeting with title, date (YYYY-MM-DD), startTime & endTime (HH:mm 24h), optional location/video link, type, tags, markdown agenda & notes, attendees, reminders, and initial action items.",
    parameters: z.object({
      title: z.string().trim().min(1).describe("Title of the meeting"),
      date: z
        .string()
        .trim()
        .min(1)
        .describe("Meeting date in YYYY-MM-DD format"),
      startTime: z
        .string()
        .trim()
        .min(1)
        .describe("Start time in HH:mm 24-hour format (e.g. '10:00')"),
      endTime: z
        .string()
        .trim()
        .min(1)
        .describe("End time in HH:mm 24-hour format (e.g. '10:45')"),
      locationOrLink: z
        .string()
        .trim()
        .optional()
        .describe("Physical room or video call URL"),
      type: meetingTypeEnum
        .optional()
        .describe("Meeting type (default: 'other')"),
      tags: z
        .array(z.string().trim().min(1))
        .optional()
        .describe("Tags for categorizing the meeting"),
      agendaMarkdown: z
        .string()
        .optional()
        .describe("Markdown-formatted meeting agenda"),
      notesMarkdown: z
        .string()
        .optional()
        .describe("Markdown-formatted discussion notes"),
      attendees: z
        .array(attendeeSchema)
        .optional()
        .describe("List of attendees with name and email"),
      reminders: z
        .array(reminderOffsetEnum)
        .optional()
        .describe("Reminder offsets before meeting start"),
      actionItems: z
        .array(actionItemInputSchema)
        .optional()
        .describe("Initial action items for the meeting"),
    }),
    execute: async (
      args: z.infer<
        z.ZodObject<{
          title: z.ZodString;
          date: z.ZodString;
          startTime: z.ZodString;
          endTime: z.ZodString;
          locationOrLink: z.ZodOptional<z.ZodString>;
          type: z.ZodOptional<typeof meetingTypeEnum>;
          tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
          agendaMarkdown: z.ZodOptional<z.ZodString>;
          notesMarkdown: z.ZodOptional<z.ZodString>;
          attendees: z.ZodOptional<z.ZodArray<typeof attendeeSchema>>;
          reminders: z.ZodOptional<z.ZodArray<typeof reminderOffsetEnum>>;
          actionItems: z.ZodOptional<z.ZodArray<typeof actionItemInputSchema>>;
        }>
      >,
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.createMeeting(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to create meeting");
      }
    },
  },

  // Update Meeting
  {
    name: "meetings_update_meeting",
    description:
      "Update an existing meeting's details, markdown agenda/notes, attendees, reminders, tags, or archive status.",
    parameters: z.object({
      meetingId: z
        .string()
        .uuid()
        .describe("Unique identifier of the meeting to update"),
      title: z.string().trim().min(1).optional().describe("Updated title"),
      date: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Updated date in YYYY-MM-DD format"),
      startTime: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Updated start time in HH:mm 24h format"),
      endTime: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Updated end time in HH:mm 24h format"),
      locationOrLink: z
        .string()
        .trim()
        .nullable()
        .optional()
        .describe("Updated room or video call URL (null to clear)"),
      type: meetingTypeEnum.optional().describe("Updated meeting type"),
      tags: z
        .array(z.string().trim().min(1))
        .optional()
        .describe("Replaced list of tags"),
      agendaMarkdown: z.string().optional().describe("Updated Markdown agenda"),
      notesMarkdown: z
        .string()
        .optional()
        .describe("Updated Markdown discussion notes"),
      isArchived: z
        .boolean()
        .optional()
        .describe("Archive or unarchive the meeting"),
      attendees: z
        .array(attendeeSchema)
        .optional()
        .describe("Replaced list of attendees"),
      reminders: z
        .array(reminderOffsetEnum)
        .optional()
        .describe("Replaced list of reminder offsets"),
      actionItems: z
        .array(actionItemInputSchema)
        .optional()
        .describe("Replaced list of action items"),
    }),
    execute: async (args: any, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.updateMeeting(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to update meeting");
      }
    },
  },

  // Delete Meeting
  {
    name: "meetings_delete_meeting",
    description:
      "Permanently delete a meeting and all of its attendees, action items, and reminders.",
    parameters: z.object({
      meetingId: z
        .string()
        .uuid()
        .describe("Unique identifier of the meeting to delete"),
    }),
    execute: async (args: { meetingId: string }, context: any) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.deleteMeeting(
          args.meetingId,
          userId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete meeting");
      }
    },
  },

  // Add Action Item
  {
    name: "meetings_add_action_item",
    description:
      "Add a follow-up action item to a meeting with optional owner and dueDate (YYYY-MM-DD).",
    parameters: z.object({
      meetingId: z.string().uuid().describe("Unique identifier of the meeting"),
      text: z.string().trim().min(1).describe("Action item description"),
      owner: z
        .string()
        .trim()
        .optional()
        .describe("Person assigned to complete the action item"),
      dueDate: z
        .string()
        .trim()
        .optional()
        .describe("Optional due date in YYYY-MM-DD format"),
    }),
    execute: async (
      args: {
        meetingId: string;
        text: string;
        owner?: string;
        dueDate?: string;
      },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.addActionItem(userId, args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to add action item");
      }
    },
  },

  // Toggle Action Item
  {
    name: "meetings_toggle_action_item",
    description:
      "Toggle the completed status of a meeting action item between completed and pending.",
    parameters: z.object({
      meetingId: z.string().uuid().describe("Meeting ID"),
      actionItemId: z.string().uuid().describe("Action item ID to toggle"),
    }),
    execute: async (
      args: { meetingId: string; actionItemId: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.toggleActionItem(
          args.meetingId,
          args.actionItemId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to toggle action item");
      }
    },
  },

  // Delete Action Item
  {
    name: "meetings_delete_action_item",
    description: "Remove an action item from a meeting.",
    parameters: z.object({
      meetingId: z.string().uuid().describe("Meeting ID"),
      actionItemId: z.string().uuid().describe("Action item ID to delete"),
    }),
    execute: async (
      args: { meetingId: string; actionItemId: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.deleteActionItem(
          args.meetingId,
          args.actionItemId,
          userId,
        );
        return JSON.stringify(result);
      } catch (error: any) {
        throw new UserError(error.message || "Failed to delete action item");
      }
    },
  },

  // Convert Action Item to Task
  {
    name: "meetings_convert_action_item_to_task",
    description:
      "Mark a meeting action item as converted to a standalone task.",
    parameters: z.object({
      meetingId: z.string().uuid().describe("Meeting ID"),
      actionItemId: z
        .string()
        .uuid()
        .describe("Action item ID to mark as converted"),
    }),
    execute: async (
      args: { meetingId: string; actionItemId: string },
      context: any,
    ) => {
      const userId = requireUserId(context);
      try {
        const result = await meetingService.convertActionItemToTask(
          args.meetingId,
          args.actionItemId,
          userId,
        );
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        throw new UserError(
          error.message || "Failed to convert action item to task",
        );
      }
    },
  },
];

export function registerMeetingTools(server: FastMCP<any>) {
  for (const tool of meetingTools) {
    server.addTool(tool as any);
  }
}
