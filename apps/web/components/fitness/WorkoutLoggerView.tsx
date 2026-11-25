// Active Workout Logger, Templates Launcher, Cardio & Skills View
"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  Link2,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { useFitness } from "@/hook/fitness";
import {
  getPreviousExercisePerformance,
  getProgressiveOverloadSuggestion,
  toDateKey,
} from "@/lib/fitnessUtils";
import { RestTimerBar } from "./RestTimerBar";
import { ExercisePickerModal } from "./ExercisePickerModal";
import type { CardioActivityType, SetType } from "./types";

const PR_LABELS: Record<string, string> = {
  weight: "Weight PR",
  "1rm": "1RM PR",
  reps: "Reps PR",
  volume: "Volume PR",
};

export function WorkoutLoggerView() {
  const {
    activeWorkout,
    templates,
    sessions,
    unit,
    isDeloadWeek,
    showRpeTempo,
    toggleShowRpeTempo,
    injuries,
    cardioSessions,
    skills,
    startBlankWorkout,
    startWorkoutFromTemplate,
    discardActiveWorkout,
    finishActiveWorkout,
    updateActiveWorkoutMeta,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateExerciseNotes,
    toggleSupersetLink,
    addSetToExercise,
    updateSet,
    removeSet,
    toggleSetComplete,
    addCardioSession,
    createSkill,
    advanceSkillStage,
  } = useFitness();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillStages, setSkillStages] = useState(
    "Wall Plank, Hold, Freestanding",
  );
  const [skillTarget, setSkillTarget] = useState("3 × 30s");

  // Cardio quick-log state
  const [cardioType, setCardioType] = useState<CardioActivityType>("run");
  const [cardioDist, setCardioDist] = useState("5.0");
  const [cardioDur, setCardioDur] = useState("28");
  const [cardioHr, setCardioHr] = useState("148");
  const [cardioCals, setCardioCals] = useState("340");

  const avoidedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const inj of injuries) {
      if (inj.status !== "Resolved") {
        for (const id of inj.avoidExerciseIds) ids.add(id);
      }
    }
    return ids;
  }, [injuries]);

  const handleLogCardio = (e: React.FormEvent) => {
    e.preventDefault();
    const dist = Number(cardioDist) || 0;
    const dur = Number(cardioDur) || 0;
    if (dur <= 0) return;
    addCardioSession({
      type: cardioType,
      date: toDateKey(),
      distanceKm: dist,
      durationMinutes: dur,
      heartRateAvg: Number(cardioHr) || undefined,
      calories: Number(cardioCals) || Math.round(dur * 10),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Active Workout Session */}
      {activeWorkout ? (
        <div className="flex flex-col gap-4">
          <RestTimerBar />

          <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
            {/* Session Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--h)]">
              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  type="text"
                  value={activeWorkout.title}
                  onChange={(e) =>
                    updateActiveWorkoutMeta({ title: e.target.value })
                  }
                  className="bg-transparent text-lg font-semibold text-[var(--i)] outline-none border-b border-transparent focus:border-[var(--h)] pb-0.5"
                  placeholder="Workout title..."
                />
                <input
                  type="text"
                  value={activeWorkout.notes || ""}
                  onChange={(e) =>
                    updateActiveWorkoutMeta({ notes: e.target.value })
                  }
                  className="bg-transparent text-xs text-[var(--m)] outline-none"
                  placeholder="Add session notes (energy, warm-up, cues)..."
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={toggleShowRpeTempo}
                  className="bt !w-auto !h-8 px-3 text-xs"
                >
                  {showRpeTempo ? "Hide RPE/Tempo" : "Show RPE/Tempo"}
                </button>
                <button
                  type="button"
                  onClick={discardActiveWorkout}
                  className="bt !w-auto !h-8 px-3 text-xs text-[var(--error)]"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={finishActiveWorkout}
                  className="bt p !w-auto !h-8 px-4 text-xs"
                >
                  <Check size={14} />
                  <span>Finish Workout</span>
                </button>
              </div>
            </div>

            {/* Exercise Cards */}
            {activeWorkout.exercises.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3">
                <Dumbbell size={28} className="text-[var(--m)]" />
                <p className="text-sm text-[var(--m)]">
                  No exercises added yet. Pick your first exercise to start
                  logging sets.
                </p>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="bt p !w-auto px-4 !h-9 text-xs"
                >
                  <Plus size={14} />
                  <span>Add Exercise</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeWorkout.exercises.map((exLog) => {
                  const prev = getPreviousExercisePerformance(
                    exLog.exerciseId,
                    sessions,
                  );
                  const overload = getProgressiveOverloadSuggestion(
                    exLog.exerciseId,
                    sessions,
                    isDeloadWeek,
                  );
                  const isAvoided = avoidedExerciseIds.has(exLog.exerciseId);

                  return (
                    <div
                      key={exLog.id}
                      className="bg-[var(--bg)] border border-[var(--h)] rounded-xl p-4 flex flex-col gap-3"
                    >
                      {/* Exercise Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-[var(--i)]">
                              {exLog.exerciseName}
                            </h3>
                            <span className="badge-pill text-[var(--m)]">
                              {exLog.muscleGroup} · {exLog.equipment}
                            </span>
                            {exLog.supersetGroupId && (
                              <span className="badge-pill bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30">
                                Superset {exLog.supersetGroupId}
                              </span>
                            )}
                            {isAvoided && (
                              <span className="badge-pill bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                Injury Caution
                              </span>
                            )}
                          </div>

                          {/* Inline Previous Performance */}
                          <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--m)]">
                            <span>
                              {prev
                                ? `Last time: ${prev.label}`
                                : "First time logging"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSupersetLink(exLog.id)}
                            className={`bt !w-auto !h-7 px-2.5 text-[11px] ${
                              exLog.supersetGroupId
                                ? "border-violet-500/40 text-violet-500"
                                : ""
                            }`}
                            title="Toggle Superset Grouping"
                          >
                            <Link2 size={12} />
                            <span>Superset</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExerciseFromWorkout(exLog.id)}
                            className="ib !w-7 !h-7 text-[var(--m)] hover:text-[var(--error)]"
                            title="Remove Exercise"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Progressive Overload Suggestion */}
                      {overload && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                          <div className="flex items-center gap-2 text-[var(--i)]">
                            <Sparkles
                              size={13}
                              className="text-[var(--accent)] shrink-0"
                            />
                            <span>{overload.message}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              exLog.sets.forEach((st) => {
                                if (!st.completed && st.type === "working") {
                                  updateSet(exLog.id, st.id, {
                                    weight: overload.suggestedWeight,
                                    reps: overload.suggestedReps,
                                  });
                                }
                              });
                            }}
                            className="px-2.5 py-1 rounded-md bg-[var(--p)] text-[var(--pt)] font-semibold text-[11px] shrink-0 cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      )}

                      {/* Sets Table */}
                      <div className="overflow-x-auto styled-scrollbar">
                        <table className="w-full text-xs border-collapse min-w-[540px]">
                          <thead>
                            <tr className="text-[var(--m)] border-b border-[var(--h)]">
                              <th className="py-1.5 px-2 text-left font-medium w-12">
                                Set
                              </th>
                              <th className="py-1.5 px-2 text-left font-medium w-28">
                                Type
                              </th>
                              <th className="py-1.5 px-2 text-left font-medium w-24">
                                {unit}
                              </th>
                              <th className="py-1.5 px-2 text-left font-medium w-20">
                                Reps
                              </th>
                              {showRpeTempo && (
                                <>
                                  <th className="py-1.5 px-2 text-left font-medium w-20">
                                    RPE
                                  </th>
                                  <th className="py-1.5 px-2 text-left font-medium w-24">
                                    Tempo
                                  </th>
                                </>
                              )}
                              <th className="py-1.5 px-2 text-left font-medium w-20">
                                Rest (s)
                              </th>
                              <th className="py-1.5 px-2 text-right font-medium">
                                Done
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--h)]">
                            {exLog.sets.map((st) => (
                              <tr
                                key={st.id}
                                className={
                                  st.completed
                                    ? "bg-emerald-500/5"
                                    : "hover:bg-[var(--s)]/50"
                                }
                              >
                                <td className="py-2 px-2 font-semibold text-[var(--i)]">
                                  {st.setNumber}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="relative">
                                    <select
                                      value={st.type}
                                      onChange={(e) =>
                                        updateSet(exLog.id, st.id, {
                                          type: e.target.value as SetType,
                                        })
                                      }
                                      className="w-full h-7 pl-2 pr-6 rounded-md bg-[var(--s)] border border-[var(--h)] text-[11px] font-medium text-[var(--i)] appearance-none cursor-pointer"
                                    >
                                      <option
                                        value="working"
                                        className="bg-[var(--bg)] text-[var(--i)]"
                                      >
                                        Working
                                      </option>
                                      <option
                                        value="warmup"
                                        className="bg-[var(--bg)] text-[var(--i)]"
                                      >
                                        Warm-up
                                      </option>
                                      <option
                                        value="dropset"
                                        className="bg-[var(--bg)] text-[var(--i)]"
                                      >
                                        Drop Set
                                      </option>
                                      <option
                                        value="amrap"
                                        className="bg-[var(--bg)] text-[var(--i)]"
                                      >
                                        AMRAP
                                      </option>
                                    </select>
                                    <ChevronDown
                                      size={11}
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    step={2.5}
                                    min={0}
                                    value={st.weight || ""}
                                    placeholder={
                                      prev?.bestSet
                                        ? String(prev.bestSet.weight)
                                        : "0"
                                    }
                                    onChange={(e) =>
                                      updateSet(exLog.id, st.id, {
                                        weight: Number(e.target.value),
                                      })
                                    }
                                    className="in !h-7 !px-2 text-xs"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    value={st.reps || ""}
                                    placeholder={
                                      prev?.bestSet
                                        ? String(prev.bestSet.reps)
                                        : "0"
                                    }
                                    onChange={(e) =>
                                      updateSet(exLog.id, st.id, {
                                        reps: Number(e.target.value),
                                      })
                                    }
                                    className="in !h-7 !px-2 text-xs"
                                  />
                                </td>
                                {showRpeTempo && (
                                  <>
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        step={0.5}
                                        min={5}
                                        max={10}
                                        placeholder="8"
                                        value={st.rpe ?? ""}
                                        onChange={(e) =>
                                          updateSet(exLog.id, st.id, {
                                            rpe: e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          })
                                        }
                                        className="in !h-7 !px-2 text-xs"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="text"
                                        placeholder="3-1-1-0"
                                        value={st.tempo ?? ""}
                                        onChange={(e) =>
                                          updateSet(exLog.id, st.id, {
                                            tempo: e.target.value,
                                          })
                                        }
                                        className="in !h-7 !px-2 text-xs"
                                      />
                                    </td>
                                  </>
                                )}
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    step={15}
                                    min={0}
                                    value={st.restSeconds}
                                    onChange={(e) =>
                                      updateSet(exLog.id, st.id, {
                                        restSeconds: Number(e.target.value),
                                      })
                                    }
                                    className="in !h-7 !px-2 text-xs"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {st.prs && st.prs.length > 0 && (
                                      <span
                                        className="badge-pill bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1"
                                        title={st.prs
                                          .map((p) => PR_LABELS[p])
                                          .join(", ")}
                                      >
                                        <Trophy size={10} />
                                        {PR_LABELS[st.prs[0] ?? "weight"]}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleSetComplete(exLog.id, st.id)
                                      }
                                      className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                                        st.completed
                                          ? "bg-[var(--p)] border-[var(--p)] text-[var(--pt)]"
                                          : "bg-[var(--bg)] border-[var(--h)] text-[var(--m)] hover:border-[var(--m)]"
                                      }`}
                                      title="Mark set complete & start rest timer"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeSet(exLog.id, st.id)}
                                      className="ib !w-6 !h-6 text-[var(--m)] hover:text-[var(--error)]"
                                      title="Delete set"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Exercise Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <input
                          type="text"
                          value={exLog.notes || ""}
                          onChange={(e) =>
                            updateExerciseNotes(exLog.id, e.target.value)
                          }
                          placeholder="Exercise note (seat height, grip, cue)..."
                          className="flex-1 bg-transparent text-xs text-[var(--m)] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => addSetToExercise(exLog.id)}
                          className="bt !w-auto !h-7 px-3 text-xs self-start sm:self-auto"
                        >
                          <Plus size={12} />
                          <span>Add Set</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="bt !h-10 text-xs font-semibold"
                >
                  <Plus size={14} />
                  <span>Add Exercise</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Quick-Start Templates & Blank Workout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--i)]">
                    One-Tap Workout Templates
                  </h2>
                  <p className="text-xs text-[var(--m)]">
                    Start a structured routine in one tap or launch a blank
                    session
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startBlankWorkout()}
                  className="bt p !w-auto !h-9 px-4 text-xs"
                >
                  <Plus size={14} />
                  <span>Empty Workout</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="badge-pill text-[var(--accent)] border-blue-500/25 bg-blue-500/10">
                          {tpl.category}
                        </span>
                        <span className="text-[11px] text-[var(--m)]">
                          ~{tpl.estimatedMinutes} min · {tpl.exercises.length}{" "}
                          exercises
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--i)] mt-1">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-[var(--m)]">
                        {tpl.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => startWorkoutFromTemplate(tpl.id)}
                      className="bt p !h-8 text-xs"
                    >
                      <Play size={12} />
                      <span>Start Routine</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bodyweight Skills & Mobility */}
            <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--i)]">
                  Bodyweight Skills &amp; Mobility
                </h2>
                <p className="text-xs text-[var(--m)]">
                  Track calisthenics progressions and daily mobility routines
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {skills.length === 0 ? (
                  <p className="text-xs text-[var(--m)] sm:col-span-3">
                    No skills or mobility routines added yet. Add one below to
                    track progression stages.
                  </p>
                ) : null}
                {skills.map((sk) => {
                  const pct = Math.round(
                    ((sk.stageIndex + 1) / sk.stages.length) * 100,
                  );
                  return (
                    <div
                      key={sk.id}
                      className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col justify-between gap-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="badge-pill w-fit text-[var(--m)]">
                          {sk.category}
                        </span>
                        <h3 className="text-sm font-semibold text-[var(--i)] mt-1">
                          {sk.name}
                        </h3>
                        <p className="text-xs text-[var(--accent)] font-medium">
                          Stage: {sk.currentStage}
                        </p>
                        <p className="text-[11px] text-[var(--m)]">
                          Target: {sk.targetHoldOrReps}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="w-full h-1.5 rounded-full bg-[var(--h)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--success)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => advanceSkillStage(sk.id)}
                          disabled={sk.stageIndex >= sk.stages.length - 1}
                          className="bt !h-7 text-[11px] disabled:opacity-50"
                        >
                          <Zap size={11} />
                          <span>
                            {sk.stageIndex >= sk.stages.length - 1
                              ? "Mastered"
                              : "Advance Stage"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!skillName.trim()) return;
                  const stages = skillStages
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  createSkill({
                    name: skillName.trim(),
                    category: "Skill",
                    stages:
                      stages.length > 0
                        ? stages
                        : ["Beginner", "Intermediate", "Mastered"],
                    targetHoldOrReps: skillTarget.trim() || "3 × 30s",
                  });
                  setSkillName("");
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--h)]"
              >
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Skill name (e.g. Handstand)"
                  className="in !h-8 text-xs"
                />
                <input
                  type="text"
                  value={skillStages}
                  onChange={(e) => setSkillStages(e.target.value)}
                  placeholder="Stages (comma-separated)"
                  className="in !h-8 text-xs"
                />
                <input
                  type="text"
                  value={skillTarget}
                  onChange={(e) => setSkillTarget(e.target.value)}
                  placeholder="Target (e.g. 3 × 30s)"
                  className="in !h-8 text-xs"
                />
                <button type="submit" className="bt p !h-8 text-xs">
                  <Plus size={12} />
                  <span>Add Skill</span>
                </button>
              </form>
            </div>
          </div>

          {/* Cardio Quick-Log Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <form
              onSubmit={handleLogCardio}
              className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <h2 className="text-sm font-semibold text-[var(--i)]">
                  Cardio Logging
                </h2>
              </div>

              <div className="relative">
                <select
                  value={cardioType}
                  onChange={(e) =>
                    setCardioType(e.target.value as CardioActivityType)
                  }
                  className="w-full h-9 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                >
                  <option
                    value="run"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Run
                  </option>
                  <option
                    value="cycle"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Cycle
                  </option>
                  <option
                    value="swim"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Swim
                  </option>
                  <option
                    value="walk"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Walk
                  </option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span>Distance (km)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={cardioDist}
                    onChange={(e) => setCardioDist(e.target.value)}
                    className="in !h-8 text-xs"
                  />
                </label>
                <label>
                  <span>Duration (min)</span>
                  <input
                    type="number"
                    min="1"
                    value={cardioDur}
                    onChange={(e) => setCardioDur(e.target.value)}
                    className="in !h-8 text-xs"
                  />
                </label>
                <label>
                  <span>Avg HR (bpm)</span>
                  <input
                    type="number"
                    min="40"
                    value={cardioHr}
                    onChange={(e) => setCardioHr(e.target.value)}
                    className="in !h-8 text-xs"
                  />
                </label>
                <label>
                  <span>Calories (kcal)</span>
                  <input
                    type="number"
                    min="0"
                    value={cardioCals}
                    onChange={(e) => setCardioCals(e.target.value)}
                    className="in !h-8 text-xs"
                  />
                </label>
              </div>

              <button type="submit" className="bt p !h-8 text-xs mt-1">
                <Plus size={13} />
                <span>Log Cardio</span>
              </button>

              {/* Recent Cardio */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--h)]">
                <span className="text-[11px] font-medium text-[var(--m)]">
                  Recent Cardio
                </span>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto styled-scrollbar">
                  {cardioSessions.slice(0, 4).map((c) => {
                    const pace =
                      c.distanceKm > 0
                        ? (c.durationMinutes / c.distanceKm).toFixed(1)
                        : "-";
                    return (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--h)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[var(--i)] capitalize">
                            {c.type} · {c.distanceKm} km
                          </div>
                          <div className="text-[11px] text-[var(--m)]">
                            {c.durationMinutes} min · {pace} min/km
                            {c.heartRateAvg ? ` · ${c.heartRateAvg} bpm` : ""}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[var(--m)]">
                          {c.calories} kcal
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(exId) => addExerciseToWorkout(exId)}
      />
    </div>
  );
}
