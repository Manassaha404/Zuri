// Weekly & Monthly Reports and Mood Correlation Analytics
"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Heart,
  Flame,
  Shield,
  Sparkles,
  Calendar,
  AlertCircle,
  Award,
} from "lucide-react";
import { useHabits } from "@/hook/habits";
import {
  calculateHabitStats,
  calculateMoodCorrelation,
  getDayOfWeek,
} from "@/lib/habitUtils";
import type { MoodType } from "./types";

export function HabitReportsView() {
  const { habits, checkIns, streakFreezes } = useHabits();
  const [reportPeriod, setReportPeriod] = useState<
    "week" | "month" | "quarter"
  >("month");

  const activeHabits = useMemo(
    () => habits.filter((h) => h.status === "active"),
    [habits],
  );

  // Calculate habit stats leaderboard
  const habitLeaderboard = useMemo(() => {
    return activeHabits
      .map((h) => {
        const stats = calculateHabitStats(h, checkIns, streakFreezes);
        return {
          habit: h,
          stats,
        };
      })
      .sort((a, b) => b.stats.completionRate - a.stats.completionRate);
  }, [activeHabits, checkIns, streakFreezes]);

  // Overall aggregate stats
  const overallStats = useMemo(() => {
    const totalCompletions = Object.values(checkIns).filter(
      (c) => c.completed,
    ).length;
    const avgRate =
      habitLeaderboard.length > 0
        ? Math.round(
            habitLeaderboard.reduce(
              (acc, item) => acc + item.stats.completionRate,
              0,
            ) / habitLeaderboard.length,
          )
        : 0;

    const totalFreezesUsed = streakFreezes.length;

    return {
      totalCompletions,
      avgRate,
      totalFreezesUsed,
      activeHabitsCount: activeHabits.length,
    };
  }, [checkIns, habitLeaderboard, streakFreezes, activeHabits]);

  // Weekday distribution (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const weekdayStats = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: number[] = [0, 0, 0, 0, 0, 0, 0];
    const totals: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (const rec of Object.values(checkIns)) {
      const d = getDayOfWeek(rec.date);
      if (d >= 0 && d < 7) {
        totals[d] = (totals[d] ?? 0) + 1;
        if (rec.completed) {
          counts[d] = (counts[d] ?? 0) + 1;
        }
      }
    }

    return dayNames.map((name, i) => {
      const total = totals[i] ?? 0;
      const count = counts[i] ?? 0;
      const rate = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        name,
        completed: count,
        total,
        rate,
      };
    });
  }, [checkIns]);

  // Mood correlation analysis
  const moodCorrelation = useMemo(() => {
    return calculateMoodCorrelation(checkIns);
  }, [checkIns]);

  const getMoodIcon = (mood: MoodType) => {
    switch (mood) {
      case "great":
        return <Sparkles size={16} className="text-[#10b981]" />;
      case "good":
        return <Smile size={16} className="text-[#3b82f6]" />;
      case "neutral":
        return <Meh size={16} className="text-[var(--m)]" />;
      case "low":
        return <Frown size={16} className="text-[#f59e0b]" />;
      case "stressed":
        return <AlertCircle size={16} className="text-[#ef4444]" />;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
              Habit Performance & Mood Correlation
            </h2>
          </div>
          <p className="text-xs text-[var(--m)] mt-0.5">
            Discover behavioral trends and understand how completing daily
            habits uplifts your psychological state.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="nav-pill-group self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setReportPeriod("week")}
            className={`nav-pill-item ${reportPeriod === "week" ? "bg-[var(--p)] text-[var(--pt)]" : "text-[var(--m)] hover:text-[var(--i)]"}`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setReportPeriod("month")}
            className={`nav-pill-item ${reportPeriod === "month" ? "bg-[var(--p)] text-[var(--pt)]" : "text-[var(--m)] hover:text-[var(--i)]"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setReportPeriod("quarter")}
            className={`nav-pill-item ${reportPeriod === "quarter" ? "bg-[var(--p)] text-[var(--pt)]" : "text-[var(--m)] hover:text-[var(--i)]"}`}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)] mb-2">
            <span className="text-xs font-medium">Avg Completion</span>
            <TrendingUp size={16} className="text-[#10b981]" />
          </div>
          <span className="text-2xl font-bold text-[var(--i)] tracking-tight">
            {overallStats.avgRate}%
          </span>
          <span className="text-[11px] text-[#10b981] font-medium block mt-1">
            +4.2% vs previous period
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)] mb-2">
            <span className="text-xs font-medium">Total Check-Ins</span>
            <Flame size={16} className="text-[#f97316]" />
          </div>
          <span className="text-2xl font-bold text-[var(--i)] tracking-tight">
            {overallStats.totalCompletions}
          </span>
          <span className="text-[11px] text-[var(--m)] block mt-1">
            Across {overallStats.activeHabitsCount} active habits
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)] mb-2">
            <span className="text-xs font-medium">Freezes Used</span>
            <Shield size={16} className="text-[#38bdf8]" />
          </div>
          <span className="text-2xl font-bold text-[#38bdf8] tracking-tight">
            {overallStats.totalFreezesUsed}
          </span>
          <span className="text-[11px] text-[var(--m)] block mt-1">
            Streaks protected safely
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)] mb-2">
            <span className="text-xs font-medium">Top Consistency</span>
            <Award size={16} className="text-[#eab308]" />
          </div>
          <span className="text-lg font-bold text-[var(--i)] truncate block">
            {habitLeaderboard[0]?.habit.name || "None"}
          </span>
          <span className="text-[11px] text-[var(--m)] block mt-1">
            {habitLeaderboard[0]?.stats.currentStreak || 0} days unbroken
          </span>
        </div>
      </div>

      {/* Mood Correlation Analysis */}
      <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--h)]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--i)]">
                Psychological Mood & Habit Correlation
              </h3>
            </div>
            <p className="text-xs text-[var(--m)] mt-0.5">
              How your daily mental state corresponds with habit follow-through.
            </p>
          </div>
        </div>

        {/* Insight Highlight Card */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] mb-5">
          <p className="text-xs text-[var(--b)] leading-relaxed">
            <strong className="text-[var(--i)] font-semibold">
              Key Behavioral Insight:
            </strong>{" "}
            On days when you hit your Morning Routine and daily targets, your
            reported mood is <strong>Energized / Calm</strong> over{" "}
            <span className="text-[#10b981] font-semibold">86%</span> of the
            time. Habit completion strongly acts as a positive feedback loop for
            afternoon focus and emotional balance.
          </p>
        </div>

        {/* Mood Breakdown Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {moodCorrelation.map((item) => (
            <div
              key={item.mood}
              className="p-3.5 rounded-xl border border-[var(--h)] bg-[var(--s)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getMoodIcon(item.mood)}
                  <span className="text-xs font-semibold text-[var(--i)]">
                    {item.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--i)]">
                  {item.averageCompletionRate}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-[var(--h)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10b981]"
                  style={{ width: `${item.averageCompletionRate}%` }}
                />
              </div>

              <span className="text-[10px] text-[var(--m)] mt-2 block">
                {item.sampleCheckIns} check-in entries logged
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekday Distribution & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday Completion Distribution */}
        <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
          <h3 className="text-sm font-semibold text-[var(--i)] mb-1">
            Consistency by Day of Week
          </h3>
          <p className="text-xs text-[var(--m)] mb-4">
            Identifying peak momentum days and potential weekend drop-offs.
          </p>

          <div className="flex flex-col gap-2.5">
            {weekdayStats.map((item) => (
              <div key={item.name} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-medium text-[var(--m)]">
                  {item.name}
                </span>

                <div className="flex-1 h-3 rounded-full bg-[var(--surface-card)] overflow-hidden border border-[var(--h)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>

                <span className="w-10 text-right font-semibold text-[var(--i)]">
                  {item.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Consistency Leaderboard */}
        <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
          <h3 className="text-sm font-semibold text-[var(--i)] mb-1">
            Habit Consistency Leaderboard
          </h3>
          <p className="text-xs text-[var(--m)] mb-4">
            Ranked by overall completion percentage and current streak.
          </p>

          <div className="flex flex-col gap-3">
            {habitLeaderboard.slice(0, 5).map((item, idx) => (
              <div
                key={item.habit.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-xs font-bold text-[var(--m)]">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[var(--i)] block truncate">
                      {item.habit.name}
                    </span>
                    <span className="text-[10px] text-[var(--m)] flex items-center gap-1">
                      <Flame size={11} className="text-[#f97316]" />
                      {item.stats.currentStreak} day streak
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#10b981]">
                    {item.stats.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
