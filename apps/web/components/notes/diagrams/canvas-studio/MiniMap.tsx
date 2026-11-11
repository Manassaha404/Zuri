"use client";

// Small overview map in the bottom-right corner showing full diagram layout and draggable view frame
import { useRef, useState } from "react";
import { useDiagramStudioStore } from "@/store/diagramStudioStore";

interface MiniMapProps {
  viewportWidth: number;
  viewportHeight: number;
}

export function MiniMap({ viewportWidth, viewportHeight }: MiniMapProps) {
  const { elements, panX, panY, zoom, setPan } = useDiagramStudioStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (elements.length === 0) return null;

  // Compute total canvas bounding box
  let minX = -100;
  let minY = -100;
  let maxX = 1200;
  let maxY = 900;

  elements.forEach((el) => {
    minX = Math.min(minX, el.x - 100);
    minY = Math.min(minY, el.y - 100);
    maxX = Math.max(maxX, el.x + el.width + 100);
    maxY = Math.max(maxY, el.y + el.height + 100);
  });

  const mapW = 160;
  const mapH = 100;
  const sceneW = maxX - minX;
  const sceneH = maxY - minY;
  const scale = Math.min(mapW / sceneW, mapH / sceneH);

  // Viewport rectangle inside minimap
  const viewX = (-panX / zoom - minX) * scale;
  const viewY = (-panY / zoom - minY) * scale;
  const viewW = (viewportWidth / zoom) * scale;
  const viewH = (viewportHeight / zoom) * scale;

  const handleMinimapInteraction = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap point to scene point
    const sceneTargetX = minX + clickX / scale;
    const sceneTargetY = minY + clickY / scale;

    const newPanX = viewportWidth / 2 - sceneTargetX * zoom;
    const newPanY = viewportHeight / 2 - sceneTargetY * zoom;

    setPan(newPanX, newPanY);
  };

  return (
    <div
      ref={mapRef}
      onClick={handleMinimapInteraction}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={(e) => {
        if (isDragging) handleMinimapInteraction(e);
      }}
      className="absolute bottom-4 right-4 z-30 h-[100px] w-[160px] rounded-xl border border-[var(--h)] bg-[var(--bg)]/90 backdrop-blur-md shadow-lg overflow-hidden cursor-pointer select-none"
    >
      <svg className="h-full w-full pointer-events-none">
        {/* Simplified element boxes */}
        {elements
          .filter((el) => el.type !== "connector")
          .map((el) => {
            const rx = (el.x - minX) * scale;
            const ry = (el.y - minY) * scale;
            const rw = Math.max(2, el.width * scale);
            const rh = Math.max(2, el.height * scale);
            return (
              <rect
                key={el.id}
                x={rx}
                y={ry}
                width={rw}
                height={rh}
                rx={1}
                fill={el.fill || "#3b82f6"}
                stroke={el.stroke || "#3b82f6"}
                strokeWidth={0.5}
                opacity={0.7}
              />
            );
          })}

        {/* Current Viewport Frame */}
        <rect
          x={Math.max(0, viewX)}
          y={Math.max(0, viewY)}
          width={Math.max(10, Math.min(mapW, viewW))}
          height={Math.max(10, Math.min(mapH, viewH))}
          fill="#3b82f6"
          fillOpacity={0.15}
          stroke="#3b82f6"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
      <div className="absolute top-1 left-2 text-[9px] font-mono font-bold text-[var(--m)] opacity-60">
        Overview
      </div>
    </div>
  );
}
