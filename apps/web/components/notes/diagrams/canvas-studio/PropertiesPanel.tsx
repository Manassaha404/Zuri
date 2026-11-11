"use client";

// Properties and styling dock for shapes, text, connectors, alignment & layers
import { useDiagramStudioStore } from "@/store/diagramStudioStore";
import { wrapText, getElementTextPadding } from "./geometry";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  BringToFront,
  SendToBack,
  Lock,
  Unlock,
  Group,
  Ungroup,
  Layers,
  ArrowRight,
  Shuffle,
  Trash2,
  Copy,
  CornerDownRight,
  Maximize2,
  Minimize2,
} from "lucide-react";

const COLOR_PALETTE = [
  "#ffffff",
  "#f8f9fa",
  "#e5e7eb",
  "#111111",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];

export function PropertiesPanel() {
  const {
    elements,
    selectedIds,
    updateSelectedElements,
    deleteSelected,
    duplicateSelected,
    alignSelected,
    distributeSelected,
    matchSizeSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupSelected,
    ungroupSelected,
    toggleLockSelected,
  } = useDiagramStudioStore();

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  if (selectedElements.length === 0) return null;

  const first = selectedElements[0]!;
  const isMulti = selectedElements.length > 1;
  const isConnector = first.type === "connector";

  const anyLocked = selectedElements.some((el) => el.isLocked);
  const anyGrouped = selectedElements.some((el) => el.groupId);

  return (
    <div className="pointer-events-auto flex flex-col w-76 max-h-full h-fit rounded-2xl border border-[var(--h)] bg-[var(--bg)]/95 backdrop-blur-md p-4 shadow-2xl space-y-4 text-xs animate-in slide-in-from-right-4 duration-150 select-none overflow-y-auto styled-scrollbar">
      {/* Header: Element Type & Count & Quick Actions */}
      <div className="flex items-center justify-between border-b border-[var(--h)] pb-2.5">
        <div className="flex items-center gap-1.5 truncate pr-1">
          <span className="font-bold text-[var(--i)] uppercase text-[11px] tracking-wider truncate">
            {isMulti
              ? `${selectedElements.length} Selected`
              : first.type.replace("_", " ")}
          </span>
          {anyLocked && (
            <span title="Locked">
              <Lock className="h-3 w-3 text-amber-500 shrink-0" />
            </span>
          )}
          {anyGrouped && (
            <span className="rounded bg-blue-500/10 text-blue-500 px-1 py-0.2 text-[9px] font-bold shrink-0">
              GROUP
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleLockSelected}
            className={`p-1 rounded-md transition-colors ${
              anyLocked
                ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
            }`}
            title={anyLocked ? "Unlock (Ctrl+L)" : "Lock (Ctrl+L)"}
          >
            {anyLocked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
          {isMulti && (
            <button
              type="button"
              onClick={groupSelected}
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Group (Ctrl+G)"
            >
              <Group className="h-3.5 w-3.5" />
            </button>
          )}
          {anyGrouped && (
            <button
              type="button"
              onClick={ungroupSelected}
              className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
              title="Ungroup (Ctrl+Shift+G)"
            >
              <Ungroup className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={duplicateSelected}
            disabled={anyLocked}
            className="p-1 rounded-md text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] disabled:opacity-30 transition-colors"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={anyLocked}
            className="p-1 rounded-md text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
            title="Delete (Backspace/Del)"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Selection Alignment & Distribution Tools */}
      {isMulti && (
        <div className="space-y-2 border-b border-[var(--h)] pb-3">
          <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
            Align & Distribute
          </div>
          <div className="grid grid-cols-6 gap-1 bg-[var(--s)] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => alignSelected("left")}
              className="p-1.5 rounded hover:bg-[var(--bg)] flex items-center justify-center text-[var(--i)]"
              title="Align Left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alignSelected("center")}
              className="p-1.5 rounded hover:bg-[var(--bg)] flex items-center justify-center text-[var(--i)]"
              title="Align Center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alignSelected("right")}
              className="p-1.5 rounded hover:bg-[var(--bg)] flex items-center justify-center text-[var(--i)]"
              title="Align Right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alignSelected("top")}
              className="p-1.5 rounded hover:bg-[var(--bg)] flex items-center justify-center text-[var(--i)]"
              title="Align Top"
            >
              <span className="font-mono text-[10px] font-bold">Top</span>
            </button>
            <button
              type="button"
              onClick={() => alignSelected("middle")}
              className="p-1.5 rounded hover:bg-[var(--bg)] flex items-center justify-center text-[var(--i)]"
              title="Align Middle"
            >
              <span className="font-mono text-[10px] font-bold">Mid</span>
            </button>
            <button
              type="button"
              onClick={() => alignSelected("bottom")}
              className="p-1.5 rounded hover:bg-[var(--bg)] flex items-center justify-center text-[var(--i)]"
              title="Align Bottom"
            >
              <span className="font-mono text-[10px] font-bold">Bot</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => distributeSelected("horizontal")}
              className="flex-1 rounded-lg border border-[var(--h)] bg-[var(--bg)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--s)]"
            >
              Distribute H
            </button>
            <button
              type="button"
              onClick={() => distributeSelected("vertical")}
              className="flex-1 rounded-lg border border-[var(--h)] bg-[var(--bg)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--s)]"
            >
              Distribute V
            </button>
          </div>
        </div>
      )}

      {/* Position & Dimensions Inputs */}
      {!isConnector && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
            Layout & Geometry
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between rounded-lg border border-[var(--h)] bg-[var(--s)] px-2 py-1 text-[11px]">
              <span className="text-[var(--m)] font-mono">W</span>
              <input
                type="number"
                value={Math.round(first.width)}
                onChange={(e) =>
                  updateSelectedElements({ width: Number(e.target.value) })
                }
                className="w-16 bg-transparent text-right font-mono font-semibold text-[var(--i)] outline-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--h)] bg-[var(--s)] px-2 py-1 text-[11px]">
              <span className="text-[var(--m)] font-mono">H</span>
              <input
                type="number"
                value={Math.round(first.height)}
                onChange={(e) =>
                  updateSelectedElements({ height: Number(e.target.value) })
                }
                className="w-16 bg-transparent text-right font-mono font-semibold text-[var(--i)] outline-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--h)] bg-[var(--s)] px-2 py-1 text-[11px]">
              <span className="text-[var(--m)] font-mono">X</span>
              <input
                type="number"
                value={Math.round(first.x)}
                onChange={(e) =>
                  updateSelectedElements({ x: Number(e.target.value) })
                }
                className="w-16 bg-transparent text-right font-mono font-semibold text-[var(--i)] outline-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--h)] bg-[var(--s)] px-2 py-1 text-[11px]">
              <span className="text-[var(--m)] font-mono">Y</span>
              <input
                type="number"
                value={Math.round(first.y)}
                onChange={(e) =>
                  updateSelectedElements({ y: Number(e.target.value) })
                }
                className="w-16 bg-transparent text-right font-mono font-semibold text-[var(--i)] outline-none"
              />
            </label>
          </div>
        </div>
      )}

      {/* Colors & Fill */}
      {!isConnector && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
            Fill Color
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => updateSelectedElements({ fill: "transparent" })}
              className={`h-5 w-5 rounded-md border text-[9px] flex items-center justify-center font-bold ${
                first.fill === "transparent" ? "ring-2 ring-[var(--i)]" : ""
              }`}
              title="Transparent"
            >
              ∅
            </button>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateSelectedElements({ fill: c })}
                className={`h-5 w-5 rounded-md border transition-transform hover:scale-115 ${
                  first.fill === c ? "ring-2 ring-[var(--i)] scale-110" : ""
                }`}
                style={{ backgroundColor: c, borderColor: "var(--h)" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke / Border */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
          <span>Border & Stroke</span>
          <span>{first.strokeWidth}px</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateSelectedElements({ stroke: c })}
              className={`h-5 w-5 rounded-md border transition-transform hover:scale-115 ${
                first.stroke === c ? "ring-2 ring-[var(--i)] scale-110" : ""
              }`}
              style={{ backgroundColor: c, borderColor: "var(--h)" }}
            />
          ))}
        </div>

        {/* Stroke styles & width */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--h)] bg-[var(--s)] p-1 text-[11px]">
            <button
              type="button"
              onClick={() => updateSelectedElements({ strokeStyle: "solid" })}
              className={`px-2 py-0.5 rounded ${
                first.strokeStyle === "solid"
                  ? "bg-[var(--bg)] font-bold text-[var(--i)] shadow-2xs"
                  : "text-[var(--m)]"
              }`}
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => updateSelectedElements({ strokeStyle: "dashed" })}
              className={`px-2 py-0.5 rounded ${
                first.strokeStyle === "dashed"
                  ? "bg-[var(--bg)] font-bold text-[var(--i)] shadow-2xs"
                  : "text-[var(--m)]"
              }`}
            >
              Dashed
            </button>
            <button
              type="button"
              onClick={() => updateSelectedElements({ strokeStyle: "dotted" })}
              className={`px-2 py-0.5 rounded ${
                first.strokeStyle === "dotted"
                  ? "bg-[var(--bg)] font-bold text-[var(--i)] shadow-2xs"
                  : "text-[var(--m)]"
              }`}
            >
              Dotted
            </button>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => updateSelectedElements({ strokeWidth: w })}
                className={`h-6 w-6 rounded-md border text-[10px] font-mono font-bold ${
                  first.strokeWidth === w
                    ? "bg-[var(--p)] text-[var(--pt)]"
                    : "border-[var(--h)] text-[var(--m)]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONNECTOR SPECIFIC SETTINGS */}
      {isConnector && (
        <div className="space-y-2 border-t border-[var(--h)] pt-2.5">
          <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
            Connector Routing
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--h)] bg-[var(--s)] p-1">
            <button
              type="button"
              onClick={() => updateSelectedElements({ routing: "straight" })}
              className={`py-1 text-center font-medium rounded-lg ${
                first.routing === "straight"
                  ? "bg-[var(--bg)] text-[var(--i)] shadow-2xs"
                  : "text-[var(--m)]"
              }`}
            >
              Straight
            </button>
            <button
              type="button"
              onClick={() => updateSelectedElements({ routing: "elbow" })}
              className={`py-1 text-center font-medium rounded-lg ${
                first.routing === "elbow"
                  ? "bg-[var(--bg)] text-[var(--i)] shadow-2xs"
                  : "text-[var(--m)]"
              }`}
            >
              Elbow
            </button>
            <button
              type="button"
              onClick={() => updateSelectedElements({ routing: "curved" })}
              className={`py-1 text-center font-medium rounded-lg ${
                first.routing === "curved" || !first.routing
                  ? "bg-[var(--bg)] text-[var(--i)] shadow-2xs"
                  : "text-[var(--m)]"
              }`}
            >
              Curved
            </button>
          </div>

          {/* Line Arrowhead */}
          <div>
            <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider mb-1">
              Line Arrowhead
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--h)] bg-[var(--s)] p-1 text-xs">
              <button
                type="button"
                onClick={() => updateSelectedElements({ endArrow: "none" })}
                className={`py-1 text-center font-medium rounded-lg ${
                  first.endArrow === "none" || !first.endArrow
                    ? "bg-[var(--bg)] text-[var(--i)] shadow-2xs"
                    : "text-[var(--m)]"
                }`}
              >
                None (Plain Line)
              </button>
              <button
                type="button"
                onClick={() => updateSelectedElements({ endArrow: "arrow" })}
                className={`py-1 text-center font-medium rounded-lg ${
                  first.endArrow === "arrow"
                    ? "bg-[var(--bg)] text-[var(--i)] shadow-2xs"
                    : "text-[var(--m)]"
                }`}
              >
                Arrow End
              </button>
            </div>
          </div>

          {/* Connector Label / Description */}
          <div>
            <label className="mb-1 block text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
              Label (e.g. Yes / No)
            </label>
            <input
              type="text"
              value={first.text || first.connectorLabel || ""}
              onChange={(e) =>
                updateSelectedElements({
                  text: e.target.value,
                  connectorLabel: e.target.value,
                })
              }
              placeholder="e.g. Yes, No, 200 OK..."
              className="w-full rounded-lg border border-[var(--h)] bg-[var(--s)] px-2.5 py-1.5 text-xs text-[var(--i)] outline-none overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
          </div>
        </div>
      )}

      {/* Typography for shapes & text */}
      {!isConnector && (
        <div className="space-y-1.5 border-t border-[var(--h)] pt-2.5">
          <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
            Typography
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-lg border border-[var(--h)] bg-[var(--s)] p-1">
              <button
                type="button"
                onClick={() => updateSelectedElements({ bold: !first.bold })}
                className={`p-1 rounded ${first.bold ? "bg-[var(--bg)] text-[var(--i)]" : "text-[var(--m)]"}`}
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSelectedElements({ italic: !first.italic })
                }
                className={`p-1 rounded ${first.italic ? "bg-[var(--bg)] text-[var(--i)]" : "text-[var(--m)]"}`}
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSelectedElements({ underline: !first.underline })
                }
                className={`p-1 rounded ${first.underline ? "bg-[var(--bg)] text-[var(--i)]" : "text-[var(--m)]"}`}
                title="Underline"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center rounded-lg border border-[var(--h)] bg-[var(--s)] p-1">
              <button
                type="button"
                onClick={() => updateSelectedElements({ textAlign: "left" })}
                className={`p-1 rounded ${first.textAlign === "left" ? "bg-[var(--bg)] text-[var(--i)]" : "text-[var(--m)]"}`}
                title="Align Left"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateSelectedElements({ textAlign: "center" })}
                className={`p-1 rounded ${first.textAlign === "center" ? "bg-[var(--bg)] text-[var(--i)]" : "text-[var(--m)]"}`}
                title="Align Center"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateSelectedElements({ textAlign: "right" })}
                className={`p-1 rounded ${first.textAlign === "right" ? "bg-[var(--bg)] text-[var(--i)]" : "text-[var(--m)]"}`}
                title="Align Right"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 4 Big Visible Text Sizes */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-semibold text-[var(--m)]">
              Text Size
            </span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: "S", size: 14, title: "Small (14px)" },
                { label: "M", size: 18, title: "Medium (18px)" },
                { label: "L", size: 24, title: "Large (24px)" },
                { label: "XL", size: 32, title: "Extra Large (32px)" },
              ].map(({ label, size, title }) => (
                <button
                  key={size}
                  type="button"
                  title={title}
                  onClick={() => {
                    const { px, py } = getElementTextPadding(first);
                    const maxW = Math.max(20, first.width - px * 2);
                    const wrapped = wrapText(
                      first.text || "",
                      maxW,
                      size,
                      first.fontFamily,
                    );
                    const lineHeight = size * 1.35;
                    const neededH = wrapped.length * lineHeight + py * 2;
                    const newH = Math.max(first.height, Math.round(neededH));
                    updateSelectedElements({ fontSize: size, height: newH });
                  }}
                  className={`py-1 text-center font-bold text-xs rounded-lg border transition-all ${
                    (first.fontSize || 18) === size
                      ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)] shadow-2xs"
                      : "border-[var(--h)] text-[var(--m)] hover:text-[var(--i)] bg-[var(--s)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-semibold text-[var(--m)]">
              Text Color
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  updateSelectedElements({ textColor: "var(--i)" })
                }
                className={`h-5 w-5 rounded-md border text-[9px] flex items-center justify-center font-bold ${
                  first.textColor === "var(--i)" || !first.textColor
                    ? "ring-2 ring-[var(--i)]"
                    : ""
                }`}
                title="Default (Theme contrast: white in dark, black in light)"
              >
                Auto
              </button>
              {[
                "#ffffff",
                "#111111",
                "#3b82f6",
                "#10b981",
                "#ef4444",
                "#f59e0b",
                "#8b5cf6",
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateSelectedElements({ textColor: c })}
                  className={`h-5 w-5 rounded-md border transition-transform hover:scale-115 ${
                    first.textColor === c
                      ? "ring-2 ring-[var(--i)] scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: c, borderColor: "var(--h)" }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Layers & Grouping */}
      <div className="space-y-1.5 border-t border-[var(--h)] pt-2.5">
        <div className="text-[10px] font-bold text-[var(--m)] uppercase tracking-wider">
          Layers & Hierarchy
        </div>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={bringToFront}
            className="flex items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--s)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--bg)]"
            title="Bring to Front"
          >
            Front
          </button>
          <button
            type="button"
            onClick={bringForward}
            className="flex items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--s)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--bg)]"
            title="Forward One"
          >
            Forward
          </button>
          <button
            type="button"
            onClick={sendBackward}
            className="flex items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--s)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--bg)]"
            title="Backward One"
          >
            Backward
          </button>
          <button
            type="button"
            onClick={sendToBack}
            className="flex items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--s)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--bg)]"
            title="Send to Back"
          >
            Back
          </button>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={groupSelected}
            disabled={!isMulti}
            className="flex-1 rounded-lg border border-[var(--h)] bg-[var(--s)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--bg)] disabled:opacity-40"
            title="Group Selected (Ctrl+G)"
          >
            Group
          </button>
          <button
            type="button"
            onClick={ungroupSelected}
            disabled={!anyGrouped}
            className="flex-1 rounded-lg border border-[var(--h)] bg-[var(--s)] py-1.5 text-[11px] font-medium text-[var(--i)] hover:bg-[var(--bg)] disabled:opacity-40"
            title="Ungroup (Ctrl+Shift+G)"
          >
            Ungroup
          </button>
          <button
            type="button"
            onClick={toggleLockSelected}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              anyLocked
                ? "border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                : "border-[var(--h)] bg-[var(--s)] text-[var(--i)] hover:bg-[var(--bg)]"
            }`}
            title={
              anyLocked ? "Unlock Elements (Ctrl+L)" : "Lock Elements (Ctrl+L)"
            }
          >
            {anyLocked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
