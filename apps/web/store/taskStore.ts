import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TaskItem,
  TaskProject,
  TaskViewTab,
  TaskFilterState,
  TaskPriority,
  TaskStatus,
  PomodoroMode,
} from "../components/tasks/types";

const DEFAULT_PROJECTS: TaskProject[] = [];

const STARTER_TASKS: TaskItem[] = [];

interface PomodoroState {
  activeTaskId: string | null;
  mode: PomodoroMode;
  secondsLeft: number;
  remainingByMode: Record<PomodoroMode, number>;
  isRunning: boolean;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

interface TaskStore {
  tasks: TaskItem[];
  projects: TaskProject[];
  activeView: TaskViewTab;
  filters: TaskFilterState;
  pomodoro: PomodoroState;

  // Hydration
  setWorkspaceData: (data: {
    projects: TaskProject[];
    tasks: TaskItem[];
  }) => void;

  // View & Filter Actions
  setActiveView: (view: TaskViewTab) => void;
  setSearchQuery: (query: string) => void;
  setProjectFilter: (projectId: string | "all") => void;
  setPriorityFilter: (priority: TaskPriority | "all") => void;
  setStatusFilter: (status: TaskStatus | "all") => void;
  setTagFilter: (tag: string | null) => void;
  resetFilters: () => void;

  // Project Actions
  addProject: (
    name: string,
    color: string,
    meta?: Partial<Omit<TaskProject, "id" | "name" | "color">>,
  ) => TaskProject;
  updateProject: (
    projectId: string,
    updates: Partial<Omit<TaskProject, "id">>,
  ) => void;
  deleteProject: (projectId: string) => void;

  // Task CRUD Actions
  addTask: (
    task: Omit<TaskItem, "id" | "loggedMinutes" | "createdAt" | "updatedAt">,
  ) => TaskItem;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  cycleTaskStatus: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;

  // Subtasks
  addSubtask: (taskId: string, text: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Pomodoro Timer Actions
  selectPomodoroTask: (taskId: string | null) => void;
  setPomodoroMode: (mode: PomodoroMode) => void;
  togglePomodoroRunning: () => void;
  resetPomodoro: () => void;
  tickPomodoro: () => void;
}

const MODE_SECONDS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: STARTER_TASKS,
      projects: DEFAULT_PROJECTS,
      activeView: "today",
      filters: {
        searchQuery: "",
        projectId: "all",
        priorityFilter: "all",
        statusFilter: "all",
        tagFilter: null,
      },
      pomodoro: {
        activeTaskId: "task-1",
        mode: "focus",
        secondsLeft: 25 * 60,
        remainingByMode: {
          focus: 25 * 60,
          short_break: 5 * 60,
          long_break: 15 * 60,
        },
        isRunning: false,
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
      },

      setWorkspaceData: ({ projects, tasks }) => set({ projects, tasks }),

      setActiveView: (view) => set({ activeView: view }),

      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      setProjectFilter: (projectId) =>
        set((state) => ({
          filters: { ...state.filters, projectId },
        })),

      setPriorityFilter: (priority) =>
        set((state) => ({
          filters: { ...state.filters, priorityFilter: priority },
        })),

      setStatusFilter: (status) =>
        set((state) => ({
          filters: { ...state.filters, statusFilter: status },
        })),

      setTagFilter: (tag) =>
        set((state) => ({
          filters: { ...state.filters, tagFilter: tag },
        })),

      resetFilters: () =>
        set({
          filters: {
            searchQuery: "",
            projectId: "all",
            priorityFilter: "all",
            statusFilter: "all",
            tagFilter: null,
          },
        }),

