// Geometry, anchor calculation, smart guides, and connector path routing
import {
  DiagramElement,
  AnchorSide,
  ConnectorRouting,
  SmartGuide,
} from "./types";

export interface Point {
  x: number;
  y: number;
}

// Get the connection anchor coordinates for any element based on side
export function getElementAnchor(
  element: DiagramElement,
  side: AnchorSide,
): Point {
  const { x, y, width, height, rotation = 0 } = element;
  const midX = x + width / 2;
  const midY = y + height / 2;

  let pt: Point;
  switch (side) {
    case "top":
      pt = { x: midX, y };
      break;
    case "bottom":
      pt = { x: midX, y: y + height };
      break;
    case "left":
      pt = { x, y: midY };
      break;
    case "right":
      pt = { x: x + width, y: midY };
      break;
    case "top-left":
      pt = { x, y };
      break;
    case "top-right":
      pt = { x: x + width, y };
      break;
    case "bottom-left":
      pt = { x, y: y + height };
      break;
    case "bottom-right":
      pt = { x: x + width, y: y + height };
      break;
    default:
      pt = { x: midX, y: midY };
      break;
  }

  if (!rotation) return pt;

  // Rotate anchor around element center
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = pt.x - midX;
  const dy = pt.y - midY;

  return {
    x: midX + dx * cos - dy * sin,
    y: midY + dx * sin + dy * cos,
  };
}

// Calculate the closest point on the stroke / outline of an element
export function getClosestPointOnElementPerimeter(
  element: DiagramElement,
  pt: Point,
): { point: Point; side: AnchorSide; distance: number } {
  const { x, y, width, height } = element;
  const left = x;
  const right = x + width;
  const top = y;
  const bottom = y + height;

  const clampedX = Math.max(left, Math.min(right, pt.x));
  const clampedY = Math.max(top, Math.min(bottom, pt.y));

  const isOutside = pt.x < left || pt.x > right || pt.y < top || pt.y > bottom;

  let snapSide: AnchorSide = "right";
  let snapPt: Point = { x: clampedX, y: clampedY };
  let distance: number;

  if (isOutside) {
    distance = Math.hypot(pt.x - clampedX, pt.y - clampedY);

    const dLeft = Math.abs(clampedX - left);
    const dRight = Math.abs(clampedX - right);
    const dTop = Math.abs(clampedY - top);
    const dBottom = Math.abs(clampedY - bottom);

    if (pt.x >= right) snapSide = "right";
    else if (pt.x <= left) snapSide = "left";
    else if (pt.y <= top) snapSide = "top";
    else if (pt.y >= bottom) snapSide = "bottom";
    else {
      const minD = Math.min(dLeft, dRight, dTop, dBottom);
      if (minD === dRight) snapSide = "right";
      else if (minD === dLeft) snapSide = "left";
      else if (minD === dTop) snapSide = "top";
      else snapSide = "bottom";
    }
  } else {
    const dLeft = pt.x - left;
    const dRight = right - pt.x;
    const dTop = pt.y - top;
    const dBottom = bottom - pt.y;

    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    distance = minD;

    if (minD === dLeft) {
      snapSide = "left";
      snapPt = { x: left, y: pt.y };
    } else if (minD === dRight) {
      snapSide = "right";
      snapPt = { x: right, y: pt.y };
    } else if (minD === dTop) {
      snapSide = "top";
      snapPt = { x: pt.x, y: top };
    } else {
      snapSide = "bottom";
      snapPt = { x: pt.x, y: bottom };
    }
  }

  // Snap to center anchor if close to middle of the side
  const centerAnchor = getElementAnchor(element, snapSide);
  const distToCenter = Math.hypot(
    snapPt.x - centerAnchor.x,
    snapPt.y - centerAnchor.y,
  );
  if (distToCenter < 28) {
    snapPt = centerAnchor;
  }

  return { point: snapPt, side: snapSide, distance };
}

// Find closest anchor side on an element to a given point
export function getClosestAnchor(
  element: DiagramElement,
  pt: Point,
): { side: AnchorSide; point: Point; distance: number } {
  return getClosestPointOnElementPerimeter(element, pt);
}

