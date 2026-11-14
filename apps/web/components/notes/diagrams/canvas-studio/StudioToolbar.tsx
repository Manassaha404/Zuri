"use client";

// Comprehensive floating/top toolbar for visual diagram studio
import { useState } from "react";
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import { CanvasTool, ElementType } from "./types";
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Diamond,
  Database,
  FileText,
  FileCode,
  StickyNote,
  PenTool,
  Eraser,
  Image as ImageIcon,
  Smile,
  ArrowRight,
  Minus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  ChevronDown,
  Plus,
} from "lucide-react";

interface StudioToolbarProps {
  onOpenIcons: () => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

export function StudioToolbar({
  onOpenIcons,
  viewportRef,
}: StudioToolbarProps) {
  const {
    activeTool,
    setActiveTool,
    selectedShapeType,
    setSelectedShapeType,
    undo,
    redo,
    undoStack,
    redoStack,
    zoom,
    setZoom,
    zoomToFit,
    resetZoom,
    showGrid,
    toggleGrid,
    newDiagram,
    docTitle,
    setDocTitle,
  } = useDiagramStudioStore();

  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const SHAPE_CATEGORIES = [
    {
      name: "Basic Shapes",
      shapes: [
        { type: "process", label: "Rectangle", icon: Square },
        { type: "rounded_rect", label: "Rounded Rect", icon: Square },
        { type: "circle", label: "Circle", icon: Circle },
        { type: "line", label: "Straight Line", icon: Minus },
        { type: "decision", label: "Diamond", icon: Diamond },
        { type: "pill", label: "Pill / Terminal", icon: Circle },
        { type: "triangle", label: "Triangle", icon: Square },
        { type: "cylinder", label: "Database", icon: Database },
        { type: "document", label: "Document", icon: FileText },
        { type: "io", label: "Parallelogram", icon: Square },
      ],
    },
  ];

  const handleSelectShape = (shapeType: ElementType) => {
    if (shapeType === "line") {
      setActiveTool("line");
      setIsShapeMenuOpen(false);
      return;
    }
    setSelectedShapeType(shapeType);
    setActiveTool("shape");
    setIsShapeMenuOpen(false);
  };

  return (
    <div className="absolute top-3 inset-x-4 z-40 flex items-center justify-between pointer-events-none gap-2 select-none">
      {/* Left: Document Title */}
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--h)] bg-[var(--bg)]/95 backdrop-blur-md px-3 py-1.5 shadow-md pointer-events-auto">
        {/* Title editing */}
        {isEditingTitle ? (
          <input
            autoFocus
            defaultValue={docTitle}
            onBlur={(e) => {
              setDocTitle(e.target.value.trim() || "Untitled Diagram");
              setIsEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setDocTitle(
                  (e.target as HTMLInputElement).value.trim() ||
                    "Untitled Diagram",
                );
                setIsEditingTitle(false);
              }
            }}
            className="rounded-lg border border-[var(--i)] bg-transparent px-2 py-1 text-xs font-bold text-[var(--i)] outline-none max-w-[180px]"
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="cursor-pointer px-2 py-1 text-xs font-bold text-[var(--i)] hover:bg-[var(--s)] rounded-lg transition-colors truncate max-w-[180px]"
            title="Click to rename"
          >
            {docTitle}
          </h2>
        )}

        <button
          type="button"
          onClick={newDiagram}
          className="rounded-lg p-1 text-[var(--m)] hover:bg-[var(--s)] hover:text-[var(--i)] transition-colors"
          title="New Blank Diagram"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Center: Primary Tools Rail */}
      <div className="flex items-center rounded-2xl border border-[var(--h)] bg-[var(--bg)]/95 backdrop-blur-md p-1.5 shadow-lg pointer-events-auto gap-0.5 text-xs">
        {/* Select Tool (V) */}
        <button
          type="button"
          onClick={() => setActiveTool("select")}
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            activeTool === "select"
              ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
              : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          }`}
          title="Select / Move Tool (V)"
        >
          <MousePointer2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Select</span>
        </button>

        {/* Hand Pan Tool (H) */}
        <button
          type="button"
          onClick={() => setActiveTool("hand")}
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            activeTool === "hand"
              ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
              : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          }`}
          title="Pan Hand Tool (H / Space+Drag)"
        >
          <Hand className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Hand</span>
        </button>

        <div className="h-4 w-px bg-[var(--h)] my-auto mx-1" />

        {/* Shapes Menu Dropdown (S) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
            className={`flex h-8 items-center gap-1 rounded-xl px-2.5 transition-colors ${
              activeTool === "shape"
                ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
            }`}
            title="Shapes & Flowchart Nodes (S)"
          >
            <Square className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Shapes</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {isShapeMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsShapeMenuOpen(false)}
              />
              <div className="absolute left-0 top-10 z-50 w-72 max-h-[75vh] overflow-y-auto styled-scrollbar rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-3 shadow-2xl space-y-3 animate-in fade-in-0">
                {SHAPE_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider px-1">
                      {cat.name}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {cat.shapes.map((item) => {
                        const IconComponent = item.icon;
                        const isCurrent = selectedShapeType === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() =>
                              handleSelectShape(item.type as ElementType)
                            }
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                              isCurrent
                                ? "bg-[var(--s)] text-[var(--i)] font-semibold border border-[var(--h)]"
                                : "text-[var(--b)] hover:bg-[var(--s)]"
                            }`}
                          >
                            <IconComponent className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Straight Line (L) */}
        <button
          type="button"
          onClick={() => setActiveTool("line")}
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            activeTool === "line"
              ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
              : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          }`}
          title="Straight Line (L) — Hold Shift for geometrically straight"
        >
          <Minus className="h-3.5 w-3.5 rotate-[-45deg]" />
          <span className="hidden md:inline">Line</span>
        </button>

        {/* Connectors (C) */}
        <button
          type="button"
          onClick={() => setActiveTool("connector")}
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            activeTool === "connector"
              ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
              : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          }`}
          title="Draw Connectors (C)"
        >
          <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
          <span className="hidden md:inline">Connect</span>
        </button>

        {/* Free Text (T) */}
        <button
          type="button"
          onClick={() => setActiveTool("text")}
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            activeTool === "text"
              ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
              : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          }`}
          title="Text Box (T)"
        >
          <span className="font-serif font-bold text-sm">T</span>
          <span className="hidden md:inline">Text</span>
        </button>

        {/* Sticky Note (N) */}
        <button
          type="button"
          onClick={() => setActiveTool("sticky")}
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            activeTool === "sticky"
              ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
              : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          }`}
          title="Sticky Note (N)"
        >
          <StickyNote className="h-3.5 w-3.5 text-yellow-500" />
          <span className="hidden md:inline">Sticky</span>
        </button>

        {/* Freehand Pen (P) */}
        <button
          type="button"
          onClick={() => setActiveTool("pen")}
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
            activeTool === "pen"
              ? "bg-[var(--p)] text-[var(--pt)] font-semibold shadow-2xs"
              : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
          }`}
          title="Freehand Pen (P)"
        >
          <PenTool className="h-3.5 w-3.5 text-emerald-500" />
          <span className="hidden md:inline">Pen</span>
        </button>

        {/* Icon Library */}
        <button
          type="button"
          onClick={onOpenIcons}
          className="flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
          title="Icon Library"
        >
          <Smile className="h-3.5 w-3.5 text-violet-500" />
          <span className="hidden md:inline">Icons</span>
        </button>
      </div>

      {/* Right: History Undo / Redo & Zoom Controls */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--h)] bg-[var(--bg)]/95 backdrop-blur-md p-1.5 shadow-md pointer-events-auto text-xs">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={undo}
          disabled={undoStack.length === 0}
          className="flex h-7 items-center gap-1 px-2 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] disabled:opacity-40 transition-colors"
          title="Undo (Ctrl/Cmd+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">Undo</span>
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={redoStack.length === 0}
          className="flex h-7 items-center gap-1 px-2 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] disabled:opacity-40 transition-colors"
          title="Redo (Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">Redo</span>
        </button>

        <div className="h-4 w-px bg-[var(--h)] my-auto" />

        {/* Grid Toggle */}
        <button
          type="button"
          onClick={toggleGrid}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            showGrid
              ? "text-[var(--i)] bg-[var(--s)]"
              : "text-[var(--m)] hover:text-[var(--i)]"
          }`}
          title="Toggle Grid (G)"
        >
          <Grid className="h-3.5 w-3.5" />
        </button>

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="w-12 text-center font-mono text-[11px] font-bold text-[var(--i)] hover:underline"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(8.0, z + 0.1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const el = viewportRef.current;
              if (el) zoomToFit(el.clientWidth, el.clientHeight);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
            title="Zoom to Fit All"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
