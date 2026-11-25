// Customizable Kanban Board with Drag-and-Drop, WIP Limits, and Swimlanes
"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, AlertTriangle, Edit2, Check } from "lucide-react";
import { sortByPosition } from "@/components/notes/utils/fractional-index";
import { useProjectBoard } from "@/hook/projects";
import { KanbanCardItem } from "./KanbanCardItem";
import type { BoardCard, BoardColumn } from "./types";

interface KanbanBoardViewProps {
  filteredCards: BoardCard[];
  onSelectCard: (card: BoardCard) => void;
  onAddCardInColumn: (columnId: string) => void;
}

export function KanbanBoardView({
  filteredCards,
  onSelectCard,
  onAddCardInColumn,
}: KanbanBoardViewProps) {
  const {
    activeProjectId,
    columns,
    swimlaneMode,
    addColumn,
    updateColumn,
    deleteColumn,
    moveCard,
  } = useProjectBoard();

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColWip, setNewColWip] = useState("");
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState("");
  const [editingColWip, setEditingColWip] = useState("");

  const projectColumns = useMemo(
    () =>
      sortByPosition(columns.filter((c) => c.projectId === activeProjectId)),
    [columns, activeProjectId],
  );

  // Compute swimlane rows
  const swimlanes = useMemo(() => {
    if (swimlaneMode === "none") {
      return [{ key: "all", label: null as string | null }];
    }
    if (swimlaneMode === "priority") {
      return [
        { key: "urgent", label: "Urgent" },
        { key: "high", label: "High" },
        { key: "medium", label: "Medium" },
        { key: "low", label: "Low" },
      ];
    }
    const assignees = Array.from(
      new Set(filteredCards.map((c) => c.assignee || "Unassigned")),
    ).sort();
    return assignees.map((a) => ({ key: a, label: a }));
  }, [swimlaneMode, filteredCards]);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnColumn = (
    e: React.DragEvent,
    columnId: string,
    targetIndex?: number,
  ) => {
    e.preventDefault();
    const id = draggedCardId || e.dataTransfer.getData("text/plain");
    if (id) {
      moveCard(id, columnId, targetIndex);
    }
    setDraggedCardId(null);
    setDragOverColId(null);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const wip = newColWip ? parseInt(newColWip, 10) : undefined;
    addColumn(
      activeProjectId,
      newColTitle.trim(),
      wip && !Number.isNaN(wip) && wip > 0 ? wip : undefined,
    );
    setNewColTitle("");
    setNewColWip("");
  };

  const startEditCol = (col: BoardColumn) => {
    setEditingColId(col.id);
    setEditingColTitle(col.title);
    setEditingColWip(col.wipLimit ? String(col.wipLimit) : "");
  };

  const saveEditCol = (colId: string) => {
    if (editingColTitle.trim()) {
      const wip = editingColWip ? parseInt(editingColWip, 10) : undefined;
      updateColumn(colId, {
        title: editingColTitle.trim(),
        wipLimit: wip && !Number.isNaN(wip) && wip > 0 ? wip : undefined,
      });
    }
    setEditingColId(null);
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      {swimlanes.map((lane) => (
        <div key={lane.key} className="flex flex-col gap-2 min-w-0">
          {lane.label && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--i)]">
                {lane.label}
              </span>
              <span className="flex-1 h-px bg-[var(--h)]" />
            </div>
          )}

          <div className="flex items-start gap-4 overflow-x-auto pb-3 styled-scrollbar">
            {projectColumns.map((col) => {
              const colCards = sortByPosition(
                filteredCards.filter((c) => {
                  if (c.columnId !== col.id) return false;
                  if (swimlaneMode === "priority")
                    return c.priority === lane.key;
                  if (swimlaneMode === "assignee")
                    return (c.assignee || "Unassigned") === lane.key;
                  return true;
                }),
              );

              const totalColCount = filteredCards.filter(
                (c) => c.columnId === col.id,
              ).length;
              const isOverWip =
                typeof col.wipLimit === "number" &&
                totalColCount > col.wipLimit;
              const isAtWip =
                typeof col.wipLimit === "number" &&
                totalColCount === col.wipLimit;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColId(col.id);
                  }}
                  onDragLeave={() => setDragOverColId(null)}
                  onDrop={(e) => handleDropOnColumn(e, col.id)}
                  className={`w-76 shrink-0 rounded-2xl p-3 bg-[var(--surface-card)] border flex flex-col gap-3 transition-colors ${
                    dragOverColId === col.id
                      ? "border-[var(--accent)]"
                      : isOverWip
                        ? "border-red-500/50"
                        : "border-[var(--h)]"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between gap-2">
                    {editingColId === col.id ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editingColTitle}
                          onChange={(e) => setEditingColTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs rounded bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] min-w-0"
                        />
                        <input
                          type="number"
                          min={1}
                          value={editingColWip}
                          onChange={(e) => setEditingColWip(e.target.value)}
                          placeholder="WIP"
                          className="w-12 px-1.5 py-1 text-xs rounded bg-[var(--bg)] border border-[var(--h)] text-[var(--i)]"
                        />
                        <button
                          type="button"
                          onClick={() => saveEditCol(col.id)}
                          className="p-1 text-emerald-500"
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-xs font-semibold text-[var(--i)] truncate">
                            {col.title}
                          </h3>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                              isOverWip
                                ? "bg-red-500/15 text-red-500"
                                : isAtWip
                                  ? "bg-amber-500/15 text-amber-500"
                                  : "bg-[var(--s)] text-[var(--m)]"
                            }`}
                          >
                            {totalColCount}
                            {col.wipLimit ? `/${col.wipLimit}` : ""}
                          </span>
                          {isOverWip && (
                            <span title="WIP limit exceeded">
                              <AlertTriangle
                                size={12}
                                className="text-red-500 shrink-0"
                              />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCol(col)}
                            className="p-1 rounded text-[var(--m)] hover:text-[var(--i)]"
                            title="Edit column & WIP limit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteColumn(col.id)}
                            className="p-1 rounded text-[var(--m)] hover:text-red-500"
                            title="Delete column"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Cards Stack */}
                  <div className="flex flex-col gap-2 min-h-[48px]">
                    {colCards.map((card, idx) => (
                      <div
                        key={card.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDropOnColumn(e, col.id, idx);
                        }}
                      >
                        <KanbanCardItem
                          card={card}
                          onSelect={onSelectCard}
                          onDragStart={handleDragStart}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddCardInColumn(col.id)}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                  >
                    <Plus size={13} />
                    <span>Add Card</span>
                  </button>
                </div>
              );
            })}

            {/* Add Column Card (only in primary lane) */}
            {lane.key === swimlanes[0]?.key && (
              <form
                onSubmit={handleAddColumn}
                className="w-68 shrink-0 rounded-2xl p-3 bg-[var(--surface-card)] border border-dashed border-[var(--h)] flex flex-col gap-2"
              >
                <span className="text-xs font-semibold text-[var(--m)]">
                  + Add Column
                </span>
                <input
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Column title..."
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={newColWip}
                    onChange={(e) => setNewColWip(e.target.value)}
                    placeholder="WIP limit (opt)"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)] min-w-0"
                  />
                  <button
                    type="submit"
                    className="bt p !w-auto !h-8 shrink-0 text-xs px-3"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
