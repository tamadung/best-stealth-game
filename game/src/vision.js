// Line of sight and vision-cone geometry. Walls and display cases block
// sight; bushes and lamps do not. Nothing here knows about screens or sound.

/** True when the segment (x1,y1)-(x2,y2) touches the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) return false;
  // An endpoint inside the rectangle is a hit.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Cross each of the four edges; a crossing means the segment enters the rect.
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const den = dx * (ey2 - ey1) - dy * (ex2 - ex1);
    if (den === 0) continue;
    const t = ((ex1 - x1) * (ey2 - ey1) - (ey1 - y1) * (ex2 - ex1)) / den;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/**
 * True when nothing solid stands between (x1,y1) and (x2,y2). `solids` is the
 * level's walls plus its display cases.
 */
export function hasLineOfSight(x1, y1, x2, y2, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, solids[i])) return false;
  }
  return true;
}

/** True when (x,y) sits inside any lamp's lit circle. */
export function isLit(x, y, lamps) {
  for (let i = 0; i < lamps.length; i += 1) {
    const lamp = lamps[i];
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy <= lamp.r * lamp.r) return true;
  }
  return false;
}

/** True when (x,y) sits inside any bush: hidden, unless a guard is close. */
export function inBush(x, y, bushes) {
  for (let i = 0; i < bushes.length; i += 1) {
    const bush = bushes[i];
    const dx = x - bush.x;
    const dy = y - bush.y;
    if (dx * dx + dy * dy <= bush.r * bush.r) return true;
  }
  return false;
}

/** Smallest absolute angle between two headings, in radians. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}
