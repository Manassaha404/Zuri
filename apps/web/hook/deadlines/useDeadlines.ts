// Hook managing deadline tracking query, mutations, categories and synchronization with deadlineStore
"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useDeadlineStore } from "@/store/deadlineStore";
import type {
  DeadlineItem,
  DeadlinePriority,
  DeadlineStatus,
  ReminderOffset,
  RecurrenceType,
  DeadlineCategoryItem,
} from "@/components/deadlines/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val: unknown): val is string =>
  typeof val === "string" && UUID_REGEX.test(val);

export function useDeadlines() {
  const userId = useUserInfoStore((s) => s.userId);
  const isInitialized = useUserInfoStore((s) => s.isInitialized);

  const {
    deadlines,
    categories,
    addDeadline: storeAddDeadline,
    updateDeadline: storeUpdateDeadline,
    deleteDeadline: storeDeleteDeadline,
    toggleStatus: storeToggleStatus,
    setDeadlines: storeSetDeadlines,
    setCategories: storeSetCategories,
    addCategory: storeAddCategory,
    deleteCategory: storeDeleteCategory,
  } = useDeadlineStore();

  const utils = trpc.useUtils();

  // Query deadline workspace hierarchy, categories and stats from PostgreSQL
  const workspaceQuery = trpc.deadlines.getWorkspace.useQuery(undefined, {
    enabled: Boolean(isInitialized && userId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  // Sync database records directly into Zustand store
  useEffect(() => {
    if (workspaceQuery.data && "deadlines" in workspaceQuery.data) {
      const rawDeadlines = (workspaceQuery.data.deadlines || []) as any[];
      const rawCategories = (workspaceQuery.data.categories || []) as any[];

      const normalizedDeadlines: DeadlineItem[] = rawDeadlines.map((d) => ({
        id: d.deadlineId || d.id,
        title: d.title,
        description: d.description || undefined,
        category: d.category || "assignment",
        priority: (d.priority as DeadlinePriority) || "medium",
        status: (d.status as DeadlineStatus) || "upcoming",
        dueDate:
          typeof d.dueDate === "string"
            ? d.dueDate
            : new Date(d.dueDate).toISOString(),
        softDueDate: d.softDueDate
          ? typeof d.softDueDate === "string"
            ? d.softDueDate
            : new Date(d.softDueDate).toISOString()
          : undefined,
        completedAt: d.completedAt
          ? typeof d.completedAt === "string"
            ? d.completedAt
            : new Date(d.completedAt).toISOString()
          : undefined,
        reminders: (d.reminders as ReminderOffset[]) || [],
        recurrence: (d.recurrence as RecurrenceType) || "none",
        createdAt:
          typeof d.createdAt === "string"
            ? d.createdAt
            : new Date(d.createdAt).toISOString(),
        updatedAt:
          typeof d.updatedAt === "string"
            ? d.updatedAt
            : new Date(d.updatedAt).toISOString(),
      }));

      storeSetDeadlines(normalizedDeadlines);

      if (rawCategories.length > 0) {
        const normalizedCategories: DeadlineCategoryItem[] = rawCategories.map(
          (c) => ({
            id: c.categoryId || c.id,
            name: c.name,
            color: c.color || "#3b82f6",
            icon: c.icon || "Tag",
            isSystem: Boolean(c.isSystem),
          }),
        );
        storeSetCategories(normalizedCategories);
      }
    }
  }, [workspaceQuery.data, storeSetDeadlines, storeSetCategories]);

  // Mutation: Create Deadline
  const createMutation = trpc.deadlines.createDeadline.useMutation({
    onSuccess: () => {
      utils.deadlines.getWorkspace.invalidate();
    },
  });

  const createDeadline = useCallback(
    async (item: Omit<DeadlineItem, "id" | "createdAt" | "updatedAt">) => {
      storeAddDeadline(item);

      if (userId) {
        try {
          const res = await createMutation.mutateAsync({
            title: item.title,
            description: item.description,
            category: item.category,
            priority: item.priority,
            status: item.status,
            dueDate: item.dueDate,
            softDueDate: item.softDueDate,
            recurrence: item.recurrence,
            reminders: item.reminders,
          });
          utils.deadlines.getWorkspace.invalidate();
          return res;
        } catch (err) {
          console.error("Failed to sync created deadline with database:", err);
          utils.deadlines.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeAddDeadline, createMutation, utils.deadlines.getWorkspace],
  );

  // Mutation: Update Deadline
  const updateMutation = trpc.deadlines.updateDeadline.useMutation({
    onSuccess: () => {
      utils.deadlines.getWorkspace.invalidate();
    },
  });

  const updateDeadline = useCallback(
    async (id: string, updates: Partial<DeadlineItem>) => {
      storeUpdateDeadline(id, updates);

      if (userId && isUuid(id)) {
        try {
          const res = await updateMutation.mutateAsync({
            deadlineId: id,
            title: updates.title,
            description: updates.description,
            category: updates.category,
            priority: updates.priority,
            status: updates.status,
            dueDate: updates.dueDate,
            softDueDate: updates.softDueDate,
            recurrence: updates.recurrence,
            reminders: updates.reminders,
          });
          return res;
        } catch (err) {
          console.error("Failed to sync updated deadline with database:", err);
          utils.deadlines.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeUpdateDeadline, updateMutation, utils.deadlines.getWorkspace],
  );

  // Mutation: Toggle Status
  const toggleStatusMutation = trpc.deadlines.toggleStatus.useMutation({
    onSuccess: () => {
      utils.deadlines.getWorkspace.invalidate();
    },
  });

  const toggleStatus = useCallback(
    async (id: string) => {
      storeToggleStatus(id);

      if (userId && isUuid(id)) {
        try {
          await toggleStatusMutation.mutateAsync({ deadlineId: id });
        } catch (err) {
          console.error("Failed to toggle deadline status on server:", err);
          utils.deadlines.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeToggleStatus,
      toggleStatusMutation,
      utils.deadlines.getWorkspace,
    ],
  );

  // Mutation: Delete Deadline
  const deleteMutation = trpc.deadlines.deleteDeadline.useMutation({
    onSuccess: () => {
      utils.deadlines.getWorkspace.invalidate();
    },
  });

  const deleteDeadline = useCallback(
    async (id: string) => {
      storeDeleteDeadline(id);

      if (userId && isUuid(id)) {
        try {
          await deleteMutation.mutateAsync({ deadlineId: id });
        } catch (err) {
          console.error("Failed to delete deadline on server:", err);
          utils.deadlines.getWorkspace.invalidate();
        }
      }
    },
    [userId, storeDeleteDeadline, deleteMutation, utils.deadlines.getWorkspace],
  );

  // Mutation: Add Category
  const addCategoryMutation = trpc.deadlines.addCategory.useMutation({
    onSuccess: () => {
      utils.deadlines.getWorkspace.invalidate();
    },
  });

  const addCategory = useCallback(
    async (input: { name: string; color?: string; icon?: string }) => {
      const tempId = `cat-${Date.now()}`;
      storeAddCategory({
        id: tempId,
        name: input.name.trim(),
        color: input.color || "#3b82f6",
        icon: input.icon || "Tag",
        isSystem: false,
      });

      if (userId) {
        try {
          const res = await addCategoryMutation.mutateAsync({
            name: input.name,
            color: input.color,
            icon: input.icon,
          });
          utils.deadlines.getWorkspace.invalidate();
          return res;
        } catch (err) {
          console.error("Failed to add category to database:", err);
          utils.deadlines.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeAddCategory,
      addCategoryMutation,
      utils.deadlines.getWorkspace,
    ],
  );

  // Mutation: Delete Category
  const deleteCategoryMutation = trpc.deadlines.deleteCategory.useMutation({
    onSuccess: () => {
      utils.deadlines.getWorkspace.invalidate();
    },
  });

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      storeDeleteCategory(categoryId);

      if (userId && isUuid(categoryId)) {
        try {
          await deleteCategoryMutation.mutateAsync({ categoryId });
        } catch (err) {
          console.error("Failed to delete category from database:", err);
          utils.deadlines.getWorkspace.invalidate();
        }
      }
    },
    [
      userId,
      storeDeleteCategory,
      deleteCategoryMutation,
      utils.deadlines.getWorkspace,
    ],
  );

  return {
    deadlines,
    categories,
    isLoading: workspaceQuery.isLoading,
    isRefetching: workspaceQuery.isRefetching,
    refetch: workspaceQuery.refetch,
    createDeadline,
    updateDeadline,
    toggleStatus,
    deleteDeadline,
    addCategory,
    deleteCategory,
  };
}
