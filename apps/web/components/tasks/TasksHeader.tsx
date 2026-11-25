// Tasks Header with back link, metrics, natural language Quick-Add bar, view tabs, and filters
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  X,
  Tag,
  Repeat,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import { useTasks } from "@/hook/tasks";
import { parseQuickAddTask } from "@/lib/taskQuickAdd";
import type { TaskPriority, TaskViewTab } from "./types";

interface TasksHeaderProps {
  onOpenCreateModal: () => void;
}

export function TasksHeader({ onOpenCreateModal }: TasksHeaderProps) {
  const { darkMode, toggleTheme } = useUIStore();
  const {
    tasks,
    projects,
    activeView,
    filters,
    setActiveView,
    setSearchQuery,
    setPriorityFilter,
    setTagFilter,
    resetFilters,
    addTask,
    addProject,
  } = useTasks();

  const [quickInput, setQuickInput] = useState("");

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Parsed preview for natural language quick-add
  const parsedPreview = useMemo(() => {
    if (!quickInput.trim()) return null;
    return parseQuickAddTask(quickInput);
  }, [quickInput]);

  // Quick metrics
  const stats = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let doingCount = 0;

    tasks.forEach((t) => {
      if (t.status === "done") {
        completedCount += 1;
        return;
      }
      if (t.status === "doing") doingCount += 1;
      if (t.dueDate) {
        if (t.dueDate < todayStr) overdueCount += 1;
        else if (t.dueDate === todayStr) todayCount += 1;
        else upcomingCount += 1;
      }
    });

    return {
      total: tasks.length,
      todayCount,
      upcomingCount,
      overdueCount,
      completedCount,
      doingCount,
    };
  }, [tasks, todayStr]);

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const parsed = parseQuickAddTask(quickInput);
    let targetProjectId =
      filters.projectId !== "all"
        ? filters.projectId
        : projects[0]?.id || "proj-inbox";

    if (parsed.projectName) {
      const matched = projects.find(
        (p) => p.name.toLowerCase() === parsed.projectName!.toLowerCase(),
      );
      if (matched) {
        targetProjectId = matched.id;
      } else {
        const created = await addProject(parsed.projectName, "#3b82f6");
        targetProjectId = created.id;
      }
    }

    addTask({
      title: parsed.title,
      dueDate:
        parsed.dueDate || (activeView === "today" ? todayStr : undefined),
      dueTime: parsed.dueTime,
      priority: parsed.priority || "medium",
      status: "todo",
      projectId: targetProjectId,
      tags: parsed.tags,
      subtasks: [],
      recurrence: parsed.recurrence || "none",
      reminder: parsed.dueTime ? "10m" : "none",
      estimateMinutes: parsed.estimateMinutes,
    });

    setQuickInput("");
  };

  const viewTabs: { id: TaskViewTab; label: string; count?: number }[] = [
    { id: "today", label: "Today", count: stats.todayCount },
    { id: "upcoming", label: "Upcoming", count: stats.upcomingCount },
    { id: "overdue", label: "Overdue", count: stats.overdueCount },
    { id: "completed", label: "Completed", count: stats.completedCount },
    { id: "all", label: "All Tasks", count: stats.total },
  ];

  const priorityOptions: { value: "all" | TaskPriority; label: string }[] = [
    { value: "all", label: "All Priorities" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.projectId !== "all" ||
    filters.priorityFilter !== "all" ||
    Boolean(filters.tagFilter);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      {/* Top Row: Back, Title, ThemeToggle, Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--i)] break-words">
                Task Tracker
              </h1>
              <span className="badge-pill bg-[var(--s)] text-[var(--m)] border border-[var(--h)] shrink-0">
                {stats.total} total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--m)] mt-1 break-words">
              Organize tasks, subtasks, projects, recurring schedules, and focus
              sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <ThemeToggle
            darkMode={darkMode}
            onToggle={toggleTheme}
            className="w-9 h-9 border border-[var(--h)] bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)]"
            size={18}
          />
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="bt p text-xs sm:text-sm font-semibold flex items-center gap-2 px-3.5 py-2 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              Due Today
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.todayCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              In Progress
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.doingCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <AlertCircle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              Overdue
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.overdueCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--m)] font-medium uppercase tracking-wider truncate">
              Completed
            </p>
            <p className="text-lg font-bold text-[var(--i)] leading-tight truncate">
              {stats.completedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Natural Language Quick Add */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} className="text-[var(--accent)] shrink-0" />
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder='Quick add: e.g. "pay rent tomorrow 5pm #finance !high ~15m"'
            className="flex-1 bg-transparent text-sm text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none min-w-0"
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="bt p text-xs px-3 py-1.5 disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {parsedPreview && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[var(--h)] text-[11px]">
            <span className="text-[var(--m)] font-medium">Parsed:</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--s)] border border-[var(--h)] text-[var(--i)] font-medium truncate max-w-[220px]">
              {parsedPreview.title}
            </span>
            {parsedPreview.dueDate && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                {parsedPreview.dueDate}
                {parsedPreview.dueTime ? ` ${parsedPreview.dueTime}` : ""}
              </span>
            )}
            {parsedPreview.priority && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium uppercase">
                {parsedPreview.priority}
              </span>
            )}
            {parsedPreview.projectName && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-medium">
                @{parsedPreview.projectName}
              </span>
            )}
            {parsedPreview.estimateMinutes && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--s)] border border-[var(--h)] text-[var(--b)]">
                ~{parsedPreview.estimateMinutes}m
              </span>
            )}
            {parsedPreview.recurrence && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                <Repeat size={10} />
                {parsedPreview.recurrence}
              </span>
            )}
            {parsedPreview.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--s)] border border-[var(--h)] text-[var(--m)]"
              >
                <Tag size={10} />
                {t}
              </span>
            ))}
          </div>
        )}
      </form>

      {/* View Tabs & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full min-w-0">
        <div className="nav-pill-group flex items-center gap-1 overflow-x-auto styled-scrollbar max-w-full">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
              className={`nav-pill-item flex items-center gap-1.5 whitespace-nowrap ${
                activeView === tab.id ? "active" : ""
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeView === tab.id
                      ? "bg-[var(--pt)]/20 text-[var(--pt)]"
                      : "bg-[var(--bg)] text-[var(--m)] border border-[var(--h)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="relative flex-1 sm:flex-initial sm:w-52 min-w-[160px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
            />
          </div>

          <div className="relative">
            <select
              value={filters.priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as "all" | TaskPriority)
              }
              aria-label="Filter by priority"
              className="appearance-none bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] pl-3 pr-8 py-1.5 cursor-pointer hover:bg-[var(--s)] focus:outline-none focus:border-[var(--p)]"
            >
              {priorityOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-[var(--surface-card)] text-[var(--i)]"
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
          </div>

          {filters.tagFilter && (
            <button
              type="button"
              onClick={() => setTagFilter(null)}
              className="badge-pill bg-blue-500/10 text-blue-500 border-blue-500/30 flex items-center gap-1 cursor-pointer"
            >
              <Tag size={11} />
              <span>{filters.tagFilter}</span>
              <X size={11} />
            </button>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-[var(--m)] hover:text-[var(--i)] px-2 py-1 rounded-md hover:bg-[var(--s)] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
