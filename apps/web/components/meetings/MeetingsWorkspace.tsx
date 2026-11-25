// Main Coordinator Component for Meetings Tracker Workspace
"use client";

import { useState } from "react";
import { useInitUIStore } from "@/store/uiStore";
import { useMeetingStore } from "@/store/meetingStore";
import { MeetingsHeader } from "./MeetingsHeader";
import { MeetingsListView } from "./MeetingsListView";
import { MeetingCalendarView } from "./MeetingCalendarView";
import { MeetingModal } from "./MeetingModal";
import { MeetingDetailsModal } from "./MeetingDetailsModal";
import type { MeetingItem } from "./types";

export function MeetingsWorkspace() {
  useInitUIStore();
  const { activeTab } = useMeetingStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingItem | null>(
    null,
  );
  const [detailsMeeting, setDetailsMeeting] = useState<MeetingItem | null>(
    null,
  );

  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (item: MeetingItem) => {
    setEditingMeeting(item);
    setCreateModalOpen(true);
  };

  const handleViewDetails = (item: MeetingItem) => {
    setDetailsMeeting(item);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full min-w-0">
        {/* Workspace Header & Global Controls */}
        <MeetingsHeader onOpenCreateModal={handleOpenCreate} />

        {/* View 1: Upcoming Meetings */}
        {activeTab === "upcoming" && (
          <MeetingsListView
            viewMode="upcoming"
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onOpenCreate={handleOpenCreate}
          />
        )}

        {/* View 2: Past Meetings */}
        {activeTab === "past" && (
          <MeetingsListView
            viewMode="past"
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onOpenCreate={handleOpenCreate}
          />
        )}

        {/* View 3: Calendar Grid View */}
        {activeTab === "calendar" && (
          <MeetingCalendarView
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onOpenCreate={handleOpenCreate}
          />
        )}
      </div>

      {/* Create / Edit Meeting Modal */}
      <MeetingModal
        isOpen={createModalOpen}
        initialMeeting={editingMeeting}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingMeeting(null);
        }}
      />

      {/* Meeting Details Modal / Drawer */}
      <MeetingDetailsModal
        isOpen={Boolean(detailsMeeting)}
        meeting={detailsMeeting}
        onClose={() => setDetailsMeeting(null)}
        onEdit={(meeting) => {
          setDetailsMeeting(null);
          handleEdit(meeting);
        }}
      />
    </div>
  );
}
