// Header component for Deadline Tracker workspace
"use client";

import { useRouter } from "next/navigation";
import {
  Timer,
  Plus,
  Calendar,
  Clock,
  CalendarDays,
  BarChart3,
  Search,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import { useDeadlineStore } from "@/store/deadlineStore";
import type { DeadlineViewTab, DeadlinePriority } from "./types";

interface DeadlinesHeaderProps {
  onOpenCreateModal: () => void;
  onOpenManageCategories: () => void;
}

export function DeadlinesHeader({
  onOpenCreateModal,
  onOpenManageCategories,
}: DeadlinesHeaderProps) {
  const router = useRouter();
  const { darkMode, toggleTheme } = useUIStore();
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    priorityFilter,
    setPriorityFilter,
    deadlines,
    categories,
  } = useDeadlineStore();

  const tabs: Array<{
    id: DeadlineViewTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      id: "nearest",
      label: "Nearest Due",
      icon: <Clock size={14} />,
      count: deadlines.filter((d) => d.status !== "done").length,
    },
    {
      id: "this_week",
      label: "Due This Week",
      icon: <CalendarDays size={14} />,
      count: deadlines.filter((d) => {
        if (d.status === "done") return false;
        const diffDays =
          (new Date(d.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }).length,
    },
    {
      id: "calendar",
      label: "Calendar View",
      icon: <Calendar size={14} />,
    },
    {
      id: "stats",
      label: "Analytics",
      icon: <BarChart3 size={14} />,
    },
  ];

  const priorities: Array<{ id: DeadlinePriority | "all"; label: string }> = [
    { id: "all", label: "All Priorities" },
    { id: "urgent", label: "Urgent" },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ];

  return (
    <header className="flex flex-col gap-5 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 shadow-xs">
      {/* Top Bar: Title, Navigation, Theme & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--h)]">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--p)] text-[var(--pt)] flex items-center justify-center shadow-xs">
              <Timer size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-[var(--i)] tracking-tight">
                  Deadline Tracker
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--s)] border border-[var(--h)] text-[var(--m)]">
                  Live Countdown & Pacing
                </span>
              </div>
              <p className="text-xs text-[var(--m)]">
                Countdowns, urgency tiers, soft vs. hard deadlines & custom
                categories
              </p>
            </div>
          </div>
        </div>

        {/* Right: Manage Categories, Theme Toggle and Add Deadline Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenManageCategories}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--h)] bg-[var(--bg)] hover:bg-[var(--s)] text-[var(--b)] transition-colors shadow-2xs"
            title="Manage Deadline Categories"
          >
            <Tag size={13} className="text-[var(--accent)]" />
            <span>Categories</span>
          </button>

          <div className="border border-[var(--h)] rounded-lg p-0.5 bg-[var(--bg)]">
            <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--p)] text-[var(--pt)] hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus size={15} />
            <span>New Deadline</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Nav Pills for Views */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--s)] border border-[var(--h)] no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full text-xs font-semibold px-3.5 py-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--bg)]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? "bg-[var(--pt)] text-[var(--p)]"
                        : "bg-[var(--h)] text-[var(--m)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Select Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search box */}
          <div className="relative flex-1 sm:w-56 min-w-[180px]">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deadlines..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg)] border border-[var(--h)] rounded-lg text-[var(--i)] placeholder:text-[var(--m)] focus:outline-hidden focus:border-[var(--p)] transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter deadlines by category"
            className="styled-select text-xs"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name.toLowerCase()}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as DeadlinePriority | "all")
            }
            aria-label="Filter deadlines by priority"
            className="styled-select text-xs"
          >
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
