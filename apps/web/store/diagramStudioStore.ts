// Zustand store managing state for the Eraser-grade hand-crafted diagram canvas
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DiagramElement,
  CanvasTool,
  ElementType,
  SmartGuide,
  CanvasComment,
  VersionSnapshot,
  AnchorSide,
  ConnectorRouting,
} from "@/components/notes/diagrams/canvas-studio/types";
import {
  calculateSmartGuides,
  getClosestAnchor,
} from "@/components/notes/diagrams/canvas-studio/geometry";

export interface StudioState {
  // Document state
  docId: string;
  docTitle: string;
  elements: DiagramElement[];
  comments: CanvasComment[];

  // View state
  panX: number;
  panY: number;
  zoom: number; // 0.1 to 8.0
  showGrid: boolean;
  gridType: "dots" | "lines";
  snapToGrid: boolean;
  gridSize: number;

  // Tools & Selection
  activeTool: CanvasTool;
  selectedShapeType: ElementType;
  selectedIconId: string | null;
  selectedIds: string[];
  hoveredId: string | null;
  hoveredAnchor: {
    elementId: string;
    side: AnchorSide;
    x: number;
    y: number;
  } | null;
  isQuickAddOpen: {
    elementId: string;
    side: AnchorSide;
    x: number;
    y: number;
  } | null;

  // Active connector drawing
  connectorDraft: {
    fromId?: string;
    fromSide?: AnchorSide;
    startX: number;
    startY: number;
    curX: number;
    curY: number;
    routing: ConnectorRouting;
  } | null;

  // Freehand drawing
  freehandDraft: { points: Array<{ x: number; y: number }> } | null;

