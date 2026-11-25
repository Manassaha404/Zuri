// Exercise Library, Custom Exercises, and Training Programs View
"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  Dumbbell,
  Layers,
  Play,
  Plus,
  Search,
  Trophy,
  X,
} from "lucide-react";
import { useFitness } from "@/hook/fitness";
import {
  estimate1RM,
  getExerciseRecords,
  MUSCLE_GROUPS,
} from "@/lib/fitnessUtils";
import type { EquipmentType, Exercise, MuscleGroup } from "./types";

const EQUIPMENT_LIST: EquipmentType[] = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Kettlebell",
  "Band",
];

export function ExerciseLibraryView() {
  const {
    exercises,
    sessions,
    programs,
    templates,
    unit,
    addCustomExercise,
    createProgram,
    advanceProgramWeek,
    startWorkoutFromTemplate,
  } = useFitness();

  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "All">("All");
  const [equipFilter, setEquipFilter] = useState<EquipmentType | "All">("All");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  const [progName, setProgName] = useState("");
  const [progStyle, setProgStyle] = useState("PPL 6-Day");
  const [progWeeks, setProgWeeks] = useState(8);
  const [progRule, setProgRule] = useState("Add 2.5 kg when hitting top reps");

  // Custom exercise form
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>("Chest");
  const [newEquip, setNewEquip] = useState<EquipmentType>("Dumbbell");
  const [newRest, setNewRest] = useState(90);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const mQuery = ex.name.toLowerCase().includes(query.toLowerCase());
      const mMuscle = muscleFilter === "All" || ex.muscleGroup === muscleFilter;
      const mEquip = equipFilter === "All" || ex.equipment === equipFilter;
      return mQuery && mMuscle && mEquip;
    });
  }, [exercises, query, muscleFilter, equipFilter]);

  const selectedRecords = useMemo(() => {
    if (!selectedExercise) return null;
    return getExerciseRecords(selectedExercise.id, sessions);
  }, [selectedExercise, sessions]);

  const selectedHistory = useMemo(() => {
    if (!selectedExercise) return [];
    const pts: Array<{ date: string; est1rm: number; weight: number }> = [];
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    for (const sess of sorted) {
      const ex = sess.exercises.find(
        (e) => e.exerciseId === selectedExercise.id,
      );
      if (!ex) continue;
      const best = ex.sets
        .filter((s) => s.completed && s.type !== "warmup")
        .reduce(
          (max, s) => {
            const e1 = estimate1RM(s.weight, s.reps);
            return e1 > max.est1rm ? { est1rm: e1, weight: s.weight } : max;
          },
          { est1rm: 0, weight: 0 },
        );
      if (best.est1rm > 0) {
        pts.push({ date: sess.date, ...best });
      }
    }
    return pts;
  }, [selectedExercise, sessions]);

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addCustomExercise({
      name: newName.trim(),
      muscleGroup: newMuscle,
      equipment: newEquip,
      defaultRestSeconds: newRest,
    });
    setNewName("");
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Training Programs */}
      <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--i)]">
              Training Programs &amp; Progression
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setProgramOpen(true)}
            className="bt p !w-auto !h-8 px-3 text-xs"
          >
            <Plus size={13} />
            <span>Add Program</span>
          </button>
        </div>

        {programs.length === 0 ? (
          <p className="text-xs text-[var(--m)] py-4">
            No training programs created yet. Add a program (e.g. 5/3/1, PPL
            6-Day, Starting Strength) to track multi-week progression and
            deloads.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {programs.map((prog) => {
              const isDeloadDue =
                prog.currentWeek % prog.deloadEveryWeeks === 0;
              const pct = Math.round(
                (prog.currentWeek / prog.totalWeeks) * 100,
              );
              const firstTpl = templates.find((t) =>
                prog.templateIds.includes(t.id),
              );
              return (
                <div
                  key={prog.id}
                  className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col justify-between gap-3"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge-pill bg-blue-500/10 text-[var(--accent)] border-blue-500/25">
                        {prog.style}
                      </span>
                      <span className="text-xs font-semibold text-[var(--i)]">
                        Week {prog.currentWeek}/{prog.totalWeeks}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--i)] mt-1">
                      {prog.name}
                    </h3>
                    <p className="text-xs text-[var(--m)]">
                      {prog.description}
                    </p>
                    <p className="text-[11px] text-[var(--b)] bg-[var(--s)] px-2.5 py-1.5 rounded-lg border border-[var(--h)] mt-1">
                      Rule: {prog.progressionRule}
                    </p>
                    {isDeloadDue && (
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Deload week scheduled this week
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="w-full h-1.5 rounded-full bg-[var(--h)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {firstTpl && (
                        <button
                          type="button"
                          onClick={() => startWorkoutFromTemplate(firstTpl.id)}
                          className="bt p !h-7 text-[11px] flex-1"
                        >
                          <Play size={11} />
                          <span>Train</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => advanceProgramWeek(prog.id)}
                        className="bt !h-7 text-[11px] flex-1"
                      >
                        <span>Next Week</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exercise Library + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--i)]">
                Exercise Library ({filtered.length})
              </h2>
              <p className="text-xs text-[var(--m)]">
                Search by muscle group or equipment, or add custom movements
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bt p !w-auto !h-8 px-3 text-xs"
            >
              <Plus size={13} />
              <span>Custom Exercise</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="in in-prefix !h-9 text-xs"
              />
            </div>

            <div className="relative">
              <select
                value={muscleFilter}
                onChange={(e) =>
                  setMuscleFilter(e.target.value as MuscleGroup | "All")
                }
                className="w-full h-9 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
              >
                <option value="All" className="bg-[var(--bg)] text-[var(--i)]">
                  All Muscles
                </option>
                {MUSCLE_GROUPS.map((m) => (
                  <option
                    key={m}
                    value={m}
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={equipFilter}
                onChange={(e) =>
                  setEquipFilter(e.target.value as EquipmentType | "All")
                }
                className="w-full h-9 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
              >
                <option value="All" className="bg-[var(--bg)] text-[var(--i)]">
                  All Equipment
                </option>
                {EQUIPMENT_LIST.map((eq) => (
                  <option
                    key={eq}
                    value={eq}
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    {eq}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto styled-scrollbar pr-1">
            {filtered.map((ex) => {
              const isSelected = selectedExercise?.id === ex.id;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedExercise(ex)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--s)] border-[var(--p)]"
                      : "bg-[var(--bg)] border-[var(--h)] hover:bg-[var(--s)]/60"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--i)]">
                        {ex.name}
                      </span>
                      {ex.isCustom && (
                        <span className="badge-pill text-[var(--accent)] border-blue-500/25 bg-blue-500/10">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--m)]">
                      {ex.muscleGroup} · {ex.equipment} · Default rest{" "}
                      {ex.defaultRestSeconds}s
                    </span>
                  </div>
                  <Dumbbell size={15} className="text-[var(--m)] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Exercise PRs & Progress Chart */}
        <div className="lg:col-span-5 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
          {selectedExercise ? (
            <>
              <div>
                <span className="badge-pill text-[var(--m)]">
                  {selectedExercise.muscleGroup} · {selectedExercise.equipment}
                </span>
                <h3 className="text-base font-semibold text-[var(--i)] mt-2">
                  {selectedExercise.name}
                </h3>
              </div>

              {selectedRecords && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--m)]">
                      <Trophy size={12} className="text-amber-500" />
                      <span>Heaviest Weight</span>
                    </div>
                    <div className="text-base font-bold text-[var(--i)] mt-0.5">
                      {selectedRecords.maxWeight} {unit}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--m)]">
                      <Trophy size={12} className="text-[var(--accent)]" />
                      <span>Best Est. 1RM</span>
                    </div>
                    <div className="text-base font-bold text-[var(--i)] mt-0.5">
                      {selectedRecords.best1RM} {unit}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
                    <div className="text-[11px] text-[var(--m)]">Most Reps</div>
                    <div className="text-base font-bold text-[var(--i)] mt-0.5">
                      {selectedRecords.maxReps} reps
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
                    <div className="text-[11px] text-[var(--m)]">
                      Best Set Volume
                    </div>
                    <div className="text-base font-bold text-[var(--i)] mt-0.5">
                      {selectedRecords.maxSetVolume} {unit}
                    </div>
                  </div>
                </div>
              )}

              {/* Simple SVG Est. 1RM Progression Chart */}
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col gap-2">
                <span className="text-xs font-semibold text-[var(--i)]">
                  Estimated 1RM Trend ({unit})
                </span>
                {selectedHistory.length < 2 ? (
                  <p className="text-xs text-[var(--m)] py-6 text-center">
                    Log at least 2 sessions of {selectedExercise.name} to view
                    progression chart.
                  </p>
                ) : (
                  <svg viewBox="0 0 300 110" className="w-full h-28">
                    {(() => {
                      const minVal =
                        Math.min(...selectedHistory.map((p) => p.est1rm)) * 0.9;
                      const maxVal =
                        Math.max(...selectedHistory.map((p) => p.est1rm)) *
                        1.05;
                      const range = Math.max(1, maxVal - minVal);
                      const pts = selectedHistory.map((p, i) => {
                        const x =
                          20 +
                          (i / Math.max(1, selectedHistory.length - 1)) * 260;
                        const y = 90 - ((p.est1rm - minVal) / range) * 70;
                        return { x, y, ...p };
                      });
                      const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={poly}
                          />
                          {pts.map((p, idx) => (
                            <g key={idx}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="var(--bg)"
                                stroke="var(--accent)"
                                strokeWidth="2"
                              />
                              <text
                                x={p.x}
                                y={p.y - 8}
                                textAnchor="middle"
                                fontSize="9"
                                fill="var(--i)"
                              >
                                {p.est1rm}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Create Program Modal */}
      {programOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!progName.trim()) return;
              createProgram({
                name: progName.trim(),
                style: progStyle,
                totalWeeks: progWeeks,
                progressionRule: progRule,
                templateIds: templates[0] ? [templates[0].id] : [],
              });
              setProgName("");
              setProgramOpen(false);
            }}
            className="w-full max-w-md bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)] bg-[var(--surface-card)]">
              <h3 className="text-sm font-semibold text-[var(--i)]">
                Add Training Program
              </h3>
              <button
                type="button"
                onClick={() => setProgramOpen(false)}
                className="ib !w-8 !h-8"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <label>
                <span>Program Name</span>
                <input
                  type="text"
                  required
                  value={progName}
                  onChange={(e) => setProgName(e.target.value)}
                  placeholder="e.g. PPL 6-Day Hypertrophy"
                  className="in"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span>Style</span>
                  <div className="relative">
                    <select
                      value={progStyle}
                      onChange={(e) => setProgStyle(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                    >
                      <option
                        value="PPL 6-Day"
                        className="bg-[var(--bg)] text-[var(--i)]"
                      >
                        PPL 6-Day
                      </option>
                      <option
                        value="5/3/1"
                        className="bg-[var(--bg)] text-[var(--i)]"
                      >
                        5/3/1
                      </option>
                      <option
                        value="Starting Strength"
                        className="bg-[var(--bg)] text-[var(--i)]"
                      >
                        Starting Strength
                      </option>
                      <option
                        value="Custom"
                        className="bg-[var(--bg)] text-[var(--i)]"
                      >
                        Custom
                      </option>
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                    />
                  </div>
                </label>
                <label>
                  <span>Total Weeks</span>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={progWeeks}
                    onChange={(e) => setProgWeeks(Number(e.target.value))}
                    className="in"
                  />
                </label>
              </div>
              <label>
                <span>Progression Rule</span>
                <input
                  type="text"
                  value={progRule}
                  onChange={(e) => setProgRule(e.target.value)}
                  className="in"
                />
              </label>
              <button type="submit" className="bt p mt-2">
                <Plus size={14} />
                <span>Save Program</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Custom Exercise Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateExercise}
            className="w-full max-w-md bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)] bg-[var(--surface-card)]">
              <h3 className="text-sm font-semibold text-[var(--i)]">
                Create Custom Exercise
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="ib !w-8 !h-8"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <label>
                <span>Exercise Name</span>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Bulgarian Split Squat"
                  className="in"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span>Muscle Group</span>
                  <div className="relative">
                    <select
                      value={newMuscle}
                      onChange={(e) =>
                        setNewMuscle(e.target.value as MuscleGroup)
                      }
                      className="w-full h-10 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                    >
                      {MUSCLE_GROUPS.map((m) => (
                        <option
                          key={m}
                          value={m}
                          className="bg-[var(--bg)] text-[var(--i)]"
                        >
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                    />
                  </div>
                </label>
                <label>
                  <span>Equipment</span>
                  <div className="relative">
                    <select
                      value={newEquip}
                      onChange={(e) =>
                        setNewEquip(e.target.value as EquipmentType)
                      }
                      className="w-full h-10 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                    >
                      {EQUIPMENT_LIST.map((eq) => (
                        <option
                          key={eq}
                          value={eq}
                          className="bg-[var(--bg)] text-[var(--i)]"
                        >
                          {eq}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                    />
                  </div>
                </label>
              </div>

              <label>
                <span>Default Rest (seconds)</span>
                <input
                  type="number"
                  step={15}
                  min={15}
                  value={newRest}
                  onChange={(e) => setNewRest(Number(e.target.value))}
                  className="in"
                />
              </label>

              <button type="submit" className="bt p mt-2">
                <Plus size={14} />
                <span>Save Custom Exercise</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
