/**
 * The army as a column of figures, as pure math. Nothing here is a historical claim: the number of figures is the force
 * of the data divided by `MEN_PER_FIGURE`, and the mix of foot soldiers, riders and mules and the spacing are a schematic
 * picture (the screen says so). The renderer only places what these functions return.
 */
export type FigureKind = 'leader' | 'foot' | 'rider' | 'rider_black' | 'mule';

export interface Slot {
  kind: FigureKind;
  /** scene units behind the head of the column */
  along: number;
  /** scene units to the left (negative) or right of the route */
  lateral: number;
  /** this figure's own size, a few percent either side of 1 (the leader's is 1) */
  scale: number;
  /** this figure's own shade, added to the lightness of its colors (the leader's is 0) */
  tint: number;
}

/** One figure stands for this many men. */
export const MEN_PER_FIGURE = 50;
/** The column drawn when the count of men is not known: a fixed size, and the screen says the count is not known. */
export const DEFAULT_FIGURES = 60;
/** The most figures on a `high` tier; the other tiers scale it (`particleScale`). */
export const MAX_FIGURES = 200;
/** Camera distance (scene units) to the army below which the figures replace the marker. */
export const FIGURE_NEAR = 8;
const FIGURE_FAR_MARGIN = 1.25;

const ROW_SPACING = 0.13;
/** Distance between the three lanes of the column. */
const LATERAL = 0.09;
const MAX_LENGTH = 6;
/** How far a figure strays from its place: along the route as a fraction of a row, and across it in scene units. */
const JITTER_ALONG = 0.25;
const JITTER_ACROSS = 0.015;
/** The schematic mix, repeated down the column: six on foot, a brown and a black rider, two mules in ten. */
const PATTERN: readonly FigureKind[] = ['foot', 'foot', 'rider', 'foot', 'mule', 'foot', 'foot', 'rider_black', 'foot', 'mule'];

/** A number from 0 up to 1 that depends only on its two arguments: the same column is drawn every time. */
function unit(n: number, salt: number): number {
  let x = (Math.imul(n + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0;
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0;
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

/** How many figures a force is drawn with. `known` is false when the data has no count: the column is then a fixed schematic size. */
export function figureCount(men: number | null, tierScale: number): { count: number; known: boolean } {
  const cap = Math.max(1, Math.round(MAX_FIGURES * tierScale));
  if (men === null) return { count: Math.min(DEFAULT_FIGURES, cap), known: false };
  if (men <= 0) return { count: 0, known: true };
  return { count: Math.min(cap, Math.max(1, Math.round(men / MEN_PER_FIGURE))), known: true };
}

/**
 * The places of a column of `count` figures: the leader at the head, the rest three abreast behind it, each a little off its place
 * (a fixed pseudo-random jitter, so the column looks like men walking and not like a grid), the whole column no longer than `MAX_LENGTH`.
 */
export function columnSlots(count: number): Slot[] {
  const rows = Math.ceil(Math.max(0, count - 1) / 3);
  const spacing = Math.min(ROW_SPACING, MAX_LENGTH / Math.max(1, rows));
  const slots: Slot[] = [];
  for (let i = 0; i < count; i += 1) {
    if (i === 0) {
      slots.push({ kind: 'leader', along: 0, lateral: 0, scale: 1, tint: 0 });
      continue;
    }
    const lane = (i - 1) % 3;
    slots.push({
      kind: PATTERN[(i - 1) % PATTERN.length]!,
      along: Math.ceil(i / 3) * spacing + (unit(i, 1) - 0.5) * 2 * JITTER_ALONG * spacing,
      lateral: (lane - 1) * LATERAL + (unit(i, 2) - 0.5) * 2 * JITTER_ACROSS,
      scale: 1 + (unit(i, 3) - 0.5) * 0.12,
      tint: (unit(i, 4) - 0.5) * 0.08
    });
  }
  return slots;
}

const SWING: Record<FigureKind, number> = { foot: 0.6, rider: 0.45, rider_black: 0.45, mule: 0.4, leader: 0.45 };
const BOB: Record<FigureKind, number> = { foot: 0.012, rider: 0.02, rider_black: 0.02, mule: 0.014, leader: 0.02 };

/**
 * The pose of a walking figure at a phase of the stride (one stride per unit): the angle of one pair of legs (the other
 * pair has the opposite) and how far the body rises, twice per stride. `amount` from 0 (standing) to 1 (marching).
 */
export function gaitAt(kind: FigureKind, phase: number, amount = 1): { swing: number; bob: number } {
  if (amount === 0) return { swing: 0, bob: 0 };
  const s = Math.sin(phase * Math.PI * 2);
  return { swing: amount * SWING[kind] * s, bob: amount * BOB[kind] * Math.abs(s) };
}

/** Figures or the single marker, by camera distance, with a margin so it does not flicker at the threshold. */
export function lodFor(distance: number, current: 'marker' | 'figures'): 'marker' | 'figures' {
  const limit = current === 'figures' ? FIGURE_NEAR * FIGURE_FAR_MARGIN : FIGURE_NEAR;
  return distance < limit ? 'figures' : 'marker';
}

/** The count of the first force of the first point of the route, or null when it is not known: the column is drawn with this strength. */
export function startingMen(points: ReadonlyArray<{ forces: ReadonlyArray<{ men: number | null }> }>): number | null {
  return points[0]?.forces[0]?.men ?? null;
}
