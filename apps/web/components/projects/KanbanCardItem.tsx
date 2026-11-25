// Draggable Kanban Card Item
"use client";

import { Calendar, CheckSquare, MessageSquare, User } from "lucide-react";
import { useProjectBoard } from "@/hook/projects";
import type { BoardCard, CardPriority } from "./types";

interface KanbanCardItemProps {
  card: BoardCard;
  onSelect: (card: BoardCard) => void;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
}

const PRIORITY_DOT: Record<CardPriority, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-[var(--m)]",
};

export function KanbanCardItem({
  card,
  onSelect,
  onDragStart,
}: KanbanCardItemProps) {
  const { setLabelFilter } = useProjectBoard();
  const completedChecks = card.checklist.filter((c) => c.completed).length;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={() => onSelect(card)}
      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)] hover:border-[var(--m)] cursor-grab active:cursor-grabbing transition-colors flex flex-col gap-2 min-w-0"
    >
      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((lbl) => (
            <button
              key={lbl.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLabelFilter(lbl.name);
              }}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: lbl.color }}
            >
              {lbl.name}
            </button>
          ))}
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2 min-w-0">
        <span
          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[card.priority]}`}
          title={`Priority: ${card.priority}`}
        />
        <h4 className="text-xs font-semibold text-[var(--i)] leading-snug break-words">
          {card.title}
        </h4>
      </div>

      {/* Footer Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[var(--m)]">
        <div className="flex flex-wrap items-center gap-2">
          {card.dueDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {card.dueDate}
            </span>
          )}
          {card.checklist.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckSquare size={11} />
              {completedChecks}/{card.checklist.length}
            </span>
          )}
          {card.comments.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={11} />
              {card.comments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {card.assignee && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--s)] border border-[var(--h)] text-[10px] text-[var(--b)] max-w-[100px] truncate"
              title={card.assignee}
            >
              <User size={10} />
              {card.assignee.split(" ")[0]}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-[var(--s)] border border-[var(--h)] text-[10px] font-medium">
            {card.storyPoints}p
          </span>
        </div>
      </div>
    </div>
  );
}