// Magnetically detect closest point on stroke / outline of candidate elements within radius
export function findMagneticAnchor(
  elements: DiagramElement[],
  pt: Point,
  excludeId?: string,
  magneticThreshold = 55,
): {
  elementId: string;
  side: AnchorSide;
  x: number;
  y: number;
  isCenterAnchor: boolean;
} | null {
  let bestCandidate: {
    elementId: string;
    side: AnchorSide;
    point: Point;
    distance: number;
    isCenterAnchor: boolean;
  } | null = null;

  for (const el of elements) {
    if (
      el.id === excludeId ||
      el.type === "connector" ||
      el.type === "freehand"
    )
      continue;

    const { point, side, distance } = getClosestPointOnElementPerimeter(el, pt);

    if (distance <= magneticThreshold) {
      if (!bestCandidate || distance < bestCandidate.distance) {
        const centerAnchor = getElementAnchor(el, side);
        const isCenter =
          Math.hypot(point.x - centerAnchor.x, point.y - centerAnchor.y) < 6;
        bestCandidate = {
          elementId: el.id,
          side,
          point,
          distance,
          isCenterAnchor: isCenter,
        };
      }
    }
  }

  if (bestCandidate) {
    return {
      elementId: bestCandidate.elementId,
      side: bestCandidate.side,
      x: bestCandidate.point.x,
      y: bestCandidate.point.y,
      isCenterAnchor: bestCandidate.isCenterAnchor,
    };
  }

  return null;
}

// Dynamically calculate optimal facing anchor sides between two connected elements
export function getOptimalAnchorSides(
  fromEl: DiagramElement,
  toEl: DiagramElement,
): { fromSide: AnchorSide; toSide: AnchorSide } {
  const fCenter = {
    x: fromEl.x + fromEl.width / 2,
    y: fromEl.y + fromEl.height / 2,
  };
  const tCenter = { x: toEl.x + toEl.width / 2, y: toEl.y + toEl.height / 2 };

  const dx = tCenter.x - fCenter.x;
  const dy = tCenter.y - fCenter.y;

  // Check bounds overlap
  const horizontalOverlap =
    fromEl.x < toEl.x + toEl.width && fromEl.x + fromEl.width > toEl.x;
  const verticalOverlap =
    fromEl.y < toEl.y + toEl.height && fromEl.y + fromEl.height > toEl.y;

  // If one is directly above/below the other with vertical alignment
  if (horizontalOverlap) {
    if (dy > 0) return { fromSide: "bottom", toSide: "top" };
    return { fromSide: "top", toSide: "bottom" };
  }

  // If one is directly left/right with horizontal alignment
  if (verticalOverlap) {
    if (dx > 0) return { fromSide: "right", toSide: "left" };
    return { fromSide: "left", toSide: "right" };
  }

  // Diagonal positioning: evaluate cardinal side pairs
  const candidatePairs: Array<{ fromSide: AnchorSide; toSide: AnchorSide }> = [
    { fromSide: "right", toSide: "left" },
    { fromSide: "left", toSide: "right" },
    { fromSide: "bottom", toSide: "top" },
    { fromSide: "top", toSide: "bottom" },
    { fromSide: dx > 0 ? "right" : "left", toSide: dy > 0 ? "top" : "bottom" },
    { fromSide: dy > 0 ? "bottom" : "top", toSide: dx > 0 ? "left" : "right" },
  ];

  let bestPair = candidatePairs[0]!;
  let minCost = Infinity;

  for (const pair of candidatePairs) {
    const p1 = getElementAnchor(fromEl, pair.fromSide);
    const p2 = getElementAnchor(toEl, pair.toSide);
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    let penalty = 0;
    if (pair.fromSide === "right" && p2.x < p1.x) penalty += 500;
    if (pair.fromSide === "left" && p2.x > p1.x) penalty += 500;
    if (pair.fromSide === "bottom" && p2.y < p1.y) penalty += 500;
    if (pair.fromSide === "top" && p2.y > p1.y) penalty += 500;

    if (pair.toSide === "left" && p2.x < p1.x) penalty += 500;
    if (pair.toSide === "right" && p2.x > p1.x) penalty += 500;
    if (pair.toSide === "top" && p2.y < p1.y) penalty += 500;
    if (pair.toSide === "bottom" && p2.y > p1.y) penalty += 500;

    const cost = dist + penalty;
    if (cost < minCost) {
      minCost = cost;
      bestPair = pair;
    }
  }

  return bestPair;
}

