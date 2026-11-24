import { create } from "zustand";
import type {
  DeadlineItem,
  DeadlineViewTab,
  DeadlinePriority,
  DeadlineStatus,
  DeadlineCategoryItem,
} from "../components/deadlines/types";

const DEFAULT_CATEGORIES: DeadlineCategoryItem[] = [
  {
    id: "cat-1",
    name: "Assignment",
    color: "#3b82f6",
    icon: "BookOpen",
    isSystem: true,
  },
  {
    id: "cat-2",
    name: "Exam",
    color: "#ef4444",
    icon: "GraduationCap",
    isSystem: true,
  },
  {
    id: "cat-3",
    name: "Project",
    color: "#8b5cf6",
    icon: "FolderGit2",
    isSystem: true,
  },
  {
    id: "cat-4",
    name: "Bill",
    color: "#10b981",
    icon: "Receipt",
    isSystem: true,
  },
  {
    id: "cat-5",
    name: "Application",
    color: "#f59e0b",
    icon: "FileText",
    isSystem: true,
  },
];

interface DeadlineStore {
  deadlines: DeadlineItem[];
  categories: DeadlineCategoryItem[];
  activeTab: DeadlineViewTab;
  searchQuery: string;
  categoryFilter: string;
  priorityFilter: DeadlinePriority | "all";
  statusFilter: DeadlineStatus | "all";
  selectedDeadlineId: string | null;

  // Actions
  setActiveTab: (tab: DeadlineViewTab) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (cat: string) => void;
  setPriorityFilter: (pri: DeadlinePriority | "all") => void;
  setStatusFilter: (status: DeadlineStatus | "all") => void;
  setSelectedDeadlineId: (id: string | null) => void;
  setDeadlines: (items: DeadlineItem[]) => void;
  setCategories: (categories: DeadlineCategoryItem[]) => void;

  // Optimistic In-Memory Handlers
  addDeadline: (
    item: Omit<DeadlineItem, "id" | "createdAt" | "updatedAt">,
  ) => void;
  updateDeadline: (id: string, updates: Partial<DeadlineItem>) => void;
  deleteDeadline: (id: string) => void;
  toggleStatus: (id: string) => void;
  addCategory: (category: DeadlineCategoryItem) => void;
  deleteCategory: (categoryId: string) => void;
}

export const useDeadlineStore = create<DeadlineStore>((set) => ({
  deadlines: [],
  categories: DEFAULT_CATEGORIES,
  activeTab: "nearest",
  searchQuery: "",
  categoryFilter: "all",
  priorityFilter: "all",
  statusFilter: "all",
  selectedDeadlineId: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),
  setPriorityFilter: (pri) => set({ priorityFilter: pri }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSelectedDeadlineId: (id) => set({ selectedDeadlineId: id }),
  setDeadlines: (items) => set({ deadlines: items }),
  setCategories: (categories) => set({ categories }),

  addDeadline: (item) => {
    const newItem: DeadlineItem = {
      ...item,
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      deadlines: [newItem, ...state.deadlines],
    }));
  },

  updateDeadline: (id, updates) => {
    set((state) => ({
      deadlines: state.deadlines.map((d) =>
        d.id === id
          ? {
              ...d,
              ...updates,
              updatedAt: new Date().toISOString(),
              ...(updates.status === "done" && !d.completedAt
                ? { completedAt: new Date().toISOString() }
                : {}),
            }
          : d,
      ),
    }));
  },

  deleteDeadline: (id) => {
    set((state) => ({
      deadlines: state.deadlines.filter((d) => d.id !== id),
      selectedDeadlineId:
        state.selectedDeadlineId === id ? null : state.selectedDeadlineId,
    }));
  },

  toggleStatus: (id) => {
    set((state) => ({
      deadlines: state.deadlines.map((d) => {
        if (d.id !== id) return d;
        const newStatus: DeadlineStatus =
          d.status === "done" ? "in_progress" : "done";
        return {
          ...d,
          status: newStatus,
          completedAt:
            newStatus === "done" ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  deleteCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
    })),
}));
