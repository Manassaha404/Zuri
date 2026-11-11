"use client";

// Eraser-like visual diagram canvas with resizable spaces, freeform text, and magnetic arrow lines
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  CanvasSceneElement,
  CanvasElementType,
  AnchorPosition,
} from "../types";
import {
  MousePointer2,
  Square,
  Server,
  Database,
  Cloud,
  Type,
  ArrowRight,
  Minus,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Workflow,
  Sparkles,
  Move,
  CornerDownRight,
} from "lucide-react";

interface EraserCanvasProps {
  elements: CanvasSceneElement[];
  onChange: (elements: CanvasSceneElement[]) => void;
}

type ActiveTool =
  | "select"
  | "rectangle"
  | "server"
  | "database"
  | "cloud"
  | "text"
  | "arrow"
  | "line";

interface AnchorPoint {
  nodeId: string;
  nodeTitle: string;
  position: AnchorPosition;
  x: number;
  y: number;
}

const COLOR_PRESETS = [
  { name: "Blue", fill: "#3b82f6", stroke: "#2563eb" },
  { name: "Emerald", fill: "#10b981", stroke: "#059669" },
  { name: "Violet", fill: "#8b5cf6", stroke: "#7c3aed" },
  { name: "Amber", fill: "#f59e0b", stroke: "#d97706" },
  { name: "Rose", fill: "#ec4899", stroke: "#db2777" },
  { name: "Zinc", fill: "#71717a", stroke: "#52525b" },
];

