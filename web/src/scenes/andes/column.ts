/**
 * The army as a column of figures, as pure math. Nothing here is a historical claim: the number of figures is the force
 * of the data divided by `MEN_PER_FIGURE`, and the mix of foot soldiers, riders and mules and the spacing are a schematic
 * picture (the screen says so). The renderer only places what these functions return.
 */
export type FigureKind = 'leader' | 'foot' | 'rider' | 'mule';

export interface Slot {
  kind: FigureKind;
  /** scene units behind the head of the column */
  along: number;
  /** scene units to the left (negative) or right of the route */
  lateral: number;
}

/** One figure stands for this many men. */
export const MEN_PER_FIGURE = 100;
/** The column drawn when the count of men is not known: a fixed size, and the screen says the count is not known. */
export const DEFAULT_FIGURES = 24;
/** The most figures on a `high` tier; the other tiers scale it (`particleScale`). */
export const MAX_FIGURES = 150;
/** Camera distance (scene units) to the army below which the figures replace the marker. */
export const FIGURE_NEAR = 8;
const FIGURE_FAR_MARGIN = 1.25;

const ROW_SPACING = 0.22;
const LATERAL = 0.14;
const MAX_LENGTH = 5;
/** The schematic mix, repeated down the column: six on foot, two riders, two mules in ten. */
const PATTERN: readonly FigureKind[] = ['foot', 'foot', 'rider', 'foot', 'mule', 'foot', 'foot', 'rider', 'foot', 'mule'];

/** How many figures a force is drawn with. `known` is false when the data has no count: the column is then a fixed schematic size. */
export function figureCount(men: number | null, tierScale: number): { count: number; known: boolean } {
  const cap = Math.max(1, Math.round(MAX_FIGURES * tierScale));
  if (men === null) return { count: Math.min(DEFAULT_FIGURES, cap), known: false };
  if (men <= 0) return { count: 0, known: true };
  return { count: Math.min(cap, Math.max(1, Math.round(men / MEN_PER_FIGURE))), known: true };
}

/** The places of a column of `count` figures: the leader at the head, the rest in pairs behind it, the whole column no longer than `MAX_LENGTH`. */
export function columnSlots(count: number): Slot[] {
  const rows = Math.ceil(Math.max(0, count - 1) / 2);
  const spacing = Math.min(ROW_SPACING, MAX_LENGTH / Math.max(1, rows));
  const slots: Slot[] = [];
  for (let i = 0; i < count; i += 1) {
    if (i === 0) {
      slots.push({ kind: 'leader', along: 0, lateral: 0 });
      continue;
    }
    slots.push({ kind: PATTERN[(i - 1) % PATTERN.length]!, along: Math.ceil(i / 2) * spacing, lateral: (i % 2 === 1 ? -1 : 1) * LATERAL });
  }
  return slots;
}

const SWING: Record<FigureKind, number> = { foot: 0.6, rider: 0.45, mule: 0.4, leader: 0.45 };
const BOB: Record<FigureKind, number> = { foot: 0.012, rider: 0.02, mule: 0.014, leader: 0.02 };

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
