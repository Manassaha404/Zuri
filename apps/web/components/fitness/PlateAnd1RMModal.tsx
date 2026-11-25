// Plate Calculator & 1RM Calculator Modal
"use client";

import { useState } from "react";
import { Calculator, X } from "lucide-react";
import { useFitnessStore } from "@/store/fitnessStore";
import { calculatePlatesPerSide, estimate1RM } from "@/lib/fitnessUtils";

interface PlateAnd1RMModalProps {
  open: boolean;
  onClose: () => void;
}

export function PlateAnd1RMModal({ open, onClose }: PlateAnd1RMModalProps) {
  const { unit } = useFitnessStore();
  const [mode, setMode] = useState<"plates" | "1rm">("plates");

  const [targetWeight, setTargetWeight] = useState(100);
  const [barWeight, setBarWeight] = useState(unit === "kg" ? 20 : 45);

  const [liftWeight, setLiftWeight] = useState(80);
  const [liftReps, setLiftReps] = useState(5);

  if (!open) return null;

  const { plates, remainder } = calculatePlatesPerSide(
    targetWeight,
    barWeight,
    unit,
  );
  const est1RM = estimate1RM(liftWeight, liftReps);
  const percentages = [95, 90, 85, 80, 75, 70, 65, 60];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)] bg-[var(--surface-card)]">
          <div className="flex items-center gap-2">
            <Calculator size={17} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--i)]">
              Strength Calculators
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ib !w-8 !h-8"
            aria-label="Close modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Mode Switch */}
        <div className="p-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto styled-scrollbar">
          <div className="nav-pill-group flex items-center gap-1 w-fit">
            <button
              type="button"
              onClick={() => setMode("plates")}
              className={`nav-pill-item cursor-pointer ${
                mode === "plates"
                  ? "bg-[var(--p)] text-[var(--pt)]"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
            >
              Plate Calculator
            </button>
            <button
              type="button"
              onClick={() => setMode("1rm")}
              className={`nav-pill-item cursor-pointer ${
                mode === "1rm"
                  ? "bg-[var(--p)] text-[var(--pt)]"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
            >
              1RM Estimator
            </button>
          </div>

          {mode === "plates" ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span>Target Weight ({unit})</span>
                  <input
                    type="number"
                    className="in"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    step={unit === "kg" ? 2.5 : 5}
                    min={0}
                  />
                </label>
                <label>
                  <span>Barbell Weight ({unit})</span>
                  <input
                    type="number"
                    className="in"
                    value={barWeight}
                    onChange={(e) => setBarWeight(Number(e.target.value))}
                    min={0}
                  />
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col gap-3">
                <span className="text-xs font-medium text-[var(--m)]">
                  Load per side ({unit})
                </span>
                {plates.length === 0 ? (
                  <p className="text-xs text-[var(--m)]">
                    Empty bar or target below bar weight.
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="h-8 px-2.5 rounded-md bg-[var(--h)] text-[var(--i)] text-xs font-semibold flex items-center">
                      Bar ({barWeight})
                    </div>
                    {plates.map((p, i) => (
                      <div
                        key={`${p}-${i}`}
                        className="px-2.5 py-2 rounded-md bg-[var(--p)] text-[var(--pt)] text-xs font-bold"
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                )}
                {remainder > 0 && (
                  <p className="text-xs text-[var(--warning)]">
                    Remainder not covered by standard plates: {remainder} {unit}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span>Weight Lifted ({unit})</span>
                  <input
                    type="number"
                    className="in"
                    value={liftWeight}
                    onChange={(e) => setLiftWeight(Number(e.target.value))}
                    step={2.5}
                    min={0}
                  />
                </label>
                <label>
                  <span>Reps Completed</span>
                  <input
                    type="number"
                    className="in"
                    value={liftReps}
                    onChange={(e) => setLiftReps(Number(e.target.value))}
                    min={1}
                    max={30}
                  />
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--m)]">
                  Estimated 1RM (Epley)
                </span>
                <span className="text-2xl font-bold text-[var(--i)]">
                  {est1RM} {unit}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {percentages.map((pct) => (
                  <div
                    key={pct}
                    className="p-2.5 rounded-lg bg-[var(--s)] border border-[var(--h)] text-center"
                  >
                    <div className="text-[11px] text-[var(--m)]">{pct}%</div>
                    <div className="text-xs font-semibold text-[var(--i)]">
                      {Math.round((est1RM * pct) / 100)} {unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
