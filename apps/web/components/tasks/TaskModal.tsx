// Create / Edit Task Modal with subtasks, recurrence, reminders, and time estimate
"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, ChevronDown } from "lucide-react";
import { useTasks } from "@/hook/tasks";
import type {
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskRecurrence,
  TaskReminderOffset,
  SubtaskItem,
} from "./types";

interface TaskModalProps {
  isOpen: boolean;
  initialTask: TaskItem | null;
  onClose: () => void;
}

const PRESET_TAGS = [
  "Work",
  "Personal",
  "Urgent",
  "Finance",
  "Health",
  "Learning",
  "Errands",
  "Review",
];

export function TaskModal({ isOpen, initialTask, onClose }: TaskModalProps) {
  const { tasks, projects, addTask, updateTask } = useTasks();

  const availableTags = useMemo(() => {
    const set = new Set<string>(PRESET_TAGS);
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [projectId, setProjectId] = useState("proj-inbox");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("none");
  const [reminder, setReminder] = useState<TaskReminderOffset>("none");
  const [estimateMinutes, setEstimateMinutes] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setDueDate(initialTask.dueDate || "");
      setDueTime(initialTask.dueTime || "");
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setProjectId(initialTask.projectId);
      setTags(initialTask.tags);
      setRecurrence(initialTask.recurrence);
      setReminder(initialTask.reminder);
      setEstimateMinutes(
        initialTask.estimateMinutes ? String(initialTask.estimateMinutes) : "",
      );
      setSubtasks(initialTask.subtasks);
    } else {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setTitle("");
      setDescription("");
      setDueDate(todayStr);
      setDueTime("");
      setPriority("medium");
      setStatus("todo");
      setProjectId(projects[0]?.id || "proj-inbox");
      setTags([]);
      setRecurrence("none");
      setReminder("none");
      setEstimateMinutes("");
      setSubtasks([]);
    }
    setTagInput("");
    setNewSubtaskText("");
  }, [isOpen, initialTask, projects]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        text: trimmed,
        completed: false,
      },
    ]);
    setNewSubtaskText("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const estNum = estimateMinutes ? parseInt(estimateMinutes, 10) : undefined;
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      priority,
      status,
      projectId,
      tags,
      subtasks,
      recurrence,
      reminder,
      estimateMinutes:
        estNum && !Number.isNaN(estNum) && estNum > 0 ? estNum : undefined,
    };

    if (initialTask) {
      updateTask(initialTask.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)]">
          <h2 className="text-base font-semibold text-[var(--i)]">
            {initialTask ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-5 overflow-y-auto styled-scrollbar"
        >
          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, links, or acceptance criteria..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Priority
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="low" className="bg-[var(--surface-card)]">
                    Low
                  </option>
                  <option value="medium" className="bg-[var(--surface-card)]">
                    Medium
                  </option>
                  <option value="high" className="bg-[var(--surface-card)]">
                    High
                  </option>
                  <option value="urgent" className="bg-[var(--surface-card)]">
                    Urgent
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="todo" className="bg-[var(--surface-card)]">
                    To Do
                  </option>
                  <option value="doing" className="bg-[var(--surface-card)]">
                    Doing
                  </option>
                  <option value="done" className="bg-[var(--surface-card)]">
                    Done
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Project / List
              </label>
              <div className="relative">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  {projects.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      className="bg-[var(--surface-card)]"
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Recurrence
              </label>
              <div className="relative">
                <select
                  value={recurrence}
                  onChange={(e) =>
                    setRecurrence(e.target.value as TaskRecurrence)
                  }
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="none" className="bg-[var(--surface-card)]">
                    None
                  </option>
                  <option value="daily" className="bg-[var(--surface-card)]">
                    Daily
                  </option>
                  <option value="weekly" className="bg-[var(--surface-card)]">
                    Weekly
                  </option>
                  <option value="biweekly" className="bg-[var(--surface-card)]">
                    Biweekly
                  </option>
                  <option value="monthly" className="bg-[var(--surface-card)]">
                    Monthly
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Reminder
              </label>
              <div className="relative">
                <select
                  value={reminder}
                  onChange={(e) =>
                    setReminder(e.target.value as TaskReminderOffset)
                  }
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="none" className="bg-[var(--surface-card)]">
                    None
                  </option>
                  <option value="at_time" className="bg-[var(--surface-card)]">
                    At due time
                  </option>
                  <option value="10m" className="bg-[var(--surface-card)]">
                    10m before
                  </option>
                  <option value="30m" className="bg-[var(--surface-card)]">
                    30m before
                  </option>
                  <option value="1h" className="bg-[var(--surface-card)]">
                    1h before
                  </option>
                  <option value="1d" className="bg-[var(--surface-card)]">
                    1d before
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Estimate (min)
              </label>
              <input
                type="number"
                min={1}
                value={estimateMinutes}
                onChange={(e) => setEstimateMinutes(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Tags
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bt text-xs px-3 py-1.5"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {availableTags.map((preset) => {
                const selected = tags.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setTags(
                        selected
                          ? tags.filter((t) => t !== preset)
                          : [...tags, preset],
                      )
                    }
                    className={`badge-pill text-[11px] cursor-pointer transition-colors ${
                      selected
                        ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                        : "bg-[var(--bg)] text-[var(--m)] border-[var(--h)] hover:text-[var(--i)] hover:border-[var(--m)]"
                    }`}
                  >
                    #{preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Subtasks &amp; Checklist
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add checklist item..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bt text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl overflow-hidden bg-[var(--bg)]">
                {subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs"
                  >
                    <span className="truncate text-[var(--b)]">{s.text}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSubtasks(subtasks.filter((x) => x.id !== s.id))
                      }
                      className="text-[var(--m)] hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="bt p text-xs px-4 py-2">
              {initialTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