// Helper to create rounded fillet elbow paths
export function createRoundedElbowPath(points: Point[], radius = 14): string {
  if (points.length < 2) return "";
  if (points.length === 2)
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;

  let path = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    const next = points[i + 1]!;

    const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const d2 = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(radius, d1 / 2, d2 / 2);

    if (r < 1) {
      path += ` L ${cur.x} ${cur.y}`;
      continue;
    }

    const v1x = (prev.x - cur.x) / d1;
    const v1y = (prev.y - cur.y) / d1;
    const pBefore = { x: cur.x + v1x * r, y: cur.y + v1y * r };

    const v2x = (next.x - cur.x) / d2;
    const v2y = (next.y - cur.y) / d2;
    const pAfter = { x: cur.x + v2x * r, y: cur.y + v2y * r };

    path += ` L ${pBefore.x} ${pBefore.y} Q ${cur.x} ${cur.y} ${pAfter.x} ${pAfter.y}`;
  }

  const last = points[points.length - 1]!;
  path += ` L ${last.x} ${last.y}`;
  return path;
}

// Generate SVG path for connectors: curved (default), straight, or smart auto-adjusting elbow
export function snapPointToGeometricAngle(
  start: Point,
  current: Point,
  stepDegrees = 45,
): Point {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return current;

  const angle = Math.atan2(dy, dx);
  const stepRad = (stepDegrees * Math.PI) / 180;
  const snappedAngle = Math.round(angle / stepRad) * stepRad;
  const deg = Math.round(((snappedAngle * 180) / Math.PI + 360) % 360);

  if (deg === 0 || deg === 180) {
    return { x: start.x + (deg === 0 ? distance : -distance), y: start.y };
  }
  if (deg === 90 || deg === 270) {
    return { x: start.x, y: start.y + (deg === 90 ? distance : -distance) };
  }
  const diagDist = distance * Math.SQRT1_2;
  const signX = Math.cos(snappedAngle) > 0 ? 1 : -1;
  const signY = Math.sin(snappedAngle) > 0 ? 1 : -1;
  return {
    x: start.x + signX * diagDist,
    y: start.y + signY * diagDist,
  };
}

