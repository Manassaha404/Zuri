import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MeetingItem,
  MeetingType,
  MeetingViewTab,
  ActionItem,
  MeetingFilterState,
} from "../components/meetings/types";

interface MeetingStore {
  meetings: MeetingItem[];
  activeTab: MeetingViewTab;
  filters: MeetingFilterState;

  // Tab & Filter Actions
  setActiveTab: (tab: MeetingViewTab) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: "all" | MeetingType) => void;
  setTagFilter: (tag: string | null) => void;
  resetFilters: () => void;

  // Hydration & Optimistic Entity Actions
  setMeetings: (meetings: MeetingItem[]) => void;
  addMeeting: (
    meeting: Omit<MeetingItem, "id" | "createdAt" | "updatedAt">,
  ) => MeetingItem;
  updateMeeting: (id: string, updates: Partial<MeetingItem>) => void;
  deleteMeeting: (id: string) => void;

  // Optimistic Action Items Actions
  addActionItem: (
    meetingId: string,
    item: Omit<ActionItem, "id" | "completed" | "convertedToTask">,
  ) => void;
  toggleActionItem: (meetingId: string, actionItemId: string) => void;
  deleteActionItem: (meetingId: string, actionItemId: string) => void;
  convertActionItemToTask: (meetingId: string, actionItemId: string) => void;
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set) => ({
      meetings: [],
      activeTab: "upcoming",
      filters: {
        searchQuery: "",
        typeFilter: "all",
        tagFilter: null,
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      setTypeFilter: (type) =>
        set((state) => ({
          filters: { ...state.filters, typeFilter: type },
        })),

      setTagFilter: (tag) =>
        set((state) => ({
          filters: { ...state.filters, tagFilter: tag },
        })),

      resetFilters: () =>
        set({
          filters: {
            searchQuery: "",
            typeFilter: "all",
            tagFilter: null,
          },
        }),

      setMeetings: (meetings) => set({ meetings }),

      addMeeting: (meetingData) => {
        const id = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();
        const newMeeting: MeetingItem = {
          ...meetingData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          meetings: [newMeeting, ...state.meetings],
        }));

        return newMeeting;
      },

      updateMeeting: (id, updates) => {
        set((state) => ({
          meetings: state.meetings.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item,
          ),
        }));
      },

      deleteMeeting: (id) => {
        set((state) => ({
          meetings: state.meetings.filter((item) => item.id !== id),
        }));
      },

      addActionItem: (meetingId, item) => {
        const newAction: ActionItem = {
          ...item,
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          completed: false,
          convertedToTask: false,
        };

        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  actionItems: [...m.actionItems, newAction],
                  updatedAt: new Date().toISOString(),
                }
              : m,
          ),
        }));
      },

      toggleActionItem: (meetingId, actionItemId) => {
        set((state) => ({
          meetings: state.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            return {
              ...m,
              actionItems: m.actionItems.map((act) =>
                act.id === actionItemId
                  ? { ...act, completed: !act.completed }
                  : act,
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteActionItem: (meetingId, actionItemId) => {
        set((state) => ({
          meetings: state.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            return {
              ...m,
              actionItems: m.actionItems.filter(
                (act) => act.id !== actionItemId,
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      convertActionItemToTask: (meetingId, actionItemId) => {
        set((state) => ({
          meetings: state.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            return {
              ...m,
              actionItems: m.actionItems.map((act) =>
                act.id === actionItemId
                  ? { ...act, convertedToTask: true }
                  : act,
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
    }),
    {
      name: "zuri-meeting-ui",
      partialize: (state) => ({
        activeTab: state.activeTab,
        filters: state.filters,
      }),
    },
  ),
);
