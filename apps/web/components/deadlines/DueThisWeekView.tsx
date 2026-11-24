// View dedicated to items due within the current 7-day window
"use client";

import { useMemo } from "react";
import { useDeadlineStore } from "@/store/deadlineStore";
import { DeadlineCard } from "./DeadlineCard";
import { CalendarDays, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { DeadlineItem } from "./types";

interface DueThisWeekViewProps {
  onEdit: (item: DeadlineItem) => void;
  onOpenCreate: () => void;
}

export function DueThisWeekView({
  onEdit,
  onOpenCreate,
}: DueThisWeekViewProps) {
  const { deadlines } = useDeadlineStore();

  const { thisWeekItems, overdueItems, upcomingLaterItems } = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdue: DeadlineItem[] = [];
    const thisWeek: DeadlineItem[] = [];
    const later: DeadlineItem[] = [];

    deadlines.forEach((d) => {
      const due = new Date(d.dueDate);
      if (d.status === "done") return;

      if (due.getTime() < now.getTime()) {
        overdue.push(d);
      } else if (due.getTime() <= sevenDaysFromNow.getTime()) {
        thisWeek.push(d);
      } else {
        later.push(d);
      }
    });

    const sortByDate = (a: DeadlineItem, b: DeadlineItem) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

    return {
      overdueItems: overdue.sort(sortByDate),
      thisWeekItems: thisWeek.sort(sortByDate),
      upcomingLaterItems: later.sort(sortByDate),
    };
  }, [deadlines]);

  return (
    <div className="flex flex-col gap-6">
      {/* Highlight Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-[var(--surface-card)] to-purple-500/10 border border-[var(--h)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--i)] flex items-center gap-2">
            <CalendarDays size={18} className="text-[var(--accent)]" />
            <span>Weekly Sprint & Horizon</span>
          </h2>
          <p className="text-xs text-[var(--m)] mt-1">
            Focus view for all commitments due across the next 7 days.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center px-4 py-2 bg-[var(--bg)] border border-[var(--h)] rounded-xl">
            <span className="text-lg font-bold text-[var(--i)]">
              {thisWeekItems.length}
            </span>
            <span className="text-[10px] text-[var(--m)] uppercase tracking-wider font-semibold">
              Due This Week
            </span>
          </div>
          {overdueItems.length > 0 && (
            <div className="flex flex-col items-center px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {overdueItems.length}
              </span>
              <span className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wider font-semibold">
                Overdue
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Critical Overdue Section (if any) */}
      {overdueItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle size={16} />
            <h3 className="text-sm font-semibold tracking-tight">
              Action Required: Overdue Deadlines ({overdueItems.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3.5">
            {overdueItems.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Due This Week Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--i)] tracking-tight">
              Due in Next 7 Days ({thisWeekItems.length})
            </h3>
          </div>
        </div>

        {thisWeekItems.length === 0 ? (
          <div className="p-8 text-center bg-[var(--surface-card)] border border-[var(--h)] rounded-xl">
            <CheckCircle
              size={28}
              className="mx-auto text-emerald-500 mb-2 opacity-80"
            />
            <h4 className="text-xs font-semibold text-[var(--i)]">
              No deadlines due in the next 7 days
            </h4>
            <p className="text-[11px] text-[var(--m)] mt-0.5">
              Great pacing! Check the upcoming tab to get a head start on later
              milestones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {thisWeekItems.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Coming Up Later Preview */}
      {upcomingLaterItems.length > 0 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-[var(--h)]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--m)] uppercase tracking-wider">
              Coming Up After This Week ({upcomingLaterItems.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 opacity-80">
            {upcomingLaterItems.slice(0, 3).map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
