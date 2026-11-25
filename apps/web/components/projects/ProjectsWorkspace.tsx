// Main Coordinator Component for Projects & Kanban Board Workspace
"use client";

import { useState, useMemo } from "react";
import { useInitUIStore } from "@/store/uiStore";
import { useProjectBoard } from "@/hook/projects";
import { useTasks } from "@/hook/tasks";
import { useContacts } from "@/hook/contacts";
import { ProjectsHeader } from "./ProjectsHeader";
import { SprintBurndownPanel } from "./SprintBurndownPanel";
import { KanbanBoardView } from "./KanbanBoardView";
import { ProjectModal } from "./ProjectModal";
import { CardModal } from "./CardModal";
import type { BoardCard } from "./types";
import type { TaskProject } from "@/components/tasks/types";

export function ProjectsWorkspace() {
  useInitUIStore();
  useTasks();
  useContacts();
  const { activeProjectId, showBurndown, cards, filters } = useProjectBoard();

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TaskProject | null>(
    null,
  );
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<BoardCard | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<string | undefined>(
    undefined,
  );

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (c.projectId !== activeProjectId) return false;
      if (
        filters.priorityFilter !== "all" &&
        c.priority !== filters.priorityFilter
      ) {
        return false;
      }
      if (
        filters.assigneeFilter !== "all" &&
        c.assignee !== filters.assigneeFilter
      ) {
        return false;
      }
      if (
        filters.sprintFilter !== "all" &&
        c.sprintId !== filters.sprintFilter
      ) {
        return false;
      }
      if (
        filters.labelFilter &&
        !c.labels.some((l) => l.name === filters.labelFilter)
      ) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const inTitle = c.title.toLowerCase().includes(q);
        const inDesc = (c.description || "").toLowerCase().includes(q);
        const inAssignee = (c.assignee || "").toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inAssignee) return false;
      }
      return true;
    });
  }, [cards, activeProjectId, filters]);

  const handleOpenNewCard = (columnId?: string) => {
    setEditingCard(null);
    setDefaultColumnId(columnId);
    setCardModalOpen(true);
  };

  const handleSelectCard = (card: BoardCard) => {
    setEditingCard(card);
    setDefaultColumnId(undefined);
    setCardModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full min-w-0">
        <ProjectsHeader
          onOpenNewProject={() => {
            setEditingProject(null);
            setProjectModalOpen(true);
          }}
          onOpenEditProject={(proj) => {
            setEditingProject(proj);
            setProjectModalOpen(true);
          }}
          onOpenNewCard={() => handleOpenNewCard()}
        />

        {showBurndown && <SprintBurndownPanel />}

        <KanbanBoardView
          filteredCards={filteredCards}
          onSelectCard={handleSelectCard}
          onAddCardInColumn={(colId) => handleOpenNewCard(colId)}
        />
      </div>

      <ProjectModal
        isOpen={projectModalOpen}
        initialProject={editingProject}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
      />

      <CardModal
        isOpen={cardModalOpen}
        initialCard={editingCard}
        defaultColumnId={defaultColumnId}
        onClose={() => {
          setCardModalOpen(false);
          setEditingCard(null);
          setDefaultColumnId(undefined);
        }}
      />
    </div>
  );
}
