// History Calendar, Muscle Volume Heatmap, Summary Insights & Goals
"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  Flame,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useFitness } from "@/hook/fitness";
import {
  calcSessionVolume,
  getWeeklyMuscleVolume,
  MUSCLE_GROUPS,
  toDateKey,
} from "@/lib/fitnessUtils";
import type { FitnessGoal } from "./types";

export function InsightsAndHistoryView() {
  const {
    sessions,
    cardioSessions,
    exercises,
    goals,
    unit,
    addGoal,
    updateGoalProgress,
    deleteGoal,
  } = useFitness();

  const [selectedDay, setSelectedDay] = useState<string>(toDateKey());
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] =
    useState<FitnessGoal["category"]>("Strength");
  const [goalCurrent, setGoalCurrent] = useState("60");
  const [goalTarget, setGoalTarget] = useState("80");
  const [goalUnit, setGoalUnit] = useState("kg");
  const [goalDate, setGoalDate] = useState("2027-03-01");

  const summary = useMemo(() => {
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);
    const cutoffKey = toDateKey(cutoff30);
    const recent = sessions.filter((s) => s.date >= cutoffKey);

    const totalVolume = recent.reduce(
      (sum, s) => sum + calcSessionVolume(s),
      0,
    );
    const prCount = recent.reduce(
      (sum, s) =>
        sum +
        s.exercises.reduce(
          (exSum, ex) =>
            exSum + ex.sets.filter((st) => st.prs && st.prs.length > 0).length,
          0,
        ),
      0,
    );
    const consistency = Math.min(100, Math.round((recent.length / 16) * 100));

    return {
      sessionsCount: recent.length,
      totalVolume: Math.round(totalVolume),
      prCount,
      consistency,
    };
  }, [sessions]);

  const weeklyMuscleVolume = useMemo(
    () => getWeeklyMuscleVolume(sessions, exercises, 7),
    [sessions, exercises],
  );

  // Build current month calendar grid
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const workoutDays = new Set(sessions.map((s) => s.date));
    const cardioDays = new Set(cardioSessions.map((c) => c.date));

    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const key = toDateKey(d);
      return {
        day: i + 1,
        key,
        hasWorkout: workoutDays.has(key),
        hasCardio: cardioDays.has(key),
      };
    });
  }, [sessions, cardioSessions]);

  const daySessions = useMemo(
    () => sessions.filter((s) => s.date === selectedDay),
    [sessions, selectedDay],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 30-Day Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--m)]">
            <Calendar size={13} className="text-[var(--accent)]" />
            <span>30-Day Sessions</span>
          </div>
          <div className="text-2xl font-bold text-[var(--i)] mt-1">
            {summary.sessionsCount}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--m)]">
            <TrendingUp size={13} className="text-emerald-500" />
            <span>Total Volume</span>
          </div>
          <div className="text-2xl font-bold text-[var(--i)] mt-1">
            {summary.totalVolume.toLocaleString()} {unit}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--m)]">
            <Trophy size={13} className="text-amber-500" />
            <span>PRs Hit</span>
          </div>
          <div className="text-2xl font-bold text-[var(--i)] mt-1">
            {summary.prCount}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--m)]">
            <Flame size={13} className="text-orange-500" />
            <span>Consistency</span>
          </div>
          <div className="text-2xl font-bold text-[var(--i)] mt-1">
            {summary.consistency}%
          </div>
        </div>
      </div>

      {/* Calendar + Muscle-Group Volume Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-6 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--i)]">
              Workout History Calendar
            </h2>
            <span className="text-xs text-[var(--m)]">
              {new Date().toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((d) => {
              const isSelected = selectedDay === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDay(d.key)}
                  className={`h-10 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)]"
                      : d.hasWorkout
                        ? "bg-emerald-500/15 border-emerald-500/30 text-[var(--i)]"
                        : "bg-[var(--bg)] border-[var(--h)] text-[var(--m)] hover:bg-[var(--s)]"
                  }`}
                >
                  <span>{d.day}</span>
                  {(d.hasWorkout || d.hasCardio) && (
                    <span className="flex gap-0.5">
                      {d.hasWorkout && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      {d.hasCardio && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Day Inspector */}
          <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[var(--i)]">
              Sessions on {selectedDay}
            </span>
            {daySessions.length === 0 ? (
              <p className="text-xs text-[var(--m)]">
                Rest day — no strength workouts logged.
              </p>
            ) : (
              daySessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-2.5 rounded-lg bg-[var(--s)] border border-[var(--h)] text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-[var(--i)]">
                    <span>{sess.title}</span>
                    <span>
                      {Math.round(calcSessionVolume(sess))} {unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--m)] mt-0.5">
                    {sess.exercises.map((e) => e.exerciseName).join(", ")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Muscle-Group Volume Heatmap */}
        <div className="lg:col-span-6 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--i)]">
              Weekly Muscle-Group Volume Heatmap
            </h2>
            <p className="text-xs text-[var(--m)]">
              Working sets in the last 7 days — spot neglected muscle groups
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MUSCLE_GROUPS.filter((m) => m !== "Full Body").map((mg) => {
              const setsCount = weeklyMuscleVolume[mg] || 0;
              const status =
                setsCount === 0
                  ? "Neglected"
                  : setsCount < 6
                    ? "Low"
                    : setsCount <= 14
                      ? "Optimal"
                      : "High";
              const badgeCls =
                setsCount === 0
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : setsCount < 6
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";

              return (
                <div
                  key={mg}
                  className={`p-3 rounded-xl border flex flex-col gap-1 ${badgeCls}`}
                >
                  <span className="text-xs font-semibold text-[var(--i)]">
                    {mg}
                  </span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">{setsCount} sets</span>
                    <span>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Goal Tracking */}
      <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--i)]">
            Target Goals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {goals.map((g) => {
            const pct =
              g.category === "Bodyweight"
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round((g.targetValue / g.currentValue) * 100),
                    ),
                  )
                : Math.min(
                    100,
                    Math.round((g.currentValue / g.targetValue) * 100),
                  );

            return (
              <div
                key={g.id}
                className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="badge-pill text-[var(--m)]">
                      {g.category}
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--i)] mt-1">
                      {g.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteGoal(g.id)}
                    className="ib !w-7 !h-7 text-[var(--m)] hover:text-[var(--error)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--m)]">
                  <span>
                    {g.currentValue} / {g.targetValue} {g.unit}
                  </span>
                  <span>By {g.targetDate}</span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-[var(--h)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    step="0.5"
                    value={g.currentValue}
                    onChange={(e) =>
                      updateGoalProgress(g.id, Number(e.target.value))
                    }
                    className="in !h-7 !px-2 text-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Goal Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!goalTitle.trim()) return;
            addGoal({
              title: goalTitle.trim(),
              category: goalCategory,
              currentValue: Number(goalCurrent) || 0,
              targetValue: Number(goalTarget) || 100,
              unit: goalUnit,
              targetDate: goalDate,
              completed: false,
            });
            setGoalTitle("");
          }}
          className="grid grid-cols-1 sm:grid-cols-6 gap-2 pt-2 border-t border-[var(--h)]"
        >
          <input
            type="text"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="New goal (e.g. Bench 80 kg by March)"
            className="in !h-8 text-xs sm:col-span-2"
          />
          <div className="relative">
            <select
              value={goalCategory}
              onChange={(e) =>
                setGoalCategory(e.target.value as FitnessGoal["category"])
              }
              className="w-full h-8 pl-2.5 pr-7 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs text-[var(--i)] appearance-none cursor-pointer"
            >
              <option
                value="Strength"
                className="bg-[var(--bg)] text-[var(--i)]"
              >
                Strength
              </option>
              <option
                value="Bodyweight"
                className="bg-[var(--bg)] text-[var(--i)]"
              >
                Bodyweight
              </option>
              <option value="Cardio" className="bg-[var(--bg)] text-[var(--i)]">
                Cardio
              </option>
              <option
                value="Consistency"
                className="bg-[var(--bg)] text-[var(--i)]"
              >
                Consistency
              </option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
          </div>
          <input
            type="number"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            placeholder="Target"
            className="in !h-8 text-xs"
          />
          <input
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
            className="in !h-8 text-xs"
          />
          <button type="submit" className="bt p !h-8 text-xs">
            <Plus size={12} />
            <span>Add Goal</span>
          </button>
        </form>
      </div>
    </div>
  );
}
