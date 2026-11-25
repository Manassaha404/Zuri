// Rest Timer component for between-set recovery
"use client";

import { useEffect } from "react";
import { Pause, Play, RotateCcw, Timer, Plus, Minus } from "lucide-react";
import { useFitnessStore } from "@/store/fitnessStore";
import { formatTimerSeconds } from "@/lib/fitnessUtils";

export function RestTimerBar() {
  const {
    restTimerSeconds,
    restTimerTotal,
    restTimerRunning,
    startRestTimer,
    pauseRestTimer,
    resumeRestTimer,
    resetRestTimer,
    tickRestTimer,
  } = useFitnessStore();

  useEffect(() => {
    if (!restTimerRunning) return;
    const interval = setInterval(() => {
      tickRestTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimerRunning, tickRestTimer]);

  const progress =
    restTimerTotal > 0
      ? Math.min(100, Math.round((restTimerSeconds / restTimerTotal) * 100))
      : 0;

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
            restTimerRunning
              ? "bg-blue-500/15 border-blue-500/30 text-[var(--accent)]"
              : "bg-[var(--s)] border-[var(--h)] text-[var(--m)]"
          }`}
        >
          <Timer size={17} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--m)]">
              Rest Timer
            </span>
            <span className="font-mono text-base font-bold text-[var(--i)]">
              {formatTimerSeconds(restTimerSeconds)}
            </span>
          </div>
          <div className="w-36 h-1.5 rounded-full bg-[var(--h)] overflow-hidden mt-1">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls & Presets */}
      <div className="flex items-center flex-wrap gap-1.5">
        {[60, 90, 120, 180].map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => startRestTimer(sec)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--bg)] border border-[var(--h)] text-[var(--b)] hover:border-[var(--m)] cursor-pointer transition-colors"
          >
            {sec}s
          </button>
        ))}

        <button
          type="button"
          onClick={() => startRestTimer(Math.max(15, restTimerSeconds - 15))}
          className="ib !w-7 !h-7"
          title="-15s"
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          onClick={() => startRestTimer(restTimerSeconds + 15)}
          className="ib !w-7 !h-7"
          title="+15s"
        >
          <Plus size={12} />
        </button>

        {restTimerRunning ? (
          <button
            type="button"
            onClick={pauseRestTimer}
            className="bt p !w-auto !h-7 px-2.5 text-xs"
          >
            <Pause size={12} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              restTimerSeconds > 0 ? resumeRestTimer() : startRestTimer(90)
            }
            className="bt p !w-auto !h-7 px-2.5 text-xs"
          >
            <Play size={12} />
            <span>Start</span>
          </button>
        )}

        <button
          type="button"
          onClick={resetRestTimer}
          className="ib !w-7 !h-7"
          title="Reset Timer"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
