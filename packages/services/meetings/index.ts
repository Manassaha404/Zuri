// Meeting Service - Core business logic for meetings, attendees, action items, and reminders
import db, { eq, and, asc, inArray } from "@repo/database";
import {
  meetings,
  meetingAttendees,
  meetingActionItems,
  meetingReminders,
  type Meeting,
  type MeetingAttendee,
  type MeetingActionItem,
  type MeetingReminder,
} from "@repo/database/models";
import { AppError } from "@repo/error";

export type MeetingType = "class" | "standup" | "1:1" | "interview" | "other";

export type MeetingReminderOffset =
  | "none"
  | "5m"
  | "10m"
  | "15m"
  | "30m"
  | "1h";

export interface MeetingAttendeeInput {
  name: string;
  email: string;
  avatar?: string;
}

export interface MeetingActionItemInput {
  text: string;
  completed?: boolean;
  owner?: string;
  dueDate?: string;
  convertedToTask?: boolean;
}

export interface CreateMeetingInput {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  locationOrLink?: string;
  type?: MeetingType;
  tags?: string[];
  agendaMarkdown?: string;
  notesMarkdown?: string;
  attendees?: MeetingAttendeeInput[];
  reminders?: MeetingReminderOffset[];
  actionItems?: MeetingActionItemInput[];
}

export interface UpdateMeetingInput {
  meetingId: string;
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  locationOrLink?: string | null;
  type?: MeetingType;
  tags?: string[];
  agendaMarkdown?: string;
  notesMarkdown?: string;
  isArchived?: boolean;
  attendees?: MeetingAttendeeInput[];
  reminders?: MeetingReminderOffset[];
  actionItems?: MeetingActionItemInput[];
}

export interface AddActionItemInput {
  meetingId: string;
  text: string;
  owner?: string;
  dueDate?: string;
}

export interface HydratedMeeting extends Meeting {
  attendees: MeetingAttendee[];
  actionItems: MeetingActionItem[];
  reminders: MeetingReminderOffset[];
}

export class MeetingService {
  // Hydrate meetings with attendees, action items, and reminders
  private async hydrateMeetings(
    meetingRows: Meeting[],
  ): Promise<HydratedMeeting[]> {
    if (meetingRows.length === 0) return [];

    const meetingIds = meetingRows.map((m) => m.meetingId);

    const [attendeeRows, actionItemRows, reminderRows] = await Promise.all([
      db
        .select()
        .from(meetingAttendees)
        .where(inArray(meetingAttendees.meetingId, meetingIds))
        .orderBy(asc(meetingAttendees.createdAt)),
      db
        .select()
        .from(meetingActionItems)
        .where(inArray(meetingActionItems.meetingId, meetingIds))
        .orderBy(asc(meetingActionItems.createdAt)),
      db
        .select()
        .from(meetingReminders)
        .where(inArray(meetingReminders.meetingId, meetingIds))
        .orderBy(asc(meetingReminders.createdAt)),
    ]);

    const attendeesMap = new Map<string, MeetingAttendee[]>();
    for (const a of attendeeRows) {
      const list = attendeesMap.get(a.meetingId) || [];
      list.push(a);
      attendeesMap.set(a.meetingId, list);
    }

    const actionItemsMap = new Map<string, MeetingActionItem[]>();
    for (const item of actionItemRows) {
      const list = actionItemsMap.get(item.meetingId) || [];
      list.push(item);
      actionItemsMap.set(item.meetingId, list);
    }

    const remindersMap = new Map<string, MeetingReminderOffset[]>();
    for (const r of reminderRows) {
      const list = remindersMap.get(r.meetingId) || [];
      list.push(r.offset as MeetingReminderOffset);
      remindersMap.set(r.meetingId, list);
    }

    return meetingRows.map((m) => ({
      ...m,
      attendees: attendeesMap.get(m.meetingId) || [],
      actionItems: actionItemsMap.get(m.meetingId) || [],
      reminders: remindersMap.get(m.meetingId) || [],
    }));
  }

