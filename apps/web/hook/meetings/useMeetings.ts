// Hook managing meeting workspace queries, mutations, and synchronization with meetingStore
"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useMeetingStore } from "@/store/meetingStore";
import type {
  MeetingItem,
  MeetingType,
  ReminderOffset,
  ActionItem,
  Attendee,
} from "@/components/meetings/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val: unknown): val is string =>
  typeof val === "string" && UUID_REGEX.test(val);

export function useMeetings() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);

  const {
    meetings,
    activeTab,
    filters,
    setActiveTab,
    setSearchQuery,
    setTypeFilter,
    setTagFilter,
    resetFilters,
    setMeetings: storeSetMeetings,
    addMeeting: storeAddMeeting,
    updateMeeting: storeUpdateMeeting,
    deleteMeeting: storeDeleteMeeting,
    addActionItem: storeAddActionItem,
    toggleActionItem: storeToggleActionItem,
    deleteActionItem: storeDeleteActionItem,
    convertActionItemToTask: storeConvertActionItemToTask,
  } = useMeetingStore();

  const utils = trpc.useUtils();

  // Query meeting workspace from PostgreSQL
  const workspaceQuery = trpc.meetings.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  // Sync database records directly into Zustand store
  useEffect(() => {
    if (workspaceQuery.data && "meetings" in workspaceQuery.data) {
      const rawMeetings = (workspaceQuery.data.meetings || []) as any[];

      const normalized: MeetingItem[] = rawMeetings.map((m) => ({
        id: m.meetingId || m.id,
        title: m.title,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        locationOrLink: m.locationOrLink || undefined,
        attendees: ((m.attendees || []) as any[]).map(
          (a): Attendee => ({
            name: a.name,
            email: a.email,
            avatar: a.avatar || undefined,
          }),
        ),
        type: (m.type as MeetingType) || "other",
        tags: (m.tags as string[]) || [],
        agendaMarkdown: m.agendaMarkdown || "",
        notesMarkdown: m.notesMarkdown || "",
        reminders: (m.reminders as ReminderOffset[]) || [],
        actionItems: ((m.actionItems || []) as any[]).map(
          (act): ActionItem => ({
            id: act.actionItemId || act.id,
            text: act.text,
            completed: Boolean(act.completed),
            owner: act.owner || undefined,
            dueDate: act.dueDate || undefined,
            convertedToTask: Boolean(act.convertedToTask),
          }),
        ),
        createdAt:
          typeof m.createdAt === "string"
            ? m.createdAt
            : new Date(m.createdAt).toISOString(),
        updatedAt:
          typeof m.updatedAt === "string"
            ? m.updatedAt
            : new Date(m.updatedAt).toISOString(),
      }));

      storeSetMeetings(normalized);
    }
  }, [workspaceQuery.data, storeSetMeetings]);

  // Mutation: Create Meeting
  const createMutation = trpc.meetings.createMeeting.useMutation({
    onSuccess: () => {
      utils.meetings.getWorkspace.invalidate();
    },
  });

  const addMeeting = useCallback(
    async (item: Omit<MeetingItem, "id" | "createdAt" | "updatedAt">) => {
      const optimistic = storeAddMeeting(item);

      if (userId) {
        try {
          const res = await createMutation.mutateAsync({
            title: item.title,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            locationOrLink: item.locationOrLink,
            type: item.type,
            tags: item.tags,
            agendaMarkdown: item.agendaMarkdown,
            notesMarkdown: item.notesMarkdown,
            attendees: item.attendees,
            reminders: item.reminders,
            actionItems: item.actionItems.map((a) => ({
              text: a.text,
              completed: a.completed,
              owner: a.owner,
              dueDate: a.dueDate,
              convertedToTask: a.convertedToTask,
            })),
          });
          utils.meetings.getWorkspace.invalidate();
          return res;
        } catch (err) {
          console.error("Failed to sync created meeting with database:", err);
          utils.meetings.getWorkspace.invalidate();
        }
      }

      return optimistic;
    },
    [userId, storeAddMeeting, createMutation, utils.meetings.getWorkspace],
  );

  // Mutation: Update Meeting
  const updateMutation = trpc.meetings.updateMeeting.useMutation({
    onSuccess: () => {
      utils.meetings.getWorkspace.invalidate();
    },
  });

  const updateMeeting = useCallback(
    async (id: string, updates: Partial<MeetingItem>) => {
      storeUpdateMeeting(id, updates);

      if (userId && isUuid(id)) {
        try {
          const res = await updateMutation.mutateAsync({
            meetingId: id,
            title: updates.title,
            date: updates.date,
            startTime: updates.startTime,
            endTime: updates.endTime,
            locationOrLink:
              updates.locationOrLink !== undefined
                ? updates.locationOrLink || null
                : undefined,
            type: updates.type,
            tags: updates.tags,
            agendaMarkdown: updates.agendaMarkdown,
            notesMarkdown: updates.notesMarkdown,
            attendees: updates.attendees,
            reminders: updates.reminders,
            actionItems: updates.actionItems?.map((a) => ({
              text: a.text,
              completed: a.completed,
              owner: a.owner,
              dueDate: a.dueDate,
              convertedToTask: a.convertedToTask,
            })),
          });
          return res;
        } catch (err) {
          console.error("Failed to sync updated meeting with database:", err);
          utils.meetings.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeUpdateMeeting, updateMutation, utils.meetings.getWorkspace],
  );

  // Mutation: Delete Meeting
  const deleteMutation = trpc.meetings.deleteMeeting.useMutation({
    onSuccess: () => {
      utils.meetings.getWorkspace.invalidate();
    },
  });

  const deleteMeeting = useCallback(
    async (id: string) => {
      storeDeleteMeeting(id);

      if (userId && isUuid(id)) {
        try {
          await deleteMutation.mutateAsync({ meetingId: id });
        } catch (err) {
          console.error("Failed to delete meeting on server:", err);
          utils.meetings.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeDeleteMeeting, deleteMutation, utils.meetings.getWorkspace],
  );

  // Mutation: Add Action Item
  const addActionItemMutation = trpc.meetings.addActionItem.useMutation({
    onSuccess: () => {
      utils.meetings.getWorkspace.invalidate();
    },
  });

  const addActionItem = useCallback(
    async (
      meetingId: string,
      item: Omit<ActionItem, "id" | "completed" | "convertedToTask">,
    ) => {
      storeAddActionItem(meetingId, item);

      if (userId && isUuid(meetingId)) {
        try {
          await addActionItemMutation.mutateAsync({
            meetingId,
            text: item.text,
            owner: item.owner,
            dueDate: item.dueDate,
          });
        } catch (err) {
          console.error("Failed to add action item on server:", err);
          utils.meetings.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeAddActionItem,
      addActionItemMutation,
      utils.meetings.getWorkspace,
    ],
  );

  // Mutation: Toggle Action Item
  const toggleActionItemMutation = trpc.meetings.toggleActionItem.useMutation({
    onSuccess: () => {
      utils.meetings.getWorkspace.invalidate();
    },
  });

  const toggleActionItem = useCallback(
    async (meetingId: string, actionItemId: string) => {
      storeToggleActionItem(meetingId, actionItemId);

      if (userId && isUuid(meetingId) && isUuid(actionItemId)) {
        try {
          await toggleActionItemMutation.mutateAsync({
            meetingId,
            actionItemId,
          });
        } catch (err) {
          console.error("Failed to toggle action item on server:", err);
          utils.meetings.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeToggleActionItem,
      toggleActionItemMutation,
      utils.meetings.getWorkspace,
    ],
  );

  // Mutation: Delete Action Item
  const deleteActionItemMutation = trpc.meetings.deleteActionItem.useMutation({
    onSuccess: () => {
      utils.meetings.getWorkspace.invalidate();
    },
  });

  const deleteActionItem = useCallback(
    async (meetingId: string, actionItemId: string) => {
      storeDeleteActionItem(meetingId, actionItemId);

      if (userId && isUuid(meetingId) && isUuid(actionItemId)) {
        try {
          await deleteActionItemMutation.mutateAsync({
            meetingId,
            actionItemId,
          });
        } catch (err) {
          console.error("Failed to delete action item on server:", err);
          utils.meetings.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeDeleteActionItem,
      deleteActionItemMutation,
      utils.meetings.getWorkspace,
    ],
  );

  // Mutation: Convert Action Item to Task
  const convertActionItemMutation =
    trpc.meetings.convertActionItemToTask.useMutation({
      onSuccess: () => {
        utils.meetings.getWorkspace.invalidate();
      },
    });

  const convertActionItemToTask = useCallback(
    async (meetingId: string, actionItemId: string) => {
      storeConvertActionItemToTask(meetingId, actionItemId);

      if (userId && isUuid(meetingId) && isUuid(actionItemId)) {
        try {
          await convertActionItemMutation.mutateAsync({
            meetingId,
            actionItemId,
          });
        } catch (err) {
          console.error("Failed to convert action item on server:", err);
          utils.meetings.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeConvertActionItemToTask,
      convertActionItemMutation,
      utils.meetings.getWorkspace,
    ],
  );

  return {
    meetings,
    activeTab,
    filters,
    isLoading: workspaceQuery.isLoading,
    isRefetching: workspaceQuery.isRefetching,
    refetch: workspaceQuery.refetch,
    setActiveTab,
    setSearchQuery,
    setTypeFilter,
    setTagFilter,
    resetFilters,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    addActionItem,
    toggleActionItem,
    deleteActionItem,
    convertActionItemToTask,
  };
}
