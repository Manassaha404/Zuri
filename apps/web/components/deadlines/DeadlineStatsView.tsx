// Analytics & Missed-deadline stats view
"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  History,
  ShieldAlert,
} from "lucide-react";
import { useDeadlineStore } from "@/store/deadlineStore";
import {
  computeDeadlineStats,
  getDeadlineCountdown,
} from "@/lib/deadlineUtils";

export function DeadlineStatsView() {
  const { deadlines } = useDeadlineStore();

  const stats = useMemo(() => computeDeadlineStats(deadlines), [deadlines]);

  const missedDeadlines = useMemo(() => {
    return deadlines.filter((d) => {
      if (d.status === "missed") return true;
      if (d.status !== "done" && new Date(d.dueDate).getTime() < Date.now()) {
        return true;
      }
      return false;
    });
  }, [deadlines]);

  const urgentDeadlines = useMemo(() => {
    return deadlines.filter((d) => {
      if (d.status === "done") return false;
      const { daysRemaining, isOverdue } = getDeadlineCountdown(
        d.dueDate,
        d.status,
      );
      return isOverdue || daysRemaining <= 1;
    });
  }, [deadlines]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* On-Time Rate */}
        <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)]">
            <span className="text-xs font-medium">On-Time Success Rate</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--i)] font-mono">
              {stats.onTimeRate}%
            </span>
            <p className="text-[11px] text-[var(--m)] mt-1">
              Based on {stats.completed + stats.missedCount} tracked completions
            </p>
          </div>
        </div>

        {/* Total Completed */}
        <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)]">
            <span className="text-xs font-medium">Delivered On-Time</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.onTimeCount}
            </span>
            <p className="text-[11px] text-[var(--m)] mt-1">
              Completed ahead of target
            </p>
          </div>
        </div>

        {/* Missed Log */}
        <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)]">
            <span className="text-xs font-medium">Missed Deadlines</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-red-600 dark:text-red-400 font-mono">
              {stats.missedCount}
            </span>
            <p className="text-[11px] text-[var(--m)] mt-1">
              Overdue or logged as missed
            </p>
          </div>
        </div>

        {/* Urgent Deadlines */}
        <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[var(--m)]">
            <span className="text-xs font-medium">Urgent (&lt;24h Left)</span>
            <ShieldAlert size={16} className="text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
              {stats.atRiskCount}
            </span>
            <p className="text-[11px] text-[var(--m)] mt-1">
              Due within the next 24 hours
            </p>
          </div>
        </div>
      </div>

      {/* Urgent Deadlines Watchlist */}
      {urgentDeadlines.length > 0 && (
        <div className="bg-[var(--surface-card)] border border-amber-500/30 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
            <ShieldAlert size={18} />
            <span>High Urgency Watchlist</span>
          </div>

          <div className="divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl overflow-hidden bg-[var(--bg)]">
            {urgentDeadlines.map((item) => {
              const countdown = getDeadlineCountdown(item.dueDate, item.status);
              return (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[var(--i)]">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[var(--m)]">
                      Category: {item.category} • Priority: {item.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                      {countdown.text}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--m)]">
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Missed-Deadline Log Table */}
      <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--i)]">
            Missed-Deadline Post-Mortem Log
          </h3>
        </div>

        {missedDeadlines.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--m)]">
            No missed deadlines recorded! Keep up the punctual streak.
          </div>
        ) : (
          <div className="divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl overflow-hidden bg-[var(--bg)]">
            {missedDeadlines.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-[var(--i)]">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-[var(--m)]">
                    Category: {item.category} • Priority: {item.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold">
                    Past Due ({new Date(item.dueDate).toLocaleDateString()})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
