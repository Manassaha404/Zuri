// Projects & Kanban Board Header with symmetrical layout, project selector, and board filters
"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  TrendingDown,
  ChevronDown,
  Settings,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import { useTasks } from "@/hook/tasks";
import { useProjectBoard } from "@/hook/projects";
import { useContacts } from "@/hook/contacts";
import type { CardPriority, SwimlaneMode } from "./types";
import type { TaskProject } from "@/components/tasks/types";

interface ProjectsHeaderProps {
  onOpenNewProject: () => void;
  onOpenEditProject: (project: TaskProject) => void;
  onOpenNewCard: () => void;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  planning: {
    label: "Planning",
    cls: "bg-purple-500/10 text-purple-500 border-purple-500/25",
  },
  active: {
    label: "Active",
    cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  },
  on_hold: {
    label: "On Hold",
    cls: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  },
  completed: {
    label: "Completed",
    cls: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  },
};

export function ProjectsHeader({
  onOpenNewProject,
  onOpenEditProject,
  onOpenNewCard,
}: ProjectsHeaderProps) {
  const { darkMode, toggleTheme } = useUIStore();
  const { projects } = useTasks();
  const { contacts } = useContacts();
  const {
    activeProjectId,
    swimlaneMode,
    showBurndown,
    cards,
    sprints,
    filters,
    setActiveProject,
    setSwimlaneMode,
    setShowBurndown,
    setSearchQuery,
    setPriorityFilter,
    setAssigneeFilter,
    setSprintFilter,
    setLabelFilter,
    resetFilters,
  } = useProjectBoard();

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId],
  );

  const projectCards = useMemo(
    () => cards.filter((c) => c.projectId === activeProjectId),
    [cards, activeProjectId],
  );

  const assignees = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => set.add(c.name));
    projectCards.forEach((c) => {
      if (c.assignee) set.add(c.assignee);
    });
    return Array.from(set).sort();
  }, [contacts, projectCards]);

  const projectSprints = useMemo(
    () => sprints.filter((s) => s.projectId === activeProjectId),
    [sprints, activeProjectId],
  );

  const hasFilters =
    Boolean(filters.searchQuery) ||
    Boolean(filters.labelFilter) ||
    filters.assigneeFilter !== "all" ||
    filters.priorityFilter !== "all" ||
    filters.sprintFilter !== "all";

  const statusInfo =
    STATUS_LABEL[activeProject?.status || "active"] || STATUS_LABEL.active!;

  return (
    <header className="flex flex-col gap-3.5 w-full min-w-0">
      {/* Row 1: Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--i)] truncate">
                Projects &amp; Boards
              </h1>
              {activeProject && (
                <span className={`badge-pill text-[11px] ${statusInfo.cls}`}>
                  {statusInfo.label}
                </span>
              )}
              {activeProject?.deadline && (
                <span className="badge-pill text-[11px] bg-[var(--s)] border-[var(--h)] text-[var(--m)]">
                  Due {activeProject.deadline}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--m)] mt-0.5 truncate">
              {activeProject?.description ||
                "Plan sprints, track milestones, and organize work with persistent drag-and-drop boards."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setShowBurndown(!showBurndown)}
            className={`bt !w-auto !h-9 whitespace-nowrap text-xs flex items-center gap-1.5 px-3 ${
              showBurndown ? "bg-[var(--s)] border-[var(--m)]" : ""
            }`}
          >
            <TrendingDown size={14} />
            <span>Sprints &amp; Burndown</span>
          </button>

          <ThemeToggle
            darkMode={darkMode}
            onToggle={toggleTheme}
            className="w-9 h-9 border border-[var(--h)] bg-[var(--s)] text-[var(--m)] hover:text-[var(--i)]"
            size={17}
          />

          <button
            type="button"
            onClick={onOpenNewCard}
            className="bt p !w-auto !h-9 whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 px-3.5"
          >
            <Plus size={15} />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* Row 2: Project Selector & Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)] mr-0.5">
            Project
          </span>
          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => setActiveProject(proj.id)}
                className={`h-8 flex items-center gap-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                    : "bg-[var(--bg)] text-[var(--b)] border-[var(--h)] hover:bg-[var(--s)]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: proj.color }}
                />
                <span>{proj.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenNewProject}
            className="h-8 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium border border-dashed border-[var(--h)] text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)] transition-colors"
          >
            <Plus size={13} />
            <span>New Project</span>
          </button>
        </div>

        {activeProject && (
          <button
            type="button"
            onClick={() => onOpenEditProject(activeProject)}
            className="bt !w-auto !h-8 whitespace-nowrap text-xs flex items-center gap-1.5 px-3 shrink-0 self-start sm:self-center"
          >
            <Settings size={13} />
            <span>Project Settings</span>
          </button>
        )}
      </div>

      {/* Row 3: Search & Symmetrical Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 w-full min-w-0">
        <div className="relative w-full md:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="relative">
            <select
              value={swimlaneMode}
              onChange={(e) => setSwimlaneMode(e.target.value as SwimlaneMode)}
              aria-label="Swimlanes"
              className="h-8 appearance-none bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] pl-3 pr-8 cursor-pointer hover:bg-[var(--s)] focus:outline-none focus:border-[var(--p)]"
            >
              <option value="none" className="bg-[var(--surface-card)]">
                No Swimlanes
              </option>
              <option value="priority" className="bg-[var(--surface-card)]">
                Swimlanes: Priority
              </option>
              <option value="assignee" className="bg-[var(--surface-card)]">
                Swimlanes: Assignee
              </option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
          </div>

          <div className="relative">
            <select
              value={filters.priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as CardPriority | "all")
              }
              aria-label="Filter priority"
              className="h-8 appearance-none bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] pl-3 pr-8 cursor-pointer hover:bg-[var(--s)] focus:outline-none focus:border-[var(--p)]"
            >
              <option value="all" className="bg-[var(--surface-card)]">
                All Priorities
              </option>
              <option value="urgent" className="bg-[var(--surface-card)]">
                Urgent
              </option>
              <option value="high" className="bg-[var(--surface-card)]">
                High
              </option>
              <option value="medium" className="bg-[var(--surface-card)]">
                Medium
              </option>
              <option value="low" className="bg-[var(--surface-card)]">
                Low
              </option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
          </div>

          {assignees.length > 0 && (
            <div className="relative">
              <select
                value={filters.assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                aria-label="Filter assignee"
                className="h-8 appearance-none bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] pl-3 pr-8 cursor-pointer hover:bg-[var(--s)] focus:outline-none focus:border-[var(--p)]"
              >
                <option value="all" className="bg-[var(--surface-card)]">
                  All Assignees
                </option>
                {assignees.map((a) => (
                  <option
                    key={a}
                    value={a}
                    className="bg-[var(--surface-card)]"
                  >
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
              />
            </div>
          )}

          {projectSprints.length > 0 && (
            <div className="relative">
              <select
                value={filters.sprintFilter}
                onChange={(e) => setSprintFilter(e.target.value)}
                aria-label="Filter sprint"
                className="h-8 appearance-none bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] pl-3 pr-8 cursor-pointer hover:bg-[var(--s)] focus:outline-none focus:border-[var(--p)]"
              >
                <option value="all" className="bg-[var(--surface-card)]">
                  All Sprints
                </option>
                {projectSprints.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-[var(--surface-card)]"
                  >
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
              />
            </div>
          )}

          {filters.labelFilter && (
            <button
              type="button"
              onClick={() => setLabelFilter(null)}
              className="h-8 badge-pill bg-blue-500/10 text-blue-500 border-blue-500/30 flex items-center gap-1"
            >
              <span>{filters.labelFilter}</span>
              <X size={11} />
            </button>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-8 text-xs font-medium text-[var(--m)] hover:text-[var(--i)] px-2.5 rounded-lg hover:bg-[var(--s)] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
