"use client";

// Fast quick-add shape chooser popping up on connection drag-release or '+' buttons
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import { ElementType } from "./types";
import { Square, Diamond, Circle, Database, FileText, X } from "lucide-react";

export function QuickAddPopover() {
  const {
    isQuickAddOpen,
    setQuickAdd,
    quickAddConnectedShape,
    panX,
    panY,
    zoom,
  } = useDiagramStudioStore();

  if (!isQuickAddOpen) return null;

  const { elementId, side, x, y } = isQuickAddOpen;

  // Convert canvas coordinates to screen coordinates
  const screenX = x * zoom + panX;
  const screenY = y * zoom + panY;

  const SHAPE_OPTIONS: Array<{
    type: ElementType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { type: "process", label: "Process", icon: Square },
    { type: "decision", label: "Decision", icon: Diamond },
    { type: "pill", label: "Terminal", icon: Circle },
    { type: "cylinder", label: "Database", icon: Database },
    { type: "document", label: "Document", icon: FileText },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: "translate(-50%, -50%)",
      }}
      className="z-50 w-52 rounded-2xl border border-[var(--h)] bg-[var(--bg)]/95 backdrop-blur-md p-2 shadow-2xl space-y-1 animate-in zoom-in-95 duration-150 select-none text-xs"
    >
      <div className="flex items-center justify-between border-b border-[var(--h)] pb-1 px-1">
        <span className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
          Add Connected Step
        </span>
        <button
          type="button"
          onClick={() => setQuickAdd(null)}
          className="p-0.5 rounded text-[var(--m)] hover:text-[var(--i)]"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-0.5">
        {SHAPE_OPTIONS.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() =>
                quickAddConnectedShape(elementId, side, item.type, x, y)
              }
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[var(--b)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
            >
              <IconComp className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