  // Alignment Guides & Box Select
  smartGuides: SmartGuide[];
  selectionBox: {
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null;

  // History & Undo / Redo
  undoStack: DiagramElement[][];
  redoStack: DiagramElement[][];

  // Clipboard
  clipboard: DiagramElement[];

  // Versioning
  versionHistory: VersionSnapshot[];

  // Actions - View
  setPan: (panX: number, panY: number) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  zoomToFit: (viewportWidth: number, viewportHeight: number) => void;
  zoomToSelection: (viewportWidth: number, viewportHeight: number) => void;
  resetZoom: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setActiveTool: (tool: CanvasTool) => void;
  setSelectedShapeType: (shapeType: ElementType) => void;
  setSelectedIconId: (id: string | null) => void;

  // Actions - Selection
  setSelectedIds: (ids: string[]) => void;
  selectElement: (id: string, isShift?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setHoveredId: (id: string | null) => void;
  setHoveredAnchor: (
    anchor: {
      elementId: string;
      side: AnchorSide;
      x: number;
      y: number;
    } | null,
  ) => void;
  setSmartGuides: (guides: SmartGuide[]) => void;
  setSelectionBox: (
    box: { startX: number; startY: number; curX: number; curY: number } | null,
  ) => void;
  setQuickAdd: (
    qa: { elementId: string; side: AnchorSide; x: number; y: number } | null,
  ) => void;

  // Actions - Elements CRUD
  addElement: (element: Partial<DiagramElement>) => DiagramElement;
  updateElement: (id: string, updates: Partial<DiagramElement>) => void;
  updateSelectedElements: (updates: Partial<DiagramElement>) => void;
  deleteSelected: () => void;
  deleteElement: (id: string) => void;
  duplicateSelected: () => void;

  // Actions - Connectors & Quick Add
  startConnectorDraft: (
    fromId?: string,
    fromSide?: AnchorSide,
    x?: number,
    y?: number,
    routing?: ConnectorRouting,
  ) => void;
  updateConnectorDraft: (curX: number, curY: number) => void;
  finishConnectorDraft: (
    toId?: string,
    toSide?: AnchorSide,
    freeEndPoint?: { x: number; y: number },
  ) => void;
  cancelConnectorDraft: () => void;
  quickAddConnectedShape: (
    sourceId: string,
    side: AnchorSide,
    shapeType: ElementType,
    customX?: number,
    customY?: number,
  ) => void;

  // Actions - Freehand
  startFreehand: (x: number, y: number) => void;
  appendFreehandPoint: (x: number, y: number) => void;
  finishFreehand: () => void;

  // Actions - Align & Distribute
  alignSelected: (
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom",
  ) => void;
  distributeSelected: (direction: "horizontal" | "vertical") => void;
  matchSizeSelected: (dimension: "width" | "height" | "both") => void;

  // Actions - Ordering & Grouping
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleLockSelected: () => void;

  // Actions - History (Undo / Redo)
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  // Actions - Clipboard
  copySelected: () => void;
  cutSelected: () => void;
  paste: (targetX?: number, targetY?: number) => void;

  // Actions - Documents
  newDiagram: () => void;
  setDocTitle: (title: string) => void;
  saveVersionSnapshot: (label?: string) => void;
  restoreVersionSnapshot: (snapshotId: string) => void;
}

export const useDiagramStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      docId: "doc-001",
      docTitle: "Diagram Canvas",
      elements: [],
      comments: [],

      panX: 80,
      panY: 60,
      zoom: 1,
      showGrid: true,
      gridType: "dots",
      snapToGrid: true,
      gridSize: 20,

      activeTool: "select",
      selectedShapeType: "process",
      selectedIconId: null,
      selectedIds: [],
      hoveredId: null,
      hoveredAnchor: null,
      isQuickAddOpen: null,

      connectorDraft: null,
      freehandDraft: null,
      smartGuides: [],
      selectionBox: null,

      undoStack: [],
      redoStack: [],
      clipboard: [],
      versionHistory: [],

      // View
      setPan: (panX, panY) => set({ panX, panY }),
      setZoom: (val) =>
        set((state) => {
          const next = typeof val === "function" ? val(state.zoom) : val;
          return { zoom: Math.min(8.0, Math.max(0.1, next)) };
        }),

      zoomToFit: (viewportWidth, viewportHeight) => {
        const { elements } = get();
        if (elements.length === 0) {
          set({ panX: 0, panY: 0, zoom: 1 });
          return;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        elements.forEach((el) => {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
        });

        const pad = 120;
        const totalW = maxX - minX + pad * 2;
        const totalH = maxY - minY + pad * 2;

        const scaleX = viewportWidth / totalW;
        const scaleY = viewportHeight / totalH;
        const targetZoom = Math.min(
          1.5,
          Math.max(0.2, Math.min(scaleX, scaleY)),
        );

        const panX = viewportWidth / 2 - ((minX + maxX) / 2) * targetZoom;
        const panY = viewportHeight / 2 - ((minY + maxY) / 2) * targetZoom;

        set({ zoom: targetZoom, panX, panY });
      },

      zoomToSelection: (viewportWidth, viewportHeight) => {
        const { elements, selectedIds } = get();
        const selected = elements.filter((el) => selectedIds.includes(el.id));
        if (selected.length === 0) return;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        selected.forEach((el) => {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
        });

        const pad = 80;
        const totalW = maxX - minX + pad * 2;
        const totalH = maxY - minY + pad * 2;

        const targetZoom = Math.min(
          2.0,
          Math.max(
            0.3,
            Math.min(viewportWidth / totalW, viewportHeight / totalH),
          ),
        );
        const panX = viewportWidth / 2 - ((minX + maxX) / 2) * targetZoom;
        const panY = viewportHeight / 2 - ((minY + maxY) / 2) * targetZoom;

        set({ zoom: targetZoom, panX, panY });
      },

      resetZoom: () => set({ zoom: 1 }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
      setActiveTool: (tool) => set({ activeTool: tool, connectorDraft: null }),
      setSelectedShapeType: (shapeType) =>
        set({ selectedShapeType: shapeType }),
      setSelectedIconId: (id) => set({ selectedIconId: id }),

      // Selection
      setSelectedIds: (ids) => set({ selectedIds: ids }),
      selectElement: (id, isShift = false) => {
        set((state) => {
          const target = state.elements.find((el) => el.id === id);
          const relatedIds = target?.groupId
            ? state.elements
                .filter((el) => el.groupId === target.groupId)
                .map((el) => el.id)
            : [id];

          if (isShift) {
            const allSelected = relatedIds.every((rid) =>
              state.selectedIds.includes(rid),
            );
            return {
              selectedIds: allSelected
                ? state.selectedIds.filter((item) => !relatedIds.includes(item))
                : Array.from(new Set([...state.selectedIds, ...relatedIds])),
            };
          }
          return { selectedIds: relatedIds };
        });
      },
      selectAll: () =>
        set((s) => ({ selectedIds: s.elements.map((el) => el.id) })),
      clearSelection: () => set({ selectedIds: [], isQuickAddOpen: null }),
      setHoveredId: (id) => set({ hoveredId: id }),
      setHoveredAnchor: (anchor) => set({ hoveredAnchor: anchor }),
      setSmartGuides: (guides) => set({ smartGuides: guides }),
      setSelectionBox: (box) => set({ selectionBox: box }),
      setQuickAdd: (qa) => set({ isQuickAddOpen: qa }),

      // Elements CRUD
      addElement: (element) => {
        get().pushUndo();
        const { elements, selectedShapeType } = get();
        const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const maxZ = elements.reduce(
          (max, el) => Math.max(max, el.zIndex || 0),
          0,
        );

        const newEl: DiagramElement = {
          id,
          type: element.type || selectedShapeType,
          x: element.x || 300,
          y: element.y || 200,
          width: element.width || 160,
          height: element.height || 70,
          rotation: 0,
          zIndex: maxZ + 1,
          fill: element.fill || "transparent",
          stroke: element.stroke || "var(--i)",
          strokeWidth: element.strokeWidth || 2,
          strokeStyle: element.strokeStyle || "solid",
          cornerRadius: element.cornerRadius || 8,
          text: element.text || "",
          textColor: element.textColor || "var(--i)",
          fontSize: element.fontSize || 18,
          textAlign: element.textAlign || "center",
          verticalAlign: element.verticalAlign || "middle",
          ...element,
        };

        set({
          elements: [...elements, newEl],
          selectedIds: [id],
          activeTool: "select",
        });

        return newEl;
      },

      updateElement: (id, updates) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el,
          ),
        }));
      },

      updateSelectedElements: (updates) => {
        get().pushUndo();
        const { selectedIds } = get();
        set((state) => ({
          elements: state.elements.map((el) =>
            selectedIds.includes(el.id) && !el.isLocked
              ? { ...el, ...updates }
              : el,
          ),
        }));
      },

      deleteSelected: () => {
        const { selectedIds, elements } = get();
        const lockedIds = elements
          .filter((el) => selectedIds.includes(el.id) && el.isLocked)
          .map((el) => el.id);
        const deletableIds = selectedIds.filter(
          (id) => !lockedIds.includes(id),
        );
        if (deletableIds.length === 0) return;
        get().pushUndo();
        const remaining = elements.filter(
          (el) =>
            !deletableIds.includes(el.id) &&
            !deletableIds.includes(el.from?.id || "") &&
            !deletableIds.includes(el.to?.id || ""),
        );
        set({ elements: remaining, selectedIds: lockedIds });
      },

      deleteElement: (id: string) => {
        const target = get().elements.find((el) => el.id === id);
        if (target?.isLocked) return;
        get().pushUndo();
        const { selectedIds, elements } = get();
        const remaining = elements.filter(
          (el) => el.id !== id && el.from?.id !== id && el.to?.id !== id,
        );
        set({
          elements: remaining,
          selectedIds: selectedIds.filter((selId) => selId !== id),
        });
      },

      duplicateSelected: () => {
        get().pushUndo();
        const { selectedIds, elements } = get();
        const newElements = [...elements];
        const newSelectedIds: string[] = [];

        selectedIds.forEach((id) => {
          const item = elements.find((el) => el.id === id);
          if (!item) return;

          const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const dup: DiagramElement = {
            ...item,
            id: newId,
            x: item.x + 30,
            y: item.y + 30,
            from: null,
            to: null,
          };
          newElements.push(dup);
          newSelectedIds.push(newId);
        });

        set({ elements: newElements, selectedIds: newSelectedIds });
      },

      // Connectors & Straight Lines
      startConnectorDraft: (
        fromId,
        fromSide = "right",
        x = 0,
        y = 0,
        routing = "curved",
      ) => {
        set({
          connectorDraft: {
            fromId,
            fromSide,
            startX: x,
            startY: y,
            curX: x,
            curY: y,
            routing,
          },
        });
      },

      updateConnectorDraft: (curX, curY) => {
        set((state) =>
          state.connectorDraft
            ? { connectorDraft: { ...state.connectorDraft, curX, curY } }
            : state,
        );
      },

      cancelConnectorDraft: () => {
        set({ connectorDraft: null, hoveredAnchor: null });
      },

      finishConnectorDraft: (toId, toSide = "left", freeEndPoint) => {
        const { connectorDraft, elements } = get();
        if (!connectorDraft) return;

        const hasFrom = !!connectorDraft.fromId;
        const hasTo = !!toId;

        // If neither endpoint is bound and no valid free point provided, cancel
        if (!hasTo && !freeEndPoint) {
          set({ connectorDraft: null, hoveredAnchor: null });
          return;
        }

        const startX = connectorDraft.startX;
        const startY = connectorDraft.startY;
        const endX = freeEndPoint ? freeEndPoint.x : connectorDraft.curX;
        const endY = freeEndPoint ? freeEndPoint.y : connectorDraft.curY;

        // Prevent zero-length accidental clicks
        const dist = Math.hypot(endX - startX, endY - startY);
        if (!hasTo && dist < 15) {
          set({ connectorDraft: null, hoveredAnchor: null });
          return;
        }

        get().pushUndo();
        const id = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);
        const width = Math.max(1, Math.abs(endX - startX));
        const height = Math.max(1, Math.abs(endY - startY));

        const isStraightLine =
          connectorDraft.routing === "straight" || get().activeTool === "line";

        const newConnector: DiagramElement = {
          id,
          type: "connector",
          x: minX,
          y: minY,
          width,
          height,
          rotation: 0,
          zIndex: 0,
          fill: "none",
          stroke: isStraightLine ? "var(--i)" : "#3b82f6",
          strokeWidth: 2,
          strokeStyle: "solid",
          from: hasFrom
            ? {
                id: connectorDraft.fromId!,
                side: connectorDraft.fromSide || "right",
                auto: true,
              }
            : { id: "", side: "right", point: { x: startX, y: startY } },
          to: hasTo
            ? { id: toId!, side: toSide, auto: true }
            : { id: "", side: "left", point: { x: endX, y: endY } },
          routing: isStraightLine
            ? "straight"
            : connectorDraft.routing || "curved",
          startArrow: "none",
          endArrow: isStraightLine ? "none" : "arrow",
        };

        set({
          elements: [...elements, newConnector],
          connectorDraft: null,
          hoveredAnchor: null,
          selectedIds: [id],
          activeTool: "select",
        });
      },

      quickAddConnectedShape: (sourceId, side, shapeType, customX, customY) => {
        get().pushUndo();
        const { elements } = get();
        const source = elements.find((el) => el.id === sourceId);
        if (!source) return;

        const targetW = 160;
        const targetH = 65;
        const gap = 90;
        let targetX = source.x;
        let targetY = source.y;
        let sourceSide = side;
        let targetSide: AnchorSide = "left";

        if (customX !== undefined && customY !== undefined) {
          targetX = customX - targetW / 2;
          targetY = customY - targetH / 2;

          const dx = customX - (source.x + source.width / 2);
          const dy = customY - (source.y + source.height / 2);

          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
              sourceSide = "right";
              targetSide = "left";
            } else {
              sourceSide = "left";
              targetSide = "right";
            }
          } else {
            if (dy > 0) {
              sourceSide = "bottom";
              targetSide = "top";
            } else {
              sourceSide = "top";
              targetSide = "bottom";
            }
          }
        } else {
          switch (side) {
            case "right":
              targetX = source.x + source.width + gap;
              targetY = source.y + (source.height - targetH) / 2;
              targetSide = "left";
              break;
            case "left":
              targetX = source.x - targetW - gap;
              targetY = source.y + (source.height - targetH) / 2;
              targetSide = "right";
              break;
            case "bottom":
              targetX = source.x + (source.width - targetW) / 2;
              targetY = source.y + source.height + gap;
              targetSide = "top";
              break;
            case "top":
              targetX = source.x + (source.width - targetW) / 2;
              targetY = source.y - targetH - gap;
              targetSide = "bottom";
              break;
          }
        }

        const newTargetId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newShape: DiagramElement = {
          id: newTargetId,
          type: shapeType,
          x: Math.round(targetX),
          y: Math.round(targetY),
          width: targetW,
          height: targetH,
          rotation: 0,
          zIndex: (source.zIndex || 1) + 1,
          fill: "transparent",
          stroke: "var(--i)",
          strokeWidth: 2,
          strokeStyle: "solid",
          cornerRadius: 8,
          text: "",
          textColor: "var(--i)",
          fontSize: 18,
          textAlign: "center",
          verticalAlign: "middle",
        };

        const newConnId = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newConnector: DiagramElement = {
          id: newConnId,
          type: "connector",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          zIndex: 0,
          fill: "none",
          stroke: "#3b82f6",
          strokeWidth: 2,
          strokeStyle: "solid",
          from: { id: source.id, side: sourceSide },
          to: { id: newTargetId, side: targetSide },
          routing: "curved",
          startArrow: "none",
          endArrow: "arrow",
        };

        set({
          elements: [...elements, newShape, newConnector],
          selectedIds: [newTargetId],
          isQuickAddOpen: null,
        });
      },

      // Freehand
      startFreehand: (x, y) => {
        set({ freehandDraft: { points: [{ x, y }] } });
      },
      appendFreehandPoint: (x, y) => {
        set((state) =>
          state.freehandDraft
            ? {
                freehandDraft: {
                  points: [...state.freehandDraft.points, { x, y }],
                },
              }
            : state,
        );
      },
      finishFreehand: () => {
        const { freehandDraft, elements } = get();
        if (!freehandDraft || freehandDraft.points.length < 2) {
          set({ freehandDraft: null });
          return;
        }

        get().pushUndo();
        const id = `freehand-${Date.now()}`;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        freehandDraft.points.forEach((pt) => {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        });

        const newEl: DiagramElement = {
          id,
          type: "freehand",
          x: minX,
          y: minY,
          width: Math.max(20, maxX - minX),
          height: Math.max(20, maxY - minY),
          rotation: 0,
          zIndex: elements.length + 1,
          fill: "none",
          stroke: "var(--i)",
          strokeWidth: 3,
          strokeStyle: "solid",
          points: freehandDraft.points,
        };

        set({
          elements: [...elements, newEl],
          freehandDraft: null,
          selectedIds: [id],
          activeTool: "select",
        });
      },

      // Align & Distribute
      alignSelected: (alignment) => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        const selected = elements.filter((el) => selectedIds.includes(el.id));
        if (selected.length < 2) return;

        let targetVal = 0;
        if (alignment === "left")
          targetVal = Math.min(...selected.map((el) => el.x));
        if (alignment === "right")
          targetVal = Math.max(...selected.map((el) => el.x + el.width));
        if (alignment === "top")
          targetVal = Math.min(...selected.map((el) => el.y));
        if (alignment === "bottom")
          targetVal = Math.max(...selected.map((el) => el.y + el.height));
        if (alignment === "center") {
          const min = Math.min(...selected.map((el) => el.x));
          const max = Math.max(...selected.map((el) => el.x + el.width));
          targetVal = (min + max) / 2;
        }
        if (alignment === "middle") {
          const min = Math.min(...selected.map((el) => el.y));
          const max = Math.max(...selected.map((el) => el.y + el.height));
          targetVal = (min + max) / 2;
        }

        const updated = elements.map((el) => {
          if (!selectedIds.includes(el.id)) return el;
          if (alignment === "left") return { ...el, x: targetVal };
          if (alignment === "right") return { ...el, x: targetVal - el.width };
          if (alignment === "center")
            return { ...el, x: targetVal - el.width / 2 };
          if (alignment === "top") return { ...el, y: targetVal };
          if (alignment === "bottom")
            return { ...el, y: targetVal - el.height };
          if (alignment === "middle")
            return { ...el, y: targetVal - el.height / 2 };
          return el;
        });

        set({ elements: updated });
      },

      distributeSelected: (direction) => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        const selected = elements.filter((el) => selectedIds.includes(el.id));
        if (selected.length < 3) return;

        if (direction === "horizontal") {
          const sorted = [...selected].sort((a, b) => a.x - b.x);
          const first = sorted[0]!;
          const last = sorted[sorted.length - 1]!;
          const totalDistance = last.x + last.width - first.x;
          const totalWidths = sorted.reduce((acc, el) => acc + el.width, 0);
          const spacing = (totalDistance - totalWidths) / (sorted.length - 1);

          let curX = first.x;
          const map = new Map<string, number>();
          sorted.forEach((el) => {
            map.set(el.id, curX);
            curX += el.width + spacing;
          });

          set({
            elements: elements.map((el) =>
              map.has(el.id) ? { ...el, x: map.get(el.id)! } : el,
            ),
          });
        } else {
          const sorted = [...selected].sort((a, b) => a.y - b.y);
          const first = sorted[0]!;
          const last = sorted[sorted.length - 1]!;
          const totalDistance = last.y + last.height - first.y;
          const totalHeights = sorted.reduce((acc, el) => acc + el.height, 0);
          const spacing = (totalDistance - totalHeights) / (sorted.length - 1);

          let curY = first.y;
          const map = new Map<string, number>();
          sorted.forEach((el) => {
            map.set(el.id, curY);
            curY += el.height + spacing;
          });

          set({
            elements: elements.map((el) =>
              map.has(el.id) ? { ...el, y: map.get(el.id)! } : el,
            ),
          });
        }
      },

      matchSizeSelected: (dimension) => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        const selected = elements.filter((el) => selectedIds.includes(el.id));
        if (selected.length < 2) return;

        const maxW = Math.max(...selected.map((el) => el.width));
        const maxH = Math.max(...selected.map((el) => el.height));

        set({
          elements: elements.map((el) => {
            if (!selectedIds.includes(el.id)) return el;
            return {
              ...el,
              width: dimension === "height" ? el.width : maxW,
              height: dimension === "width" ? el.height : maxH,
            };
          }),
        });
      },

      // Ordering
      bringToFront: () => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        const maxZ = elements.reduce(
          (max, el) => Math.max(max, el.zIndex || 0),
          0,
        );
        set({
          elements: elements.map((el) =>
            selectedIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el,
          ),
        });
      },

      sendToBack: () => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        const minZ = elements.reduce(
          (min, el) => Math.min(min, el.zIndex || 0),
          0,
        );
        set({
          elements: elements.map((el) =>
            selectedIds.includes(el.id)
              ? { ...el, zIndex: Math.max(0, minZ - 1) }
              : el,
          ),
        });
      },

      bringForward: () => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        set({
          elements: elements.map((el) =>
            selectedIds.includes(el.id)
              ? { ...el, zIndex: (el.zIndex || 0) + 1 }
              : el,
          ),
        });
      },

      sendBackward: () => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        set({
          elements: elements.map((el) =>
            selectedIds.includes(el.id)
              ? { ...el, zIndex: Math.max(0, (el.zIndex || 0) - 1) }
              : el,
          ),
        });
      },

      groupSelected: () => {
        const { selectedIds, elements } = get();
        if (selectedIds.length < 2) return;
        get().pushUndo();
        const groupId = `grp-${Date.now()}`;
        set({
          elements: elements.map((el) =>
            selectedIds.includes(el.id) ? { ...el, groupId } : el,
          ),
        });
      },

      ungroupSelected: () => {
        const { selectedIds, elements } = get();
        const groupIdsToDisband = new Set(
          elements
            .filter((el) => selectedIds.includes(el.id) && el.groupId)
            .map((el) => el.groupId as string),
        );
        if (groupIdsToDisband.size === 0) return;
        get().pushUndo();
        set({
          elements: elements.map((el) =>
            el.groupId && groupIdsToDisband.has(el.groupId)
              ? { ...el, groupId: null }
              : el,
          ),
        });
      },

      toggleLockSelected: () => {
        const { selectedIds, elements } = get();
        if (selectedIds.length === 0) return;
        get().pushUndo();
        const anyLocked = elements.some(
          (el) => selectedIds.includes(el.id) && el.isLocked,
        );
        set({
          elements: elements.map((el) =>
            selectedIds.includes(el.id) ? { ...el, isLocked: !anyLocked } : el,
          ),
        });
      },

      // History
      pushUndo: () => {
        const { elements, undoStack } = get();
        set({
          undoStack: [...undoStack.slice(-30), elements],
          redoStack: [],
        });
      },

      undo: () => {
        const { undoStack, elements, redoStack } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1]!;
        set({
          elements: prev,
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, elements],
          selectedIds: [],
        });
      },

      redo: () => {
        const { redoStack, elements, undoStack } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1]!;
        set({
          elements: next,
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack, elements],
          selectedIds: [],
        });
      },

      // Clipboard
      copySelected: () => {
        const { elements, selectedIds } = get();
        const selected = elements.filter((el) => selectedIds.includes(el.id));
        set({ clipboard: selected });
      },

      cutSelected: () => {
        get().pushUndo();
        const { elements, selectedIds } = get();
        const selected = elements.filter((el) => selectedIds.includes(el.id));
        const remaining = elements.filter((el) => !selectedIds.includes(el.id));
        set({ clipboard: selected, elements: remaining, selectedIds: [] });
      },

      paste: (targetX, targetY) => {
        const { clipboard, elements } = get();
        if (clipboard.length === 0) return;

        get().pushUndo();
        const newIds: string[] = [];
        const pasted = clipboard.map((item, idx) => {
          const newId = `el-${Date.now()}-${idx}`;
          newIds.push(newId);
          return {
            ...item,
            id: newId,
            x: targetX !== undefined ? targetX + idx * 20 : item.x + 30,
            y: targetY !== undefined ? targetY + idx * 20 : item.y + 30,
            from: null,
            to: null,
          };
        });

        set({ elements: [...elements, ...pasted], selectedIds: newIds });
      },

      // Documents
      newDiagram: () => {
        get().pushUndo();
        set({
          docId: `doc-${Date.now()}`,
          docTitle: "Untitled Diagram",
          elements: [],
          comments: [],
          selectedIds: [],
          panX: 100,
          panY: 80,
          zoom: 1,
        });
      },

      setDocTitle: (title) => set({ docTitle: title }),

      saveVersionSnapshot: (label) => {
        const { elements, versionHistory, docTitle } = get();
        const snapshot: VersionSnapshot = {
          id: `snap-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          title: label || docTitle,
          elementCount: elements.length,
          elements,
        };
        set({ versionHistory: [snapshot, ...versionHistory.slice(0, 15)] });
      },

      restoreVersionSnapshot: (snapshotId) => {
        const { versionHistory } = get();
        const found = versionHistory.find((s) => s.id === snapshotId);
        if (!found) return;
        get().pushUndo();
        set({ elements: found.elements, selectedIds: [] });
      },
    }),
    {
      name: "zuri_diagram_studio_store",
      partialize: (state) => ({
        docId: state.docId,
        docTitle: state.docTitle,
        elements: state.elements.filter(
          (el) =>
            !(
              el.type === "connector" &&
              !el.to?.id &&
              !el.to?.point &&
              el.x === 0 &&
              el.y === 0 &&
              el.width === 0 &&
              el.height === 0
            ),
        ),
        versionHistory: state.versionHistory,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.elements) {
          state.elements = state.elements.filter(
            (el) =>
              !(
                el.type === "connector" &&
                !el.to?.id &&
                !el.to?.point &&
                el.x === 0 &&
                el.y === 0 &&
                el.width === 0 &&
                el.height === 0
              ),
          );
        }
      },
    },
  ),
);
