// List View sorted by nearest deadline with urgency filters
"use client";

import { useMemo } from "react";
import { useDeadlineStore } from "@/store/deadlineStore";
import { DeadlineCard } from "./DeadlineCard";
import { Plus, Clock, CheckCircle2 } from "lucide-react";
import type { DeadlineItem } from "./types";

interface NearestListViewProps {
  onEdit: (item: DeadlineItem) => void;
  onOpenCreate: () => void;
}

export function NearestListView({
  onEdit,
  onOpenCreate,
}: NearestListViewProps) {
  const {
    deadlines,
    searchQuery,
    categoryFilter,
    priorityFilter,
    statusFilter,
  } = useDeadlineStore();

  const filteredDeadlines = useMemo(() => {
    return deadlines
      .filter((d) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = d.title.toLowerCase().includes(q);
          const matchDesc = d.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }

        if (
          categoryFilter !== "all" &&
          d.category.toLowerCase() !== categoryFilter.toLowerCase()
        ) {
          return false;
        }

        if (priorityFilter !== "all" && d.priority !== priorityFilter) {
          return false;
        }

        if (statusFilter !== "all" && d.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [deadlines, searchQuery, categoryFilter, priorityFilter, statusFilter]);

  const activeDeadlines = filteredDeadlines.filter((d) => d.status !== "done");
  const completedDeadlines = filteredDeadlines.filter(
    (d) => d.status === "done",
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Active Deadlines Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--i)] tracking-tight">
              Active Deadlines (Nearest First)
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--s)] border border-[var(--h)] text-[var(--m)]">
              {activeDeadlines.length}
            </span>
          </div>

          <span className="text-xs text-[var(--m)] hidden sm:inline">
            Ordered by nearest timestamp
          </span>
        </div>

        {activeDeadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface-card)] border border-dashed border-[var(--h)] rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--s)] flex items-center justify-center text-[var(--m)] mb-3">
              <Clock size={24} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--i)]">
              No active deadlines found
            </h3>
            <p className="text-xs text-[var(--m)] max-w-sm mt-1 mb-4">
              {searchQuery
                ? "No deadlines match your current search and filter settings."
                : "You have no upcoming deadlines right now. Everything is clear!"}
            </p>
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--p)] text-[var(--pt)] hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              <span>Create New Deadline</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {activeDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Deadlines Section */}
      {completedDeadlines.length > 0 && (
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--h)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <h2 className="text-sm font-semibold text-[var(--i)] tracking-tight">
                Completed Deadlines
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--s)] border border-[var(--h)] text-[var(--m)]">
                {completedDeadlines.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 opacity-75">
            {completedDeadlines.map((deadline) => (
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
