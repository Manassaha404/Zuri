"use client";

// Visual diagram studio modal
import { useState, useEffect } from "react";
import { useNotesStore } from "@/store/notesStore";
import { useUIStore } from "@/store/uiStore";
import { useNoteAutosave } from "@/hook/notes";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import { DiagramStudioApp } from "./canvas-studio";
import { X, Layers, Save } from "lucide-react";

export function DiagramModal() {
  const { darkMode, toggleTheme } = useUIStore();
  const {
    isDiagramModalOpen,
    activeDiagramId,
    activePageId,
    pages,
    closeDiagramModal,
    diagrams,
    updateDiagram,
    createDiagram,
  } = useNotesStore();

  const { saveDiagram } = useNoteAutosave();

  const activePage = pages.find((p) => p.pageId === activePageId);
  const diagram =
    diagrams.find((d) => d.diagramId === activeDiagramId) ||
    diagrams.find((d) => d.pageId === activePageId);

  useEffect(() => {
    if (diagram && diagram.scene?.elements) {
      useDiagramStudioStore.setState({
        elements: (diagram.scene.elements as any) || [],
        docTitle: activePage?.title
          ? `${activePage.title} Diagram`
          : "Page Diagram",
      });
    } else {
      useDiagramStudioStore.setState({
        elements: [],
        docTitle: activePage?.title
          ? `${activePage.title} Diagram`
          : "Page Diagram",
      });
    }
  }, [diagram, activePage, isDiagramModalOpen]);

  if (!isDiagramModalOpen) return null;

  const handleSave = async () => {
    const studioElements = useDiagramStudioStore.getState().elements;
    const scene = {
      elements: studioElements as any,
      zoom: 1,
      panX: 0,
      panY: 0,
    };
    const title = activePage?.title
      ? `${activePage.title} Diagram`
      : "Page Diagram";

    if (diagram) {
      updateDiagram(diagram.diagramId, {
        title,
        kind: "canvas",
        scene,
      });
    } else if (activePageId) {
      createDiagram(activePageId, {
        title,
        kind: "canvas",
        scene,
      });
    }

    await saveDiagram({
      title,
      kind: "canvas",
      scene,
    });
    closeDiagramModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 animate-in fade-in-0 select-none">
      <div className="w-full max-w-[96vw] h-[92vh] rounded-2xl border border-[var(--h)] bg-[var(--bg)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header - Diagram has no separate name, directly bound to page */}
        <div className="flex items-center justify-between border-b border-[var(--h)] bg-[var(--s)]/70 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] shadow-2xs">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--i)]">
                  {activePage?.title
                    ? `${activePage.title} — Diagram`
                    : "Page Diagram"}
                </span>
                <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                  Page Canvas
                </span>
              </div>
              <p className="text-[11px] text-[var(--m)]">
                Visual diagram directly connected to this page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle
              darkMode={darkMode}
              onToggle={toggleTheme}
              size={15}
              className="w-8 h-8 rounded-lg border border-[var(--h)] bg-transparent text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
            />
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--p)] px-3.5 py-1.5 text-xs font-semibold text-[var(--pt)] hover:opacity-90 active:scale-[0.99] transition-all shadow-2xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={closeDiagramModal}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          <div className="flex-1 h-full w-full overflow-hidden min-h-0 relative">
            <DiagramStudioApp standalone={false} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-[var(--h)] bg-[var(--s)] px-6 py-3 text-xs shrink-0">
          <span className="text-[var(--m)]">
            Changes persist directly to page blocks and diagram references.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeDiagramModal}
              className="rounded-lg border border-[var(--h)] bg-[var(--bg)] px-4 py-2 text-xs font-medium text-[var(--b)] hover:bg-[var(--s)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--p)] px-4 py-2 text-xs font-semibold text-[var(--pt)] hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save & Embed Diagram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
