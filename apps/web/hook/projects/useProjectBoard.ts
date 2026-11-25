// Hook managing project Kanban boards, columns, cards, sprints, milestones, and synchronization with projectBoardStore
"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useProjectBoardStore } from "@/store/projectBoardStore";
import { useTaskStore } from "@/store/taskStore";
import {
  generatePositionBetween,
  sortByPosition,
} from "@/components/notes/utils/fractional-index";
import type {
  BoardCard,
  BoardColumn,
  BoardSprint,
  BoardMilestone,
  CardPriority,
} from "@/components/projects/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val: unknown): val is string =>
  typeof val === "string" && UUID_REGEX.test(val);

export function useProjectBoard() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);
  const projects = useTaskStore((s) => s.projects);

  const {
    activeProjectId,
    swimlaneMode,
    showBurndown,
    columns,
    cards,
    sprints,
    milestones,
    filters,
    setActiveProject,
    setSwimlaneMode,
    setShowBurndown,
    setSearchQuery,
    setLabelFilter,
    setAssigneeFilter,
    setPriorityFilter,
    setSprintFilter,
    resetFilters,
    setWorkspaceData,
    addColumn: storeAddColumn,
    updateColumn: storeUpdateColumn,
    deleteColumn: storeDeleteColumn,
    addCard: storeAddCard,
    updateCard: storeUpdateCard,
    deleteCard: storeDeleteCard,
    moveCard: storeMoveCard,
    addChecklistItem: storeAddChecklistItem,
    toggleChecklistItem: storeToggleChecklistItem,
    deleteChecklistItem: storeDeleteChecklistItem,
    addComment: storeAddComment,
    addSprint: storeAddSprint,
    deleteSprint: storeDeleteSprint,
    addMilestone: storeAddMilestone,
    deleteMilestone: storeDeleteMilestone,
  } = useProjectBoardStore();

  const utils = trpc.useUtils();

  const boardQuery = trpc.projects.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.some((p) => p.id === activeProjectId)
    ) {
      if (projects[0]) setActiveProject(projects[0].id);
    }
  }, [projects, activeProjectId, setActiveProject]);

  useEffect(() => {
    if (boardQuery.data && "columns" in boardQuery.data) {
      const rawCols = (boardQuery.data.columns || []) as any[];
      const rawCards = (boardQuery.data.cards || []) as any[];
      const rawSprints = (boardQuery.data.sprints || []) as any[];
      const rawMilestones = (boardQuery.data.milestones || []) as any[];

      const normalizedCols: BoardColumn[] = rawCols.map((c) => ({
        id: c.columnId || c.id,
        projectId: c.projectId,
        title: c.title,
        position: c.position || "a0",
        wipLimit: c.wipLimit ?? undefined,
        isDoneColumn: Boolean(c.isDoneColumn),
      }));

      const normalizedCards: BoardCard[] = rawCards.map((c) => ({
        id: c.cardId || c.id,
        projectId: c.projectId,
        columnId: c.columnId,
        position: c.position || "a0",
        title: c.title,
        description: c.description || undefined,
        labels: c.labels || [],
        priority: (c.priority as CardPriority) || "medium",
        startDate: c.startDate || undefined,
        dueDate: c.dueDate || undefined,
        assignee: c.assignee || undefined,
        sprintId: c.sprintId || undefined,
        milestoneId: c.milestoneId || undefined,
        storyPoints: c.storyPoints ?? 1,
        checklist: ((c.checklist || []) as any[]).map((chk) => ({
          id: chk.itemId || chk.id,
          text: chk.text,
          completed: Boolean(chk.completed),
        })),
        comments: ((c.comments || []) as any[]).map((cmt) => ({
          id: cmt.commentId || cmt.id,
          author: cmt.author,
          text: cmt.text,
          createdAt:
            typeof cmt.createdAt === "string"
              ? cmt.createdAt
              : new Date(cmt.createdAt).toISOString(),
        })),
        createdAt:
          typeof c.createdAt === "string"
            ? c.createdAt
            : new Date(c.createdAt).toISOString(),
        updatedAt:
          typeof c.updatedAt === "string"
            ? c.updatedAt
            : new Date(c.updatedAt).toISOString(),
      }));

      const normalizedSprints: BoardSprint[] = rawSprints.map((s) => ({
        id: s.sprintId || s.id,
        projectId: s.projectId,
        name: s.name,
        goal: s.goal || undefined,
        startDate: s.startDate,
        endDate: s.endDate,
        isActive: Boolean(s.isActive),
      }));

      const normalizedMilestones: BoardMilestone[] = rawMilestones.map((m) => ({
        id: m.milestoneId || m.id,
        projectId: m.projectId,
        title: m.title,
        dueDate: m.dueDate,
      }));

      setWorkspaceData({
        columns: normalizedCols,
        cards: normalizedCards,
        sprints: normalizedSprints,
        milestones: normalizedMilestones,
      });
    }
  }, [boardQuery.data, setWorkspaceData]);

  const addColMut = trpc.projects.addColumn.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const addColumn = useCallback(
    async (projectId: string, title: string, wipLimit?: number) => {
      const projCols = sortByPosition(
        columns.filter((c) => c.projectId === projectId),
      );
      const position = generatePositionBetween(
        projCols[projCols.length - 1]?.position ?? null,
        null,
      );
      storeAddColumn(projectId, title, wipLimit);
      if (userId && isUuid(projectId)) {
        try {
          await addColMut.mutateAsync({ projectId, title, position, wipLimit });
        } catch (err) {
          console.error("Failed to add column:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [columns, userId, storeAddColumn, addColMut, utils.projects.getWorkspace],
  );

  const updateColMut = trpc.projects.updateColumn.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const updateColumn = useCallback(
    async (
      columnId: string,
      updates: Partial<
        Pick<BoardColumn, "title" | "wipLimit" | "isDoneColumn">
      >,
    ) => {
      storeUpdateColumn(columnId, updates);
      if (userId && isUuid(columnId)) {
        try {
          await updateColMut.mutateAsync({
            columnId,
            title: updates.title,
            wipLimit: updates.wipLimit ?? null,
            isDoneColumn: updates.isDoneColumn,
          });
        } catch (err) {
          console.error("Failed to update column:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeUpdateColumn, updateColMut, utils.projects.getWorkspace],
  );

  const deleteColMut = trpc.projects.deleteColumn.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const deleteColumn = useCallback(
    async (columnId: string) => {
      storeDeleteColumn(columnId);
      if (userId && isUuid(columnId)) {
        try {
          await deleteColMut.mutateAsync({ columnId });
        } catch (err) {
          console.error("Failed to delete column:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeDeleteColumn, deleteColMut, utils.projects.getWorkspace],
  );

  const addCardMut = trpc.projects.addCard.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const addCard = useCallback(
    async (
      cardData: Omit<
        BoardCard,
        "id" | "position" | "checklist" | "comments" | "createdAt" | "updatedAt"
      > & { checklist?: BoardCard["checklist"] },
    ) => {
      const colCards = sortByPosition(
        cards.filter((c) => c.columnId === cardData.columnId),
      );
      const position = generatePositionBetween(
        colCards[colCards.length - 1]?.position ?? null,
        null,
      );
      storeAddCard(cardData);
      if (userId && isUuid(cardData.projectId) && isUuid(cardData.columnId)) {
        try {
          await addCardMut.mutateAsync({
            projectId: cardData.projectId,
            columnId: cardData.columnId,
            position,
            title: cardData.title,
            description: cardData.description,
            labels: cardData.labels,
            priority: cardData.priority,
            startDate: cardData.startDate,
            dueDate: cardData.dueDate,
            assignee: cardData.assignee,
            sprintId: isUuid(cardData.sprintId) ? cardData.sprintId : undefined,
            milestoneId: isUuid(cardData.milestoneId)
              ? cardData.milestoneId
              : undefined,
            storyPoints: cardData.storyPoints,
          });
        } catch (err) {
          console.error("Failed to add card:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [cards, userId, storeAddCard, addCardMut, utils.projects.getWorkspace],
  );

  const updateCardMut = trpc.projects.updateCard.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const updateCard = useCallback(
    async (cardId: string, updates: Partial<BoardCard>) => {
      storeUpdateCard(cardId, updates);
      if (userId && isUuid(cardId)) {
        try {
          await updateCardMut.mutateAsync({
            cardId,
            columnId: isUuid(updates.columnId) ? updates.columnId : undefined,
            title: updates.title,
            description:
              updates.description !== undefined
                ? updates.description || null
                : undefined,
            labels: updates.labels,
            priority: updates.priority,
            startDate:
              updates.startDate !== undefined
                ? updates.startDate || null
                : undefined,
            dueDate:
              updates.dueDate !== undefined
                ? updates.dueDate || null
                : undefined,
            assignee:
              updates.assignee !== undefined
                ? updates.assignee || null
                : undefined,
            sprintId:
              updates.sprintId !== undefined
                ? isUuid(updates.sprintId)
                  ? updates.sprintId
                  : null
                : undefined,
            milestoneId:
              updates.milestoneId !== undefined
                ? isUuid(updates.milestoneId)
                  ? updates.milestoneId
                  : null
                : undefined,
            storyPoints: updates.storyPoints,
          });
        } catch (err) {
          console.error("Failed to update card:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeUpdateCard, updateCardMut, utils.projects.getWorkspace],
  );

  const moveCardMut = trpc.projects.moveCard.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const moveCard = useCallback(
    async (cardId: string, targetColumnId: string, targetIndex?: number) => {
      const targetCards = sortByPosition(
        cards.filter((c) => c.columnId === targetColumnId && c.id !== cardId),
      );
      const idx =
        typeof targetIndex === "number"
          ? Math.max(0, Math.min(targetIndex, targetCards.length))
          : targetCards.length;
      const newPosition = generatePositionBetween(
        idx > 0 ? (targetCards[idx - 1]?.position ?? null) : null,
        idx < targetCards.length ? (targetCards[idx]?.position ?? null) : null,
      );
      storeMoveCard(cardId, targetColumnId, targetIndex);
      if (userId && isUuid(cardId) && isUuid(targetColumnId)) {
        try {
          await moveCardMut.mutateAsync({
            cardId,
            targetColumnId,
            position: newPosition,
          });
        } catch (err) {
          console.error("Failed to move card:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [cards, userId, storeMoveCard, moveCardMut, utils.projects.getWorkspace],
  );

  const deleteCardMut = trpc.projects.deleteCard.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const deleteCard = useCallback(
    async (cardId: string) => {
      storeDeleteCard(cardId);
      if (userId && isUuid(cardId)) {
        try {
          await deleteCardMut.mutateAsync({ cardId });
        } catch (err) {
          console.error("Failed to delete card:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeDeleteCard, deleteCardMut, utils.projects.getWorkspace],
  );

  const addCheckMut = trpc.projects.addChecklistItem.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const addChecklistItem = useCallback(
    async (cardId: string, text: string) => {
      storeAddChecklistItem(cardId, text);
      if (userId && isUuid(cardId)) {
        try {
          await addCheckMut.mutateAsync({ cardId, text });
        } catch (err) {
          console.error("Failed to add checklist item:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeAddChecklistItem, addCheckMut, utils.projects.getWorkspace],
  );

  const toggleCheckMut = trpc.projects.toggleChecklistItem.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const toggleChecklistItem = useCallback(
    async (cardId: string, itemId: string) => {
      storeToggleChecklistItem(cardId, itemId);
      if (userId && isUuid(itemId)) {
        try {
          await toggleCheckMut.mutateAsync({ itemId });
        } catch (err) {
          console.error("Failed to toggle checklist item:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeToggleChecklistItem,
      toggleCheckMut,
      utils.projects.getWorkspace,
    ],
  );

  const deleteCheckMut = trpc.projects.deleteChecklistItem.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const deleteChecklistItem = useCallback(
    async (cardId: string, itemId: string) => {
      storeDeleteChecklistItem(cardId, itemId);
      if (userId && isUuid(itemId)) {
        try {
          await deleteCheckMut.mutateAsync({ itemId });
        } catch (err) {
          console.error("Failed to delete checklist item:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeDeleteChecklistItem,
      deleteCheckMut,
      utils.projects.getWorkspace,
    ],
  );

  const addCommentMut = trpc.projects.addComment.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const addComment = useCallback(
    async (cardId: string, author: string, text: string) => {
      storeAddComment(cardId, author, text);
      if (userId && isUuid(cardId)) {
        try {
          await addCommentMut.mutateAsync({ cardId, author, text });
        } catch (err) {
          console.error("Failed to add comment:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeAddComment, addCommentMut, utils.projects.getWorkspace],
  );

  const addSprintMut = trpc.projects.addSprint.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const addSprint = useCallback(
    async (sprint: Omit<BoardSprint, "id">) => {
      storeAddSprint(sprint);
      if (userId && isUuid(sprint.projectId)) {
        try {
          await addSprintMut.mutateAsync(sprint);
        } catch (err) {
          console.error("Failed to add sprint:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeAddSprint, addSprintMut, utils.projects.getWorkspace],
  );

  const deleteSprintMut = trpc.projects.deleteSprint.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const deleteSprint = useCallback(
    async (sprintId: string) => {
      storeDeleteSprint(sprintId);
      if (userId && isUuid(sprintId)) {
        try {
          await deleteSprintMut.mutateAsync({ sprintId });
        } catch (err) {
          console.error("Failed to delete sprint:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeDeleteSprint, deleteSprintMut, utils.projects.getWorkspace],
  );

  const addMsMut = trpc.projects.addMilestone.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const addMilestone = useCallback(
    async (ms: Omit<BoardMilestone, "id">) => {
      storeAddMilestone(ms);
      if (userId && isUuid(ms.projectId)) {
        try {
          await addMsMut.mutateAsync(ms);
        } catch (err) {
          console.error("Failed to add milestone:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeAddMilestone, addMsMut, utils.projects.getWorkspace],
  );

  const deleteMsMut = trpc.projects.deleteMilestone.useMutation({
    onSuccess: () => utils.projects.getWorkspace.invalidate(),
  });
  const deleteMilestone = useCallback(
    async (milestoneId: string) => {
      storeDeleteMilestone(milestoneId);
      if (userId && isUuid(milestoneId)) {
        try {
          await deleteMsMut.mutateAsync({ milestoneId });
        } catch (err) {
          console.error("Failed to delete milestone:", err);
          utils.projects.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeDeleteMilestone, deleteMsMut, utils.projects.getWorkspace],
  );

  return {
    activeProjectId,
    swimlaneMode,
    showBurndown,
    columns,
    cards,
    sprints,
    milestones,
    filters,
    isLoading: boardQuery.isLoading,
    setActiveProject,
    setSwimlaneMode,
    setShowBurndown,
    setSearchQuery,
    setLabelFilter,
    setAssigneeFilter,
    setPriorityFilter,
    setSprintFilter,
    resetFilters,
    addColumn,
    updateColumn,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addComment,
    addSprint,
    deleteSprint,
    addMilestone,
    deleteMilestone,
  };
}
