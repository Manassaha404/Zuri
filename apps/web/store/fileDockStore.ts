import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FileCategoryFilter,
  FileSortBy,
  FileViewMode,
} from "@/components/file-dock/types";

interface FileDockStore {
  activeDockId: string | null;
  activeFolderId: string | null;
  searchQuery: string;
  viewMode: FileViewMode;
  filterType: FileCategoryFilter;
  sortBy: FileSortBy;

  setActiveDockId: (dockId: string | null) => void;
  setActiveFolderId: (folderId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: FileViewMode) => void;
  setFilterType: (filter: FileCategoryFilter) => void;
  setSortBy: (sort: FileSortBy) => void;
}

export const useFileDockStore = create<FileDockStore>()(
  persist(
    (set) => ({
      activeDockId: null,
      activeFolderId: null,
      searchQuery: "",
      viewMode: "grid",
      filterType: "all",
      sortBy: "newest",

      setActiveDockId: (activeDockId) =>
        set({ activeDockId, activeFolderId: null }),
      setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setViewMode: (viewMode) => set({ viewMode }),
      setFilterType: (filterType) => set({ filterType }),
      setSortBy: (sortBy) => set({ sortBy }),
    }),
    {
      name: "zuri-file-dock-prefs",
      partialize: (state) => ({
        activeDockId: state.activeDockId,
        activeFolderId: state.activeFolderId,
        viewMode: state.viewMode,
        filterType: state.filterType,
        sortBy: state.sortBy,
      }),
    },
  ),
);
