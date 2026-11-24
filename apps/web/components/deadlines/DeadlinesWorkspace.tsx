// Main Coordinator Component for Deadline Tracker Workspace
"use client";

import { useState } from "react";
import { useInitUIStore } from "@/store/uiStore";
import { useDeadlineStore } from "@/store/deadlineStore";
import { useDeadlines } from "@/hook/deadlines";
import { DeadlinesHeader } from "./DeadlinesHeader";
import { NearestListView } from "./NearestListView";
import { DueThisWeekView } from "./DueThisWeekView";
import { CalendarDeadlineView } from "./CalendarDeadlineView";
import { DeadlineStatsView } from "./DeadlineStatsView";
import { DeadlineModal } from "./DeadlineModal";
import { CategoriesModal } from "./CategoriesModal";
import type { DeadlineItem } from "./types";

export function DeadlinesWorkspace() {
  useInitUIStore();
  useDeadlines();
  const { activeTab } = useDeadlineStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeadlineItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (item: DeadlineItem) => {
    setEditingItem(item);
    setCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Workspace Header & Global Controls */}
        <DeadlinesHeader
          onOpenCreateModal={handleOpenCreate}
          onOpenManageCategories={() => setCategoriesModalOpen(true)}
        />

        {/* View 1: List sorted by nearest */}
        {activeTab === "nearest" && (
          <NearestListView
            onEdit={handleEdit}
            onOpenCreate={handleOpenCreate}
          />
        )}

        {/* View 2: Due this week horizon */}
        {activeTab === "this_week" && (
          <DueThisWeekView
            onEdit={handleEdit}
            onOpenCreate={handleOpenCreate}
          />
        )}

        {/* View 3: Calendar grid */}
        {activeTab === "calendar" && (
          <CalendarDeadlineView
            onEdit={handleEdit}
            onOpenCreate={handleOpenCreate}
          />
        )}

        {/* View 4: Analytics, On-time stats & Missed-deadline log */}
        {activeTab === "stats" && <DeadlineStatsView />}
      </div>

      {/* Deadline Create / Edit Modal */}
      <DeadlineModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        editingItem={editingItem}
      />

      {/* Categories Modal */}
      <CategoriesModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
      />
    </div>
  );
}
