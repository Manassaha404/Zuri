// Comprehensive type definitions for Eraser-grade visual flowchart and diagram studio

export type AnchorSide =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type BasicShapeType =
  | "pill" // Start / End (rounded pill)
  | "process" // Standard Rectangle
  | "rounded_rect" // Rounded Rectangle
  | "circle" // Circle
  | "ellipse" // Ellipse
  | "decision" // Diamond
  | "triangle" // Triangle
  | "cylinder" // Database cylinder
  | "document" // Wavy bottom Document
  | "io"; // Parallelogram (Input / Output)

export type FlowchartShapeType = BasicShapeType;
export type GeneralShapeType = BasicShapeType;

export type ElementType =
  | BasicShapeType
  | "rect"
  | "line"
  | "sticky_note"
  | "text"
  | "freehand"
  | "image"
  | "icon"
  | "connector"
  | "container"
  | "swimlane"
  | "frame";

export type ConnectorRouting = "straight" | "curved" | "elbow";
export type ArrowheadType =
  | "none"
  | "arrow"
  | "open_arrow"
  | "triangle"
  | "circle"
  | "diamond"
  | "bar";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type TextAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";

export interface FreehandPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface SwimlaneLane {
  id: string;
  title: string;
  size: number; // width or height depending on orientation
  color?: string;
}

export interface DiagramElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  zIndex: number;
  isLocked?: boolean;
  groupId?: string | null;
  containerId?: string | null; // parent container/swimlane/frame

  // Visual styling
  fill: string;
  fillOpacity?: number;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  strokeOpacity?: number;
  cornerRadius?: number;
  shadow?: boolean;
  opacity?: number;

  // Text content
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  lineHeight?: number;
  autoShrinkText?: boolean;

  // Connectors specific
  from?: {
    id: string;
    side?: AnchorSide;
    point?: { x: number; y: number };
    auto?: boolean;
  } | null;
  to?: {
    id: string;
    side?: AnchorSide;
    point?: { x: number; y: number };
    auto?: boolean;
  } | null;
  routing?: ConnectorRouting;
  startArrow?: ArrowheadType;
  endArrow?: ArrowheadType;
  connectorLabel?: string;
  labelPosition?: number; // 0 to 1 along path
  lineJump?: boolean;
  elbowOffset?: number; // drag handle offset for orthogonal elbow bend

  // Freehand specific
  points?: FreehandPoint[];

  // Image & Icon specific
  imageUrl?: string;
  iconName?: string;
  customSvg?: string;

  // Swimlane / Frame specific
  orientation?: "horizontal" | "vertical";
  lanes?: SwimlaneLane[];
}

export type CanvasTool =
  | "select"
  | "hand"
  | "shape"
  | "line"
  | "connector"
  | "text"
  | "sticky"
  | "pen"
  | "eraser"
  | "image"
  | "icon"
  | "container"
  | "swimlane"
  | "frame";

export interface SmartGuide {
  type: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
  label?: string;
}

export interface CanvasComment {
  id: string;
  x: number;
  y: number;
  elementId?: string | null;
  author: string;
  authorColor: string;
  createdAt: string;
  content: string;
  resolved: boolean;
  replies: Array<{
    id: string;
    author: string;
    authorColor: string;
    createdAt: string;
    content: string;
  }>;
}

export interface DiagramDocument {
  id: string;
  title: string;
  elements: DiagramElement[];
  comments: CanvasComment[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface VersionSnapshot {
  id: string;
  timestamp: string;
  title: string;
  elementCount: number;
  elements: DiagramElement[];
}
