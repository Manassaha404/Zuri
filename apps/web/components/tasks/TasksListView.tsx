// Filtered Task List View for Today, Upcoming, Overdue, Completed, and All
"use client";

import { useMemo } from "react";
import { CheckSquare, Plus, FilterX } from "lucide-react";
import { useTasks } from "@/hook/tasks";
import { TaskCard } from "./TaskCard";
import type { TaskItem, TaskPriority } from "./types";

interface TasksListViewProps {
  onEdit: (task: TaskItem) => void;
  onOpenCreate: () => void;
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TasksListView({ onEdit, onOpenCreate }: TasksListViewProps) {
  const { tasks, activeView, filters, resetFilters } = useTasks();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (activeView === "today") {
          if (t.status === "done" || t.dueDate !== todayStr) return false;
        } else if (activeView === "upcoming") {
          if (t.status === "done" || !t.dueDate || t.dueDate <= todayStr)
            return false;
        } else if (activeView === "overdue") {
          if (t.status === "done" || !t.dueDate || t.dueDate >= todayStr)
            return false;
        } else if (activeView === "completed") {
          if (t.status !== "done") return false;
        }

        if (filters.projectId !== "all" && t.projectId !== filters.projectId) {
          return false;
        }

        if (
          filters.priorityFilter !== "all" &&
          t.priority !== filters.priorityFilter
        ) {
          return false;
        }

        if (filters.tagFilter && !t.tags.includes(filters.tagFilter)) {
          return false;
        }

        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const inTitle = t.title.toLowerCase().includes(q);
          const inDesc = (t.description || "").toLowerCase().includes(q);
          const inTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
          if (!inTitle && !inDesc && !inTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        const pDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (pDiff !== 0) return pDiff;
        return (a.dueDate || "9999-99-99").localeCompare(
          b.dueDate || "9999-99-99",
        );
      });
  }, [tasks, activeView, filters, todayStr]);

  if (filteredTasks.length === 0) {
    const hasFilters =
      Boolean(filters.searchQuery) ||
      filters.projectId !== "all" ||
      filters.priorityFilter !== "all" ||
      Boolean(filters.tagFilter);

    return (
      <div className="w-full flex-1 min-w-0 flex flex-col items-center justify-center gap-3 p-12 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] text-center">
        <div className="w-11 h-11 rounded-xl bg-[var(--s)] border border-[var(--h)] flex items-center justify-center text-[var(--m)]">
          <CheckSquare size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--i)]">
            No tasks in {activeView}
          </h3>
          <p className="text-xs text-[var(--m)] mt-1">
            {hasFilters
              ? "Try clearing your active filters or search query."
              : "Use Quick Add above or create a new task to get started."}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="bt text-xs flex items-center gap-1.5 px-3 py-1.5"
            >
              <FilterX size={13} />
              <span>Clear Filters</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCreate}
            className="bt p text-xs flex items-center gap-1.5 px-3 py-1.5"
          >
            <Plus size={13} />
            <span>New Task</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} />
      ))}
    </div>
  );
}