      addProject: (name, color, meta) => {
        const newProj: TaskProject = {
          id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: name.trim(),
          color,
          status: meta?.status || "active",
          description: meta?.description,
          deadline: meta?.deadline,
        };
        set((state) => ({
          projects: [...state.projects, newProj],
        }));
        return newProj;
      },

      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p,
          ),
        }));
      },

      deleteProject: (projectId) => {
        if (projectId === "proj-inbox") return;
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          tasks: state.tasks.map((t) =>
            t.projectId === projectId ? { ...t, projectId: "proj-inbox" } : t,
          ),
          filters:
            state.filters.projectId === projectId
              ? { ...state.filters, projectId: "all" }
              : state.filters,
        }));
      },

      addTask: (taskData) => {
        const now = new Date().toISOString();
        const newTask: TaskItem = {
          ...taskData,
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          loggedMinutes: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));
        return newTask;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t,
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          pomodoro:
            state.pomodoro.activeTaskId === id
              ? { ...state.pomodoro, activeTaskId: null, isRunning: false }
              : state.pomodoro,
        }));
      },

      cycleTaskStatus: (id) => {
        const nextMap: Record<TaskStatus, TaskStatus> = {
          todo: "doing",
          doing: "done",
          done: "todo",
        };
        const current = get().tasks.find((t) => t.id === id);
        if (!current) return;
        const nextStatus = nextMap[current.status];
        get().setTaskStatus(id, nextStatus);
      },

      setTaskStatus: (id, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === "done" ? now : undefined,
                  updatedAt: now,
                }
              : t,
          ),
        }));
      },

      addSubtask: (taskId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...t.subtasks,
                    {
                      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                      text: trimmed,
                      completed: false,
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }));
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }));
      },

      selectPomodoroTask: (taskId) => {
        const task = taskId
          ? get().tasks.find((t) => t.id === taskId)
          : undefined;
        const focusMins =
          task?.estimateMinutes && task.estimateMinutes > 0
            ? task.estimateMinutes
            : 25;
        const focusSeconds = focusMins * 60;
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            activeTaskId: taskId,
            mode: "focus",
            focusMinutes: focusMins,
            secondsLeft: focusSeconds,
            remainingByMode: {
              ...state.pomodoro.remainingByMode,
              focus: focusSeconds,
            },
            isRunning: Boolean(taskId),
          },
        }));
      },

      setPomodoroMode: (mode) => {
        const current = get().pomodoro;
        const savedMap: Record<PomodoroMode, number> = {
          focus: current.remainingByMode?.focus ?? current.focusMinutes * 60,
          short_break:
            current.remainingByMode?.short_break ?? MODE_SECONDS.short_break,
          long_break:
            current.remainingByMode?.long_break ?? MODE_SECONDS.long_break,
          [current.mode]: current.secondsLeft,
        };
        set({
          pomodoro: {
            ...current,
            mode,
            secondsLeft: savedMap[mode],
            remainingByMode: savedMap,
            isRunning: false,
          },
        });
      },

      togglePomodoroRunning: () => {
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            isRunning: !state.pomodoro.isRunning,
          },
        }));
      },

      resetPomodoro: () => {
        set((state) => {
          const resetSeconds =
            state.pomodoro.mode === "focus"
              ? state.pomodoro.focusMinutes * 60
              : MODE_SECONDS[state.pomodoro.mode];
          return {
            pomodoro: {
              ...state.pomodoro,
              secondsLeft: resetSeconds,
              remainingByMode: {
                ...state.pomodoro.remainingByMode,
                [state.pomodoro.mode]: resetSeconds,
              },
              isRunning: false,
            },
          };
        });
      },

      tickPomodoro: () => {
        const { pomodoro, tasks } = get();
        if (!pomodoro.isRunning) return;

        if (pomodoro.secondsLeft <= 1) {
          // Session finished
          const nextMode: PomodoroMode =
            pomodoro.mode === "focus" ? "short_break" : "focus";
          const finishedResetSeconds =
            pomodoro.mode === "focus"
              ? pomodoro.focusMinutes * 60
              : MODE_SECONDS[pomodoro.mode];
          const nextRemainingByMode: Record<PomodoroMode, number> = {
            focus:
              pomodoro.remainingByMode?.focus ?? pomodoro.focusMinutes * 60,
            short_break:
              pomodoro.remainingByMode?.short_break ?? MODE_SECONDS.short_break,
            long_break:
              pomodoro.remainingByMode?.long_break ?? MODE_SECONDS.long_break,
            [pomodoro.mode]: finishedResetSeconds,
          };
          const updatedTasks =
            pomodoro.mode === "focus" && pomodoro.activeTaskId
              ? tasks.map((t) =>
                  t.id === pomodoro.activeTaskId
                    ? {
                        ...t,
                        loggedMinutes: t.loggedMinutes + pomodoro.focusMinutes,
                      }
                    : t,
                )
              : tasks;

          set({
            tasks: updatedTasks,
            pomodoro: {
              ...pomodoro,
              mode: nextMode,
              secondsLeft: nextRemainingByMode[nextMode],
              remainingByMode: nextRemainingByMode,
              isRunning: false,
            },
          });
          return;
        }

        const nextSeconds = pomodoro.secondsLeft - 1;
        set({
          pomodoro: {
            ...pomodoro,
            secondsLeft: nextSeconds,
            remainingByMode: {
              ...pomodoro.remainingByMode,
              [pomodoro.mode]: nextSeconds,
            },
          },
        });
      },
    }),
    {
      name: "zuri-task-tracker-storage",
      version: 2,
      migrate: (persistedState) => {
        const persisted = (persistedState || {}) as Partial<TaskStore>;
        return {
          activeView: persisted.activeView ?? "today",
          filters: persisted.filters,
          pomodoro: persisted.pomodoro,
        };
      },
      partialize: (state) => ({
        activeView: state.activeView,
        filters: state.filters,
        pomodoro: state.pomodoro,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<TaskStore>;
        return {
          ...currentState,
          activeView: persisted.activeView ?? currentState.activeView,
          filters: persisted.filters ?? currentState.filters,
          pomodoro: persisted.pomodoro ?? currentState.pomodoro,
          tasks: [],
          projects: [],
        };
      },
    },
  ),
);
