// Searchable Exercise Picker Modal with muscle & equipment filters
"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, ChevronDown, Plus, Search, X } from "lucide-react";
import { useFitness } from "@/hook/fitness";
import { MUSCLE_GROUPS } from "@/lib/fitnessUtils";
import type { EquipmentType, MuscleGroup } from "./types";

interface ExercisePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
}

const EQUIPMENT_LIST: EquipmentType[] = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Kettlebell",
  "Band",
];

export function ExercisePickerModal({
  open,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const { exercises, injuries } = useFitness();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "All">("All");
  const [equipment, setEquipment] = useState<EquipmentType | "All">("All");

  const avoidedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const inj of injuries) {
      if (inj.status !== "Resolved") {
        for (const id of inj.avoidExerciseIds) ids.add(id);
      }
    }
    return ids;
  }, [injuries]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchQuery = ex.name.toLowerCase().includes(query.toLowerCase());
      const matchMuscle = muscle === "All" || ex.muscleGroup === muscle;
      const matchEquip = equipment === "All" || ex.equipment === equipment;
      return matchQuery && matchMuscle && matchEquip;
    });
  }, [exercises, query, muscle, equipment]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[82vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)] bg-[var(--surface-card)]">
          <h2 className="text-sm font-semibold text-[var(--i)]">
            Add Exercise to Workout
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ib !w-8 !h-8"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-[var(--h)] flex flex-col gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)]"
            />
            <input
              type="text"
              placeholder="Search exercises..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="in in-prefix !h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select
                value={muscle}
                onChange={(e) =>
                  setMuscle(e.target.value as MuscleGroup | "All")
                }
                className="w-full h-9 pl-3 pr-8 rounded-lg bg-[var(--s)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
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
                value={equipment}
                onChange={(e) =>
                  setEquipment(e.target.value as EquipmentType | "All")
                }
                className="w-full h-9 pl-3 pr-8 rounded-lg bg-[var(--s)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
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
        </div>

        {/* Exercise List */}
        <div className="p-3 overflow-y-auto styled-scrollbar flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-[var(--m)] text-center py-6">
              No exercises match your filters.
            </p>
          ) : (
            filtered.map((ex) => {
              const isAvoided = avoidedIds.has(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    onSelect(ex.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--bg)] hover:bg-[var(--s)] transition-colors text-left cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--i)]">
                        {ex.name}
                      </span>
                      {isAvoided && (
                        <span className="badge-pill bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          Injury Caution
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--m)]">
                      {ex.muscleGroup} · {ex.equipment} · Rest{" "}
                      {ex.defaultRestSeconds}s
                    </span>
                  </div>
                  <span className="ib !w-7 !h-7 shrink-0">
                    <Plus size={14} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
