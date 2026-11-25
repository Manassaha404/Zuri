// Main Coordinator Component for Task Tracker Workspace
"use client";

import { useState, useEffect } from "react";
import { useInitUIStore } from "@/store/uiStore";
import { useTasks } from "@/hook/tasks";
import { TasksHeader } from "./TasksHeader";
import { ProjectsSidebarPanel } from "./ProjectsSidebarPanel";
import { TasksListView } from "./TasksListView";
import { TaskModal } from "./TaskModal";
import type { TaskItem } from "./types";

export function TasksWorkspace() {
  useInitUIStore();
  const { pomodoro, tickPomodoro } = useTasks();
  const isRunning = pomodoro.isRunning;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Pomodoro 1-second tick interval
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      tickPomodoro();
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, tickPomodoro]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEdit = (task: TaskItem) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full min-w-0">
        <TasksHeader onOpenCreateModal={handleOpenCreate} />

        <div className="flex flex-col lg:flex-row items-start gap-6 w-full min-w-0">
          <ProjectsSidebarPanel />
          <TasksListView onEdit={handleEdit} onOpenCreate={handleOpenCreate} />
        </div>
      </div>

      <TaskModal
        isOpen={modalOpen}
        initialTask={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}
