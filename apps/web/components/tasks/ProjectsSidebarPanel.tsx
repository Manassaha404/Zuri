// Projects, Tags, and Pomodoro Focus Timer Panel
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Folder,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Tag,
  Trash2,
  Kanban,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTasks } from "@/hook/tasks";
import type { PomodoroMode } from "./types";

const PROJECT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export function ProjectsSidebarPanel() {
  const {
    tasks,
    projects,
    filters,
    pomodoro,
    setProjectFilter,
    setTagFilter,
    addProject,
    deleteProject,
    setPomodoroMode,
    togglePomodoroRunning,
    resetPomodoro,
  } = useTasks();

  const [newProjName, setNewProjName] = useState("");
  const [newProjColor, setNewProjColor] = useState<string>(
    PROJECT_COLORS[0] ?? "#3b82f6",
  );
  const [showAddProj, setShowAddProj] = useState(false);
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(false);

  useEffect(() => {
    if (!isTimerFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsTimerFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTimerFullscreen]);

  const allTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    tasks.forEach((t) => {
      t.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  const activePomodoroTask = useMemo(
    () => tasks.find((t) => t.id === pomodoro.activeTaskId) || null,
    [tasks, pomodoro.activeTaskId],
  );

  const formattedTime = useMemo(() => {
    const mins = Math.floor(pomodoro.secondsLeft / 60);
    const secs = pomodoro.secondsLeft % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [pomodoro.secondsLeft]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    addProject(newProjName, newProjColor);
    setNewProjName("");
    setShowAddProj(false);
  };

  const modeLabels: { id: PomodoroMode; label: string; fullLabel: string }[] = [
    { id: "focus", label: "Focus", fullLabel: "Focus" },
    { id: "short_break", label: "Short", fullLabel: "Short Break" },
    { id: "long_break", label: "Long", fullLabel: "Long Break" },
  ];

  return (
    <aside className="flex flex-col gap-4 w-full lg:w-72 shrink-0 min-w-0">
      {/* Fullscreen Timer Overlay */}
      {isTimerFullscreen && (
        <div className="fixed inset-0 z-50 bg-[var(--bg)]/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg p-8 rounded-3xl bg-[var(--surface-card)] border border-[var(--h)] shadow-lg flex flex-col items-center gap-6 text-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-[var(--accent)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
                  Focus Timer
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerFullscreen(false)}
                className="p-2 rounded-lg border border-[var(--h)] bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)] transition-colors"
                title="Exit full screen"
                aria-label="Exit full screen"
              >
                <Minimize2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--s)] p-1 rounded-xl border border-[var(--h)]">
              {modeLabels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPomodoroMode(m.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pomodoro.mode === m.id
                      ? "bg-[var(--p)] text-[var(--pt)]"
                      : "text-[var(--m)] hover:text-[var(--i)]"
                  }`}
                >
                  {m.fullLabel}
                </button>
              ))}
            </div>

            <span className="text-7xl font-bold tracking-tight text-[var(--i)] tabular-nums py-2">
              {formattedTime}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePomodoroRunning}
                className="bt p px-6 py-2.5 text-sm flex items-center gap-2 rounded-xl"
              >
                {pomodoro.isRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{pomodoro.isRunning ? "Pause" : "Start"}</span>
              </button>
              <button
                type="button"
                onClick={resetPomodoro}
                className="bt px-4 py-2.5 text-sm flex items-center gap-2 rounded-xl"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
            </div>

            <div className="text-sm text-[var(--m)] border-t border-[var(--h)] pt-4 w-full truncate">
              {activePomodoroTask ? (
                <span>
                  Focusing on:{" "}
                  <strong className="text-[var(--i)] font-medium">
                    {activePomodoroTask.title}
                  </strong>
                </span>
              ) : (
                <span>No task linked — running standalone timer</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pomodoro Focus Timer */}
      <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Timer size={15} className="text-[var(--accent)] shrink-0" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--m)] truncate">
              Timer
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 bg-[var(--s)] p-0.5 rounded-lg border border-[var(--h)]">
              {modeLabels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPomodoroMode(m.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    pomodoro.mode === m.id
                      ? "bg-[var(--p)] text-[var(--pt)]"
                      : "text-[var(--m)] hover:text-[var(--i)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsTimerFullscreen(true)}
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Expand timer full screen"
              aria-label="Expand timer full screen"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-3xl font-bold tracking-tight text-[var(--i)] tabular-nums">
            {formattedTime}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePomodoroRunning}
              className="bt p w-9 h-9 p-0 flex items-center justify-center rounded-lg"
              aria-label={pomodoro.isRunning ? "Pause timer" : "Start timer"}
            >
              {pomodoro.isRunning ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button
              type="button"
              onClick={resetPomodoro}
              className="bt w-9 h-9 p-0 flex items-center justify-center rounded-lg"
              aria-label="Reset timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="text-xs text-[var(--m)] truncate border-t border-[var(--h)] pt-2">
          {activePomodoroTask ? (
            <span>
              Focusing on:{" "}
              <strong className="text-[var(--i)] font-medium">
                {activePomodoroTask.title}
              </strong>
            </span>
          ) : (
            <span>Select a task&apos;s Focus button to link timer</span>
          )}
        </div>
      </div>

      {/* Projects / Lists */}
      <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder size={15} className="text-[var(--m)]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              Projects &amp; Lists
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/projects"
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Open Projects & Kanban Boards"
            >
              <Kanban size={14} />
            </Link>
            <button
              type="button"
              onClick={() => setShowAddProj((v) => !v)}
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Add project"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {showAddProj && (
          <form
            onSubmit={handleAddProject}
            className="flex flex-col gap-2 p-2.5 rounded-xl bg-[var(--s)] border border-[var(--h)]"
          >
            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="Project name..."
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewProjColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      newProjColor === c
                        ? "scale-125 ring-2 ring-[var(--p)]"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
              <button type="submit" className="bt p text-[11px] px-2.5 py-1">
                Create
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto styled-scrollbar">
          <button
            type="button"
            onClick={() => setProjectFilter("all")}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.projectId === "all"
                ? "bg-[var(--p)] text-[var(--pt)]"
                : "text-[var(--b)] hover:bg-[var(--s)]"
            }`}
          >
            <span>All Projects</span>
            <span className="text-[11px] opacity-75">
              {tasks.filter((t) => t.status !== "done").length}
            </span>
          </button>

          {projects.map((proj) => {
            const count = tasks.filter(
              (t) => t.projectId === proj.id && t.status !== "done",
            ).length;
            const isActive = filters.projectId === proj.id;

            return (
              <div
                key={proj.id}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)]"
                    : "text-[var(--b)] hover:bg-[var(--s)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setProjectFilter(proj.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color }}
                  />
                  <span className="truncate">{proj.name}</span>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] opacity-75">{count}</span>
                  {proj.id !== "proj-inbox" && (
                    <button
                      type="button"
                      onClick={() => deleteProject(proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-opacity"
                      title="Delete project"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-[var(--m)]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              Tags
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(([tag, count]) => {
              const active = filters.tagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(active ? null : tag)}
                  className={`badge-pill text-[11px] cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                      : "bg-[var(--s)] text-[var(--b)] border-[var(--h)] hover:border-[var(--m)]"
                  }`}
                >
                  #{tag} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