  // Get full meeting workspace for user
  async getUserMeetingWorkspace(userId: string): Promise<{
    meetings: HydratedMeeting[];
    stats: {
      total: number;
      upcomingCount: number;
      pastCount: number;
      pendingActionItemsCount: number;
    };
  }> {
    const rows = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.userId, userId), eq(meetings.isArchived, false)))
      .orderBy(asc(meetings.date), asc(meetings.startTime));

    const hydrated = await this.hydrateMeetings(rows);

    const todayStr = new Date().toISOString().slice(0, 10);
    const upcomingCount = hydrated.filter((m) => m.date >= todayStr).length;
    const pastCount = hydrated.filter((m) => m.date < todayStr).length;
    const pendingActionItemsCount = hydrated.reduce(
      (acc, m) => acc + m.actionItems.filter((a) => !a.completed).length,
      0,
    );

    return {
      meetings: hydrated,
      stats: {
        total: hydrated.length,
        upcomingCount,
        pastCount,
        pendingActionItemsCount,
      },
    };
  }

  // Get single meeting by id
  async getMeetingById(
    meetingId: string,
    userId: string,
  ): Promise<HydratedMeeting> {
    const [row] = await db
      .select()
      .from(meetings)
      .where(
        and(eq(meetings.meetingId, meetingId), eq(meetings.userId, userId)),
      );

    if (!row) {
      throw new AppError("NOT_FOUND", "Meeting not found");
    }

    const [hydrated] = await this.hydrateMeetings([row]);
    if (!hydrated) {
      throw new AppError("NOT_FOUND", "Meeting not found");
    }

    return hydrated;
  }

  // Create meeting with optional attendees, reminders, and action items
  async createMeeting(
    userId: string,
    input: CreateMeetingInput,
  ): Promise<HydratedMeeting> {
    const title = input.title.trim();
    if (!title) {
      throw new AppError("BAD_REQUEST", "Meeting title is required");
    }

    const [created] = await db
      .insert(meetings)
      .values({
        userId,
        title,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        locationOrLink: input.locationOrLink?.trim() || null,
        type: input.type || "other",
        tags: input.tags || [],
        agendaMarkdown: input.agendaMarkdown || "",
        notesMarkdown: input.notesMarkdown || "",
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create meeting");
    }

    if (input.attendees && input.attendees.length > 0) {
      await db.insert(meetingAttendees).values(
        input.attendees.map((a) => ({
          meetingId: created.meetingId,
          name: a.name.trim(),
          email: a.email.trim(),
          avatar: a.avatar || null,
        })),
      );
    }

    const validReminders = (input.reminders || []).filter((r) => r !== "none");
    if (validReminders.length > 0) {
      await db.insert(meetingReminders).values(
        validReminders.map((offset) => ({
          meetingId: created.meetingId,
          offset,
        })),
      );
    }

    if (input.actionItems && input.actionItems.length > 0) {
      await db.insert(meetingActionItems).values(
        input.actionItems.map((item) => ({
          meetingId: created.meetingId,
          userId,
          text: item.text.trim(),
          completed: Boolean(item.completed),
          owner: item.owner?.trim() || null,
          dueDate: item.dueDate || null,
          convertedToTask: Boolean(item.convertedToTask),
        })),
      );
    }

    return await this.getMeetingById(created.meetingId, userId);
  }

  // Update meeting and optionally sync attendees, reminders, or action items
  async updateMeeting(
    userId: string,
    input: UpdateMeetingInput,
  ): Promise<HydratedMeeting> {
    const [existing] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.meetingId, input.meetingId),
          eq(meetings.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Meeting not found");
    }

    const updateValues: Partial<typeof meetings.$inferInsert> = {};
    if (input.title !== undefined) updateValues.title = input.title.trim();
    if (input.date !== undefined) updateValues.date = input.date;
    if (input.startTime !== undefined) updateValues.startTime = input.startTime;
    if (input.endTime !== undefined) updateValues.endTime = input.endTime;
    if (input.locationOrLink !== undefined) {
      updateValues.locationOrLink = input.locationOrLink
        ? input.locationOrLink.trim()
        : null;
    }
    if (input.type !== undefined) updateValues.type = input.type;
    if (input.tags !== undefined) updateValues.tags = input.tags;
    if (input.agendaMarkdown !== undefined)
      updateValues.agendaMarkdown = input.agendaMarkdown;
    if (input.notesMarkdown !== undefined)
      updateValues.notesMarkdown = input.notesMarkdown;
    if (input.isArchived !== undefined)
      updateValues.isArchived = input.isArchived;

    if (Object.keys(updateValues).length > 0) {
      await db
        .update(meetings)
        .set(updateValues)
        .where(
          and(
            eq(meetings.meetingId, input.meetingId),
            eq(meetings.userId, userId),
          ),
        );
    }

    if (input.attendees !== undefined) {
      await db
        .delete(meetingAttendees)
        .where(eq(meetingAttendees.meetingId, input.meetingId));

      if (input.attendees.length > 0) {
        await db.insert(meetingAttendees).values(
          input.attendees.map((a) => ({
            meetingId: input.meetingId,
            name: a.name.trim(),
            email: a.email.trim(),
            avatar: a.avatar || null,
          })),
        );
      }
    }

    if (input.reminders !== undefined) {
      await db
        .delete(meetingReminders)
        .where(eq(meetingReminders.meetingId, input.meetingId));

      const validReminders = input.reminders.filter((r) => r !== "none");
      if (validReminders.length > 0) {
        await db.insert(meetingReminders).values(
          validReminders.map((offset) => ({
            meetingId: input.meetingId,
            offset,
          })),
        );
      }
    }

    if (input.actionItems !== undefined) {
      await db
        .delete(meetingActionItems)
        .where(eq(meetingActionItems.meetingId, input.meetingId));

      if (input.actionItems.length > 0) {
        await db.insert(meetingActionItems).values(
          input.actionItems.map((item) => ({
            meetingId: input.meetingId,
            userId,
            text: item.text.trim(),
            completed: Boolean(item.completed),
            owner: item.owner?.trim() || null,
            dueDate: item.dueDate || null,
            convertedToTask: Boolean(item.convertedToTask),
          })),
        );
      }
    }

    return await this.getMeetingById(input.meetingId, userId);
  }

  // Delete meeting permanently
  async deleteMeeting(
    meetingId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(meetings)
      .where(
        and(eq(meetings.meetingId, meetingId), eq(meetings.userId, userId)),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Meeting not found");
    }

    await db
      .delete(meetings)
      .where(
        and(eq(meetings.meetingId, meetingId), eq(meetings.userId, userId)),
      );

    return { success: true };
  }

  // Add action item to a meeting
  async addActionItem(
    userId: string,
    input: AddActionItemInput,
  ): Promise<MeetingActionItem> {
    const [existing] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.meetingId, input.meetingId),
          eq(meetings.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Meeting not found");
    }

    const text = input.text.trim();
    if (!text) {
      throw new AppError("BAD_REQUEST", "Action item text is required");
    }

    const [created] = await db
      .insert(meetingActionItems)
      .values({
        meetingId: input.meetingId,
        userId,
        text,
        completed: false,
        owner: input.owner?.trim() || null,
        dueDate: input.dueDate || null,
        convertedToTask: false,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to add action item");
    }

    return created;
  }

  // Toggle action item completion status
  async toggleActionItem(
    meetingId: string,
    actionItemId: string,
    userId: string,
  ): Promise<MeetingActionItem> {
    const [existing] = await db
      .select()
      .from(meetingActionItems)
      .where(
        and(
          eq(meetingActionItems.actionItemId, actionItemId),
          eq(meetingActionItems.meetingId, meetingId),
          eq(meetingActionItems.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Action item not found");
    }

    const [updated] = await db
      .update(meetingActionItems)
      .set({ completed: !existing.completed })
      .where(
        and(
          eq(meetingActionItems.actionItemId, actionItemId),
          eq(meetingActionItems.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Failed to toggle action item",
      );
    }

    return updated;
  }

  // Delete action item
  async deleteActionItem(
    meetingId: string,
    actionItemId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(meetingActionItems)
      .where(
        and(
          eq(meetingActionItems.actionItemId, actionItemId),
          eq(meetingActionItems.meetingId, meetingId),
          eq(meetingActionItems.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Action item not found");
    }

    await db
      .delete(meetingActionItems)
      .where(
        and(
          eq(meetingActionItems.actionItemId, actionItemId),
          eq(meetingActionItems.userId, userId),
        ),
      );

    return { success: true };
  }

  // Mark action item as converted to task
  async convertActionItemToTask(
    meetingId: string,
    actionItemId: string,
    userId: string,
  ): Promise<MeetingActionItem> {
    const [existing] = await db
      .select()
      .from(meetingActionItems)
      .where(
        and(
          eq(meetingActionItems.actionItemId, actionItemId),
          eq(meetingActionItems.meetingId, meetingId),
          eq(meetingActionItems.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Action item not found");
    }

    const [updated] = await db
      .update(meetingActionItems)
      .set({ convertedToTask: true })
      .where(
        and(
          eq(meetingActionItems.actionItemId, actionItemId),
          eq(meetingActionItems.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Failed to convert action item",
      );
    }

    return updated;
  }
}

export default MeetingService;
