// Individual Task Card with status cycle, subtasks checklist, recurrence, reminder, and Pomodoro launch
"use client";

import { useState, useMemo } from "react";
import {
  Check,
  Clock,
  Calendar,
  Repeat,
  Bell,
  Timer,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  Pause,
} from "lucide-react";
import { useTasks } from "@/hook/tasks";
import type { TaskItem, TaskPriority, TaskStatus } from "./types";

interface TaskCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { label: string; badge: string }> =
  {
    urgent: {
      label: "Urgent",
      badge: "bg-red-500/10 text-red-500 border-red-500/25",
    },
    high: {
      label: "High",
      badge: "bg-amber-500/10 text-amber-500 border-amber-500/25",
    },
    medium: {
      label: "Medium",
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/25",
    },
    low: {
      label: "Low",
      badge: "bg-[var(--s)] text-[var(--m)] border-[var(--h)]",
    },
  };

const STATUS_BADGE: Record<TaskStatus, { label: string; style: string }> = {
  todo: {
    label: "To Do",
    style: "bg-[var(--s)] text-[var(--m)] border-[var(--h)]",
  },
  doing: {
    label: "Doing",
    style: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  done: {
    label: "Done",
    style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  },
};

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const {
    projects,
    pomodoro,
    cycleTaskStatus,
    setTaskStatus,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    selectPomodoroTask,
    togglePomodoroRunning,
  } = useTasks();

  const [expanded, setExpanded] = useState(task.subtasks.length > 0);
  const [newSubtask, setNewSubtask] = useState("");

  const project = useMemo(
    () => projects.find((p) => p.id === task.projectId),
    [projects, task.projectId],
  );

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isOverdue =
    Boolean(task.dueDate) && task.dueDate! < todayStr && task.status !== "done";

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const isActiveTimerTask = pomodoro.activeTaskId === task.id;
  const isFocusing = isActiveTimerTask && pomodoro.isRunning;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask);
    setNewSubtask("");
  };

  return (
    <div
      className={`group flex flex-col gap-3 p-4 rounded-2xl bg-[var(--surface-card)] border transition-colors min-w-0 ${
        isOverdue
          ? "border-red-500/40"
          : isFocusing
            ? "border-[var(--accent)]"
            : "border-[var(--h)] hover:border-[var(--m)]"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {/* Status Checkbox / Cycle */}
        <button
          type="button"
          onClick={() => cycleTaskStatus(task.id)}
          title="Cycle status (To Do → Doing → Done)"
          className={`mt-0.5 w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            task.status === "done"
              ? "bg-[var(--p)] border-[var(--p)] text-[var(--pt)]"
              : task.status === "doing"
                ? "border-amber-500 bg-amber-500/15 text-amber-500"
                : "border-[var(--h)] bg-[var(--bg)] hover:border-[var(--p)]"
          }`}
        >
          {task.status === "done" && <Check size={12} strokeWidth={3} />}
          {task.status === "doing" && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <h3
              className={`text-sm font-semibold tracking-tight break-words ${
                task.status === "done"
                  ? "line-through text-[var(--m)]"
                  : "text-[var(--i)]"
              }`}
            >
              {task.title}
            </h3>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setTaskStatus(
                    task.id,
                    task.status === "todo"
                      ? "doing"
                      : task.status === "doing"
                        ? "done"
                        : "todo",
                  )
                }
                className={`badge-pill text-[11px] cursor-pointer ${STATUS_BADGE[task.status].style}`}
              >
                {STATUS_BADGE[task.status].label}
              </button>
              <span
                className={`badge-pill text-[11px] ${PRIORITY_STYLES[task.priority].badge}`}
              >
                {PRIORITY_STYLES[task.priority].label}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-[var(--m)] break-words">
              {task.description}
            </p>
          )}

          {/* Metadata Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            {project && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--s)] border border-[var(--h)] text-[var(--b)]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </span>
            )}

            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                  isOverdue
                    ? "bg-red-500/10 text-red-500 border-red-500/30 font-medium"
                    : task.dueDate === todayStr
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/30 font-medium"
                      : "bg-[var(--s)] text-[var(--m)] border-[var(--h)]"
                }`}
              >
                <Calendar size={11} />
                <span>
                  {task.dueDate}
                  {task.dueTime ? ` · ${task.dueTime}` : ""}
                </span>
              </span>
            )}

            {task.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/25">
                <Repeat size={11} />
                <span className="capitalize">{task.recurrence}</span>
              </span>
            )}

            {task.reminder !== "none" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)]">
                <Bell size={11} />
                <span>{task.reminder}</span>
              </span>
            )}

            {task.estimateMinutes && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)]">
                <Timer size={11} />
                <span>
                  {task.loggedMinutes > 0
                    ? `${task.loggedMinutes}m / ${task.estimateMinutes}m`
                    : `~${task.estimateMinutes}m`}
                </span>
              </span>
            )}

            {task.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {task.status !== "done" && (
            <button
              type="button"
              onClick={() =>
                isActiveTimerTask
                  ? togglePomodoroRunning()
                  : selectPomodoroTask(task.id)
              }
              title={
                isFocusing
                  ? "Pause focus timer"
                  : isActiveTimerTask
                    ? "Resume focus timer"
                    : "Start focus timer on this task"
              }
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                isFocusing
                  ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                  : isActiveTimerTask
                    ? "bg-[var(--s)] text-[var(--i)] border-[var(--m)]"
                    : "border-[var(--h)] text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
              }`}
            >
              {isFocusing ? <Pause size={12} /> : <Play size={12} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(task)}
            title="Edit task"
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => deleteTask(task.id)}
            title="Delete task"
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Subtasks / Checklists */}
      <div className="pl-8 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--m)] hover:text-[var(--i)] w-fit"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span>
            Subtasks ({completedSubtasks}/{task.subtasks.length})
          </span>
          {task.subtasks.length > 0 && (
            <span className="w-16 h-1.5 rounded-full bg-[var(--s)] overflow-hidden ml-1">
              <span
                className="block h-full bg-[var(--p)] transition-all"
                style={{
                  width: `${Math.round((completedSubtasks / task.subtasks.length) * 100)}%`,
                }}
              />
            </span>
          )}
        </button>

        {expanded && (
          <div className="flex flex-col gap-1.5">
            {task.subtasks.length > 0 && (
              <div className="divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl overflow-hidden bg-[var(--bg)]">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-[var(--s)] transition-colors"
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => toggleSubtask(task.id, sub.id)}
                        className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                          sub.completed
                            ? "bg-[var(--p)] border-[var(--p)] text-[var(--pt)]"
                            : "border-[var(--h)] bg-[var(--bg)]"
                        }`}
                      >
                        {sub.completed && <Check size={10} strokeWidth={3} />}
                      </button>
                      <span
                        className={`text-xs truncate ${
                          sub.completed
                            ? "line-through text-[var(--m)]"
                            : "text-[var(--b)]"
                        }`}
                      >
                        {sub.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteSubtask(task.id, sub.id)}
                      className="text-[var(--m)] hover:text-red-500 p-0.5"
                      title="Delete subtask"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleAddSubtask}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="bt text-xs px-2.5 py-1 flex items-center gap-1 disabled:opacity-40"
              >
                <Plus size={12} />
                <span>Add</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
