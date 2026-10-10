export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The distance from the point the card keeps, so it does not sit on the bubble. */
const GAP = 34;

/**
 * Where the card of a bubble goes (its top left corner): above the point when it fits there, otherwise below it, and in either case kept inside the area, away from
 * its edges by `margins`. A far force is near the top of the map, in the sky: its card goes below it, toward the center of the screen, and is never cut.
 */
export function popPosition(at: Point, card: Size, area: Size, margins: Margins): Point {
  const minX = margins.left;
  const maxX = Math.max(minX, area.width - margins.right - card.width);
  const minY = margins.top;
  const maxY = Math.max(minY, area.height - margins.bottom - card.height);
  let y = at.y - GAP - card.height;
  if (y < minY) y = at.y + GAP;
  const x = at.x - card.width / 2;
  return { x: Math.round(Math.min(maxX, Math.max(minX, x))), y: Math.round(Math.min(maxY, Math.max(minY, y))) };
}
