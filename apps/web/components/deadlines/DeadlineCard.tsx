// Card displaying a single deadline item with countdown, urgency colors
"use client";

import {
  Clock,
  CheckCircle2,
  Circle,
  Repeat,
  Bell,
  Edit2,
  Trash2,
} from "lucide-react";
import { useDeadlines } from "@/hook/deadlines";
import { getDeadlineCountdown } from "@/lib/deadlineUtils";
import type { DeadlineItem, DeadlinePriority } from "./types";

interface DeadlineCardProps {
  deadline: DeadlineItem;
  onEdit: (item: DeadlineItem) => void;
}

export function DeadlineCard({ deadline, onEdit }: DeadlineCardProps) {
  const { toggleStatus, deleteDeadline, categories } = useDeadlines();

  const countdown = getDeadlineCountdown(deadline.dueDate, deadline.status);

  // Find matching category metadata if available
  const matchedCategory = categories.find(
    (c) => c.name.toLowerCase() === deadline.category.toLowerCase(),
  );

  // Urgency color tokens
  const urgencyStyles: Record<
    string,
    { badgeBg: string; badgeText: string; ringColor: string }
  > = {
    critical: {
      badgeBg: "bg-red-500/10 border-red-500/30",
      badgeText: "text-red-600 dark:text-red-400 font-semibold",
      ringColor: "border-l-red-500",
    },
    red: {
      badgeBg: "bg-red-500/10 border-red-500/30",
      badgeText: "text-red-600 dark:text-red-400 font-medium",
      ringColor: "border-l-red-500",
    },
    amber: {
      badgeBg: "bg-amber-500/10 border-amber-500/30",
      badgeText: "text-amber-600 dark:text-amber-400 font-medium",
      ringColor: "border-l-amber-500",
    },
    green: {
      badgeBg: "bg-emerald-500/10 border-emerald-500/30",
      badgeText: "text-emerald-600 dark:text-emerald-400 font-medium",
      ringColor: "border-l-emerald-500",
    },
  };

  const defaultUrgencyStyle = {
    badgeBg: "bg-emerald-500/10 border-emerald-500/30",
    badgeText: "text-emerald-600 dark:text-emerald-400 font-medium",
    ringColor: "border-l-emerald-500",
  };

  const currentUrgency =
    urgencyStyles[countdown.urgency] ?? defaultUrgencyStyle;

  const priorityLabels: Record<DeadlinePriority, { text: string; bg: string }> =
    {
      urgent: {
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
      },
      high: {
        text: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-500/10 border-orange-500/20",
      },
      medium: {
        text: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
      },
      low: {
        text: "text-[var(--m)]",
        bg: "bg-[var(--s)] border-[var(--h)]",
      },
    };

  return (
    <div
      className={`group relative flex flex-col bg-[var(--surface-card)] border border-[var(--h)] rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xs border-l-4 ${currentUrgency.ringColor}`}
    >
      {/* Main Card Body */}
      <div className="p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Completion Checkbox & Title */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => toggleStatus(deadline.id)}
              className="mt-0.5 text-[var(--m)] hover:text-[var(--i)] transition-colors focus:outline-hidden"
              title={
                deadline.status === "done" ? "Mark Incomplete" : "Mark Complete"
              }
            >
              {deadline.status === "done" ? (
                <CheckCircle2
                  size={20}
                  className="text-emerald-500 fill-emerald-500/20"
                />
              ) : (
                <Circle size={20} className="hover:text-[var(--p)]" />
              )}
            </button>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-sm sm:text-base font-semibold tracking-tight text-[var(--i)] truncate ${
                    deadline.status === "done" ? "line-through opacity-60" : ""
                  }`}
                >
                  {deadline.title}
                </h3>

                {/* Priority Badge */}
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityLabels[deadline.priority].bg} ${priorityLabels[deadline.priority].text}`}
                >
                  {priorityLabels[deadline.priority].text.includes("urgent")
                    ? "Urgent"
                    : deadline.priority.toUpperCase()}
                </span>

                {/* Category Badge */}
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1.5"
                  style={{
                    backgroundColor: matchedCategory
                      ? `${matchedCategory.color}15`
                      : "var(--s)",
                    borderColor: matchedCategory
                      ? `${matchedCategory.color}35`
                      : "var(--h)",
                    color: matchedCategory ? matchedCategory.color : "var(--m)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: matchedCategory
                        ? matchedCategory.color
                        : "var(--m)",
                    }}
                  />
                  <span className="capitalize">{deadline.category}</span>
                </span>

                {/* Recurrence Indicator */}
                {deadline.recurrence !== "none" && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400"
                    title={`Recurring ${deadline.recurrence}`}
                  >
                    <Repeat size={11} />
                    <span className="capitalize">{deadline.recurrence}</span>
                  </span>
                )}
              </div>

              {deadline.description && (
                <p className="text-xs text-[var(--m)] line-clamp-2 leading-relaxed">
                  {deadline.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Countdown & Urgency Badge */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${currentUrgency.badgeBg} ${currentUrgency.badgeText}`}
            >
              <Clock size={13} />
              <span>{countdown.text}</span>
            </div>
            <span className="text-[10px] text-[var(--m)] font-mono">
              {countdown.subtext}
            </span>
          </div>
        </div>

        {/* Soft vs Hard Deadline Comparison */}
        {deadline.softDueDate && (
          <div className="flex items-center gap-3 text-xs bg-[var(--s)]/70 border border-[var(--h)] rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-[var(--b)]">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Target (Soft):
              </span>
              <span>
                {new Date(deadline.softDueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <span className="text-[var(--h)]">|</span>
            <div className="flex items-center gap-1.5 text-[var(--m)]">
              <span className="font-semibold text-red-500">Real (Hard):</span>
              <span>
                {new Date(deadline.dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}

        {/* Reminders & Action buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[var(--h)]/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Set Reminders */}
            {deadline.reminders.length > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[var(--s)] text-[var(--m)] border border-[var(--h)]"
                title={deadline.reminders
                  .map((r) => r.replace("_", " "))
                  .join(", ")}
              >
                <Bell size={11} />
                <span>{deadline.reminders.length} reminders</span>
              </span>
            )}
          </div>

          {/* Action buttons: Edit, Delete */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => onEdit(deadline)}
              className="p-1.5 text-[var(--m)] hover:text-[var(--i)] rounded-md hover:bg-[var(--s)] transition-colors"
              title="Edit Deadline"
            >
              <Edit2 size={13} />
            </button>

            <button
              type="button"
              onClick={() => deleteDeadline(deadline.id)}
              className="p-1.5 text-[var(--m)] hover:text-red-500 rounded-md hover:bg-[var(--s)] transition-colors"
              title="Delete Deadline"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