export function EraserCanvas({ elements, onChange }: EraserCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Interaction dragging states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing state
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Line drawing state
  const [drawingLine, setDrawingLine] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    fromNodeId?: string | null;
    fromAnchor?: AnchorPosition | null;
    isArrow: boolean;
  } | null>(null);

  // Magnetic snap preview
  const [hoveredAnchor, setHoveredAnchor] = useState<AnchorPoint | null>(null);

  // Compute all magnetic anchors for current elements
  const allAnchors = useMemo(() => {
    const list: AnchorPoint[] = [];
    elements.forEach((el) => {
      if (el.type === "arrow" || el.type === "line" || el.type === "text")
        return;
      const midX = el.x + el.width / 2;
      const midY = el.y + el.height / 2;

      list.push(
        {
          nodeId: el.id,
          nodeTitle: el.label,
          position: "top",
          x: midX,
          y: el.y,
        },
        {
          nodeId: el.id,
          nodeTitle: el.label,
          position: "bottom",
          x: midX,
          y: el.y + el.height,
        },
        {
          nodeId: el.id,
          nodeTitle: el.label,
          position: "left",
          x: el.x,
          y: midY,
        },
        {
          nodeId: el.id,
          nodeTitle: el.label,
          position: "right",
          x: el.x + el.width,
          y: midY,
        },
      );
    });
    return list;
  }, [elements]);

  // Find magnetic anchor near coordinates (radius: 28px)
  const findNearbyAnchor = useCallback(
    (x: number, y: number, excludeNodeId?: string | null) => {
      const SNAP_RADIUS = 28;
      for (const anchor of allAnchors) {
        if (excludeNodeId && anchor.nodeId === excludeNodeId) continue;
        const dist = Math.hypot(anchor.x - x, anchor.y - y);
        if (dist <= SNAP_RADIUS) {
          return anchor;
        }
      }
      return null;
    },
    [allAnchors],
  );

  // Calculate coordinates for a node's anchor
  const getNodeAnchorCoords = useCallback(
    (nodeId: string, position?: AnchorPosition | null) => {
      const node = elements.find((el) => el.id === nodeId);
      if (!node) return null;
      const pos = position || "right";
      const midX = node.x + node.width / 2;
      const midY = node.y + node.height / 2;

      switch (pos) {
        case "top":
          return { x: midX, y: node.y };
        case "bottom":
          return { x: midX, y: node.y + node.height };
        case "left":
          return { x: node.x, y: midY };
        case "right":
          return { x: node.x + node.width, y: midY };
        default:
          return { x: midX, y: midY };
      }
    },
    [elements],
  );

  // Convert client mouse coordinates to canvas coordinates (accounting for zoom & container offset)
  const getCanvasCoords = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    return {
      x: (e.clientX - rect.left + scrollLeft) / zoom,
      y: (e.clientY - rect.top + scrollTop) / zoom,
    };
  };

  // Canvas Mouse Move (handles dragging nodes, resizing nodes, and line drawing with magnetic snap)
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    // 1. Line drawing with magnetic snap suggestion
    if (drawingLine) {
      const nearby = findNearbyAnchor(
        coords.x,
        coords.y,
        drawingLine.fromNodeId,
      );
      setHoveredAnchor(nearby);

      setDrawingLine((prev) =>
        prev
          ? {
              ...prev,
              currentX: nearby ? nearby.x : coords.x,
              currentY: nearby ? nearby.y : coords.y,
            }
          : null,
      );
      return;
    }

    // 2. Resizing element
    if (resizingId) {
      const deltaX = coords.x - resizeStart.x;
      const deltaY = coords.y - resizeStart.y;
      const newWidth = Math.max(120, resizeStart.width + deltaX);
      const newHeight = Math.max(60, resizeStart.height + deltaY);

      onChange(
        elements.map((el) =>
          el.id === resizingId
            ? { ...el, width: newWidth, height: newHeight }
            : el,
        ),
      );
      return;
    }

    // 3. Dragging element
    if (draggingNodeId) {
      const newX = Math.round((coords.x - dragOffset.x) / 10) * 10;
      const newY = Math.round((coords.y - dragOffset.y) / 10) * 10;

      onChange(
        elements.map((el) =>
          el.id === draggingNodeId ? { ...el, x: newX, y: newY } : el,
        ),
      );
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    if (drawingLine) {
      // If user drew a line with min distance or snapped to anchor
      const dist = Math.hypot(
        drawingLine.currentX - drawingLine.startX,
        drawingLine.currentY - drawingLine.startY,
      );

      if (dist > 15 || hoveredAnchor) {
        const newLine: CanvasSceneElement = {
          id: `line-${Date.now()}`,
          type: drawingLine.isArrow ? "arrow" : "line",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          label: drawingLine.isArrow ? "Connection" : "",
          stroke: drawingLine.isArrow ? "#3b82f6" : "#6b7280",
          hasArrowEnd: drawingLine.isArrow,
          fromNodeId: drawingLine.fromNodeId || null,
          fromAnchor: drawingLine.fromAnchor || null,
          toNodeId: hoveredAnchor?.nodeId || null,
          toAnchor: hoveredAnchor?.position || null,
          startX: drawingLine.startX,
          startY: drawingLine.startY,
          endX: hoveredAnchor ? hoveredAnchor.x : drawingLine.currentX,
          endY: hoveredAnchor ? hoveredAnchor.y : drawingLine.currentY,
        };

        onChange([...elements, newLine]);
        setSelectedId(newLine.id);
      }

      setDrawingLine(null);
      setHoveredAnchor(null);
      setActiveTool("select");
    }

    setDraggingNodeId(null);
    setResizingId(null);
  };

  // Canvas Click (create new elements or deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only handle if clicking background
    if (
      e.target !== containerRef.current &&
      (e.target as HTMLElement).tagName !== "svg"
    ) {
      return;
    }

    const coords = getCanvasCoords(e);
    const snapX = Math.round(coords.x / 20) * 20;
    const snapY = Math.round(coords.y / 20) * 20;

    if (activeTool === "rectangle") {
      const newEl: CanvasSceneElement = {
        id: `el-${Date.now()}`,
        type: "rectangle",
        x: snapX,
        y: snapY,
        width: 200,
        height: 100,
        label: "Workspace Space",
        description: "Group Container",
        fill: "#3b82f6",
        stroke: "#2563eb",
      };
      onChange([...elements, newEl]);
      setSelectedId(newEl.id);
      setActiveTool("select");
    } else if (activeTool === "server") {
      const newEl: CanvasSceneElement = {
        id: `el-${Date.now()}`,
        type: "server",
        x: snapX,
        y: snapY,
        width: 170,
        height: 75,
        label: "API Server",
        description: "Node.js Service",
        fill: "#3b82f6",
        stroke: "#2563eb",
      };
      onChange([...elements, newEl]);
      setSelectedId(newEl.id);
      setActiveTool("select");
    } else if (activeTool === "database") {
      const newEl: CanvasSceneElement = {
        id: `el-${Date.now()}`,
        type: "database",
        x: snapX,
        y: snapY,
        width: 170,
        height: 75,
        label: "PostgreSQL Database",
        description: "Primary Data Store",
        fill: "#10b981",
        stroke: "#059669",
      };
      onChange([...elements, newEl]);
      setSelectedId(newEl.id);
      setActiveTool("select");
    } else if (activeTool === "cloud") {
      const newEl: CanvasSceneElement = {
        id: `el-${Date.now()}`,
        type: "cloud",
        x: snapX,
        y: snapY,
        width: 240,
        height: 140,
        label: "Virtual Private Cloud (VPC)",
        description: "Isolated Subnet",
        fill: "#8b5cf6",
        stroke: "#7c3aed",
      };
      onChange([...elements, newEl]);
      setSelectedId(newEl.id);
      setActiveTool("select");
    } else if (activeTool === "text") {
      const newEl: CanvasSceneElement = {
        id: `el-${Date.now()}`,
        type: "text",
        x: snapX,
        y: snapY,
        width: 160,
        height: 35,
        label: "Double-click to edit text",
        fontSize: 14,
        stroke: "var(--i)",
      };
      onChange([...elements, newEl]);
      setSelectedId(newEl.id);
      setEditingId(newEl.id);
      setActiveTool("select");
    } else {
      setSelectedId(null);
      setEditingId(null);
    }
  };

  // Double click anywhere to instantly add text annotation
  const handleDoubleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const newEl: CanvasSceneElement = {
      id: `el-${Date.now()}`,
      type: "text",
      x: coords.x,
      y: coords.y,
      width: 180,
      height: 35,
      label: "Text Annotation",
      fontSize: 14,
      stroke: "var(--i)",
    };
    onChange([...elements, newEl]);
    setSelectedId(newEl.id);
    setEditingId(newEl.id);
  };

  // Start dragging a node
  const handleNodeMouseDown = (e: React.MouseEvent, el: CanvasSceneElement) => {
    if (activeTool === "arrow" || activeTool === "line") {
      return; // Handled by anchor clicking
    }
    e.stopPropagation();
    setSelectedId(el.id);
    setEditingId(null);

    const coords = getCanvasCoords(e);
    setDraggingNodeId(el.id);
    setDragOffset({
      x: coords.x - el.x,
      y: coords.y - el.y,
    });
  };

  // Start resizing a node from bottom-right handle
  const handleResizeStart = (e: React.MouseEvent, el: CanvasSceneElement) => {
    e.stopPropagation();
    const coords = getCanvasCoords(e);
    setResizingId(el.id);
    setResizeStart({
      x: coords.x,
      y: coords.y,
      width: el.width,
      height: el.height,
    });
  };

  // Start drawing a line from an anchor
  const handleAnchorMouseDown = (
    e: React.MouseEvent,
    anchor: AnchorPoint,
    isArrow: boolean,
  ) => {
    e.stopPropagation();
    setDrawingLine({
      startX: anchor.x,
      startY: anchor.y,
      currentX: anchor.x,
      currentY: anchor.y,
      fromNodeId: anchor.nodeId,
      fromAnchor: anchor.position,
      isArrow,
    });
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    onChange(
      elements.filter(
        (el) =>
          el.id !== selectedId &&
          el.fromNodeId !== selectedId &&
          el.toNodeId !== selectedId,
      ),
    );
    setSelectedId(null);
    setEditingId(null);
  };

  // Duplicate selected element
  const handleDuplicateSelected = () => {
    if (!selectedId) return;
    const item = elements.find((el) => el.id === selectedId);
    if (!item) return;

    const dup: CanvasSceneElement = {
      ...item,
      id: `el-${Date.now()}`,
      x: item.x + 30,
      y: item.y + 30,
      fromNodeId: null,
      toNodeId: null,
    };
    onChange([...elements, dup]);
    setSelectedId(dup.id);
  };

  // Apply color to selected element
  const handleApplyColor = (fill: string, stroke: string) => {
    if (!selectedId) return;
    onChange(
      elements.map((el) =>
        el.id === selectedId ? { ...el, fill, stroke } : el,
      ),
    );
  };

  const selectedItem = elements.find((el) => el.id === selectedId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg)] select-none overflow-hidden relative">
      {/* Top Eraser Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--h)] bg-[var(--s)]/70 px-4 py-2 z-20 gap-2">
        {/* Tool Selector Buttons */}
        <div className="flex items-center rounded-xl border border-[var(--h)] bg-[var(--bg)] p-1 gap-1 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTool("select")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "select"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Select & Move (V)"
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("rectangle")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "rectangle"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Add Resizable Space / Group"
          >
            <Square className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Space</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("server")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "server"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Add Server Node"
          >
            <Server className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Server</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("database")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "database"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Add Database Node"
          >
            <Database className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Database</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("cloud")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "cloud"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Add Cloud VPC"
          >
            <Cloud className="h-3.5 w-3.5 text-violet-500" />
            <span className="hidden sm:inline">Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("text")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "text"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Add Freeform Text (T)"
          >
            <Type className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Text</span>
          </button>

          <div className="h-4 w-px bg-[var(--h)] my-auto mx-0.5" />

          {/* Lines & Arrow Lines */}
          <button
            type="button"
            onClick={() => setActiveTool("arrow")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "arrow"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Draw Arrow Line with Magnetic Snapping"
          >
            <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Arrow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("line")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeTool === "line"
                ? "bg-[var(--p)] text-[var(--pt)] font-medium"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
            title="Draw Normal Straight Line"
          >
            <Minus className="h-3.5 w-3.5 text-[var(--m)]" />
            <span className="hidden sm:inline">Line</span>
          </button>
        </div>

        {/* Selected Element Styling & Actions */}
        {selectedItem && (
          <div className="flex items-center gap-2 animate-in fade-in-0">
            {/* Color presets */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-2 py-1 shadow-2xs">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleApplyColor(c.fill, c.stroke)}
                  className="h-4 w-4 rounded-full border hover:scale-115 transition-transform"
                  style={{ backgroundColor: c.fill, borderColor: c.stroke }}
                  title={c.name}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--m)] hover:text-[var(--i)] shadow-2xs"
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] text-red-500 hover:bg-red-500/10 shadow-2xs"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--m)] shadow-2xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-1 hover:text-[var(--i)]"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center font-mono text-[11px] text-[var(--i)] font-semibold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="p-1 hover:text-[var(--i)]"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="ml-1 text-[10px] hover:text-[var(--i)] font-mono"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Helper Notification Banner */}
      <div className="bg-[var(--s)]/50 border-b border-[var(--h)] px-4 py-1 text-[11px] text-[var(--m)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-emerald-500" />
          <span>
            <strong>Eraser Mode:</strong> Double-click anywhere to add text.
            Drag corner handle to resize spaces. Drag arrows near node anchors
            for <strong>magnetic snap</strong>.
          </span>
        </div>
        {hoveredAnchor && (
          <span className="rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold animate-pulse">
            🧲 Magnetic Snap: {hoveredAnchor.nodeTitle} (
            {hoveredAnchor.position})
          </span>
        )}
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 relative overflow-auto styled-scrollbar cursor-crosshair bg-[radial-gradient(circle_at_1px_1px,var(--h)_1px,transparent_0)] bg-[size:24px_24px]"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
          width: "2500px",
          height: "2000px",
        }}
      >
        {/* SVG Layer for Lines & Arrows */}
        <svg
          className="absolute inset-0 pointer-events-none w-full h-full"
          style={{ width: "2500px", height: "2000px" }}
        >
          <defs>
            {/* Arrowhead marker definition */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
            </marker>
            <marker
              id="arrowhead-violet"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#8b5cf6" />
            </marker>
            <marker
              id="arrowhead-emerald"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
            </marker>
            <marker
              id="arrowhead-amber"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Render Persistent Lines and Arrows */}
          {elements
            .filter((el) => el.type === "arrow" || el.type === "line")
            .map((line) => {
              // Dynamic coordinates following magnetic anchors
              let start = { x: line.startX || 0, y: line.startY || 0 };
              let end = { x: line.endX || 0, y: line.endY || 0 };

              if (line.fromNodeId) {
                const calculated = getNodeAnchorCoords(
                  line.fromNodeId,
                  line.fromAnchor,
                );
                if (calculated) start = calculated;
              }

              if (line.toNodeId) {
                const calculated = getNodeAnchorCoords(
                  line.toNodeId,
                  line.toAnchor,
                );
                if (calculated) end = calculated;
              }

              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;
              const isSelected = selectedId === line.id;

              return (
                <g
                  key={line.id}
                  className="pointer-events-auto cursor-pointer group/line"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(line.id);
                  }}
                >
                  {/* Thick invisible stroke for easier clicking */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="transparent"
                    strokeWidth={14}
                  />

                  {/* Visible line */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={line.stroke || "#3b82f6"}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeDasharray={line.hasArrowEnd ? undefined : "5 5"}
                    markerEnd={
                      line.hasArrowEnd
                        ? line.stroke === "#8b5cf6"
                          ? "url(#arrowhead-violet)"
                          : line.stroke === "#10b981"
                            ? "url(#arrowhead-emerald)"
                            : line.stroke === "#f59e0b"
                              ? "url(#arrowhead-amber)"
                              : "url(#arrowhead)"
                        : undefined
                    }
                  />

                  {/* Line middle label */}
                  {line.label && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x={-(line.label.length * 3.5 + 10)}
                        y={-11}
                        width={line.label.length * 7 + 20}
                        height={22}
                        rx={6}
                        fill="var(--bg)"
                        stroke={line.stroke || "var(--h)"}
                        strokeWidth={1}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={600}
                        fill="var(--i)"
                        fontFamily="monospace"
                      >
                        {line.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* Active drawing line preview */}
          {drawingLine && (
            <line
              x1={drawingLine.startX}
              y1={drawingLine.startY}
              x2={drawingLine.currentX}
              y2={drawingLine.currentY}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 4"
              markerEnd={drawingLine.isArrow ? "url(#arrowhead)" : undefined}
            />
          )}

          {/* Pulsing magnetic snap target circle */}
          {hoveredAnchor && (
            <g transform={`translate(${hoveredAnchor.x}, ${hoveredAnchor.y})`}>
              <circle
                r={12}
                fill="#10b981"
                opacity={0.2}
                className="animate-ping"
              />
              <circle r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
            </g>
          )}
        </svg>

        {/* Render HTML Space/Node Elements */}
        {elements
          .filter((el) => el.type !== "arrow" && el.type !== "line")
          .map((el) => {
            const isSelected = selectedId === el.id;
            const isEditing = editingId === el.id;

            // FREEFORM TEXT ELEMENT
            if (el.type === "text") {
              return (
                <div
                  key={el.id}
                  style={{
                    position: "absolute",
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, el)}
                  className={`group/text cursor-move p-1 rounded-md transition-all ${
                    isSelected
                      ? "ring-2 ring-[var(--i)] bg-[var(--s)]/60"
                      : "hover:bg-[var(--s)]/40"
                  }`}
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      defaultValue={el.label}
                      onBlur={(e) => {
                        onChange(
                          elements.map((item) =>
                            item.id === el.id
                              ? { ...item, label: e.target.value }
                              : item,
                          ),
                        );
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onChange(
                            elements.map((item) =>
                              item.id === el.id
                                ? {
                                    ...item,
                                    label: (e.target as HTMLInputElement).value,
                                  }
                                : item,
                            ),
                          );
                          setEditingId(null);
                        }
                      }}
                      className="w-full bg-transparent outline-none font-semibold text-[var(--i)] text-sm"
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingId(el.id);
                      }}
                      className="font-semibold text-[var(--i)] text-sm leading-tight select-text"
                      style={{
                        fontSize: el.fontSize ? `${el.fontSize}px` : "14px",
                      }}
                    >
                      {el.label || "Text annotation"}
                    </div>
                  )}
                </div>
              );
            }

            // CARDS / SPACES (RESIZABLE & DRAGGABLE)
            const isServer = el.type === "server";
            const isDb = el.type === "database";
            const isCloud = el.type === "cloud";

            const IconComp = isDb
              ? Database
              : isServer
                ? Server
                : isCloud
                  ? Cloud
                  : Square;

            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  backgroundColor: el.fill ? `${el.fill}12` : "var(--bg)",
                  borderColor: isSelected
                    ? "var(--i)"
                    : el.stroke || "var(--h)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, el)}
                className={`group/node rounded-2xl border-2 p-3.5 shadow-sm transition-shadow flex flex-col justify-between cursor-move select-none ${
                  isSelected
                    ? "ring-3 ring-[var(--i)]/20 shadow-md"
                    : "hover:shadow-md"
                }`}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg border shrink-0"
                      style={{
                        backgroundColor: el.fill ? `${el.fill}25` : "var(--bg)",
                        borderColor: el.stroke,
                      }}
                    >
                      <IconComp
                        className="h-4 w-4"
                        style={{ color: el.stroke }}
                      />
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--m)] truncate">
                      {el.type}
                    </span>
                  </div>

                  {/* Magnetic drag anchor quick start icons on hover */}
                  <div className="opacity-0 group-hover/node:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onMouseDown={(e) =>
                        handleAnchorMouseDown(
                          e,
                          {
                            nodeId: el.id,
                            nodeTitle: el.label,
                            position: "right",
                            x: el.x + el.width,
                            y: el.y + el.height / 2,
                          },
                          true,
                        )
                      }
                      className="p-1 rounded bg-[var(--bg)] border border-[var(--h)] text-[var(--m)] hover:text-blue-500 shadow-2xs"
                      title="Drag arrow from this node"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Node Title & Description */}
                <div className="my-auto py-1">
                  {isEditing ? (
                    <input
                      autoFocus
                      defaultValue={el.label}
                      onBlur={(e) => {
                        onChange(
                          elements.map((item) =>
                            item.id === el.id
                              ? { ...item, label: e.target.value }
                              : item,
                          ),
                        );
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onChange(
                            elements.map((item) =>
                              item.id === el.id
                                ? {
                                    ...item,
                                    label: (e.target as HTMLInputElement).value,
                                  }
                                : item,
                            ),
                          );
                          setEditingId(null);
                        }
                      }}
                      className="w-full font-bold text-xs text-[var(--i)] bg-transparent outline-none border-b border-[var(--i)]"
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingId(el.id);
                      }}
                      className="font-bold text-xs text-[var(--i)] truncate cursor-text"
                      title="Double-click to edit label"
                    >
                      {el.label}
                    </div>
                  )}

                  {el.description && (
                    <div className="text-[10px] text-[var(--m)] line-clamp-1 mt-0.5">
                      {el.description}
                    </div>
                  )}
                </div>

                {/* Footer space indicator */}
                <div className="flex items-center justify-between text-[9px] font-mono text-[var(--m)] pt-1 border-t border-[var(--h)]/40">
                  <span>
                    {Math.round(el.width)}×{Math.round(el.height)}
                  </span>
                  <span>Eraser Space</span>
                </div>

                {/* Magnetic Snap Anchors Visual Dots (Top, Bottom, Left, Right) */}
                <div
                  onMouseDown={(e) =>
                    handleAnchorMouseDown(
                      e,
                      {
                        nodeId: el.id,
                        nodeTitle: el.label,
                        position: "top",
                        x: el.x + el.width / 2,
                        y: el.y,
                      },
                      true,
                    )
                  }
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[var(--bg)] border-2 border-[var(--m)] opacity-0 group-hover/node:opacity-100 hover:scale-130 hover:border-emerald-500 hover:bg-emerald-500 transition-all cursor-crosshair z-10"
                  title="Connect from Top (Drag to snap)"
                />
                <div
                  onMouseDown={(e) =>
                    handleAnchorMouseDown(
                      e,
                      {
                        nodeId: el.id,
                        nodeTitle: el.label,
                        position: "bottom",
                        x: el.x + el.width / 2,
                        y: el.y + el.height,
                      },
                      true,
                    )
                  }
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[var(--bg)] border-2 border-[var(--m)] opacity-0 group-hover/node:opacity-100 hover:scale-130 hover:border-emerald-500 hover:bg-emerald-500 transition-all cursor-crosshair z-10"
                  title="Connect from Bottom (Drag to snap)"
                />
                <div
                  onMouseDown={(e) =>
                    handleAnchorMouseDown(
                      e,
                      {
                        nodeId: el.id,
                        nodeTitle: el.label,
                        position: "left",
                        x: el.x,
                        y: el.y + el.height / 2,
                      },
                      true,
                    )
                  }
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[var(--bg)] border-2 border-[var(--m)] opacity-0 group-hover/node:opacity-100 hover:scale-130 hover:border-emerald-500 hover:bg-emerald-500 transition-all cursor-crosshair z-10"
                  title="Connect from Left (Drag to snap)"
                />
                <div
                  onMouseDown={(e) =>
                    handleAnchorMouseDown(
                      e,
                      {
                        nodeId: el.id,
                        nodeTitle: el.label,
                        position: "right",
                        x: el.x + el.width,
                        y: el.y + el.height / 2,
                      },
                      true,
                    )
                  }
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[var(--bg)] border-2 border-[var(--m)] opacity-0 group-hover/node:opacity-100 hover:scale-130 hover:border-emerald-500 hover:bg-emerald-500 transition-all cursor-crosshair z-10"
                  title="Connect from Right (Drag to snap)"
                />

                {/* RESIZE HANDLE (Bottom-Right Corner) */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => handleResizeStart(e, el)}
                    className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-[var(--i)] text-[var(--pt)] flex items-center justify-center cursor-se-resize shadow-md hover:scale-125 transition-transform z-20"
                    title="Drag to resize space"
                  >
                    <CornerDownRight className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
