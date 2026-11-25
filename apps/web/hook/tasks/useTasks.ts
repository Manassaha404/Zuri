// Hook managing task workspace queries, mutations, projects, subtasks, and synchronization with taskStore
"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useTaskStore } from "@/store/taskStore";
import type {
  TaskItem,
  TaskProject,
  TaskPriority,
  TaskStatus,
  TaskRecurrence,
  TaskReminderOffset,
  ProjectStatus,
} from "@/components/tasks/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val: unknown): val is string =>
  typeof val === "string" && UUID_REGEX.test(val);

export function useTasks() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);

  const {
    tasks,
    projects,
    activeView,
    filters,
    pomodoro,
    setActiveView,
    setSearchQuery,
    setProjectFilter,
    setPriorityFilter,
    setStatusFilter,
    setTagFilter,
    resetFilters,
    setWorkspaceData,
    addProject: storeAddProject,
    updateProject: storeUpdateProject,
    deleteProject: storeDeleteProject,
    addTask: storeAddTask,
    updateTask: storeUpdateTask,
    deleteTask: storeDeleteTask,
    cycleTaskStatus: storeCycleTaskStatus,
    setTaskStatus: storeSetTaskStatus,
    addSubtask: storeAddSubtask,
    toggleSubtask: storeToggleSubtask,
    deleteSubtask: storeDeleteSubtask,
    selectPomodoroTask,
    setPomodoroMode,
    togglePomodoroRunning,
    resetPomodoro,
    tickPomodoro,
  } = useTaskStore();

  const utils = trpc.useUtils();

  const workspaceQuery = trpc.tasks.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (workspaceQuery.data && "tasks" in workspaceQuery.data) {
      const rawProjects = (workspaceQuery.data.projects || []) as any[];
      const rawTasks = (workspaceQuery.data.tasks || []) as any[];

      const normalizedProjects: TaskProject[] = rawProjects.map((p) => ({
        id: p.projectId || p.id,
        name: p.name,
        color: p.color || "#3b82f6",
        description: p.description || undefined,
        status: (p.status as ProjectStatus) || "active",
        deadline: p.deadline || undefined,
      }));

      const normalizedTasks: TaskItem[] = rawTasks.map((t) => ({
        id: t.taskId || t.id,
        title: t.title,
        description: t.description || undefined,
        dueDate: t.dueDate || undefined,
        dueTime: t.dueTime || undefined,
        priority: (t.priority as TaskPriority) || "medium",
        status: (t.status as TaskStatus) || "todo",
        projectId: t.projectId,
        tags: (t.tags as string[]) || [],
        subtasks: ((t.subtasks || []) as any[]).map((s) => ({
          id: s.subtaskId || s.id,
          text: s.text,
          completed: Boolean(s.completed),
        })),
        recurrence: (t.recurrence as TaskRecurrence) || "none",
        reminder: (t.reminder as TaskReminderOffset) || "none",
        estimateMinutes: t.estimateMinutes ?? undefined,
        loggedMinutes: t.loggedMinutes ?? 0,
        completedAt: t.completedAt
          ? typeof t.completedAt === "string"
            ? t.completedAt
            : new Date(t.completedAt).toISOString()
          : undefined,
        createdAt:
          typeof t.createdAt === "string"
            ? t.createdAt
            : new Date(t.createdAt).toISOString(),
        updatedAt:
          typeof t.updatedAt === "string"
            ? t.updatedAt
            : new Date(t.updatedAt).toISOString(),
      }));

      setWorkspaceData({
        projects: normalizedProjects,
        tasks: normalizedTasks,
      });
    }
  }, [workspaceQuery.data, setWorkspaceData]);

  const createProjectMutation = trpc.tasks.createProject.useMutation({
    onSuccess: () => {
      utils.tasks.getWorkspace.invalidate();
      utils.projects.getWorkspace.invalidate();
    },
  });

  const addProject = useCallback(
    async (
      name: string,
      color: string,
      meta?: Partial<Omit<TaskProject, "id" | "name" | "color">>,
    ) => {
      const optimistic = storeAddProject(name, color, meta);
      if (userId) {
        try {
          const created = await createProjectMutation.mutateAsync({
            name,
            color,
            description: meta?.description,
            status: meta?.status,
            deadline: meta?.deadline,
          });
          utils.tasks.getWorkspace.invalidate();
          utils.projects.getWorkspace.invalidate();
          return {
            id: (created as any).projectId,
            name: (created as any).name,
            color: (created as any).color,
          };
        } catch (err) {
          console.error("Failed to create project:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
      return optimistic;
    },
    [
      userId,
      storeAddProject,
      createProjectMutation,
      utils.tasks.getWorkspace,
      utils.projects.getWorkspace,
    ],
  );

  const updateProjectMutation = trpc.tasks.updateProject.useMutation({
    onSuccess: () => utils.tasks.getWorkspace.invalidate(),
  });

  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Omit<TaskProject, "id">>) => {
      storeUpdateProject(projectId, updates);
      if (userId && isUuid(projectId)) {
        try {
          await updateProjectMutation.mutateAsync({
            projectId,
            name: updates.name,
            color: updates.color,
            description:
              updates.description !== undefined
                ? updates.description || null
                : undefined,
            status: updates.status,
            deadline:
              updates.deadline !== undefined
                ? updates.deadline || null
                : undefined,
          });
        } catch (err) {
          console.error("Failed to update project:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeUpdateProject,
      updateProjectMutation,
      utils.tasks.getWorkspace,
    ],
  );

  const deleteProjectMutation = trpc.tasks.deleteProject.useMutation({
    onSuccess: () => {
      utils.tasks.getWorkspace.invalidate();
      utils.projects.getWorkspace.invalidate();
    },
  });

  const deleteProject = useCallback(
    async (projectId: string) => {
      storeDeleteProject(projectId);
      if (userId && isUuid(projectId)) {
        try {
          await deleteProjectMutation.mutateAsync({ projectId });
        } catch (err) {
          console.error("Failed to delete project:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeDeleteProject,
      deleteProjectMutation,
      utils.tasks.getWorkspace,
    ],
  );

  const createTaskMutation = trpc.tasks.createTask.useMutation({
    onSuccess: () => utils.tasks.getWorkspace.invalidate(),
  });

  const addTask = useCallback(
    async (
      item: Omit<TaskItem, "id" | "loggedMinutes" | "createdAt" | "updatedAt">,
    ) => {
      const optimistic = storeAddTask(item);
      if (userId) {
        try {
          const res = await createTaskMutation.mutateAsync({
            projectId: isUuid(item.projectId) ? item.projectId : undefined,
            title: item.title,
            description: item.description,
            dueDate: item.dueDate,
            dueTime: item.dueTime,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            recurrence: item.recurrence,
            reminder: item.reminder,
            estimateMinutes: item.estimateMinutes,
            subtasks: item.subtasks.map((s) => ({
              text: s.text,
              completed: s.completed,
            })),
          });
          utils.tasks.getWorkspace.invalidate();
          return res;
        } catch (err) {
          console.error("Failed to create task:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
      return optimistic;
    },
    [userId, storeAddTask, createTaskMutation, utils.tasks.getWorkspace],
  );

  const updateTaskMutation = trpc.tasks.updateTask.useMutation({
    onSuccess: () => utils.tasks.getWorkspace.invalidate(),
  });

  const updateTask = useCallback(
    async (id: string, updates: Partial<TaskItem>) => {
      storeUpdateTask(id, updates);
      if (userId && isUuid(id)) {
        try {
          await updateTaskMutation.mutateAsync({
            taskId: id,
            projectId: isUuid(updates.projectId)
              ? updates.projectId
              : undefined,
            title: updates.title,
            description:
              updates.description !== undefined
                ? updates.description || null
                : undefined,
            dueDate:
              updates.dueDate !== undefined
                ? updates.dueDate || null
                : undefined,
            dueTime:
              updates.dueTime !== undefined
                ? updates.dueTime || null
                : undefined,
            priority: updates.priority,
            status: updates.status,
            tags: updates.tags,
            recurrence: updates.recurrence,
            reminder: updates.reminder,
            estimateMinutes: updates.estimateMinutes,
            loggedMinutes: updates.loggedMinutes,
            subtasks: updates.subtasks?.map((s) => ({
              text: s.text,
              completed: s.completed,
            })),
          });
        } catch (err) {
          console.error("Failed to update task:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeUpdateTask, updateTaskMutation, utils.tasks.getWorkspace],
  );

  const deleteTaskMutation = trpc.tasks.deleteTask.useMutation({
    onSuccess: () => utils.tasks.getWorkspace.invalidate(),
  });

  const deleteTask = useCallback(
    async (id: string) => {
      storeDeleteTask(id);
      if (userId && isUuid(id)) {
        try {
          await deleteTaskMutation.mutateAsync({ taskId: id });
        } catch (err) {
          console.error("Failed to delete task:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeDeleteTask, deleteTaskMutation, utils.tasks.getWorkspace],
  );

  const setTaskStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      storeSetTaskStatus(id, status);
      if (userId && isUuid(id)) {
        try {
          await updateTaskMutation.mutateAsync({ taskId: id, status });
        } catch (err) {
          console.error("Failed to update task status:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeSetTaskStatus, updateTaskMutation, utils.tasks.getWorkspace],
  );

  const cycleTaskStatus = useCallback(
    async (id: string) => {
      const current = tasks.find((t) => t.id === id);
      if (!current) return;
      const nextMap: Record<TaskStatus, TaskStatus> = {
        todo: "doing",
        doing: "done",
        done: "todo",
      };
      const nextStatus = nextMap[current.status];
      storeCycleTaskStatus(id);
      if (userId && isUuid(id)) {
        try {
          await updateTaskMutation.mutateAsync({
            taskId: id,
            status: nextStatus,
          });
        } catch (err) {
          console.error("Failed to cycle task status:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [
      tasks,
      userId,
      storeCycleTaskStatus,
      updateTaskMutation,
      utils.tasks.getWorkspace,
    ],
  );

  const addSubtaskMutation = trpc.tasks.addSubtask.useMutation({
    onSuccess: () => utils.tasks.getWorkspace.invalidate(),
  });

  const addSubtask = useCallback(
    async (taskId: string, text: string) => {
      storeAddSubtask(taskId, text);
      if (userId && isUuid(taskId)) {
        try {
          await addSubtaskMutation.mutateAsync({ taskId, text });
        } catch (err) {
          console.error("Failed to add subtask:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeAddSubtask, addSubtaskMutation, utils.tasks.getWorkspace],
  );

  const toggleSubtaskMutation = trpc.tasks.toggleSubtask.useMutation({
    onSuccess: () => utils.tasks.getWorkspace.invalidate(),
  });

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      storeToggleSubtask(taskId, subtaskId);
      if (userId && isUuid(subtaskId)) {
        try {
          await toggleSubtaskMutation.mutateAsync({ subtaskId });
        } catch (err) {
          console.error("Failed to toggle subtask:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeToggleSubtask,
      toggleSubtaskMutation,
      utils.tasks.getWorkspace,
    ],
  );

  const deleteSubtaskMutation = trpc.tasks.deleteSubtask.useMutation({
    onSuccess: () => utils.tasks.getWorkspace.invalidate(),
  });

  const deleteSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      storeDeleteSubtask(taskId, subtaskId);
      if (userId && isUuid(subtaskId)) {
        try {
          await deleteSubtaskMutation.mutateAsync({ subtaskId });
        } catch (err) {
          console.error("Failed to delete subtask:", err);
          utils.tasks.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeDeleteSubtask,
      deleteSubtaskMutation,
      utils.tasks.getWorkspace,
    ],
  );

  return {
    tasks,
    projects,
    activeView,
    filters,
    pomodoro,
    isLoading: workspaceQuery.isLoading,
    setActiveView,
    setSearchQuery,
    setProjectFilter,
    setPriorityFilter,
    setStatusFilter,
    setTagFilter,
    resetFilters,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    cycleTaskStatus,
    setTaskStatus,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    selectPomodoroTask,
    setPomodoroMode,
    togglePomodoroRunning,
    resetPomodoro,
    tickPomodoro,
  };
}
