"use client";

// High-fidelity SVG shape renderers for all flowchart and general shapes
import { DiagramElement } from "./types";
import { getIconItem } from "./icons";
import { wrapText, getElementTextPadding } from "./geometry";

interface ShapeRendererProps {
  element: DiagramElement;
  isSelected?: boolean;
  isEditing?: boolean;
}

export function ShapeRenderer({
  element,
  isSelected,
  isEditing,
}: ShapeRendererProps) {
  const {
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    strokeStyle,
    cornerRadius = 6,
    opacity = 1,
  } = element;

  const strokeDash =
    strokeStyle === "dashed"
      ? "8 6"
      : strokeStyle === "dotted"
        ? "3 3"
        : undefined;

  // Render SVG Path based on shape type
  const renderShapePath = () => {
    switch (element.type) {
      // FLOWCHART SHAPES
      case "pill": {
        const radius = Math.min(width, height) / 2;
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={radius}
            ry={radius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "decision": {
        // Diamond
        const points = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
        return (
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "io": {
        // Parallelogram (slanted left/right)
        const slant = Math.min(width * 0.2, 30);
        const points = `${slant},0 ${width},0 ${width - slant},${height} 0,${height}`;
        return (
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "document": {
        // Wavy bottom document
        const wave = height * 0.12;
        const d = `M 0 0 L ${width} 0 L ${width} ${height - wave} Q ${width * 0.75} ${height} ${width * 0.5} ${height - wave} Q ${width * 0.25} ${height - wave * 2} 0 ${height - wave} Z`;
        return (
          <path
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "cylinder": {
        // Database cylinder
        const capH = Math.min(height * 0.25, 24);
        return (
          <g>
            <path
              d={`M 0 ${capH} L 0 ${height - capH} A ${width / 2} ${capH} 0 0 0 ${width} ${height - capH} L ${width} ${capH} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
            <ellipse
              cx={width / 2}
              cy={height - capH}
              rx={width / 2}
              ry={capH}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
            <ellipse
              cx={width / 2}
              cy={capH}
              rx={width / 2}
              ry={capH}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
          </g>
        );
      }

      case "circle": {
        return (
          <circle
            cx={width / 2}
            cy={height / 2}
            r={Math.min(width, height) / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "ellipse": {
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2}
            ry={height / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "triangle": {
        const points = `${width / 2},0 ${width},${height} 0,${height}`;
        return (
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "sticky_note": {
        const fold = 18;
        return (
          <g
            filter={
              element.shadow !== false ? "url(#sticky-shadow)" : undefined
            }
          >
            <path
              d={`M 0 0 L ${width} 0 L ${width} ${height - fold} L ${width - fold} ${height} L 0 ${height} Z`}
              fill={fill || "#fef08a"}
              stroke={stroke || "#eab308"}
              strokeWidth={strokeWidth || 1}
            />
            <path
              d={`M ${width - fold} ${height - fold} L ${width} ${height - fold} L ${width - fold} ${height} Z`}
              fill="#eab308"
              opacity={0.4}
            />
          </g>
        );
      }

      case "swimlane": {
        const lanes = element.lanes || [];
        const isHoriz = element.orientation !== "vertical";
        let curOffset = 0;

        return (
          <g>
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={cornerRadius}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            {lanes.map((lane, idx) => {
              const laneStart = curOffset;
              curOffset += lane.size;

              if (isHoriz) {
                return (
                  <g key={lane.id}>
                    {/* Header band */}
                    <rect
                      x={0}
                      y={laneStart}
                      width={120}
                      height={lane.size}
                      fill={lane.color ? `${lane.color}15` : "#e5e7eb30"}
                      stroke={stroke}
                      strokeWidth={1}
                    />
                    <text
                      x={60}
                      y={laneStart + lane.size / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight={600}
                      fill="var(--i)"
                    >
                      {lane.title}
                    </text>
                    {idx > 0 && (
                      <line
                        x1={0}
                        y1={laneStart}
                        x2={width}
                        y2={laneStart}
                        stroke={stroke}
                        strokeWidth={1}
                      />
                    )}
                  </g>
                );
              }
              return (
                <g key={lane.id}>
                  <rect
                    x={laneStart}
                    y={0}
                    width={lane.size}
                    height={40}
                    fill={lane.color ? `${lane.color}15` : "#e5e7eb30"}
                    stroke={stroke}
                    strokeWidth={1}
                  />
                  <text
                    x={laneStart + lane.size / 2}
                    y={20}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--i)"
                  >
                    {lane.title}
                  </text>
                  {idx > 0 && (
                    <line
                      x1={laneStart}
                      y1={0}
                      x2={laneStart}
                      y2={height}
                      stroke={stroke}
                      strokeWidth={1}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      }

      case "container":
      case "frame": {
        return (
          <g>
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={cornerRadius}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
            {element.text && !isEditing && (
              <text
                x={14}
                y={22}
                fontSize={12}
                fontWeight={600}
                fill={element.textColor || stroke}
                fontFamily="sans-serif"
              >
                {element.text}
              </text>
            )}
          </g>
        );
      }

      case "text": {
        if (!stroke || stroke === "transparent" || stroke === "none") {
          return null;
        }
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={cornerRadius || 0}
            fill={fill && fill !== "none" ? fill : "transparent"}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case "icon": {
        const item = getIconItem(element.iconName);
        // Default stroke color is white in dark mode and black in light mode (var(--i)), with transparent fill and no border
        const iconColor = stroke || "var(--i)";

        return (
          <g className="cursor-pointer select-none">
            {/* Full-surface transparent hit area so icon is easily clickable and draggable anywhere */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="transparent"
              stroke="none"
              className="pointer-events-auto"
            />
            {item?.source === "simple-icons" && item.path ? (
              <svg
                x={0}
                y={0}
                width={width}
                height={height}
                viewBox="0 0 24 24"
                preserveAspectRatio="none"
                className="overflow-visible pointer-events-auto"
              >
                <path d={item.path} fill={iconColor} />
              </svg>
            ) : item?.icon ? (
              <svg
                x={0}
                y={0}
                width={width}
                height={height}
                viewBox="0 0 24 24"
                preserveAspectRatio="none"
                className="overflow-visible pointer-events-auto"
              >
                <item.icon
                  width="100%"
                  height="100%"
                  stroke={iconColor}
                  fill="none"
                  strokeWidth={element.strokeWidth || 2}
                />
              </svg>
            ) : null}
          </g>
        );
      }

      // Default process rectangle
      default: {
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={cornerRadius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }
    }
  };

  // Text inside shape with auto-enter wrap and safe stroke padding
  const renderText = () => {
    if (
      isEditing ||
      !element.text ||
      element.type === "container" ||
      element.type === "frame"
    )
      return null;

    const { px, py } = getElementTextPadding(element);
    const maxTextWidth = Math.max(20, width - px * 2);
    const fontSize = element.fontSize || 13;
    const fontFamily = element.fontFamily || "Inter, sans-serif";
    const lineHeight = fontSize * 1.35;

    // Auto-enter / word wrap text to prevent overflowing in x direction
    const lines = wrapText(element.text, maxTextWidth, fontSize, fontFamily);
    const totalTextH = lines.length * lineHeight;

    let startY = (height - totalTextH) / 2 + fontSize * 0.9;
    if (element.verticalAlign === "top") startY = py + fontSize * 0.9;
    if (element.verticalAlign === "bottom")
      startY = height - totalTextH + fontSize * 0.9 - py;

    let textAnchor: "middle" | "start" | "end" = "middle";
    let startX = width / 2;
    if (element.textAlign === "left") {
      textAnchor = "start";
      startX = px;
    } else if (element.textAlign === "right") {
      textAnchor = "end";
      startX = width - px;
    }

    return (
      <text
        fill={element.textColor || "var(--i)"}
        fontSize={fontSize}
        fontWeight={element.bold ? 700 : 500}
        fontStyle={element.italic ? "italic" : "normal"}
        textDecoration={
          element.underline
            ? "underline"
            : element.strike
              ? "line-through"
              : undefined
        }
        fontFamily={fontFamily}
        textAnchor={textAnchor}
      >
        {lines.map((line, idx) => (
          <tspan key={idx} x={startX} y={startY + idx * lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <g
      opacity={opacity}
      transform={`rotate(${element.rotation}, ${width / 2}, ${height / 2})`}
    >
      {renderShapePath()}
      {renderText()}
    </g>
  );
}
