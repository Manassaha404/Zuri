import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  generatePositionBetween,
  sortByPosition,
} from "@/components/notes/utils/fractional-index";
import type {
  BoardCard,
  BoardColumn,
  BoardSprint,
  BoardMilestone,
  SwimlaneMode,
  BoardFilterState,
  CardPriority,
} from "../components/projects/types";

const STARTER_COLUMNS: BoardColumn[] = [];
const STARTER_SPRINTS: BoardSprint[] = [];
const STARTER_MILESTONES: BoardMilestone[] = [];
const STARTER_CARDS: BoardCard[] = [];

interface ProjectBoardStore {
  activeProjectId: string;
  swimlaneMode: SwimlaneMode;
  showBurndown: boolean;
  columns: BoardColumn[];
  cards: BoardCard[];
  sprints: BoardSprint[];
  milestones: BoardMilestone[];
  filters: BoardFilterState;

  setWorkspaceData: (data: {
    columns: BoardColumn[];
    cards: BoardCard[];
    sprints: BoardSprint[];
    milestones: BoardMilestone[];
  }) => void;

  setActiveProject: (projectId: string) => void;
  setSwimlaneMode: (mode: SwimlaneMode) => void;
  setShowBurndown: (show: boolean) => void;

  // Filters
  setSearchQuery: (q: string) => void;
  setLabelFilter: (label: string | null) => void;
  setAssigneeFilter: (assignee: string | "all") => void;
  setPriorityFilter: (priority: CardPriority | "all") => void;
  setSprintFilter: (sprintId: string | "all") => void;
  resetFilters: () => void;

  // Columns
  ensureDefaultColumns: (projectId: string) => void;
  addColumn: (projectId: string, title: string, wipLimit?: number) => void;
  updateColumn: (
    columnId: string,
    updates: Partial<Pick<BoardColumn, "title" | "wipLimit" | "isDoneColumn">>,
  ) => void;
  deleteColumn: (columnId: string) => void;

