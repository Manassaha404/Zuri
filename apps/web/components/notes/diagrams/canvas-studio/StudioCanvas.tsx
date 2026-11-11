"use client";

// The core infinite visual diagram canvas supporting fluid panning, zooming, connectors, smart guides, shapes, and freehand
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import { ShapeRenderer } from "./ShapeRenderer";
import {
  DiagramElement,
  AnchorSide,
  ConnectorRouting,
  CanvasTool,
  ElementType,
} from "./types";
import {
  getElementAnchor,
  getClosestAnchor,
  findMagneticAnchor,
  getOptimalAnchorSides,
  generateConnectorPath,
  snapPointToGeometricAngle,
  calculateSmartGuides,
  wrapText,
  getElementTextPadding,
  Point,
} from "./geometry";
import {
  Plus,
  RotateCw,
  CornerDownRight,
  ArrowRight,
  FileText,
  Square,
  Diamond,
  Circle,
  Database,
  Type,
} from "lucide-react";

interface StudioCanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onContextMenu: (e: React.MouseEvent, canvasPt: Point) => void;
}

type InteractionMode =
  | "idle"
  | "panning"
  | "box-select"
  | "dragging-element"
  | "resizing-element"
  | "rotating-element"
  | "drawing-connector"
  | "drawing-freehand"
  | "drawing-new-shape";

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const getResizeCursor = (handle: ResizeHandle | null): string => {
  if (!handle) return "default";
  if (handle === "nw" || handle === "se") return "nwse-resize";
  if (handle === "ne" || handle === "sw") return "nesw-resize";
  if (handle === "n" || handle === "s") return "ns-resize";
  if (handle === "e" || handle === "w") return "ew-resize";
  return "default";
};

