// Body Metrics, Smoothed Weight Trend, Progress Photos, Recovery & Injury Log
"use client";

import { useState, useMemo } from "react";
import {
  Camera,
  ChevronDown,
  Footprints,
  HeartPulse,
  Moon,
  Plus,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { useFitness } from "@/hook/fitness";
import {
  computeReadinessScore,
  computeSmoothedWeightTrend,
  toDateKey,
} from "@/lib/fitnessUtils";

export function BodyAndRecoveryView() {
  const {
    bodyMetrics,
    progressPhotos,
    recoveryLogs,
    injuries,
    exercises,
    unit,
    addBodyMetric,
    addProgressPhoto,
    saveRecoveryLog,
    addInjury,
    toggleInjuryStatus,
  } = useFitness();

  const today = toDateKey();
  const latestMetric = bodyMetrics[0];
  const todayRecovery =
    recoveryLogs.find((r) => r.date === today) || recoveryLogs[0];

  // Body metric form
  const [weight, setWeight] = useState(String(latestMetric?.weight || 77.3));
  const [bodyFat, setBodyFat] = useState(
    String(latestMetric?.bodyFatPct || 15.5),
  );
  const [chest, setChest] = useState(String(latestMetric?.chestCm || 101));
  const [waist, setWaist] = useState(String(latestMetric?.waistCm || 81));
  const [arms, setArms] = useState(String(latestMetric?.armsCm || 36.8));

  // Progress photo form
  const [photoPose, setPhotoPose] = useState<"Front" | "Side" | "Back">(
    "Front",
  );
  const [photoNote, setPhotoNote] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    undefined,
  );

  // Recovery form
  const [sleepHours, setSleepHours] = useState(
    todayRecovery?.sleepHours || 7.5,
  );
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(
    todayRecovery?.sleepQuality || 4,
  );
  const [soreness, setSoreness] = useState(todayRecovery?.soreness || 3);
  const [fatigue, setFatigue] = useState(todayRecovery?.fatigue || 3);
  const [rhr, setRhr] = useState(todayRecovery?.restingHeartRate || 56);
  const [steps, setSteps] = useState(todayRecovery?.steps || 8500);

  // Injury form
  const [injTitle, setInjTitle] = useState("");
  const [injPart, setInjPart] = useState("");
  const [injSeverity, setInjSeverity] = useState<
    "Mild" | "Moderate" | "Severe"
  >("Mild");
  const [avoidExId, setAvoidExId] = useState(exercises[0]?.id || "");

  const trend = useMemo(
    () => computeSmoothedWeightTrend(bodyMetrics, 4),
    [bodyMetrics],
  );

  const readiness = computeReadinessScore({
    id: "preview",
    date: today,
    sleepHours,
    sleepQuality,
    soreness,
    fatigue,
    restingHeartRate: rhr,
    steps,
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Body Metrics + Smoothed Weight Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-[var(--accent)]" />
              <h2 className="text-base font-semibold text-[var(--i)]">
                Weight Trend (Smoothed Moving Average)
              </h2>
            </div>
            {trend.length > 0 && (
              <span className="text-xs font-semibold text-[var(--i)]">
                Trend: {trend[trend.length - 1]?.smoothed} {unit}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--h)]">
            {trend.length < 2 ? (
              <p className="text-xs text-[var(--m)] py-8 text-center">
                Log at least 2 weight entries to display the trend chart.
              </p>
            ) : (
              <svg viewBox="0 0 360 130" className="w-full h-36">
                {(() => {
                  const vals = trend.flatMap((t) => [t.raw, t.smoothed]);
                  const minW = Math.min(...vals) - 0.5;
                  const maxW = Math.max(...vals) + 0.5;
                  const range = Math.max(0.5, maxW - minW);
                  const pts = trend.map((t, i) => {
                    const x = 24 + (i / Math.max(1, trend.length - 1)) * 312;
                    const yRaw = 105 - ((t.raw - minW) / range) * 80;
                    const ySmooth = 105 - ((t.smoothed - minW) / range) * 80;
                    return { x, yRaw, ySmooth, ...t };
                  });
                  const rawPoly = pts.map((p) => `${p.x},${p.yRaw}`).join(" ");
                  const smoothPoly = pts
                    .map((p) => `${p.x},${p.ySmooth}`)
                    .join(" ");

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="var(--m)"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        points={rawPoly}
                      />
                      <polyline
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={smoothPoly}
                      />
                      {pts.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.yRaw} r="3" fill="var(--m)" />
                          <text
                            x={p.x}
                            y={122}
                            textAnchor="middle"
                            fontSize="8"
                            fill="var(--m)"
                          >
                            {p.date.slice(5)}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            )}
            <div className="flex items-center gap-4 text-[11px] text-[var(--m)] mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[var(--accent)] inline-block" />
                Smoothed Average
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-[var(--m)] inline-block" />
                Daily Reading
              </span>
            </div>
          </div>

          {/* Progress Photos */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Camera size={15} className="text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--i)]">
                Progress Photos
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={photoPose}
                  onChange={(e) =>
                    setPhotoPose(e.target.value as "Front" | "Side" | "Back")
                  }
                  className="h-8 pl-2.5 pr-7 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                >
                  <option
                    value="Front"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Front
                  </option>
                  <option
                    value="Side"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Side
                  </option>
                  <option
                    value="Back"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Back
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
              <input
                type="text"
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                placeholder="Note (lighting, fasted)..."
                className="in !h-8 flex-1 text-xs"
              />
              <label className="bt !w-auto !h-8 px-3 text-xs cursor-pointer">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  addProgressPhoto({
                    date: today,
                    pose: photoPose,
                    weight: Number(weight) || undefined,
                    dataUrl: photoDataUrl,
                    notes: photoNote || undefined,
                  });
                  setPhotoNote("");
                  setPhotoDataUrl(undefined);
                }}
                className="bt p !w-auto !h-8 px-3 text-xs"
              >
                <Plus size={12} />
                <span>Save</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {progressPhotos.map((pp) => (
                <div
                  key={pp.id}
                  className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col gap-1.5"
                >
                  {pp.dataUrl ? (
                    <img
                      src={pp.dataUrl}
                      alt={`${pp.pose} progress`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-20 rounded-lg bg-[var(--s)] border border-dashed border-[var(--h)] flex items-center justify-center text-[11px] text-[var(--m)]">
                      {pp.pose} Check-in
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--i)]">
                      {pp.date}
                    </span>
                    {pp.weight && (
                      <span className="text-[var(--m)]">
                        {pp.weight} {unit}
                      </span>
                    )}
                  </div>
                  {pp.notes && (
                    <p className="text-[10px] text-[var(--m)] truncate">
                      {pp.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Log Body Metrics Form */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addBodyMetric({
                date: today,
                weight: Number(weight) || 75,
                bodyFatPct: Number(bodyFat) || undefined,
                chestCm: Number(chest) || undefined,
                waistCm: Number(waist) || undefined,
                armsCm: Number(arms) || undefined,
              });
            }}
            className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-3"
          >
            <h3 className="text-sm font-semibold text-[var(--i)]">
              Log Body Measurements
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <label>
                <span>Weight ({unit})</span>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="in !h-9 text-xs"
                />
              </label>
              <label>
                <span>Body Fat (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="in !h-9 text-xs"
                />
              </label>
              <label>
                <span>Chest (cm)</span>
                <input
                  type="number"
                  step="0.5"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  className="in !h-9 text-xs"
                />
              </label>
              <label>
                <span>Waist (cm)</span>
                <input
                  type="number"
                  step="0.5"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="in !h-9 text-xs"
                />
              </label>
              <label>
                <span>Arms (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  value={arms}
                  onChange={(e) => setArms(e.target.value)}
                  className="in !h-9 text-xs"
                />
              </label>
            </div>
            <button type="submit" className="bt p !h-9 text-xs mt-1">
              <Plus size={13} />
              <span>Save Body Check-in</span>
            </button>
          </form>

          {/* Daily Recovery & Readiness */}
          <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse size={16} className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-[var(--i)]">
                  Recovery &amp; Readiness
                </h3>
              </div>
              <span
                className={`badge-pill font-bold ${
                  readiness >= 75
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : readiness >= 55
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-red-500/15 text-red-500 border-red-500/30"
                }`}
              >
                Readiness: {readiness}/100
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label>
                <span className="flex items-center gap-1">
                  <Moon size={11} /> Sleep (hrs)
                </span>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={14}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="in !h-8 text-xs"
                />
              </label>
              <label>
                <span>Sleep Quality (1-5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={sleepQuality}
                  onChange={(e) =>
                    setSleepQuality(
                      Math.min(5, Math.max(1, Number(e.target.value))) as
                        | 1
                        | 2
                        | 3
                        | 4
                        | 5,
                    )
                  }
                  className="in !h-8 text-xs"
                />
              </label>
              <label>
                <span>Soreness (1-10)</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={soreness}
                  onChange={(e) => setSoreness(Number(e.target.value))}
                  className="in !h-8 text-xs"
                />
              </label>
              <label>
                <span>Fatigue (1-10)</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={fatigue}
                  onChange={(e) => setFatigue(Number(e.target.value))}
                  className="in !h-8 text-xs"
                />
              </label>
              <label>
                <span>Resting HR (bpm)</span>
                <input
                  type="number"
                  min={30}
                  max={140}
                  value={rhr}
                  onChange={(e) => setRhr(Number(e.target.value))}
                  className="in !h-8 text-xs"
                />
              </label>
              <label>
                <span className="flex items-center gap-1">
                  <Footprints size={11} /> Steps
                </span>
                <input
                  type="number"
                  step={250}
                  min={0}
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="in !h-8 text-xs"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() =>
                saveRecoveryLog({
                  date: today,
                  sleepHours,
                  sleepQuality,
                  soreness,
                  fatigue,
                  restingHeartRate: rhr,
                  steps,
                })
              }
              className="bt p !h-8 text-xs"
            >
              Save Today&apos;s Recovery
            </button>
          </div>
        </div>
      </div>

      {/* Injury Log */}
      <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--i)]">
              Injury Log &amp; Exercises to Avoid
            </h3>
            <p className="text-xs text-[var(--m)]">
              Tagged exercises automatically show caution badges during workouts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!injTitle.trim()) return;
              addInjury({
                title: injTitle.trim(),
                bodyPart: injPart.trim() || "General",
                severity: injSeverity,
                status: "Active",
                startedAt: today,
                avoidExerciseIds: avoidExId ? [avoidExId] : [],
              });
              setInjTitle("");
              setInjPart("");
            }}
            className="md:col-span-5 p-4 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col gap-2.5"
          >
            <input
              type="text"
              value={injTitle}
              onChange={(e) => setInjTitle(e.target.value)}
              placeholder="Injury description (e.g. Knee Tendonitis)"
              className="in !h-8 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={injPart}
                onChange={(e) => setInjPart(e.target.value)}
                placeholder="Body part"
                className="in !h-8 text-xs"
              />
              <div className="relative">
                <select
                  value={injSeverity}
                  onChange={(e) =>
                    setInjSeverity(
                      e.target.value as "Mild" | "Moderate" | "Severe",
                    )
                  }
                  className="w-full h-8 pl-2.5 pr-7 rounded-lg bg-[var(--s)] border border-[var(--h)] text-xs text-[var(--i)] appearance-none cursor-pointer"
                >
                  <option
                    value="Mild"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Mild
                  </option>
                  <option
                    value="Moderate"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Moderate
                  </option>
                  <option
                    value="Severe"
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Severe
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>
            <div className="relative">
              <select
                value={avoidExId}
                onChange={(e) => setAvoidExId(e.target.value)}
                className="w-full h-8 pl-2.5 pr-7 rounded-lg bg-[var(--s)] border border-[var(--h)] text-xs text-[var(--i)] appearance-none cursor-pointer"
              >
                {exercises.map((ex) => (
                  <option
                    key={ex.id}
                    value={ex.id}
                    className="bg-[var(--bg)] text-[var(--i)]"
                  >
                    Avoid: {ex.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
              />
            </div>
            <button type="submit" className="bt p !h-8 text-xs">
              <Plus size={12} />
              <span>Log Injury</span>
            </button>
          </form>

          <div className="md:col-span-7 flex flex-col gap-2">
            {injuries.map((inj) => (
              <div
                key={inj.id}
                className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--i)]">
                      {inj.title}
                    </span>
                    <span className="badge-pill text-[var(--m)]">
                      {inj.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--m)] mt-0.5">
                    {inj.bodyPart} · Avoid:{" "}
                    {inj.avoidExerciseIds
                      .map(
                        (id) => exercises.find((e) => e.id === id)?.name || id,
                      )
                      .join(", ") || "None"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleInjuryStatus(inj.id)}
                  className={`badge-pill cursor-pointer font-semibold ${
                    inj.status === "Resolved"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }`}
                >
                  {inj.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
