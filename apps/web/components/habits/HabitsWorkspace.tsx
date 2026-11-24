// Main Habits Workspace Component
"use client";

import { useState } from "react";
import { useInitUIStore } from "@/store/uiStore";
import { useHabitStore } from "@/store/habitStore";
import { useHabits } from "@/hook/habits";
import { HabitsHeader } from "./HabitsHeader";
import { HabitDateNav } from "./HabitDateNav";
import { HabitSectionList } from "./HabitSectionList";
import { HabitHeatmap } from "./HabitHeatmap";
import { HabitRoutinesView } from "./HabitRoutinesView";
import { HabitReportsView } from "./HabitReportsView";
import { HabitCreateModal } from "./HabitCreateModal";
import { HabitCheckinNoteModal } from "./HabitCheckinNoteModal";
import { HabitFreezeModal } from "./HabitFreezeModal";
import { HabitStackModal } from "./HabitStackModal";
import type { Habit } from "./types";

export function HabitsWorkspace() {
  useInitUIStore();
  useHabits();
  const { activeTab } = useHabitStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteHabit, setNoteHabit] = useState<Habit | null>(null);

  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeHabit, setFreezeHabit] = useState<Habit | null>(null);

  const [stackModalOpen, setStackModalOpen] = useState(false);
  const [editingRoutineTitle, setEditingRoutineTitle] = useState<string | null>(
    null,
  );

  const handleOpenCreateModal = () => {
    setEditingHabit(null);
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setCreateModalOpen(true);
  };

  const handleOpenNoteModal = (habit: Habit) => {
    setNoteHabit(habit);
    setNoteModalOpen(true);
  };

  const handleOpenFreezeModal = (habit: Habit) => {
    setFreezeHabit(habit);
    setFreezeModalOpen(true);
  };

  const handleOpenCreateStackModal = () => {
    setEditingRoutineTitle(null);
    setStackModalOpen(true);
  };

  const handleOpenEditStackModal = (title: string) => {
    setEditingRoutineTitle(title);
    setStackModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] habits-app habits-scrollbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Workspace Header */}
        <HabitsHeader onOpenCreateModal={handleOpenCreateModal} />

        {/* Tab Content Views */}
        {activeTab === "tracker" && (
          <div className="flex flex-col gap-6">
            {/* Interactive Date Navigation Bar */}
            <HabitDateNav />

            {/* Grouped Habit Lists */}
            <HabitSectionList
              onOpenNoteModal={handleOpenNoteModal}
              onOpenEditModal={handleOpenEditModal}
              onOpenFreezeModal={handleOpenFreezeModal}
              onOpenCreateModal={handleOpenCreateModal}
            />
          </div>
        )}

        {activeTab === "routines" && (
          <HabitRoutinesView
            onOpenCreateStackModal={handleOpenCreateStackModal}
            onOpenEditStackModal={handleOpenEditStackModal}
          />
        )}

        {activeTab === "heatmap" && <HabitHeatmap />}

        {activeTab === "reports" && <HabitReportsView />}
      </div>

      {/* Modals */}
      <HabitCreateModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingHabit(null);
        }}
        editHabit={editingHabit}
      />

      <HabitCheckinNoteModal
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setNoteHabit(null);
        }}
        habit={noteHabit}
      />

      <HabitFreezeModal
        isOpen={freezeModalOpen}
        onClose={() => {
          setFreezeModalOpen(false);
          setFreezeHabit(null);
        }}
        habit={freezeHabit}
      />

      <HabitStackModal
        isOpen={stackModalOpen}
        onClose={() => {
          setStackModalOpen(false);
          setEditingRoutineTitle(null);
        }}
        initialRoutineTitle={editingRoutineTitle}
      />
    </div>
  );
}
