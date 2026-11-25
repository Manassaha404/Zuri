// Header for Fitness Tracker workspace
"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  Apple,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calculator,
  Dumbbell,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import { useFitnessStore } from "@/store/fitnessStore";
import type { FitnessWorkspaceTab } from "./types";

interface FitnessHeaderProps {
  onOpenCalculators: () => void;
}

export function FitnessHeader({ onOpenCalculators }: FitnessHeaderProps) {
  const router = useRouter();
  const { darkMode, toggleTheme } = useUIStore();
  const {
    activeTab,
    setActiveTab,
    unit,
    setUnit,
    isDeloadWeek,
    toggleDeloadWeek,
    activeWorkout,
  } = useFitnessStore();

  const tabs: Array<{
    id: FitnessWorkspaceTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: "workout",
      label: "Workout",
      icon: <Dumbbell size={14} />,
      badge: activeWorkout ? "Live" : undefined,
    },
    {
      id: "library",
      label: "Exercises & Programs",
      icon: <BookOpen size={14} />,
    },
    {
      id: "nutrition",
      label: "Nutrition",
      icon: <Apple size={14} />,
    },
    {
      id: "body",
      label: "Body & Recovery",
      icon: <HeartPulse size={14} />,
    },
    {
      id: "insights",
      label: "History & Insights",
      icon: <BarChart3 size={14} />,
    },
  ];

  return (
    <header className="flex flex-col gap-5 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 shadow-xs">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--h)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[var(--accent)] border border-blue-500/20 flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--i)]">
                Fitness Tracker
              </h1>
              {isDeloadWeek && (
                <span className="badge-pill bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert size={11} />
                  Deload Week
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--m)]">
              Workouts, progressive overload, nutrition, body metrics, and
              recovery
            </p>
          </div>
        </div>

        {/* Right Global Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenCalculators}
            className="bt !w-auto !h-8 px-3 text-xs font-medium"
            title="Plate & 1RM Calculators"
          >
            <Calculator size={13} />
            <span>Plates &amp; 1RM</span>
          </button>

          <button
            type="button"
            onClick={toggleDeloadWeek}
            className={`bt !w-auto !h-8 px-3 text-xs font-medium ${
              isDeloadWeek
                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : ""
            }`}
            title="Toggle Deload Week (-35% intensity guidance)"
          >
            <span>{isDeloadWeek ? "Deload: On" : "Deload: Off"}</span>
          </button>

          <button
            type="button"
            onClick={() => setUnit(unit === "kg" ? "lbs" : "kg")}
            className="bt !w-auto !h-8 px-2.5 text-xs font-semibold uppercase"
            title="Toggle weight unit"
          >
            {unit}
          </button>

          <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto styled-scrollbar pb-0.5">
        <div className="nav-pill-group flex items-center gap-1 shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nav-pill-item flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500 text-white font-semibold leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