  // Cards & Fractional Indexing Drag-and-Drop
  addCard: (
    card: Omit<
      BoardCard,
      "id" | "position" | "checklist" | "comments" | "createdAt" | "updatedAt"
    > & { checklist?: BoardCard["checklist"] },
  ) => BoardCard;
  updateCard: (cardId: string, updates: Partial<BoardCard>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (
    cardId: string,
    targetColumnId: string,
    targetIndex?: number,
  ) => void;

  // Checklist & Comments
  addChecklistItem: (cardId: string, text: string) => void;
  toggleChecklistItem: (cardId: string, itemId: string) => void;
  deleteChecklistItem: (cardId: string, itemId: string) => void;
  addComment: (cardId: string, author: string, text: string) => void;

  // Sprints & Milestones
  addSprint: (sprint: Omit<BoardSprint, "id">) => void;
  deleteSprint: (sprintId: string) => void;
  addMilestone: (milestone: Omit<BoardMilestone, "id">) => void;
  deleteMilestone: (milestoneId: string) => void;
}

export const useProjectBoardStore = create<ProjectBoardStore>()(
  persist(
    (set, get) => ({
      activeProjectId: "proj-work",
      swimlaneMode: "none",
      showBurndown: false,
      columns: STARTER_COLUMNS,
      cards: STARTER_CARDS,
      sprints: STARTER_SPRINTS,
      milestones: STARTER_MILESTONES,
      filters: {
        searchQuery: "",
        labelFilter: null,
        assigneeFilter: "all",
        priorityFilter: "all",
        sprintFilter: "all",
      },

      setWorkspaceData: ({ columns, cards, sprints, milestones }) =>
        set({ columns, cards, sprints, milestones }),

      setActiveProject: (projectId) => {
        set({ activeProjectId: projectId });
        get().ensureDefaultColumns(projectId);
      },

      setSwimlaneMode: (swimlaneMode) => set({ swimlaneMode }),
      setShowBurndown: (showBurndown) => set({ showBurndown }),

      setSearchQuery: (searchQuery) =>
        set((s) => ({ filters: { ...s.filters, searchQuery } })),
      setLabelFilter: (labelFilter) =>
        set((s) => ({ filters: { ...s.filters, labelFilter } })),
      setAssigneeFilter: (assigneeFilter) =>
        set((s) => ({ filters: { ...s.filters, assigneeFilter } })),
      setPriorityFilter: (priorityFilter) =>
        set((s) => ({ filters: { ...s.filters, priorityFilter } })),
      setSprintFilter: (sprintFilter) =>
        set((s) => ({ filters: { ...s.filters, sprintFilter } })),
      resetFilters: () =>
        set({
          filters: {
            searchQuery: "",
            labelFilter: null,
            assigneeFilter: "all",
            priorityFilter: "all",
            sprintFilter: "all",
          },
        }),

      ensureDefaultColumns: (projectId) => {
        const existing = get().columns.filter((c) => c.projectId === projectId);
        if (existing.length > 0) return;

        const base = Date.now();
        const defaults: BoardColumn[] = [
          {
            id: `col-${base}-1`,
            projectId,
            title: "To Do",
            position: "a0",
          },
          {
            id: `col-${base}-2`,
            projectId,
            title: "In Progress",
            position: "a1",
            wipLimit: 3,
          },
          {
            id: `col-${base}-3`,
            projectId,
            title: "Done",
            position: "a2",
            isDoneColumn: true,
          },
        ];
        set((s) => ({ columns: [...s.columns, ...defaults] }));
      },

      addColumn: (projectId, title, wipLimit) => {
        const projCols = sortByPosition(
          get().columns.filter((c) => c.projectId === projectId),
        );
        const lastPos = projCols[projCols.length - 1]?.position ?? null;
        const newCol: BoardColumn = {
          id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          projectId,
          title: title.trim(),
          position: generatePositionBetween(lastPos, null),
          wipLimit,
        };
        set((s) => ({ columns: [...s.columns, newCol] }));
      },

      updateColumn: (columnId, updates) => {
        set((s) => ({
          columns: s.columns.map((c) =>
            c.id === columnId ? { ...c, ...updates } : c,
          ),
        }));
      },

      deleteColumn: (columnId) => {
        set((s) => ({
          columns: s.columns.filter((c) => c.id !== columnId),
          cards: s.cards.filter((card) => card.columnId !== columnId),
        }));
      },

      addCard: (cardData) => {
        const colCards = sortByPosition(
          get().cards.filter((c) => c.columnId === cardData.columnId),
        );
        const lastPos = colCards[colCards.length - 1]?.position ?? null;
        const now = new Date().toISOString();
        const newCard: BoardCard = {
          ...cardData,
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          position: generatePositionBetween(lastPos, null),
          checklist: cardData.checklist || [],
          comments: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ cards: [...s.cards, newCard] }));
        return newCard;
      },

      updateCard: (cardId, updates) => {
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? { ...c, ...updates, updatedAt: new Date().toISOString() }
              : c,
          ),
        }));
      },

      deleteCard: (cardId) => {
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== cardId),
        }));
      },

      moveCard: (cardId, targetColumnId, targetIndex) => {
        const targetCards = sortByPosition(
          get().cards.filter(
            (c) => c.columnId === targetColumnId && c.id !== cardId,
          ),
        );
        const idx =
          typeof targetIndex === "number"
            ? Math.max(0, Math.min(targetIndex, targetCards.length))
            : targetCards.length;
        const prevPos =
          idx > 0 ? (targetCards[idx - 1]?.position ?? null) : null;
        const nextPos =
          idx < targetCards.length
            ? (targetCards[idx]?.position ?? null)
            : null;
        const newPosition = generatePositionBetween(prevPos, nextPos);

        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  columnId: targetColumnId,
                  position: newPosition,
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        }));
      },

      addChecklistItem: (cardId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  checklist: [
                    ...c.checklist,
                    {
                      id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                      text: trimmed,
                      completed: false,
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        }));
      },

      toggleChecklistItem: (cardId, itemId) => {
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  checklist: c.checklist.map((i) =>
                    i.id === itemId ? { ...i, completed: !i.completed } : i,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        }));
      },

      deleteChecklistItem: (cardId, itemId) => {
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  checklist: c.checklist.filter((i) => i.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        }));
      },

      addComment: (cardId, author, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  comments: [
                    ...c.comments,
                    {
                      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                      author,
                      text: trimmed,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        }));
      },

      addSprint: (sprint) => {
        const newSprint: BoardSprint = {
          ...sprint,
          id: `sprint-${Date.now()}`,
        };
        set((s) => ({ sprints: [...s.sprints, newSprint] }));
      },

      deleteSprint: (sprintId) => {
        set((s) => ({
          sprints: s.sprints.filter((sp) => sp.id !== sprintId),
          cards: s.cards.map((c) =>
            c.sprintId === sprintId ? { ...c, sprintId: undefined } : c,
          ),
          filters:
            s.filters.sprintFilter === sprintId
              ? { ...s.filters, sprintFilter: "all" }
              : s.filters,
        }));
      },

      addMilestone: (milestone) => {
        const newMilestone: BoardMilestone = {
          ...milestone,
          id: `ms-${Date.now()}`,
        };
        set((s) => ({ milestones: [...s.milestones, newMilestone] }));
      },

      deleteMilestone: (milestoneId) => {
        set((s) => ({
          milestones: s.milestones.filter((ms) => ms.id !== milestoneId),
          cards: s.cards.map((c) =>
            c.milestoneId === milestoneId
              ? { ...c, milestoneId: undefined }
              : c,
          ),
        }));
      },
    }),
    {
      name: "zuri-project-board-storage",
      version: 2,
      migrate: (persistedState) => {
        const persisted = (persistedState || {}) as Partial<ProjectBoardStore>;
        return {
          activeProjectId: persisted.activeProjectId ?? "",
          swimlaneMode: persisted.swimlaneMode ?? "none",
          showBurndown: persisted.showBurndown ?? false,
          filters: persisted.filters,
        };
      },
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        swimlaneMode: state.swimlaneMode,
        showBurndown: state.showBurndown,
        filters: state.filters,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<ProjectBoardStore>;
        return {
          ...currentState,
          activeProjectId:
            persisted.activeProjectId ?? currentState.activeProjectId,
          swimlaneMode: persisted.swimlaneMode ?? currentState.swimlaneMode,
          showBurndown: persisted.showBurndown ?? currentState.showBurndown,
          filters: persisted.filters ?? currentState.filters,
          columns: [],
          cards: [],
          sprints: [],
          milestones: [],
        };
      },
    },
  ),
);
