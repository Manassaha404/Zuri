// Main Fitness Tracker Workspace coordinator component
"use client";

import { useState } from "react";
import { useInitUIStore } from "@/store/uiStore";
import { useFitnessStore } from "@/store/fitnessStore";
import { FitnessHeader } from "./FitnessHeader";
import { WorkoutLoggerView } from "./WorkoutLoggerView";
import { ExerciseLibraryView } from "./ExerciseLibraryView";
import { NutritionView } from "./NutritionView";
import { BodyAndRecoveryView } from "./BodyAndRecoveryView";
import { InsightsAndHistoryView } from "./InsightsAndHistoryView";
import { PlateAnd1RMModal } from "./PlateAnd1RMModal";

export function FitnessWorkspace() {
  useInitUIStore();
  const { activeTab } = useFitnessStore();
  const [calcModalOpen, setCalcModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <FitnessHeader onOpenCalculators={() => setCalcModalOpen(true)} />

        {activeTab === "workout" && <WorkoutLoggerView />}
        {activeTab === "library" && <ExerciseLibraryView />}
        {activeTab === "nutrition" && <NutritionView />}
        {activeTab === "body" && <BodyAndRecoveryView />}
        {activeTab === "insights" && <InsightsAndHistoryView />}
      </div>

      <PlateAnd1RMModal
        open={calcModalOpen}
        onClose={() => setCalcModalOpen(false)}
      />
    </div>
  );
}
