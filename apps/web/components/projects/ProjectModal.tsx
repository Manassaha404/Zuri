// Create / Edit Project Modal synced with useTaskStore
"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { useTasks } from "@/hook/tasks";
import { useProjectBoard } from "@/hook/projects";
import type { ProjectStatus, TaskProject } from "@/components/tasks/types";

interface ProjectModalProps {
  isOpen: boolean;
  initialProject: TaskProject | null;
  onClose: () => void;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export function ProjectModal({
  isOpen,
  initialProject,
  onClose,
}: ProjectModalProps) {
  const { addProject, updateProject } = useTasks();
  const { setActiveProject } = useProjectBoard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState<string>(COLORS[0] ?? "#3b82f6");

  useEffect(() => {
    if (!isOpen) return;
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || "");
      setStatus(initialProject.status || "active");
      setDeadline(initialProject.deadline || "");
      setColor(initialProject.color);
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setDeadline("");
      setColor(COLORS[0] ?? "#3b82f6");
    }
  }, [isOpen, initialProject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialProject) {
      await updateProject(initialProject.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        deadline: deadline || undefined,
        color,
      });
    } else {
      const created = await addProject(name.trim(), color, {
        description: description.trim() || undefined,
        status,
        deadline: deadline || undefined,
      });
      if (created?.id) setActiveProject(created.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)]">
          <h2 className="text-base font-semibold text-[var(--i)]">
            {initialProject ? "Project Settings" : "New Project"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1">
              Project Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App v2"
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
              placeholder="Project goals and scope..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full appearance-none px-2.5 pr-7 py-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
                >
                  <option value="planning" className="bg-[var(--surface-card)]">
                    Planning
                  </option>
                  <option value="active" className="bg-[var(--surface-card)]">
                    Active
                  </option>
                  <option value="on_hold" className="bg-[var(--surface-card)]">
                    On Hold
                  </option>
                  <option
                    value="completed"
                    className="bg-[var(--surface-card)]"
                  >
                    Completed
                  </option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--m)] mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--h)] text-[var(--i)] focus:outline-none focus:border-[var(--p)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--m)] mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "scale-115 ring-2 ring-[var(--p)]" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="bt p text-xs px-4 py-2">
              {initialProject ? "Save Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
