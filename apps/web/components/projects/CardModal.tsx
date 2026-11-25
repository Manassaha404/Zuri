// Create / Edit / Inspect Board Card Modal with labels, checklist, comments, sprint & milestone
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useProjectBoard } from "@/hook/projects";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useContacts } from "@/hook/contacts";
import type { BoardCard, BoardLabel, CardPriority } from "./types";

interface CardModalProps {
  isOpen: boolean;
  initialCard: BoardCard | null;
  defaultColumnId?: string;
  onClose: () => void;
}

const LABEL_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

export function CardModal({
  isOpen,
  initialCard,
  defaultColumnId,
  onClose,
}: CardModalProps) {
  const fullName = useUserInfoStore((s) => s.fullName);
  const { contacts } = useContacts();
  const {
    activeProjectId,
    columns,
    cards,
    sprints,
    milestones,
    addCard,
    updateCard,
    deleteCard,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addComment,
  } = useProjectBoard();

  const projCols = useMemo(
    () => columns.filter((c) => c.projectId === activeProjectId),
    [columns, activeProjectId],
  );
  const projSprints = useMemo(
    () => sprints.filter((s) => s.projectId === activeProjectId),
    [sprints, activeProjectId],
  );
  const projMilestones = useMemo(
    () => milestones.filter((m) => m.projectId === activeProjectId),
    [milestones, activeProjectId],
  );

  // Live card for immediate checklist/comment updates
  const liveCard = useMemo(
    () =>
      initialCard
        ? cards.find((c) => c.id === initialCard.id) || initialCard
        : null,
    [cards, initialCard],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [priority, setPriority] = useState<CardPriority>("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [storyPoints, setStoryPoints] = useState("2");
  const [sprintId, setSprintId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [labels, setLabels] = useState<BoardLabel[]>([]);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState<string>(
    LABEL_COLORS[0] ?? "#3b82f6",
  );
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initialCard) {
      setTitle(initialCard.title);
      setDescription(initialCard.description || "");
      setColumnId(initialCard.columnId);
      setPriority(initialCard.priority);
      setStartDate(initialCard.startDate || "");
      setDueDate(initialCard.dueDate || "");
      setAssignee(initialCard.assignee || "");
      setStoryPoints(String(initialCard.storyPoints || 1));
      setSprintId(initialCard.sprintId || "");
      setMilestoneId(initialCard.milestoneId || "");
      setLabels(initialCard.labels);
    } else {
      setTitle("");
      setDescription("");
      setColumnId(defaultColumnId || projCols[0]?.id || "");
      setPriority("medium");
      setStartDate("");
      setDueDate("");
      setAssignee("");
      setStoryPoints("2");
      setSprintId(projSprints[0]?.id || "");
      setMilestoneId(projMilestones[0]?.id || "");
      setLabels([]);
    }
    setLabelName("");
    setNewCheckItem("");
    setNewComment("");
  }, [
    isOpen,
    initialCard,
    defaultColumnId,
    projCols,
    projSprints,
    projMilestones,
  ]);

  if (!isOpen) return null;

  const handleAddLabel = () => {
    if (!labelName.trim()) return;
    setLabels([
      ...labels,
      {
        id: `lbl-${Date.now()}`,
        name: labelName.trim(),
        color: labelColor,
      },
    ]);
    setLabelName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    const payload = {
      projectId: activeProjectId,
      columnId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      assignee: assignee.trim() || undefined,
      storyPoints: Math.max(1, parseInt(storyPoints, 10) || 1),
      sprintId: sprintId || undefined,
      milestoneId: milestoneId || undefined,
      labels,
    };

    if (initialCard) {
      updateCard(initialCard.id, payload);
    } else {
      addCard(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)]">
          <h2 className="text-base font-semibold text-[var(--i)]">
            {initialCard ? "Card Details" : "New Board Card"}
          </h2>
          <div className="flex items-center gap-2">
            {initialCard && (
              <button
                type="button"
                onClick={() => {
                  deleteCard(initialCard.id);
                  onClose();
                }}
                className="p-1.5 rounded-lg text-[var(--m)] hover:text-red-500 hover:bg-red-500/10"
                title="Delete card"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-5 overflow-y-auto styled-scrollbar"
        >
          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, links, or notes..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Column
              </label>
              <div className="relative">
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  {projCols.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-[var(--surface-card)]"
                    >
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Priority
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CardPriority)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="low" className="bg-[var(--surface-card)]">
                    Low
                  </option>
                  <option value="medium" className="bg-[var(--surface-card)]">
                    Medium
                  </option>
                  <option value="high" className="bg-[var(--surface-card)]">
                    High
                  </option>
                  <option value="urgent" className="bg-[var(--surface-card)]">
                    Urgent
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Assignee
              </label>
              <div className="relative">
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="" className="bg-[var(--surface-card)]">
                    Unassigned
                  </option>
                  {contacts.map((c) => (
                    <option
                      key={c.id}
                      value={c.name}
                      className="bg-[var(--surface-card)]"
                    >
                      {c.name}
                    </option>
                  ))}
                  {assignee && !contacts.some((c) => c.name === assignee) && (
                    <option
                      value={assignee}
                      className="bg-[var(--surface-card)]"
                    >
                      {assignee}
                    </option>
                  )}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Story Points
              </label>
              <input
                type="number"
                min={1}
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Sprint
              </label>
              <div className="relative">
                <select
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="" className="bg-[var(--surface-card)]">
                    None
                  </option>
                  {projSprints.map((s) => (
                    <option
                      key={s.id}
                      value={s.id}
                      className="bg-[var(--surface-card)]"
                    >
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Milestone
              </label>
              <div className="relative">
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full appearance-none px-2.5 pr-7 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="" className="bg-[var(--surface-card)]">
                    None
                  </option>
                  {projMilestones.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      className="bg-[var(--surface-card)]"
                    >
                      {m.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Labels
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="Label name..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
              <div className="flex items-center gap-1">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLabelColor(c)}
                    className={`w-4 h-4 rounded-full ${
                      labelColor === c ? "ring-2 ring-[var(--p)]" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddLabel}
                className="bt text-xs px-2.5 py-1.5"
              >
                Add
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {labels.map((l) => (
                  <span
                    key={l.id}
                    className="badge-pill text-[11px] flex items-center gap-1 text-white border-transparent"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                    <button
                      type="button"
                      onClick={() =>
                        setLabels(labels.filter((x) => x.id !== l.id))
                      }
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Checklist (live when editing existing card) */}
          {liveCard && (
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Checklist (
                {liveCard.checklist.filter((i) => i.completed).length}/
                {liveCard.checklist.length})
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChecklistItem(liveCard.id, newCheckItem);
                      setNewCheckItem("");
                    }
                  }}
                  placeholder="Add checklist item..."
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    addChecklistItem(liveCard.id, newCheckItem);
                    setNewCheckItem("");
                  }}
                  className="bt text-xs px-2.5 py-1.5"
                >
                  <Plus size={12} />
                </button>
              </div>
              {liveCard.checklist.length > 0 && (
                <div className="divide-y divide-[var(--h)] border border-[var(--h)] rounded-xl overflow-hidden bg-[var(--bg)]">
                  {liveCard.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-1.5 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleChecklistItem(liveCard.id, item.id)
                        }
                        className="flex items-center gap-2 text-left flex-1 min-w-0"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            item.completed
                              ? "bg-[var(--p)] border-[var(--p)] text-[var(--pt)]"
                              : "border-[var(--h)]"
                          }`}
                        >
                          {item.completed && <Check size={10} />}
                        </span>
                        <span
                          className={
                            item.completed
                              ? "line-through text-[var(--m)]"
                              : "text-[var(--b)]"
                          }
                        >
                          {item.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteChecklistItem(liveCard.id, item.id)
                        }
                        className="text-[var(--m)] hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          {liveCard && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--m)] mb-1">
                <MessageSquare size={12} />
                <span>Comments ({liveCard.comments.length})</span>
              </label>
              <div className="flex flex-col gap-2 mb-2 max-h-32 overflow-y-auto styled-scrollbar">
                {liveCard.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--m)] mb-0.5">
                      <span className="font-semibold text-[var(--i)]">
                        {c.author}
                      </span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[var(--b)]">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addComment(
                        liveCard.id,
                        fullName || "Team Member",
                        newComment,
                      );
                      setNewComment("");
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    addComment(
                      liveCard.id,
                      fullName || "Team Member",
                      newComment,
                    );
                    setNewComment("");
                  }}
                  className="bt text-xs px-3 py-1.5"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="bt p text-xs px-4 py-2">
              {initialCard ? "Save Card" : "Create Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
