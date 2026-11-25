import { create } from "zustand";
import type {
  MeetingItem,
  MeetingType,
  MeetingViewTab,
  ActionItem,
  Attendee,
  ReminderOffset,
  MeetingFilterState,
} from "../components/meetings/types";

// Seed realistic starter meetings
const getSeedDate = (dayOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SEED_MEETINGS: MeetingItem[] = [
  {
    id: "meet-1",
    title: "Weekly Engineering Standup & Sprint Sync",
    date: getSeedDate(0), // Today
    startTime: "10:00",
    endTime: "10:30",
    locationOrLink: "https://meet.jit.si/zuri-eng-standup",
    attendees: [
      { name: "Alex Rivers", email: "alex@zuri.app" },
      { name: "Elena Rostova", email: "elena@zuri.app" },
      { name: "David Kim", email: "david@zuri.app" },
      { name: "Marcus Chen", email: "marcus@zuri.app" },
    ],
    type: "standup",
    tags: ["Engineering", "Sprint", "Sync"],
    agendaMarkdown: `### Agenda
- **Blockers & High-Priority PRs**: Review pending PR merges for release
- **Architecture**: Database indexing improvements and response latency
- **Deployments**: Production migration schedule for tonight`,
    notesMarkdown: `### Discussion Notes
- Marcus deployed the caching optimization; cache hit ratio reached 94%.
- Elena completed the vector search schema migration.
- David noted potential memory leaks in background streaming workers.`,
    reminders: ["10m", "5m"],
    actionItems: [
      {
        id: "act-1",
        text: "Audit memory usage in background streaming workers",
        completed: false,
        owner: "David Kim",
        dueDate: getSeedDate(1),
        convertedToTask: false,
      },
      {
        id: "act-2",
        text: "Submit PR review for vector query optimizations",
        completed: true,
        owner: "Elena Rostova",
        dueDate: getSeedDate(0),
        convertedToTask: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meet-2",
    title: "1:1 Career Alignment & Growth Review",
    date: getSeedDate(1), // Tomorrow
    startTime: "14:00",
    endTime: "14:45",
    locationOrLink: "Conference Room B (4th Floor)",
    attendees: [
      { name: "Alex Rivers", email: "alex@zuri.app" },
      { name: "Sarah Jenkins", email: "sarah.j@zuri.app" },
    ],
    type: "1:1",
    tags: ["1on1", "Mentorship", "Career"],
    agendaMarkdown: `### Discussion Points
- Quarter 1 accomplishments & milestones delivered
- Feedback on cross-functional technical leadership
- Goals for Quarter 2: Leading the workspace revamp`,
    notesMarkdown: "",
    reminders: ["15m", "1h"],
    actionItems: [
      {
        id: "act-3",
        text: "Draft Q2 personal OKRs and technical vision doc",
        completed: false,
        owner: "Alex Rivers",
        dueDate: getSeedDate(3),
        convertedToTask: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meet-3",
    title: "Distributed Systems & Consensus Lecture",
    date: getSeedDate(2),
    startTime: "09:00",
    endTime: "10:30",
    locationOrLink: "Room 304, Turing Hall",
    attendees: [
      { name: "Prof. Alan Foster", email: "foster@university.edu" },
      { name: "Alex Rivers", email: "alex@zuri.app" },
    ],
    type: "class",
    tags: ["Academics", "Distributed Systems", "Raft"],
    agendaMarkdown: `### Lecture Scope
- Raft vs Paxos: leader election, log replication, and split-brain safety
- Handling network partitions and Byzantine faults in practical clusters`,
    notesMarkdown: `### Key Takeaways
- Raft decomposes consensus into leader election, log replication, and safety invariants.
- Quorum size calculation: $Q = \\lfloor n/2 \\rfloor + 1$.`,
    reminders: ["30m"],
    actionItems: [
      {
        id: "act-4",
        text: "Complete Raft consensus simulation assignment Part 2",
        completed: false,
        owner: "Alex Rivers",
        dueDate: getSeedDate(5),
        convertedToTask: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meet-4",
    title: "Technical Interview: Senior Backend Architect Candidate",
    date: getSeedDate(4),
    startTime: "16:00",
    endTime: "17:00",
    locationOrLink: "https://meet.jit.si/interview-candidate-arch-98",
    attendees: [
      { name: "Alex Rivers", email: "alex@zuri.app" },
      { name: "Rachel Adams", email: "rachel.adams@applicant.org" },
      { name: "David Kim", email: "david@zuri.app" },
    ],
    type: "interview",
    tags: ["Hiring", "Recruiting", "Backend"],
    agendaMarkdown: `### Interview Format
1. Candidate background & past system design achievements (10m)
2. Live architectural problem: Designing a globally distributed rate limiter (35m)
3. Candidate Q&A and next steps (15m)`,
    notesMarkdown: "",
    reminders: ["15m", "1h"],
    actionItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meet-5",
    title: "Product Strategy & Roadmap Sync",
    date: getSeedDate(-2), // 2 days ago
    startTime: "11:00",
    endTime: "12:00",
    locationOrLink: "HQ Executive Boardroom & Stream",
    attendees: [
      { name: "Alex Rivers", email: "alex@zuri.app" },
      { name: "Maya Lin", email: "maya@zuri.app" },
      { name: "Sarah Jenkins", email: "sarah.j@zuri.app" },
    ],
    type: "other",
    tags: ["Strategy", "Roadmap", "Design"],
    agendaMarkdown: `### Topics
- Review user feedback metrics from v2 rollout
- Prioritize Meetings Tracker and Calendar timeline integrations`,
    notesMarkdown: `### Meeting Summary
- Positive adoption of the note-taking and deadline tracker components.
- Decided to ship Meetings Tracker with Markdown notes, action item conversion, and calendar view.`,
    reminders: ["15m"],
    actionItems: [
      {
        id: "act-5",
        text: "Finalize high-contrast design tokens for meeting cards",
        completed: true,
        owner: "Maya Lin",
        dueDate: getSeedDate(-1),
        convertedToTask: true,
      },
      {
        id: "act-6",
        text: "Review security considerations for meeting link launchers",
        completed: true,
        owner: "Alex Rivers",
        dueDate: getSeedDate(-1),
        convertedToTask: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meet-6",
    title: "Post-Incident Retrospective: Database Failover",
    date: getSeedDate(-4), // 4 days ago
    startTime: "15:00",
    endTime: "16:00",
    locationOrLink: "https://meet.jit.si/postmortem-db-failover",
    attendees: [
      { name: "Alex Rivers", email: "alex@zuri.app" },
      { name: "Elena Rostova", email: "elena@zuri.app" },
      { name: "Marcus Chen", email: "marcus@zuri.app" },
    ],
    type: "standup",
    tags: ["Postmortem", "Infrastructure", "Reliability"],
    agendaMarkdown: `### Timeline
- 14:12: Primary DB replica memory threshold alarm
- 14:18: Automated failover initiated to read replica
- 14:24: All API endpoints restored to healthy status`,
    notesMarkdown: `### Root Cause
Unindexed analytic query spiked memory buffer pool. 
Mitigation: Added query timeout cap (5000ms) and automated index audit.`,
    reminders: ["10m"],
    actionItems: [
      {
        id: "act-7",
        text: "Set up automated query timeout alert rules in monitoring dashboard",
        completed: true,
        owner: "Marcus Chen",
        dueDate: getSeedDate(-3),
        convertedToTask: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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

  // Meeting CRUD Actions
  addMeeting: (
    meeting: Omit<MeetingItem, "id" | "createdAt" | "updatedAt">,
  ) => MeetingItem;
  updateMeeting: (id: string, updates: Partial<MeetingItem>) => void;
  deleteMeeting: (id: string) => void;

  // Action Items CRUD Actions
  addActionItem: (
    meetingId: string,
    item: Omit<ActionItem, "id" | "completed" | "convertedToTask">,
  ) => void;
  toggleActionItem: (meetingId: string, actionItemId: string) => void;
  deleteActionItem: (meetingId: string, actionItemId: string) => void;
  convertActionItemToTask: (meetingId: string, actionItemId: string) => void;
}

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  meetings: SEED_MEETINGS,
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
          actionItems: m.actionItems.filter((act) => act.id !== actionItemId),
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
            act.id === actionItemId ? { ...act, convertedToTask: true } : act,
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },
}));