export function StudioCanvas({
  svgRef,
  containerRef,
  onContextMenu,
}: StudioCanvasProps) {
  const {
    elements,
    panX,
    panY,
    zoom,
    showGrid,
    gridType,
    snapToGrid,
    gridSize,
    activeTool,
    selectedShapeType,
    selectedIconId,
    selectedIds,
    hoveredId,
    hoveredAnchor,
    connectorDraft,
    freehandDraft,
    smartGuides,
    selectionBox,
    setPan,
    setZoom,
    setActiveTool,
    setSelectedIds,
    selectElement,
    clearSelection,
    selectAll,
    setHoveredId,
    setHoveredAnchor,
    setSmartGuides,
    setSelectionBox,
    setQuickAdd,
    addElement,
    updateElement,
    updateSelectedElements,
    deleteSelected,
    duplicateSelected,
    startConnectorDraft,
    updateConnectorDraft,
    finishConnectorDraft,
    cancelConnectorDraft,
    quickAddConnectedShape,
    startFreehand,
    appendFreehandPoint,
    finishFreehand,
    undo,
    redo,
    groupSelected,
    ungroupSelected,
    toggleLockSelected,
    copySelected,
    paste,
    pushUndo,
  } = useDiagramStudioStore();

  // Local interaction tracking
  const [mode, setMode] = useState<InteractionMode>("idle");
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState<Point>({ x: 0, y: 0 });
  const [activeResizeHandle, setActiveResizeHandle] =
    useState<ResizeHandle | null>(null);
  const [initialBounds, setInitialBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    fontSize?: number;
  } | null>(null);
  const [initialElementPositions, setInitialElementPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [shapeDraft, setShapeDraft] = useState<{
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [initialEditingHeight, setInitialEditingHeight] = useState<number>(0);
  const textEditorRef = useRef<HTMLTextAreaElement>(null);

  // Convert screen coordinates to canvas space
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom,
      };
    },
    [panX, panY, zoom, containerRef],
  );

  // Single selected element
  const singleSelected =
    selectedIds.length === 1
      ? elements.find((e) => e.id === selectedIds[0])
      : null;

  // Multi-element selection bounding box
  const selectionBounds = React.useMemo(() => {
    if (selectedIds.length === 0) return null;
    const selectedElements = elements.filter((e) => selectedIds.includes(e.id));
    if (selectedElements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedElements.forEach((el) => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [elements, selectedIds]);

  // Focus textarea, auto-fit height, and place cursor at end of text so typing appends rather than replaces
  useEffect(() => {
    if (editingElementId && textEditorRef.current) {
      const textarea = textEditorRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.focus();
      const len = textarea.value.length;
      textarea.setSelectionRange(len, len);
    }
  }, [editingElementId]);

  // Lock global cursor during resize to eliminate all cursor glitching & magnetic flickering
  useEffect(() => {
    if (mode === "resizing-element" && activeResizeHandle) {
      const resizeCursor = getResizeCursor(activeResizeHandle);
      const prevCursor = document.body.style.cursor;
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.cursor = resizeCursor;
      document.body.style.userSelect = "none";
      return () => {
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevUserSelect;
      };
    }
  }, [mode, activeResizeHandle]);

  // Global keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        editingElementId
      ) {
        if (e.key === "Escape" && editingElementId) {
          setEditingElementId(null);
        }
        return;
      }

      // Spacebar for hand tool / panning
      if (e.code === "Space" && !e.repeat && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Redo alternative: Ctrl + Y
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate: Ctrl / Cmd + D
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Group / Ungroup: Ctrl / Cmd + G / Ctrl / Cmd + Shift + G
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else {
          groupSelected();
        }
        return;
      }

      // Lock / Unlock: Ctrl / Cmd + L
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLockSelected();
        return;
      }

      // Select All: Ctrl / Cmd + A
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Copy: Ctrl / Cmd + C
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelected();
        return;
      }

      // Paste: Ctrl / Cmd + V
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        paste();
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }

      // Arrow keys nudge
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx =
            e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy =
            e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          elements
            .filter((el) => selectedIds.includes(el.id))
            .forEach((el) => {
              updateElement(el.id, { x: el.x + dx, y: el.y + dy });
            });
        }
        return;
      }

      // Tool shortcuts (single key)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            setActiveTool("select");
            break;
          case "h":
            setActiveTool("hand");
            break;
          case "l":
            setActiveTool("line");
            break;
          case "c":
            setActiveTool("connector");
            break;
          case "t":
            setActiveTool("text");
            break;
          case "n":
            setActiveTool("sticky");
            break;
          case "p":
            setActiveTool("pen");
            break;
          case "e":
            setActiveTool("eraser");
            break;
          case "escape":
            clearSelection();
            setQuickAdd(null);
            setEditingElementId(null);
            break;
          case "enter":
            if (singleSelected && !editingElementId) {
              e.preventDefault();
              setEditingElementId(singleSelected.id);
              setInitialEditingHeight(singleSelected.height);
              setEditingText(singleSelected.text || "");
            }
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    isSpacePressed,
    selectedIds,
    singleSelected,
    editingElementId,
    elements,
    undo,
    redo,
    selectAll,
    copySelected,
    paste,
    duplicateSelected,
    deleteSelected,
    updateElement,
    setActiveTool,
    clearSelection,
    setQuickAdd,
  ]);

  // Handle paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (editingElementId) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                // Drop image at center of screen
                const centerPt = screenToCanvas(
                  window.innerWidth / 2,
                  window.innerHeight / 2,
                );
                addElement({
                  type: "image",
                  x: centerPt.x - 150,
                  y: centerPt.y - 100,
                  width: 300,
                  height: 200,
                  imageUrl: dataUrl,
                });
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [editingElementId, screenToCanvas, addElement]);

  // Wheel listener: Zoom toward cursor & two-finger trackpad panning
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Zoom if Ctrl/Cmd pressed or mouse wheel with meta/ctrl
      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newZoom = Math.min(8.0, Math.max(0.1, zoom * zoomFactor));

        // Keep cursor position stable in canvas space
        const cursorCanvasX = (e.clientX - rect.left - panX) / zoom;
        const cursorCanvasY = (e.clientY - rect.top - panY) / zoom;

        const newPanX = e.clientX - rect.left - cursorCanvasX * newZoom;
        const newPanY = e.clientY - rect.top - cursorCanvasY * newZoom;

        setZoom(newZoom);
        setPan(newPanX, newPanY);
      } else {
        // Two-finger scroll pans canvas
        setPan(panX - e.deltaX, panY - e.deltaY);
      }
    },
    [panX, panY, zoom, containerRef, setPan, setZoom],
  );

  // Commit text editing
  const handleCommitText = () => {
    if (editingElementId) {
      const targetEl = elements.find((e) => e.id === editingElementId);
      if (targetEl && targetEl.type !== "connector") {
        const { px, py } = getElementTextPadding(targetEl);
        const fontSize = targetEl.fontSize || 14;
        const lineHeight = fontSize * 1.35;
        const maxW = Math.max(20, targetEl.width - px * 2);
        const wrapped = wrapText(
          editingText,
          maxW,
          fontSize,
          targetEl.fontFamily,
        );
        const neededH = wrapped.length * lineHeight + py * 2;
        const baseH = initialEditingHeight || 38;
        const finalH = Math.max(baseH, Math.round(neededH));
        updateElement(editingElementId, {
          text: editingText,
          connectorLabel: editingText,
          height: Math.max(targetEl.height, finalH),
        });
      } else {
        updateElement(editingElementId, {
          text: editingText,
          connectorLabel: editingText,
        });
      }
      setEditingElementId(null);
    }
  };

  // Pointer Down on Canvas
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Middle click or Hand tool or Space pressed: Pan
    if (e.button === 1 || activeTool === "hand" || isSpacePressed) {
      setMode("panning");
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPan({ x: panX, y: panY });
      return;
    }

    if (e.button !== 0) return; // Only primary button for canvas edits

    const pt = screenToCanvas(e.clientX, e.clientY);

    // If text editor is open, commit text first
    if (editingElementId) {
      handleCommitText();
    }

    // Quick add popover close
    setQuickAdd(null);

    // Freehand drawing tool
    if (activeTool === "pen") {
      setMode("drawing-freehand");
      startFreehand(pt.x, pt.y);
      return;
    }

    // Connector or Straight Line tool on canvas (magnetically snap to nearby object or start free line/connector)
    if (activeTool === "connector" || activeTool === "line") {
      const routing: ConnectorRouting =
        activeTool === "line" ? "straight" : "curved";
      const magneticTarget = findMagneticAnchor(elements, pt, undefined, 55);
      if (magneticTarget) {
        setMode("drawing-connector");
        startConnectorDraft(
          magneticTarget.elementId,
          magneticTarget.side,
          magneticTarget.x,
          magneticTarget.y,
          routing,
        );
        return;
      }
      setMode("drawing-connector");
      startConnectorDraft(undefined, undefined, pt.x, pt.y, routing);
      return;
    }

    // Text tool: drag on canvas to define length and size of text box
    if (activeTool === "text") {
      setShapeDraft({
        startX: pt.x,
        startY: pt.y,
        curX: pt.x,
        curY: pt.y,
      });
      setMode("drawing-new-shape");
      return;
    }

    // Icon tool: drag on canvas to define custom size and placement
    if (activeTool === "icon") {
      setShapeDraft({
        startX: pt.x,
        startY: pt.y,
        curX: pt.x,
        curY: pt.y,
      });
      setMode("drawing-new-shape");
      return;
    }

    // Sticky note tool: drop sticky note and start editing
    if (activeTool === "sticky") {
      pushUndo();
      const newEl = addElement({
        type: "sticky_note",
        x: pt.x - 90,
        y: pt.y - 90,
        width: 180,
        height: 180,
        fill: "#fef08a",
        stroke: "#facc15",
        text: "",
        textColor: "#111111",
        fontSize: 18,
      });
      setSelectedIds([newEl.id]);
      setEditingElementId(newEl.id);
      setInitialEditingHeight(newEl.height);
      setEditingText("");
      setActiveTool("select");
      return;
    }

    // Shape placement tools: click & drag preview
    const isShapeTool = activeTool === "shape";

    if (isShapeTool) {
      setMode("drawing-new-shape");
      setShapeDraft({
        startX: pt.x,
        startY: pt.y,
        curX: pt.x,
        curY: pt.y,
      });
      return;
    }

    // Select tool on empty canvas: Start selection marquee box
    if (activeTool === "select") {
      if (!e.shiftKey) {
        clearSelection();
      }
      setMode("box-select");
      setDragStart({ x: pt.x, y: pt.y });
      setSelectionBox({
        startX: pt.x,
        startY: pt.y,
        curX: pt.x,
        curY: pt.y,
      });
    }
  };

  // Pointer Down on Element
  const handleElementPointerDown = (
    e: React.PointerEvent,
    element: DiagramElement,
  ) => {
    // If middle click or space pressed, let canvas handle panning
    if (e.button === 1 || activeTool === "hand" || isSpacePressed) {
      handleCanvasPointerDown(e);
      return;
    }

    if (e.button !== 0) return;

    e.stopPropagation();
    const pt = screenToCanvas(e.clientX, e.clientY);

    // Eraser tool: deletes clicked element
    if (activeTool === "eraser") {
      pushUndo();
      useDiagramStudioStore.getState().deleteElement(element.id);
      return;
    }

    // Connector or Straight Line tool: start drawing from clicked element's closest anchor/stroke
    if (activeTool === "connector" || activeTool === "line") {
      const routing: ConnectorRouting =
        activeTool === "line" ? "straight" : "curved";
      const anchor = getClosestAnchor(element, pt);
      setMode("drawing-connector");
      startConnectorDraft(
        element.id,
        anchor.side,
        anchor.point.x,
        anchor.point.y,
        routing,
      );
      return;
    }

    // Selection handling with group resolution
    let currentSelection = selectedIds;
    const targetGroup = element.groupId
      ? elements
          .filter((el) => el.groupId === element.groupId)
          .map((el) => el.id)
      : [element.id];

    if (e.shiftKey) {
      selectElement(element.id, true);
      const isAlready = targetGroup.every((id) => selectedIds.includes(id));
      currentSelection = isAlready
        ? selectedIds.filter((id) => !targetGroup.includes(id))
        : Array.from(new Set([...selectedIds, ...targetGroup]));
    } else if (!selectedIds.includes(element.id)) {
      setSelectedIds(targetGroup);
      currentSelection = targetGroup;
    }

    // If any element in selection is locked, allow selection but prevent dragging
    const hasLocked = elements.some(
      (el) => currentSelection.includes(el.id) && el.isLocked,
    );
    if (hasLocked) {
      return;
    }

    // Record initial positions of all moving elements
    pushUndo();
    const positions = new Map<string, { x: number; y: number }>();
    elements
      .filter((el) => currentSelection.includes(el.id))
      .forEach((el) => {
        positions.set(el.id, { x: el.x, y: el.y });
      });

    setInitialElementPositions(positions);
    setDragStart({ x: pt.x, y: pt.y });
    setMode("dragging-element");
  };

  // Pointer Down on Anchor Dot (Starts drawing connector or straight line)
  const handleAnchorPointerDown = (
    e: React.PointerEvent,
    element: DiagramElement,
    side: AnchorSide,
  ) => {
    e.stopPropagation();
    const anchor = getElementAnchor(element, side);
    const routing: ConnectorRouting =
      activeTool === "line" ? "straight" : "curved";
    setMode("drawing-connector");
    startConnectorDraft(element.id, side, anchor.x, anchor.y, routing);
  };

  // Pointer Down on Resize Handle
  const handleResizeHandlePointerDown = (
    e: React.PointerEvent,
    handle: ResizeHandle,
  ) => {
    e.stopPropagation();
    if (!singleSelected && !selectionBounds) return;

    pushUndo();
    setActiveTool("select");
    setHoveredId(null);
    setHoveredAnchor(null);

    const target = singleSelected || selectionBounds!;
    setInitialBounds({
      x: target.x,
      y: target.y,
      width: target.width,
      height: target.height,
      rotation: singleSelected?.rotation || 0,
      fontSize: singleSelected?.fontSize || 14,
    });
    setActiveResizeHandle(handle);
    const pt = screenToCanvas(e.clientX, e.clientY);
    setDragStart(pt);
    setMode("resizing-element");
  };

  // Pointer Down on Rotation Handle
  const handleRotationHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!singleSelected) return;

    pushUndo();
    setInitialBounds({
      x: singleSelected.x,
      y: singleSelected.y,
      width: singleSelected.width,
      height: singleSelected.height,
      rotation: singleSelected.rotation || 0,
    });
    setMode("rotating-element");
  };

  // Global Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = screenToCanvas(e.clientX, e.clientY);

    // 1. Panning
    if (mode === "panning") {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan(initialPan.x + dx, initialPan.y + dy);
      return;
    }

    // 2. Box Select
    if (mode === "box-select") {
      const newBox = {
        startX: dragStart.x,
        startY: dragStart.y,
        curX: pt.x,
        curY: pt.y,
      };
      setSelectionBox(newBox);

      // Select elements inside box
      const boxLeft = Math.min(newBox.startX, newBox.curX);
      const boxRight = Math.max(newBox.startX, newBox.curX);
      const boxTop = Math.min(newBox.startY, newBox.curY);
      const boxBottom = Math.max(newBox.startY, newBox.curY);

      const insideIds = elements
        .filter((el) => {
          if (el.type === "connector") return false;
          return (
            el.x + el.width >= boxLeft &&
            el.x <= boxRight &&
            el.y + el.height >= boxTop &&
            el.y <= boxBottom
          );
        })
        .map((el) => el.id);

      setSelectedIds(insideIds);
      return;
    }

    // 3. Dragging Elements with Smart Alignment Guides
    if (mode === "dragging-element") {
      let deltaX = pt.x - dragStart.x;
      let deltaY = pt.y - dragStart.y;

      // Smart alignment if single element is being dragged
      if (singleSelected) {
        const candidate: DiagramElement = {
          ...singleSelected,
          x:
            (initialElementPositions.get(singleSelected.id)?.x ||
              singleSelected.x) + deltaX,
          y:
            (initialElementPositions.get(singleSelected.id)?.y ||
              singleSelected.y) + deltaY,
        };

        const { guides, snappedX, snappedY } = calculateSmartGuides(
          candidate,
          elements,
        );
        setSmartGuides(guides);

        // Snap to grid if enabled and no smart guide snapped
        if (snapToGrid && guides.length === 0) {
          const snapGridX = Math.round(candidate.x / gridSize) * gridSize;
          const snapGridY = Math.round(candidate.y / gridSize) * gridSize;
          deltaX =
            snapGridX -
            (initialElementPositions.get(singleSelected.id)?.x ||
              singleSelected.x);
          deltaY =
            snapGridY -
            (initialElementPositions.get(singleSelected.id)?.y ||
              singleSelected.y);
        } else {
          deltaX =
            snappedX -
            (initialElementPositions.get(singleSelected.id)?.x ||
              singleSelected.x);
          deltaY =
            snappedY -
            (initialElementPositions.get(singleSelected.id)?.y ||
              singleSelected.y);
        }
      }

      // Update positions of all selected elements
      initialElementPositions.forEach((initialPos, id) => {
        updateElement(id, {
          x: Math.round(initialPos.x + deltaX),
          y: Math.round(initialPos.y + deltaY),
        });
      });
      return;
    }

    // 4. Resizing Element
    if (mode === "resizing-element" && initialBounds && activeResizeHandle) {
      let deltaX = pt.x - dragStart.x;
      let deltaY = pt.y - dragStart.y;

      let newX = initialBounds.x;
      let newY = initialBounds.y;
      let newW = initialBounds.width;
      let newH = initialBounds.height;

      // Proportional resizing if Shift is pressed or if circle/icon
      const isCircleOrIcon =
        singleSelected?.type === "circle" || singleSelected?.type === "icon";
      const aspectRatio = isCircleOrIcon
        ? 1
        : initialBounds.width / Math.max(1, initialBounds.height);

      if (activeResizeHandle.includes("e"))
        newW = Math.max(20, initialBounds.width + deltaX);
      if (activeResizeHandle.includes("s"))
        newH = Math.max(20, initialBounds.height + deltaY);
      if (activeResizeHandle.includes("w")) {
        const potentialW = initialBounds.width - deltaX;
        if (potentialW >= 20) {
          newW = potentialW;
          newX = initialBounds.x + deltaX;
        }
      }
      if (activeResizeHandle.includes("n")) {
        const potentialH = initialBounds.height - deltaY;
        if (potentialH >= 20) {
          newH = potentialH;
          newY = initialBounds.y + deltaY;
        }
      }

      if (e.shiftKey || isCircleOrIcon) {
        if (activeResizeHandle === "se" || activeResizeHandle === "nw") {
          newH = newW / aspectRatio;
        } else if (activeResizeHandle === "ne" || activeResizeHandle === "sw") {
          newH = newW / aspectRatio;
        }
      }

      // Synchronize text size rapidly with text box and shape resizing
      let updatedFontSize = initialBounds.fontSize;
      if (
        initialBounds.fontSize &&
        initialBounds.width > 0 &&
        initialBounds.height > 0
      ) {
        const scaleW = newW / initialBounds.width;
        const scaleH = newH / initialBounds.height;
        const isCorner = activeResizeHandle.length === 2;
        const scale = isCorner
          ? Math.max(scaleW, scaleH)
          : activeResizeHandle.includes("e") || activeResizeHandle.includes("w")
            ? scaleW
            : scaleH;
        updatedFontSize = Math.max(
          10,
          Math.min(220, Math.round(initialBounds.fontSize * scale)),
        );
      }

      if (singleSelected) {
        let finalH = newH;
        if (singleSelected.text && singleSelected.type !== "connector") {
          const { px, py } = getElementTextPadding(singleSelected);
          const fSize = updatedFontSize || singleSelected.fontSize || 14;
          const maxW = Math.max(20, newW - px * 2);
          const wrapped = wrapText(
            singleSelected.text,
            maxW,
            fSize,
            singleSelected.fontFamily,
          );
          const minRequiredH = wrapped.length * (fSize * 1.35) + py * 2;
          finalH = Math.max(newH, minRequiredH);
        }

        updateElement(singleSelected.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(finalH),
          ...(updatedFontSize ? { fontSize: updatedFontSize } : {}),
        });
      }
      return;
    }

    // 5. Rotating Element
    if (mode === "rotating-element" && singleSelected) {
      const centerX = singleSelected.x + singleSelected.width / 2;
      const centerY = singleSelected.y + singleSelected.height / 2;
      const angleRad = Math.atan2(pt.y - centerY, pt.x - centerX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);

      // Snap to 15 degrees if Shift is held
      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      }
      updateElement(singleSelected.id, { rotation: (angleDeg + 360) % 360 });
      return;
    }

    // 6. Drawing Connector or Straight Line Draft
    if (mode === "drawing-connector") {
      let draftPt = pt;
      // Pressing Shift locks to completely straight geometric angles (0°, 45°, 90°, 180°, etc.)
      if (e.shiftKey && connectorDraft) {
        draftPt = snapPointToGeometricAngle(
          { x: connectorDraft.startX, y: connectorDraft.startY },
          pt,
          45,
        );
      }

      updateConnectorDraft(draftPt.x, draftPt.y);

      // When shift is held for geometric straightness, bypass magnetic anchor attraction
      if (e.shiftKey) {
        setHoveredAnchor(null);
      } else {
        const candidateAnchor = findMagneticAnchor(
          elements,
          pt,
          connectorDraft?.fromId,
          55,
        );
        setHoveredAnchor(candidateAnchor);
      }
      return;
    }

    // 7. Drawing Freehand
    if (mode === "drawing-freehand") {
      appendFreehandPoint(pt.x, pt.y);
      return;
    }

    // 8. Drawing New Shape Draft
    if (mode === "drawing-new-shape" && shapeDraft) {
      let curX = pt.x;
      let curY = pt.y;

      // Holding Shift while drawing shapes constrains to 1:1 aspect ratio
      if (e.shiftKey) {
        const dx = pt.x - shapeDraft.startX;
        const dy = pt.y - shapeDraft.startY;
        const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
        curX = shapeDraft.startX + (dx >= 0 ? maxDelta : -maxDelta);
        curY = shapeDraft.startY + (dy >= 0 ? maxDelta : -maxDelta);
      }

      setShapeDraft({
        ...shapeDraft,
        curX,
        curY,
      });
      return;
    }
  };

  // Global Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    const pt = screenToCanvas(e.clientX, e.clientY);

    // 1. Finish Drawing Connector or Straight Line
    if (mode === "drawing-connector") {
      let finalPt = pt;
      if (e.shiftKey && connectorDraft) {
        finalPt = snapPointToGeometricAngle(
          { x: connectorDraft.startX, y: connectorDraft.startY },
          pt,
          45,
        );
      }

      // Re-verify magnetic anchor at release position (radius 55) unless shift geometric constraint is active
      const targetAnchor = !e.shiftKey
        ? hoveredAnchor ||
          findMagneticAnchor(elements, pt, connectorDraft?.fromId, 55)
        : null;

      if (targetAnchor) {
        // Successfully connected to target shape/icon/text anchor or stroke
        finishConnectorDraft(targetAnchor.elementId, targetAnchor.side);
      } else if (connectorDraft?.fromId && connectorDraft?.fromSide) {
        if (activeTool === "line") {
          const dist = Math.hypot(
            finalPt.x - (connectorDraft?.startX || 0),
            finalPt.y - (connectorDraft?.startY || 0),
          );
          if (dist >= 15) {
            finishConnectorDraft(undefined, undefined, {
              x: finalPt.x,
              y: finalPt.y,
            });
          } else {
            cancelConnectorDraft();
          }
        } else {
          // Dragged from a shape and released on empty canvas: Open Quick-Add popover!
          setQuickAdd({
            elementId: connectorDraft.fromId,
            side: connectorDraft.fromSide,
            x: pt.x,
            y: pt.y,
          });
          cancelConnectorDraft();
        }
      } else if (!connectorDraft?.fromId) {
        // Free connector or straight line drawn on canvas: only create if length >= 15px
        const dist = Math.hypot(
          finalPt.x - (connectorDraft?.startX || 0),
          finalPt.y - (connectorDraft?.startY || 0),
        );
        if (dist >= 15) {
          finishConnectorDraft(undefined, undefined, {
            x: finalPt.x,
            y: finalPt.y,
          });
        } else {
          cancelConnectorDraft();
        }
      } else {
        cancelConnectorDraft();
      }
      setHoveredAnchor(null);
    }

    // 2. Finish Drawing Freehand
    if (mode === "drawing-freehand") {
      finishFreehand();
      setActiveTool("select");
    }

    // 3. Finish Drawing New Shape or Text Box
    if (mode === "drawing-new-shape" && shapeDraft) {
      const minX = Math.min(shapeDraft.startX, shapeDraft.curX);
      const minY = Math.min(shapeDraft.startY, shapeDraft.curY);
      const rawW = Math.abs(shapeDraft.curX - shapeDraft.startX);
      const rawH = Math.abs(shapeDraft.curY - shapeDraft.startY);

      if (activeTool === "icon" && selectedIconId) {
        const finalW = rawW < 20 ? 64 : rawW;
        const finalH = rawH < 20 ? 64 : rawH;
        pushUndo();
        const newEl = addElement({
          type: "icon",
          iconName: selectedIconId,
          x: minX,
          y: minY,
          width: finalW,
          height: finalH,
          fill: "transparent",
          stroke: "var(--i)",
          strokeWidth: 2,
        });

        setSelectedIds([newEl.id]);
        setShapeDraft(null);
        setActiveTool("select");
        setMode("idle");
        return;
      }

      if (activeTool === "text") {
        const finalW = rawW < 24 ? 160 : rawW;
        const finalH = rawH < 20 ? 44 : rawH;
        pushUndo();
        const initialFontSize = Math.max(
          14,
          Math.min(64, Math.round(Math.min(finalW * 0.16, finalH * 0.45))),
        );
        const newEl = addElement({
          type: "text",
          x: minX,
          y: minY,
          width: finalW,
          height: finalH,
          fill: "transparent",
          stroke: "transparent",
          text: "",
          textColor: "var(--i)",
          fontSize: initialFontSize,
        });

        setSelectedIds([newEl.id]);
        setEditingElementId(newEl.id);
        setInitialEditingHeight(newEl.height);
        setEditingText("");
        setShapeDraft(null);
        setActiveTool("select");
        setMode("idle");
        return;
      }

      // Use default size if just clicked
      const finalW = rawW < 48 ? 160 : rawW;
      const finalH = rawH < 48 ? 80 : rawH;

      pushUndo();
      const newEl = addElement({
        type: selectedShapeType || "process",
        x: minX,
        y: minY,
        width: finalW,
        height: finalH,
        fill: "transparent",
        stroke: "var(--i)",
        strokeWidth: 2,
        text: "",
        textColor: "var(--i)",
        fontSize: 18,
      });

      setSelectedIds([newEl.id]);
      setShapeDraft(null);
      setActiveTool("select");
    }

    // 4. Finish Dragging Elements: update attached connectors' bounds and auto-adjusted sides
    if (mode === "dragging-element") {
      const movedIds = Array.from(initialElementPositions.keys());
      const attachedConnectors = elements.filter(
        (el) =>
          el.type === "connector" &&
          (movedIds.includes(el.from?.id || "") ||
            movedIds.includes(el.to?.id || "")),
      );
      attachedConnectors.forEach((conn) => {
        const fEl = elements.find((e) => e.id === conn.from?.id);
        const tEl = elements.find((e) => e.id === conn.to?.id);
        if (fEl && tEl) {
          const optimal = getOptimalAnchorSides(fEl, tEl);
          const fromSide =
            conn.from?.auto !== false
              ? optimal.fromSide
              : conn.from?.side || optimal.fromSide;
          const toSide =
            conn.to?.auto !== false
              ? optimal.toSide
              : conn.to?.side || optimal.toSide;
          const startPt = getElementAnchor(fEl, fromSide);
          const endPt = getElementAnchor(tEl, toSide);
          updateElement(conn.id, {
            x: Math.min(startPt.x, endPt.x),
            y: Math.min(startPt.y, endPt.y),
            width: Math.max(1, Math.abs(endPt.x - startPt.x)),
            height: Math.max(1, Math.abs(endPt.y - startPt.y)),
            from: {
              ...conn.from,
              id: fEl.id,
              side: fromSide,
              auto: conn.from?.auto !== false,
            },
            to: {
              ...conn.to,
              id: tEl.id,
              side: toSide,
              auto: conn.to?.auto !== false,
            },
          });
        }
      });
    }

    // Clear guides & drag state
    setSmartGuides([]);
    setSelectionBox(null);
    setInitialBounds(null);
    setActiveResizeHandle(null);
    setMode("idle");
  };

  // Double click on empty canvas to add a new text box
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const pt = screenToCanvas(e.clientX, e.clientY);
    pushUndo();
    const newEl = addElement({
      type: "text",
      x: Math.round(pt.x - 70),
      y: Math.round(pt.y - 18),
      width: 140,
      height: 38,
      fill: "transparent",
      stroke: "transparent",
      text: "",
      textColor: "var(--i)",
      fontSize: 18,
    });
    setSelectedIds([newEl.id]);
    setEditingElementId(newEl.id);
    setEditingText("");
    setActiveTool("select");
  };

  // Double click on element to edit text
  const handleElementDoubleClick = (
    e: React.MouseEvent,
    element: DiagramElement,
  ) => {
    e.stopPropagation();
    if (element.isLocked) return;
    setSelectedIds([element.id]);
    setEditingElementId(element.id);
    setInitialEditingHeight(element.height);
    setEditingText(element.text || element.connectorLabel || "");
  };

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const pt = screenToCanvas(e.clientX, e.clientY);
    onContextMenu(e, pt);
  };

  // Render Connectors
  const renderConnectors = () => {
    return elements
      .filter((el) => el.type === "connector")
      .map((conn) => {
        const fromEl = elements.find((e) => e.id === conn.from?.id);
        const toEl = elements.find((e) => e.id === conn.to?.id);

        let effectiveFromSide = conn.from?.side || "right";
        let effectiveToSide = conn.to?.side || "left";

        // Auto-adjust anchor sides and routing dynamically when objects move
        if (
          fromEl &&
          toEl &&
          conn.from?.auto !== false &&
          conn.to?.auto !== false
        ) {
          const optimal = getOptimalAnchorSides(fromEl, toEl);
          effectiveFromSide = optimal.fromSide;
          effectiveToSide = optimal.toSide;
        }

        let startPt: Point = conn.from?.point || { x: conn.x, y: conn.y };
        let endPt: Point = conn.to?.point || {
          x: conn.x + conn.width,
          y: conn.y + conn.height,
        };

        if (fromEl) {
          startPt = getElementAnchor(fromEl, effectiveFromSide);
        }
        if (toEl) {
          endPt = getElementAnchor(toEl, effectiveToSide);
        }

        // Skip rendering corrupted or orphaned connectors pointing to (0, 0)
        if (
          !fromEl &&
          !toEl &&
          startPt.x === 0 &&
          startPt.y === 0 &&
          endPt.x === 0 &&
          endPt.y === 0
        ) {
          return null;
        }

        const pathData = generateConnectorPath(
          startPt,
          endPt,
          conn.routing || "curved",
          effectiveFromSide,
          effectiveToSide,
          conn.elbowOffset,
        );

        const isSelected = selectedIds.includes(conn.id);
        const strokeColor = isSelected
          ? "var(--accent)"
          : conn.stroke || "var(--i)";
        const strokeDash =
          conn.strokeStyle === "dashed"
            ? "8 6"
            : conn.strokeStyle === "dotted"
              ? "3 3"
              : undefined;

        // Label position: midpoint of line
        const midX = (startPt.x + endPt.x) / 2;
        const midY = (startPt.y + endPt.y) / 2;

        return (
          <g
            key={conn.id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              selectElement(conn.id, e.shiftKey);
            }}
            onDoubleClick={(e) => handleElementDoubleClick(e, conn)}
          >
            {/* Wider transparent hit area for easy selection */}
            <path
              d={pathData}
              stroke="transparent"
              strokeWidth={16}
              fill="none"
            />
            <path
              d={pathData}
              stroke={strokeColor}
              strokeWidth={
                isSelected ? (conn.strokeWidth || 2) + 1 : conn.strokeWidth || 2
              }
              strokeDasharray={strokeDash}
              fill="none"
              markerEnd={
                conn.endArrow && conn.endArrow !== "none"
                  ? "url(#marker-arrow)"
                  : undefined
              }
              markerStart={
                conn.startArrow === "arrow"
                  ? "url(#marker-arrow-start)"
                  : undefined
              }
            />

            {/* Middle label text */}
            {conn.text && editingElementId !== conn.id && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-(conn.text.length * 4 + 10)}
                  y={-12}
                  width={conn.text.length * 8 + 20}
                  height={24}
                  rx={6}
                  fill="var(--bg)"
                  stroke="var(--h)"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fill="var(--i)"
                  fontSize={11}
                  fontWeight={500}
                >
                  {conn.text}
                </text>
              </g>
            )}
          </g>
        );
      });
  };

  // Render active connector draft while pulling
  const renderConnectorDraft = () => {
    if (mode === "resizing-element" || mode === "dragging-element") return null;
    if (!connectorDraft) return null;

    let endPt: Point = { x: connectorDraft.curX, y: connectorDraft.curY };
    if (hoveredAnchor) {
      endPt = { x: hoveredAnchor.x, y: hoveredAnchor.y };
    }

    const targetEl = hoveredAnchor
      ? elements.find((e) => e.id === hoveredAnchor.elementId)
      : null;
    const isStraightLine =
      connectorDraft.routing === "straight" || activeTool === "line";

    const pathData = generateConnectorPath(
      { x: connectorDraft.startX, y: connectorDraft.startY },
      endPt,
      isStraightLine ? "straight" : connectorDraft.routing || "curved",
      connectorDraft.fromSide,
      hoveredAnchor?.side,
    );

    return (
      <g className="pointer-events-none">
        {/* Magnetic halo around target shape/icon/text outline */}
        {targetEl && (
          <rect
            x={targetEl.x - 4}
            y={targetEl.y - 4}
            width={targetEl.width + 8}
            height={targetEl.height + 8}
            rx={(targetEl.cornerRadius || 6) + 4}
            fill="var(--accent)"
            fillOpacity={0.06}
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="6 3"
            className="animate-pulse"
          />
        )}

        {/* Dynamic Connector / Line Path preview */}
        <path
          d={pathData}
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          fill="none"
          markerEnd={isStraightLine ? undefined : "url(#marker-arrow-draft)"}
        />

        {/* Magnetic snap point indicator on target stroke */}
        <circle
          cx={endPt.x}
          cy={endPt.y}
          r={hoveredAnchor ? 7 : 5}
          fill="var(--accent)"
          opacity={0.95}
        />
        {hoveredAnchor && (
          <circle
            cx={endPt.x}
            cy={endPt.y}
            r={15}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            opacity={0.75}
            className="animate-ping"
          />
        )}
      </g>
    );
  };

  // Render active freehand draft while drawing
  const renderFreehandDraft = () => {
    if (!freehandDraft || freehandDraft.points.length < 2) return null;
    const pts = freehandDraft.points;
    let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i]!.x} ${pts[i]!.y}`;
    }

    return (
      <path
        d={d}
        stroke="var(--i)"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none"
      />
    );
  };

  // Render smart alignment guide lines
  const renderSmartGuides = () => {
    return smartGuides.map((guide, idx) => {
      if (guide.type === "vertical") {
        return (
          <line
            key={`guide-${idx}`}
            x1={guide.position}
            y1={guide.start}
            x2={guide.position}
            y2={guide.end}
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="4 3"
            className="pointer-events-none"
          />
        );
      }
      return (
        <line
          key={`guide-${idx}`}
          x1={guide.start}
          y1={guide.position}
          x2={guide.end}
          y2={guide.position}
          stroke="#ef4444"
          strokeWidth={1}
          strokeDasharray="4 3"
          className="pointer-events-none"
        />
      );
    });
  };

  // Render Anchor Dots on Hover / Select (only when connector tool is active or dragging)
  const renderAnchorDots = () => {
    if (mode === "resizing-element" || mode === "dragging-element") return null;
    if (
      activeTool !== "connector" &&
      activeTool !== "line" &&
      mode !== "drawing-connector"
    )
      return null;

    const targetEl =
      (hoveredId ? elements.find((e) => e.id === hoveredId) : null) ||
      singleSelected;
    if (
      !targetEl ||
      targetEl.type === "connector" ||
      targetEl.type === "freehand"
    )
      return null;

    const sides: AnchorSide[] = ["top", "right", "bottom", "left"];

    return sides.map((side) => {
      const anchor = getElementAnchor(targetEl, side);
      const isAnchorHovered =
        hoveredAnchor?.elementId === targetEl.id && hoveredAnchor.side === side;

      return (
        <g key={`anchor-${side}`} className="cursor-crosshair">
          <circle
            cx={anchor.x}
            cy={anchor.y}
            r={isAnchorHovered ? 8 : 5}
            fill={isAnchorHovered ? "#3b82f6" : "var(--bg)"}
            stroke="#3b82f6"
            strokeWidth={2}
            className="transition-all duration-75"
            onPointerDown={(e) => handleAnchorPointerDown(e, targetEl, side)}
          />
        </g>
      );
    });
  };

  // Quick add buttons disabled to keep selection indicator clean and minimal
  const renderQuickAddButtons = () => {
    return null;
  };

  // Render Selection Bounding Box & 4 Corner Highlights
  const renderSelectionBounds = () => {
    if (!selectionBounds || mode === "box-select") return null;
    const { x, y, width, height } = selectionBounds;

    const isAnyLocked = elements.some(
      (el) => selectedIds.includes(el.id) && el.isLocked,
    );
    const rotation = singleSelected?.rotation || 0;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const cornerHandles: Array<{
      handle: ResizeHandle;
      hx: number;
      hy: number;
      cursor: string;
    }> = [
      { handle: "nw", hx: x, hy: y, cursor: "nwse-resize" },
      { handle: "ne", hx: x + width, hy: y, cursor: "nesw-resize" },
      { handle: "se", hx: x + width, hy: y + height, cursor: "nwse-resize" },
      { handle: "sw", hx: x, hy: y + height, cursor: "nesw-resize" },
    ];

    return (
      <g
        className="pointer-events-auto"
        transform={
          rotation ? `rotate(${rotation}, ${centerX}, ${centerY})` : undefined
        }
      >
        {/* Solid Blue Border Outline - clean, crisp bounding box enclosing the shape with zero padding */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          className="pointer-events-none"
        />

        {/* 4 Corner Highlights */}
        {cornerHandles.map(({ handle, hx, hy, cursor }) => (
          <rect
            key={handle}
            x={hx - 4.5}
            y={hy - 4.5}
            width={9}
            height={9}
            fill="#ffffff"
            stroke="#3b82f6"
            strokeWidth={1.5}
            rx={1.5}
            className="pointer-events-auto"
            style={{ cursor: isAnyLocked ? "default" : cursor }}
            onPointerDown={(e) => {
              if (!isAnyLocked) {
                handleResizeHandlePointerDown(e, handle);
              }
            }}
          />
        ))}

        {/* Lock indicator badge if element is locked */}
        {isAnyLocked && (
          <g
            transform={`translate(${x + width - 20}, ${y - 20})`}
            className="pointer-events-none"
          >
            <rect x={0} y={0} width={20} height={20} rx={10} fill="#f59e0b" />
            <path
              d="M7 9V7a3 3 0 0 1 6 0v2m-7 0h8a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"
              stroke="#ffffff"
              strokeWidth={1.3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      style={
        mode === "resizing-element" && activeResizeHandle
          ? { cursor: getResizeCursor(activeResizeHandle) }
          : undefined
      }
      className={`relative h-full w-full select-none overflow-hidden bg-[var(--bg)] ${
        mode === "resizing-element"
          ? ""
          : activeTool === "hand" || isSpacePressed
            ? "cursor-grab active:cursor-grabbing"
            : activeTool === "connector" ||
                activeTool === "line" ||
                activeTool === "pen" ||
                activeTool === "icon" ||
                activeTool === "shape"
              ? "cursor-crosshair"
              : activeTool === "text"
                ? "cursor-text"
                : "cursor-default"
      }`}
      onWheel={handleWheel}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleCanvasDoubleClick}
    >
      <svg
        ref={svgRef}
        id="diagram-canvas-svg"
        className="h-full w-full absolute inset-0"
      >
        <defs>
          {/* Dot Grid Pattern */}
          <pattern
            id="canvas-grid-dots"
            x={panX % (gridSize * zoom)}
            y={panY % (gridSize * zoom)}
            width={gridSize * zoom}
            height={gridSize * zoom}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={2}
              cy={2}
              r={1.2}
              className="fill-[var(--m)]"
              opacity={0.25}
            />
          </pattern>

          {/* Line Grid Pattern */}
          <pattern
            id="canvas-grid-lines"
            x={panX % (gridSize * zoom)}
            y={panY % (gridSize * zoom)}
            width={gridSize * zoom}
            height={gridSize * zoom}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`}
              fill="none"
              stroke="currentColor"
              className="text-[var(--h)]"
              strokeWidth={0.8}
            />
          </pattern>

          {/* Arrowhead Markers */}
          <marker
            id="marker-arrow"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--i)" />
          </marker>

          <marker
            id="marker-arrow-start"
            viewBox="0 0 10 10"
            refX={2}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <path d="M 10 1 L 0 5 L 10 9 z" fill="var(--i)" />
          </marker>

          <marker
            id="marker-arrow-draft"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent)" />
          </marker>
        </defs>

        {/* Grid Background */}
        {showGrid && (
          <rect
            width="100%"
            height="100%"
            fill={
              gridType === "dots"
                ? "url(#canvas-grid-dots)"
                : "url(#canvas-grid-lines)"
            }
            className="pointer-events-none"
          />
        )}

        {/* Main Canvas World */}
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Swimlanes, Containers & Frames (Background Layer) */}
          {elements
            .filter((el) =>
              [
                "swimlane-horizontal",
                "swimlane-vertical",
                "container",
                "frame",
              ].includes(el.type),
            )
            .map((el) => (
              <g
                key={el.id}
                transform={`translate(${el.x}, ${el.y})`}
                className={mode === "resizing-element" ? "" : "cursor-pointer"}
                onPointerDown={(e) => handleElementPointerDown(e, el)}
                onMouseEnter={() => {
                  if (mode === "idle") setHoveredId(el.id);
                }}
                onMouseLeave={() => {
                  if (mode === "idle") setHoveredId(null);
                }}
              >
                <ShapeRenderer
                  element={el}
                  isSelected={selectedIds.includes(el.id)}
                  isEditing={editingElementId === el.id}
                />
              </g>
            ))}

          {/* Connectors Layer */}
          {renderConnectors()}

          {/* Standard Shapes and Freehand Strokes */}
          {elements
            .filter(
              (el) =>
                ![
                  "connector",
                  "swimlane-horizontal",
                  "swimlane-vertical",
                  "container",
                  "frame",
                ].includes(el.type),
            )
            .map((el) => {
              if (el.type === "freehand" && el.points && el.points.length > 1) {
                let d = `M ${el.points[0]!.x} ${el.points[0]!.y}`;
                for (let i = 1; i < el.points.length; i++) {
                  d += ` L ${el.points[i]!.x} ${el.points[i]!.y}`;
                }
                return (
                  <path
                    key={el.id}
                    d={d}
                    stroke={
                      selectedIds.includes(el.id)
                        ? "var(--accent)"
                        : el.stroke || "var(--i)"
                    }
                    strokeWidth={el.strokeWidth || 3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectElement(el.id, e.shiftKey);
                    }}
                  />
                );
              }

              return (
                <g
                  key={el.id}
                  transform={`translate(${el.x}, ${el.y})`}
                  className={
                    mode === "resizing-element" ? "" : "cursor-pointer"
                  }
                  onPointerDown={(e) => handleElementPointerDown(e, el)}
                  onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                  onMouseEnter={() => {
                    if (mode === "idle") setHoveredId(el.id);
                  }}
                  onMouseLeave={() => {
                    if (mode === "idle") setHoveredId(null);
                  }}
                >
                  <ShapeRenderer
                    element={el}
                    isSelected={selectedIds.includes(el.id)}
                    isEditing={editingElementId === el.id}
                  />
                </g>
              );
            })}

          {/* Active Connector Draft */}
          {renderConnectorDraft()}

          {/* Active Freehand Draft */}
          {renderFreehandDraft()}

          {/* Real Shape / Text Box Creation Preview */}
          {shapeDraft && (
            <g
              transform={`translate(${Math.min(shapeDraft.startX, shapeDraft.curX)}, ${Math.min(shapeDraft.startY, shapeDraft.curY)})`}
              className="pointer-events-none opacity-85"
            >
              {activeTool === "icon" && selectedIconId ? (
                <>
                  <rect
                    x={0}
                    y={0}
                    width={Math.max(
                      12,
                      Math.abs(shapeDraft.curX - shapeDraft.startX),
                    )}
                    height={Math.max(
                      12,
                      Math.abs(shapeDraft.curY - shapeDraft.startY),
                    )}
                    fill="transparent"
                    stroke="var(--accent)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    rx={6}
                  />
                  <ShapeRenderer
                    element={{
                      id: "preview-icon",
                      type: "icon",
                      iconName: selectedIconId,
                      x: 0,
                      y: 0,
                      width: Math.max(
                        12,
                        Math.abs(shapeDraft.curX - shapeDraft.startX),
                      ),
                      height: Math.max(
                        12,
                        Math.abs(shapeDraft.curY - shapeDraft.startY),
                      ),
                      rotation: 0,
                      zIndex: 9999,
                      fill: "transparent",
                      stroke: "var(--i)",
                      strokeWidth: 2,
                      strokeStyle: "solid",
                    }}
                  />
                </>
              ) : activeTool === "text" ? (
                <rect
                  x={0}
                  y={0}
                  width={Math.max(
                    12,
                    Math.abs(shapeDraft.curX - shapeDraft.startX),
                  )}
                  height={Math.max(
                    12,
                    Math.abs(shapeDraft.curY - shapeDraft.startY),
                  )}
                  fill="rgba(59, 130, 246, 0.05)"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  rx={6}
                />
              ) : (
                <ShapeRenderer
                  element={{
                    id: "preview-shape",
                    type: selectedShapeType || "process",
                    x: 0,
                    y: 0,
                    width: Math.max(
                      12,
                      Math.abs(shapeDraft.curX - shapeDraft.startX),
                    ),
                    height: Math.max(
                      12,
                      Math.abs(shapeDraft.curY - shapeDraft.startY),
                    ),
                    rotation: 0,
                    zIndex: 9999,
                    fill: "transparent",
                    stroke: "var(--accent)",
                    strokeWidth: 2,
                    strokeStyle: "dashed",
                    cornerRadius: 8,
                  }}
                />
              )}
            </g>
          )}

          {/* Smart Alignment Guides */}
          {renderSmartGuides()}

          {/* Bounding Box on Selected Elements */}
          {renderSelectionBounds()}

          {/* Connection Anchor Dots */}
          {renderAnchorDots()}

          {/* Quick Add '+' Directional Buttons */}
          {renderQuickAddButtons()}

          {/* Marquee Box Selection */}
          {selectionBox && (
            <rect
              x={Math.min(selectionBox.startX, selectionBox.curX)}
              y={Math.min(selectionBox.startY, selectionBox.curY)}
              width={Math.abs(selectionBox.curX - selectionBox.startX)}
              height={Math.abs(selectionBox.curY - selectionBox.startY)}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 3"
              className="pointer-events-none"
            />
          )}
        </g>
      </svg>

      {/* In-Place Text Editor Overlay */}
      {editingElementId &&
        (() => {
          const targetEl =
            elements.find((e) => e.id === editingElementId) || singleSelected;
          if (!targetEl) return null;

          const { px, py } = getElementTextPadding(targetEl);
          let left = (targetEl.x + px) * zoom + panX;
          let top = (targetEl.y + py) * zoom + panY;
          let width = Math.max(20, targetEl.width - px * 2) * zoom;
          let height = Math.max(20, targetEl.height - py * 2) * zoom;

          if (targetEl.type === "connector") {
            const fromEl = elements.find((e) => e.id === targetEl.from?.id);
            const toEl = elements.find((e) => e.id === targetEl.to?.id);
            const startPt = fromEl
              ? getElementAnchor(fromEl, targetEl.from?.side || "right")
              : targetEl.from?.point || { x: targetEl.x, y: targetEl.y };
            const endPt = toEl
              ? getElementAnchor(toEl, targetEl.to?.side || "left")
              : targetEl.to?.point || {
                  x: targetEl.x + targetEl.width,
                  y: targetEl.y + targetEl.height,
                };
            const midX = (startPt.x + endPt.x) / 2;
            const midY = (startPt.y + endPt.y) / 2;
            const boxW = Math.max(120, editingText.length * 8 + 30);
            left = (midX - boxW / 2) * zoom + panX;
            top = (midY - 14) * zoom + panY;
            width = boxW * zoom;
            height = 28 * zoom;
          }

          return (
            <div
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center pointer-events-auto p-0"
            >
              <textarea
                ref={textEditorRef}
                rows={1}
                value={editingText}
                onChange={(e) => {
                  const newText = e.target.value;
                  setEditingText(newText);
                  e.target.style.height = "auto";
                  const scrollH = e.target.scrollHeight;
                  e.target.style.height = `${scrollH}px`;

                  // Auto-enter wrap and vertical auto-increase so text never overflows in X or Y
                  if (targetEl && targetEl.type !== "connector") {
                    const fontSize = targetEl.fontSize || 14;
                    const lineHeight = fontSize * 1.35;
                    const maxW = Math.max(20, targetEl.width - px * 2);
                    const wrapped = wrapText(
                      newText,
                      maxW,
                      fontSize,
                      targetEl.fontFamily,
                    );
                    const contentH = wrapped.length * lineHeight + py * 2;
                    const scrollCanvasH = scrollH / zoom + py * 2;
                    const neededH = Math.max(contentH, scrollCanvasH);
                    const baseH = initialEditingHeight || 38;
                    const newH = Math.max(baseH, Math.round(neededH));

                    if (newH !== targetEl.height) {
                      updateElement(targetEl.id, {
                        height: newH,
                        text: newText,
                      });
                    } else {
                      updateElement(targetEl.id, { text: newText });
                    }
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onBlur={handleCommitText}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCommitText();
                  }
                  if (e.key === "Escape") {
                    setEditingElementId(null);
                  }
                }}
                className="w-full resize-none border-none bg-transparent text-center font-medium outline-hidden shadow-none overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-0"
                style={{
                  fontSize: `${(targetEl.fontSize || 14) * zoom}px`,
                  color: targetEl.textColor || "var(--i)",
                  fontFamily: targetEl.fontFamily || "Inter, sans-serif",
                  lineHeight: "1.3",
                  maxHeight: "100%",
                }}
              />
            </div>
          );
        })()}
    </div>
  );
}
