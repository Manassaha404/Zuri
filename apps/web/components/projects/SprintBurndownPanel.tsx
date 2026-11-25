// Sprints, Milestones, and SVG Burndown Chart Panel
"use client";

import { useState, useMemo } from "react";
import { Flag, Zap, Plus, TrendingDown, Trash2 } from "lucide-react";
import { useProjectBoard } from "@/hook/projects";

export function SprintBurndownPanel() {
  const {
    activeProjectId,
    cards,
    columns,
    sprints,
    milestones,
    addSprint,
    deleteSprint,
    addMilestone,
    deleteMilestone,
  } = useProjectBoard();

  const todayDefault = new Date().toISOString().slice(0, 10);
  const twoWeeksDefault = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  })();

  const [newSprintName, setNewSprintName] = useState("");
  const [sprintStartDate, setSprintStartDate] = useState(todayDefault);
  const [sprintEndDate, setSprintEndDate] = useState(twoWeeksDefault);

  const [newMsTitle, setNewMsTitle] = useState("");
  const [newMsDate, setNewMsDate] = useState(twoWeeksDefault);

  const projCards = useMemo(
    () => cards.filter((c) => c.projectId === activeProjectId),
    [cards, activeProjectId],
  );
  const doneColumnIds = useMemo(
    () =>
      new Set(
        columns
          .filter((c) => c.projectId === activeProjectId && c.isDoneColumn)
          .map((c) => c.id),
      ),
    [columns, activeProjectId],
  );

  const projSprints = useMemo(
    () => sprints.filter((s) => s.projectId === activeProjectId),
    [sprints, activeProjectId],
  );
  const activeSprint = projSprints.find((s) => s.isActive) || projSprints[0];

  const projMilestones = useMemo(
    () => milestones.filter((m) => m.projectId === activeProjectId),
    [milestones, activeProjectId],
  );

  // Compute realistic day-by-day burndown metrics
  const burndown = useMemo(() => {
    const sprintCards = activeSprint
      ? projCards.filter((c) => c.sprintId === activeSprint.id)
      : projCards;
    const totalPoints = sprintCards.reduce((sum, c) => sum + c.storyPoints, 0);
    const doneCards = sprintCards.filter((c) => doneColumnIds.has(c.columnId));
    const donePoints = doneCards.reduce((sum, c) => sum + c.storyPoints, 0);
    const remaining = Math.max(0, totalPoints - donePoints);

    const startStr = activeSprint?.startDate || todayDefault;
    const endStr = activeSprint?.endDate || twoWeeksDefault;
    const startMs = new Date(`${startStr}T00:00:00`).getTime();
    const endMs = Math.max(
      startMs + 86400000,
      new Date(`${endStr}T00:00:00`).getTime(),
    );
    const totalDays = Math.max(
      1,
      Math.min(60, Math.round((endMs - startMs) / 86400000)),
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMs = new Date(`${todayStr}T00:00:00`).getTime();
    const elapsedDays = Math.max(
      0,
      Math.min(totalDays, Math.round((todayMs - startMs) / 86400000)),
    );

    // Build day-by-day actual remaining points up to today
    const actualSeries: Array<{
      dayIndex: number;
      date: string;
      points: number;
    }> = [];
    for (let i = 0; i <= elapsedDays; i++) {
      const dayDate = new Date(startMs + i * 86400000)
        .toISOString()
        .slice(0, 10);
      const completedByDay = doneCards
        .filter((c) => {
          const completedDay = (c.updatedAt || c.dueDate || todayStr).slice(
            0,
            10,
          );
          return completedDay <= dayDate;
        })
        .reduce((sum, c) => sum + c.storyPoints, 0);
      actualSeries.push({
        dayIndex: i,
        date: dayDate,
        points: Math.max(0, totalPoints - completedByDay),
      });
    }

    const idealTodayPoints = totalPoints * (1 - elapsedDays / totalDays);
    const paceStatus: "ahead" | "on_track" | "behind" =
      remaining < idealTodayPoints - 0.5
        ? "ahead"
        : remaining > idealTodayPoints + 0.5
          ? "behind"
          : "on_track";

    return {
      totalPoints,
      donePoints,
      remaining,
      totalDays,
      elapsedDays,
      startStr,
      endStr,
      actualSeries,
      paceStatus,
    };
  }, [activeSprint, projCards, doneColumnIds, todayDefault, twoWeeksDefault]);

  const handleAddSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim() || !sprintStartDate || !sprintEndDate) return;
    addSprint({
      projectId: activeProjectId,
      name: newSprintName.trim(),
      startDate: sprintStartDate,
      endDate: sprintEndDate,
      isActive: true,
    });
    setNewSprintName("");
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsTitle.trim() || !newMsDate) return;
    addMilestone({
      projectId: activeProjectId,
      title: newMsTitle.trim(),
      dueDate: newMsDate,
    });
    setNewMsTitle("");
  };

  // SVG Chart geometry: left=28, right=252, top=10, bottom=86
  const chartLeft = 28;
  const chartRight = 252;
  const chartTop = 10;
  const chartBottom = 86;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const maxY = Math.max(1, burndown.totalPoints);

  const xForDay = (dayIndex: number) =>
    chartLeft + (dayIndex / burndown.totalDays) * chartWidth;
  const yForPoints = (pts: number) => chartBottom - (pts / maxY) * chartHeight;

  const actualPolyline = burndown.actualSeries
    .map(
      (pt) =>
        `${xForDay(pt.dayIndex).toFixed(1)},${yForPoints(pt.points).toFixed(1)}`,
    )
    .join(" ");
  const todayX = xForDay(burndown.elapsedDays);
  const lastActual = burndown.actualSeries[burndown.actualSeries.length - 1];
  const paceBadge =
    burndown.paceStatus === "ahead"
      ? { label: "Ahead", cls: "bg-emerald-500/10 text-emerald-500" }
      : burndown.paceStatus === "behind"
        ? { label: "Behind", cls: "bg-amber-500/10 text-amber-500" }
        : { label: "On Track", cls: "bg-blue-500/10 text-blue-500" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] w-full min-w-0">
      {/* Burndown Chart */}
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--i)]">
            <TrendingDown size={15} className="text-[var(--accent)]" />
            <span>Sprint Burndown</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${paceBadge.cls}`}
            >
              {paceBadge.label}
            </span>
            <span className="text-[11px] text-[var(--m)]">
              {burndown.remaining}/{burndown.totalPoints} pts
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex-1 flex flex-col justify-between">
          <svg
            viewBox="0 0 264 106"
            className="w-full h-32 overflow-visible"
            aria-label="Sprint burndown chart"
          >
            {/* Horizontal Gridlines & Y-Axis Ticks */}
            {[0, 0.5, 1].map((ratio) => {
              const pts = Math.round(burndown.totalPoints * ratio);
              const y = yForPoints(pts);
              return (
                <g key={ratio}>
                  <line
                    x1={chartLeft}
                    y1={y}
                    x2={chartRight}
                    y2={y}
                    stroke="var(--h)"
                    strokeWidth="1"
                    strokeDasharray={ratio === 0 ? undefined : "2 3"}
                  />
                  <text
                    x={chartLeft - 5}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="8"
                    fill="var(--m)"
                  >
                    {pts}
                  </text>
                </g>
              );
            })}

            {/* Y-Axis */}
            <line
              x1={chartLeft}
              y1={chartTop}
              x2={chartLeft}
              y2={chartBottom}
              stroke="var(--h)"
              strokeWidth="1"
            />

            {/* Today Vertical Marker */}
            <line
              x1={todayX}
              y1={chartTop}
              x2={todayX}
              y2={chartBottom}
              stroke="#8b5cf6"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.7"
            />

            {/* Ideal Burndown Line */}
            <line
              x1={chartLeft}
              y1={yForPoints(burndown.totalPoints)}
              x2={chartRight}
              y2={chartBottom}
              stroke="var(--m)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Actual Burndown Polyline & Points */}
            {actualPolyline && (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.2"
                strokeLinejoin="round"
                points={actualPolyline}
              />
            )}
            {burndown.actualSeries.map((pt) => (
              <circle
                key={pt.date}
                cx={xForDay(pt.dayIndex)}
                cy={yForPoints(pt.points)}
                r={lastActual && pt.dayIndex === lastActual.dayIndex ? 3.5 : 2}
                fill="#3b82f6"
              >
                <title>{`${pt.date}: ${pt.points} pts remaining`}</title>
              </circle>
            ))}

            {/* X-Axis Labels */}
            <text
              x={chartLeft}
              y={100}
              textAnchor="start"
              fontSize="8"
              fill="var(--m)"
            >
              {burndown.startStr.slice(5)}
            </text>
            <text
              x={todayX}
              y={100}
              textAnchor="middle"
              fontSize="8"
              fill="#8b5cf6"
            >
              Today
            </text>
            <text
              x={chartRight}
              y={100}
              textAnchor="end"
              fontSize="8"
              fill="var(--m)"
            >
              {burndown.endStr.slice(5)}
            </text>
          </svg>

          <div className="flex items-center justify-between text-[10px] text-[var(--m)] mt-1">
            <span>Dashed: Ideal</span>
            <span>Blue: Actual</span>
            <span>Purple: Today</span>
          </div>
        </div>
      </div>

      {/* Sprints */}
      <div className="flex flex-col gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--i)]">
          <Zap size={15} className="text-amber-500" />
          <span>Sprints ({projSprints.length})</span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto styled-scrollbar">
          {projSprints.length === 0 ? (
            <p className="text-xs text-[var(--m)] py-2">No sprints yet.</p>
          ) : (
            projSprints.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--h)] text-xs gap-2"
              >
                <span className="font-medium text-[var(--i)] truncate">
                  {s.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[var(--m)]">
                    {s.startDate} → {s.endDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteSprint(s.id)}
                    className="p-1 rounded text-[var(--m)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete sprint"
                    aria-label={`Delete sprint ${s.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleAddSprint}
          className="flex flex-col gap-2 mt-auto p-2.5 rounded-xl bg-[var(--s)] border border-[var(--h)]"
        >
          <input
            type="text"
            value={newSprintName}
            onChange={(e) => setNewSprintName(e.target.value)}
            placeholder="Sprint name (e.g. Sprint 15)..."
            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="block text-[10px] font-medium text-[var(--m)] mb-0.5">
                Start Date
              </label>
              <input
                type="date"
                value={sprintStartDate}
                onChange={(e) => setSprintStartDate(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] font-medium text-[var(--m)] mb-0.5">
                End Date
              </label>
              <input
                type="date"
                value={sprintEndDate}
                onChange={(e) => setSprintEndDate(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!newSprintName.trim()}
            className="bt p text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Plus size={13} />
            <span>Add Sprint</span>
          </button>
        </form>
      </div>

      {/* Milestones */}
      <div className="flex flex-col gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--i)]">
          <Flag size={15} className="text-purple-500" />
          <span>Milestones ({projMilestones.length})</span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto styled-scrollbar">
          {projMilestones.length === 0 ? (
            <p className="text-xs text-[var(--m)] py-2">No milestones yet.</p>
          ) : (
            projMilestones.map((m) => {
              const msCards = projCards.filter((c) => c.milestoneId === m.id);
              const msDone = msCards.filter((c) =>
                doneColumnIds.has(c.columnId),
              ).length;
              const pct =
                msCards.length > 0
                  ? Math.round((msDone / msCards.length) * 100)
                  : 0;
              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-1 px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--h)] text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--i)] truncate">
                      {m.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[var(--m)]">
                        {m.dueDate} · {pct}%
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteMilestone(m.id)}
                        className="p-1 rounded text-[var(--m)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete milestone"
                        aria-label={`Delete milestone ${m.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-1 rounded-full bg-[var(--s)] overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleAddMilestone}
          className="flex flex-col gap-2 mt-auto p-2.5 rounded-xl bg-[var(--s)] border border-[var(--h)]"
        >
          <input
            type="text"
            value={newMsTitle}
            onChange={(e) => setNewMsTitle(e.target.value)}
            placeholder="Milestone title (e.g. Beta Launch)..."
            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--p)]"
          />
          <div>
            <label className="block text-[10px] font-medium text-[var(--m)] mb-0.5">
              Target Date
            </label>
            <input
              type="date"
              value={newMsDate}
              onChange={(e) => setNewMsDate(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
            />
          </div>
          <button
            type="submit"
            disabled={!newMsTitle.trim()}
            className="bt p text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Plus size={13} />
            <span>Add Milestone</span>
          </button>
        </form>
      </div>
    </div>
  );
}