export function generateConnectorPath(
  start: Point,
  end: Point,
  routing: ConnectorRouting = "curved",
  startSide?: AnchorSide,
  endSide?: AnchorSide,
  elbowOffset?: number,
): string {
  if (routing === "straight") {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const sSide: AnchorSide =
    startSide ||
    (Math.abs(dx) >= Math.abs(dy)
      ? dx >= 0
        ? "right"
        : "left"
      : dy >= 0
        ? "bottom"
        : "top");
  const eSide: AnchorSide =
    endSide ||
    (Math.abs(dx) >= Math.abs(dy)
      ? dx >= 0
        ? "left"
        : "right"
      : dy >= 0
        ? "top"
        : "bottom");

  if (routing === "curved") {
    const dist = Math.hypot(dx, dy);
    const tangentLen = Math.max(30, Math.min(dist * 0.45, 160));

    let cp1x = start.x;
    let cp1y = start.y;
    let cp2x = end.x;
    let cp2y = end.y;

    if (sSide === "left") cp1x -= tangentLen;
    else if (sSide === "right") cp1x += tangentLen;
    else if (sSide === "top") cp1y -= tangentLen;
    else if (sSide === "bottom") cp1y += tangentLen;

    if (eSide === "left") cp2x -= tangentLen;
    else if (eSide === "right") cp2x += tangentLen;
    else if (eSide === "top") cp2y -= tangentLen;
    else if (eSide === "bottom") cp2y += tangentLen;

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  }

  // --- SMART ORTHOGONAL ELBOW ROUTING ---
  // Check 1: Perfectly straight aligned connections (0 bends)
  if (sSide === "right" && eSide === "left" && Math.abs(dy) <= 4 && dx > 0) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  if (sSide === "left" && eSide === "right" && Math.abs(dy) <= 4 && dx < 0) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  if (sSide === "bottom" && eSide === "top" && Math.abs(dx) <= 4 && dy > 0) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  if (sSide === "top" && eSide === "bottom" && Math.abs(dx) <= 4 && dy < 0) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const margin = 24;

  // Check 2: Single 90-degree bend (L-shape)
  if (sSide === "right" && eSide === "top" && dx >= 10 && dy >= 10) {
    return createRoundedElbowPath([start, { x: end.x, y: start.y }, end], 14);
  }
  if (sSide === "right" && eSide === "bottom" && dx >= 10 && dy <= -10) {
    return createRoundedElbowPath([start, { x: end.x, y: start.y }, end], 14);
  }
  if (sSide === "left" && eSide === "top" && dx <= -10 && dy >= 10) {
    return createRoundedElbowPath([start, { x: end.x, y: start.y }, end], 14);
  }
  if (sSide === "left" && eSide === "bottom" && dx <= -10 && dy <= -10) {
    return createRoundedElbowPath([start, { x: end.x, y: start.y }, end], 14);
  }
  if (sSide === "bottom" && eSide === "left" && dy >= 10 && dx >= 10) {
    return createRoundedElbowPath([start, { x: start.x, y: end.y }, end], 14);
  }
  if (sSide === "bottom" && eSide === "right" && dy >= 10 && dx <= -10) {
    return createRoundedElbowPath([start, { x: start.x, y: end.y }, end], 14);
  }
  if (sSide === "top" && eSide === "left" && dy <= -10 && dx >= 10) {
    return createRoundedElbowPath([start, { x: start.x, y: end.y }, end], 14);
  }
  if (sSide === "top" && eSide === "right" && dy <= -10 && dx <= -10) {
    return createRoundedElbowPath([start, { x: start.x, y: end.y }, end], 14);
  }

  // Check 3: Facing parallel sides (S-shape / 2 bends)
  if (sSide === "right" && eSide === "left") {
    if (dx >= margin * 1.5) {
      const midX =
        elbowOffset !== undefined
          ? start.x + elbowOffset
          : (start.x + end.x) / 2;
      return createRoundedElbowPath(
        [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end],
        14,
      );
    }
    const p1x = start.x + margin;
    const p2x = end.x - margin;
    const midY =
      Math.abs(dy) < 30 ? Math.min(start.y, end.y) - 35 : (start.y + end.y) / 2;
    return createRoundedElbowPath(
      [
        start,
        { x: p1x, y: start.y },
        { x: p1x, y: midY },
        { x: p2x, y: midY },
        { x: p2x, y: end.y },
        end,
      ],
      14,
    );
  }

  if (sSide === "left" && eSide === "right") {
    if (dx <= -margin * 1.5) {
      const midX =
        elbowOffset !== undefined
          ? start.x - elbowOffset
          : (start.x + end.x) / 2;
      return createRoundedElbowPath(
        [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end],
        14,
      );
    }
    const p1x = start.x - margin;
    const p2x = end.x + margin;
    const midY =
      Math.abs(dy) < 30 ? Math.min(start.y, end.y) - 35 : (start.y + end.y) / 2;
    return createRoundedElbowPath(
      [
        start,
        { x: p1x, y: start.y },
        { x: p1x, y: midY },
        { x: p2x, y: midY },
        { x: p2x, y: end.y },
        end,
      ],
      14,
    );
  }

  if (sSide === "bottom" && eSide === "top") {
    if (dy >= margin * 1.5) {
      const midY =
        elbowOffset !== undefined
          ? start.y + elbowOffset
          : (start.y + end.y) / 2;
      return createRoundedElbowPath(
        [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end],
        14,
      );
    }
    const p1y = start.y + margin;
    const p2y = end.y - margin;
    const midX =
      Math.abs(dx) < 30 ? Math.max(start.x, end.x) + 35 : (start.x + end.x) / 2;
    return createRoundedElbowPath(
      [
        start,
        { x: start.x, y: p1y },
        { x: midX, y: p1y },
        { x: midX, y: p2y },
        { x: end.x, y: p2y },
        end,
      ],
      14,
    );
  }

  if (sSide === "top" && eSide === "bottom") {
    if (dy <= -margin * 1.5) {
      const midY =
        elbowOffset !== undefined
          ? start.y - elbowOffset
          : (start.y + end.y) / 2;
      return createRoundedElbowPath(
        [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end],
        14,
      );
    }
    const p1y = start.y - margin;
    const p2y = end.y + margin;
    const midX =
      Math.abs(dx) < 30 ? Math.max(start.x, end.x) + 35 : (start.x + end.x) / 2;
    return createRoundedElbowPath(
      [
        start,
        { x: start.x, y: p1y },
        { x: midX, y: p1y },
        { x: midX, y: p2y },
        { x: end.x, y: p2y },
        end,
      ],
      14,
    );
  }

  // Same side connections
  if (sSide === "right" && eSide === "right") {
    const maxX = Math.max(start.x, end.x) + margin;
    return createRoundedElbowPath(
      [start, { x: maxX, y: start.y }, { x: maxX, y: end.y }, end],
      14,
    );
  }
  if (sSide === "left" && eSide === "left") {
    const minX = Math.min(start.x, end.x) - margin;
    return createRoundedElbowPath(
      [start, { x: minX, y: start.y }, { x: minX, y: end.y }, end],
      14,
    );
  }
  if (sSide === "bottom" && eSide === "bottom") {
    const maxY = Math.max(start.y, end.y) + margin;
    return createRoundedElbowPath(
      [start, { x: start.x, y: maxY }, { x: end.x, y: maxY }, end],
      14,
    );
  }
  if (sSide === "top" && eSide === "top") {
    const minY = Math.min(start.y, end.y) - margin;
    return createRoundedElbowPath(
      [start, { x: start.x, y: minY }, { x: end.x, y: minY }, end],
      14,
    );
  }

  // Fallback
  if (sSide === "right" || sSide === "left") {
    const exitX = sSide === "right" ? start.x + margin : start.x - margin;
    return createRoundedElbowPath(
      [start, { x: exitX, y: start.y }, { x: exitX, y: end.y }, end],
      14,
    );
  }
  const exitY = sSide === "bottom" ? start.y + margin : start.y - margin;
  return createRoundedElbowPath(
    [start, { x: start.x, y: exitY }, { x: end.x, y: exitY }, end],
    14,
  );
}

// Compute smart alignment guides when dragging elements
export function calculateSmartGuides(
  draggingElement: DiagramElement,
  allElements: DiagramElement[],
  threshold = 6,
): { guides: SmartGuide[]; snappedX: number; snappedY: number } {
  const guides: SmartGuide[] = [];
  let snappedX = draggingElement.x;
  let snappedY = draggingElement.y;

  const dragLeft = draggingElement.x;
  const dragRight = draggingElement.x + draggingElement.width;
  const dragCenterX = draggingElement.x + draggingElement.width / 2;

  const dragTop = draggingElement.y;
  const dragBottom = draggingElement.y + draggingElement.height;
  const dragCenterY = draggingElement.y + draggingElement.height / 2;

  let minDiffX = threshold;
  let minDiffY = threshold;

  for (const el of allElements) {
    if (el.id === draggingElement.id || el.type === "connector") continue;

    const elLeft = el.x;
    const elRight = el.x + el.width;
    const elCenterX = el.x + el.width / 2;

    const elTop = el.y;
    const elBottom = el.y + el.height;
    const elCenterY = el.y + el.height / 2;

    // Vertical alignment (X axis)
    // Left - Left
    if (Math.abs(dragLeft - elLeft) < minDiffX) {
      minDiffX = Math.abs(dragLeft - elLeft);
      snappedX = elLeft;
      guides.push({
        type: "vertical",
        position: elLeft,
        start: Math.min(dragTop, elTop) - 20,
        end: Math.max(dragBottom, elBottom) + 20,
      });
    }
    // Center - Center
    if (Math.abs(dragCenterX - elCenterX) < minDiffX) {
      minDiffX = Math.abs(dragCenterX - elCenterX);
      snappedX = elCenterX - draggingElement.width / 2;
      guides.push({
        type: "vertical",
        position: elCenterX,
        start: Math.min(dragTop, elTop) - 20,
        end: Math.max(dragBottom, elBottom) + 20,
      });
    }
    // Right - Right
    if (Math.abs(dragRight - elRight) < minDiffX) {
      minDiffX = Math.abs(dragRight - elRight);
      snappedX = elRight - draggingElement.width;
      guides.push({
        type: "vertical",
        position: elRight,
        start: Math.min(dragTop, elTop) - 20,
        end: Math.max(dragBottom, elBottom) + 20,
      });
    }

    // Horizontal alignment (Y axis)
    // Top - Top
    if (Math.abs(dragTop - elTop) < minDiffY) {
      minDiffY = Math.abs(dragTop - elTop);
      snappedY = elTop;
      guides.push({
        type: "horizontal",
        position: elTop,
        start: Math.min(dragLeft, elLeft) - 20,
        end: Math.max(dragRight, elRight) + 20,
      });
    }
    // Center - Center
    if (Math.abs(dragCenterY - elCenterY) < minDiffY) {
      minDiffY = Math.abs(dragCenterY - elCenterY);
      snappedY = elCenterY - draggingElement.height / 2;
      guides.push({
        type: "horizontal",
        position: elCenterY,
        start: Math.min(dragLeft, elLeft) - 20,
        end: Math.max(dragRight, elRight) + 20,
      });
    }
    // Bottom - Bottom
    if (Math.abs(dragBottom - elBottom) < minDiffY) {
      minDiffY = Math.abs(dragBottom - elBottom);
      snappedY = elBottom - draggingElement.height;
      guides.push({
        type: "horizontal",
        position: elBottom,
        start: Math.min(dragLeft, elLeft) - 20,
        end: Math.max(dragRight, elRight) + 20,
      });
    }
  }

  return { guides, snappedX, snappedY };
}

// Shared canvas instance for fast and accurate text measurement
let measureCanvas: HTMLCanvasElement | null = null;

// Measure text width using 2D canvas context with fallback to approximate character width
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily = "Inter, sans-serif",
): number {
  if (typeof document === "undefined") return text.length * fontSize * 0.55;
  try {
    if (!measureCanvas) {
      measureCanvas = document.createElement("canvas");
    }
    const ctx = measureCanvas.getContext("2d");
    if (!ctx) return text.length * fontSize * 0.55;
    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
  } catch {
    return text.length * fontSize * 0.55;
  }
}

