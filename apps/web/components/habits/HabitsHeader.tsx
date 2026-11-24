// Habits Workspace Header Component
"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  LayoutGrid,
  List,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import { useHabits } from "@/hook/habits";
import { useHabitStore, type HabitWorkspaceTab } from "@/store/habitStore";
import { getTodayKey } from "@/lib/habitUtils";

interface HabitsHeaderProps {
  onOpenCreateModal: () => void;
}

export function HabitsHeader({ onOpenCreateModal }: HabitsHeaderProps) {
  const { darkMode, toggleTheme } = useUIStore();
  const { activeTab, setActiveTab, viewMode, setViewMode } = useHabitStore();
  const { habits, checkIns, streakFreezes } = useHabits();

  const todayKey = getTodayKey();

  // Quick stats summary
  const summary = useMemo(() => {
    const active = habits.filter((h) => h.status === "active");
    const completedToday = active.filter((h) => {
      if (h.type === "negative") return true;
      return checkIns[`${h.id}_${todayKey}`]?.completed;
    }).length;

    const totalActive = active.length;
    const completionPct =
      totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;

    return {
      totalActive,
      completedToday,
      completionPct,
      freezesCount: streakFreezes.length,
    };
  }, [habits, checkIns, todayKey, streakFreezes]);

  const tabs: Array<{
    id: HabitWorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "tracker",
      label: "Daily Tracker",
      icon: <CheckCircle2 size={14} />,
    },
    {
      id: "routines",
      label: "Routines & Stacks",
      icon: <Layers size={14} />,
    },
    {
      id: "heatmap",
      label: "Calendar Heatmap",
      icon: <Calendar size={14} />,
    },
    {
      id: "reports",
      label: "Analytics & Reports",
      icon: <BarChart3 size={14} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4 border-b border-[var(--h)]">
      {/* Top Bar: Title, Stats & Right Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Workspace Branding */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            replace
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--h)] bg-[var(--s)] text-xs font-semibold text-[var(--i)] hover:bg-[var(--h)] transition-colors no-underline shadow-2xs shrink-0"
            title="Back to AI Chat"
          >
            <ArrowLeft size={14} className="text-[var(--m)]" />
            <MessageSquare size={14} className="text-[#3b82f6]" />
            <span className="hidden sm:inline">Back to Chat</span>
          </Link>

          <div className="w-10 h-10 rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 flex items-center justify-center shrink-0">
            <Flame size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--i)] tracking-tight">
                Habit Tracker
              </h1>
              <span className="badge-pill bg-[#10b981]/15 text-[#059669] border-[#10b981]/30 font-semibold">
                {summary.completedToday}/{summary.totalActive} Today
              </span>
            </div>
            <p className="text-xs text-[var(--m)]">
              Build momentum, stack routines, and sustain daily consistency.
            </p>
          </div>
        </div>

        {/* Right Actions: Create & Theme Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="bt p text-xs font-semibold px-3.5 py-1.5 flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={15} />
            <span>New Habit</span>
          </button>

          {/* Dark / Light Mode Toggle beside New Habit */}
          <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
        </div>
      </div>

      {/* Navigation Tabs & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="nav-pill-group overflow-x-auto habits-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nav-pill-item flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)]"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: Grid View vs List View */}
        {activeTab === "tracker" && (
          <div className="flex items-center p-1 rounded-full bg-[var(--s)] border border-[var(--h)] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
              title="Grid view"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
              title="List view"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
