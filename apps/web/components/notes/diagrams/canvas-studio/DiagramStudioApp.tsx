"use client";

// Full unified hand-crafted visual diagram studio web app
import { useRef, useState, useEffect } from "react";
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import { StudioToolbar } from "./StudioToolbar";
import { StudioCanvas } from "./StudioCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { MiniMap } from "./MiniMap";
import { QuickAddPopover } from "./QuickAddPopover";
import { ContextMenu } from "./ContextMenu";
import { IconsModal } from "./IconsModal";
import { Point } from "./geometry";

interface DiagramStudioAppProps {
  onBack?: () => void;
  standalone?: boolean;
}

export function DiagramStudioApp({
  onBack,
  standalone = true,
}: DiagramStudioAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { selectedIds } = useDiagramStudioStore();

  // Modals state
  const [isIconsOpen, setIsIconsOpen] = useState(false);

  // Context menu state
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Track container dimensions for minimap and zoom-to-fit
  const [viewportDims, setViewportDims] = useState<{
    width: number;
    height: number;
  }>({
    width: 1200,
    height: 800,
  });

  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setViewportDims({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDims();
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, []);

  const handleOpenContextMenu = (e: React.MouseEvent, canvasPt: Point) => {
    setContextMenuState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenuState({ isOpen: false, x: 0, y: 0 });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--i)] select-none">
      {/* Top Toolbar */}
      <StudioToolbar
        onOpenIcons={() => setIsIconsOpen(true)}
        viewportRef={containerRef}
      />

      {/* Main Workspace Body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Infinite Canvas */}
        <StudioCanvas
          svgRef={svgRef}
          containerRef={containerRef}
          onContextMenu={handleOpenContextMenu}
        />

        {/* Floating Quick Add Popover */}
        <QuickAddPopover />

        {/* Floating Overview MiniMap in Bottom-Right */}
        <div className="absolute bottom-4 right-4 z-20">
          <MiniMap
            viewportWidth={viewportDims.width}
            viewportHeight={viewportDims.height}
          />
        </div>

        {/* Right Dock Properties & Styling Panel (shown when elements selected) */}
        {selectedIds.length > 0 && (
          <div className="absolute top-16 right-4 bottom-4 z-40 flex pointer-events-none">
            <PropertiesPanel />
          </div>
        )}

        {/* Context Menu on Right Click */}
        {contextMenuState.isOpen && (
          <ContextMenu
            x={contextMenuState.x}
            y={contextMenuState.y}
            onClose={handleCloseContextMenu}
          />
        )}
      </div>

      <IconsModal isOpen={isIconsOpen} onClose={() => setIsIconsOpen(false)} />
    </div>
  );
}