// Calculate safe internal padding between text and stroke for different shapes
export function getElementTextPadding(element: DiagramElement): {
  px: number;
  py: number;
} {
  if (element.type === "text") {
    return { px: 4, py: 2 };
  }
  if (element.type === "decision") {
    return {
      px: Math.max(16, element.width * 0.16),
      py: Math.max(12, element.height * 0.16),
    };
  }
  if (element.type === "triangle") {
    return {
      px: Math.max(14, element.width * 0.15),
      py: Math.max(12, element.height * 0.15),
    };
  }
  if (element.type === "circle" || element.type === "ellipse") {
    return {
      px: Math.max(10, element.width * 0.12),
      py: Math.max(10, element.height * 0.12),
    };
  }
  if (element.type === "pill") {
    return {
      px: Math.max(12, Math.min(element.width, element.height) * 0.2),
      py: 8,
    };
  }
  return { px: 8, py: 6 };
}

// Wrap text into multiple lines constrained to maxWidth to prevent overflow in x direction
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily = "Inter, sans-serif",
): string[] {
  if (!text) return [];
  const rawLines = text.split("\n");
  const wrappedLines: string[] = [];
  const safeMaxWidth = Math.max(24, maxWidth);

  for (const rawLine of rawLines) {
    if (!rawLine) {
      wrappedLines.push("");
      continue;
    }

    const words = rawLine.split(" ");
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i]!;
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = measureTextWidth(testLine, fontSize, fontFamily);

      if (testWidth <= safeMaxWidth || !currentLine) {
        if (testWidth > safeMaxWidth && !currentLine) {
          // If a single word exceeds safeMaxWidth, split it by characters
          let chunk = "";
          for (const char of word) {
            const nextChunk = chunk + char;
            if (
              measureTextWidth(nextChunk, fontSize, fontFamily) <= safeMaxWidth
            ) {
              chunk = nextChunk;
            } else {
              if (chunk) wrappedLines.push(chunk);
              chunk = char;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = testLine;
        }
      } else {
        wrappedLines.push(currentLine);
        // Word starts on new line
        if (measureTextWidth(word, fontSize, fontFamily) > safeMaxWidth) {
          let chunk = "";
          for (const char of word) {
            const nextChunk = chunk + char;
            if (
              measureTextWidth(nextChunk, fontSize, fontFamily) <= safeMaxWidth
            ) {
              chunk = nextChunk;
            } else {
              if (chunk) wrappedLines.push(chunk);
              chunk = char;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  }

  return wrappedLines;
}
