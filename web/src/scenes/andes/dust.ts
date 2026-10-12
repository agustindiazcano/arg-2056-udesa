/**
 * Dust behind the marching column, in the units of the figures. Stateless: where a puff is depends only on the clock, so nothing is
 * allocated or stored between frames and the same clock gives the same picture.
 */

/** the most puffs a column raises */
export const DUST_MAX = 90;
/** units a puff climbs over its life */
export const DUST_RISE = 0.9;
/** units a puff drifts back, away from its figure, over its life */
export const DUST_DRIFT = 1.4;
/** the strongest alpha of a puff */
const DUST_ALPHA = 0.4;
/** ms for one puff to be born, climb and fade */
const DUST_LIFE_MS = 1800;
/** each puff starts at its own point of the cycle (golden ratio, so they never line up) */
const PHASE_STEP = 0.618034;
/** dust colour, a pale earth */
const DUST_RGB = [0.78, 0.72, 0.62] as const;

export interface DustSlot {
  /** units behind the head of the column */
  along: number;
  /** units across the route */
  lateral: number;
}

export interface DustBuffers {
  /** x, y, z per puff */
  position: Float32Array;
  /** r, g, b, a per puff */
  color: Float32Array;
}

/** How many puffs a column of `figures` raises on a tier with `particleScale` (0 to 1). */
export function dustCount(figures: number, particleScale: number): number {
  if (figures <= 0 || particleScale <= 0) return 0;
  return Math.min(DUST_MAX, Math.round((figures / 2) * particleScale));
}

/** Where in its life (0 born, 1 gone) puff `i` is at `timeMs`. */
export function dustAge(i: number, timeMs: number): number {
  const t = timeMs / DUST_LIFE_MS + i * PHASE_STEP;
  return t - Math.floor(t);
}

/**
 * Writes `count` puffs into `out`. Puff `i` belongs to every second figure, is born at its feet, climbs and drifts back while it
 * fades. With `amount` 0 (the army stands still) every puff is clear. `place` gives the point of the route at an arc length and a
 * lateral offset.
 */
export function fillDust(
  out: DustBuffers,
  count: number,
  slots: ReadonlyArray<DustSlot>,
  leaderArc: number,
  timeMs: number,
  amount: number,
  place: (s: number, lateral: number, out: { x: number; y: number; z: number }) => void
): void {
  const at = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < count; i += 1) {
    const slot = slots.length > 0 ? slots[(i * 2) % slots.length] : undefined;
    if (!slot) {
      out.color[i * 4 + 3] = 0;
      continue;
    }
    const age = dustAge(i, timeMs);
    place(leaderArc - slot.along - age * DUST_DRIFT, slot.lateral, at);
    out.position[i * 3] = at.x;
    out.position[i * 3 + 1] = at.y + age * DUST_RISE;
    out.position[i * 3 + 2] = at.z;
    out.color[i * 4] = DUST_RGB[0];
    out.color[i * 4 + 1] = DUST_RGB[1];
    out.color[i * 4 + 2] = DUST_RGB[2];
    // fades in over the first tenth of its life, then out
    const fade = age < 0.1 ? age / 0.1 : (1 - age) / 0.9;
    out.color[i * 4 + 3] = Math.max(0, Math.min(1, amount)) * DUST_ALPHA * fade;
  }
}
