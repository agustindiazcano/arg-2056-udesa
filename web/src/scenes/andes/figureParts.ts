import type { FigureKind, Slot } from './column';

/**
 * A figure built of boxes, in scene units, facing +z with its feet on y = 0. A part either stands where `at` puts its centre,
 * or (`leg`) hangs from `at` as the pivot at its top and swings with the gait: `leg` is 1 or -1, the two groups swing against
 * each other. `tilt` turns the part about its own x axis (a neck, a musket).
 *
 * These are schematic shapes and first-pass colors. They are not the uniform of any army: nothing here is a historical claim.
 */
export interface Part {
  size: readonly [number, number, number];
  at: readonly [number, number, number];
  color: string;
  leg?: 1 | -1;
  tilt?: number;
}

const COAT = '#6b6f5a';
const SKIN = '#c9a58a';
const HAT = '#2b2b2b';
const IRON = '#3a3a3a';
const HORSE = '#6a4a32';
const HORSE_DARK = '#4a3322';
const MULE = '#7a6a58';
const PACK = '#8a7355';
const PENNANT = '#eef3fb';

const walker: Part[] = [
  { size: [0.016, 0.05, 0.016], at: [-0.012, 0.05, 0], color: HAT, leg: 1 },
  { size: [0.016, 0.05, 0.016], at: [0.012, 0.05, 0], color: HAT, leg: -1 },
  { size: [0.04, 0.05, 0.024], at: [0, 0.075, 0], color: COAT },
  { size: [0.02, 0.02, 0.02], at: [0, 0.11, 0], color: SKIN },
  { size: [0.026, 0.022, 0.026], at: [0, 0.131, 0], color: HAT },
  { size: [0.006, 0.006, 0.1], at: [0.028, 0.085, 0.01], color: IRON, tilt: 0.25 }
];

const horse: Part[] = [
  { size: [0.06, 0.06, 0.16], at: [0, 0.1, 0], color: HORSE },
  { size: [0.03, 0.07, 0.03], at: [0, 0.15, 0.085], color: HORSE, tilt: -0.5 },
  { size: [0.026, 0.026, 0.06], at: [0, 0.18, 0.12], color: HORSE_DARK },
  { size: [0.012, 0.045, 0.012], at: [0, 0.095, -0.085], color: HORSE_DARK, tilt: 0.3 },
  { size: [0.014, 0.07, 0.014], at: [-0.02, 0.07, 0.06], color: HORSE_DARK, leg: 1 },
  { size: [0.014, 0.07, 0.014], at: [0.02, 0.07, 0.06], color: HORSE_DARK, leg: -1 },
  { size: [0.014, 0.07, 0.014], at: [-0.02, 0.07, -0.06], color: HORSE_DARK, leg: -1 },
  { size: [0.014, 0.07, 0.014], at: [0.02, 0.07, -0.06], color: HORSE_DARK, leg: 1 }
];

const rider: Part[] = [
  { size: [0.036, 0.05, 0.022], at: [0, 0.155, -0.01], color: COAT },
  { size: [0.02, 0.02, 0.02], at: [0, 0.19, -0.01], color: SKIN },
  { size: [0.026, 0.022, 0.026], at: [0, 0.211, -0.01], color: HAT }
];

const mule: Part[] = [
  { size: [0.05, 0.05, 0.13], at: [0, 0.085, 0], color: MULE },
  { size: [0.024, 0.055, 0.024], at: [0, 0.125, 0.07], color: MULE, tilt: -0.5 },
  { size: [0.022, 0.022, 0.05], at: [0, 0.15, 0.1], color: HORSE_DARK },
  { size: [0.01, 0.035, 0.01], at: [0, 0.08, -0.07], color: HORSE_DARK, tilt: 0.3 },
  { size: [0.012, 0.055, 0.012], at: [-0.016, 0.055, 0.048], color: HORSE_DARK, leg: 1 },
  { size: [0.012, 0.055, 0.012], at: [0.016, 0.055, 0.048], color: HORSE_DARK, leg: -1 },
  { size: [0.012, 0.055, 0.012], at: [-0.016, 0.055, -0.048], color: HORSE_DARK, leg: -1 },
  { size: [0.012, 0.055, 0.012], at: [0.016, 0.055, -0.048], color: HORSE_DARK, leg: 1 },
  { size: [0.07, 0.05, 0.09], at: [0, 0.135, -0.005], color: PACK }
];

const pennant: Part[] = [
  { size: [0.004, 0.1, 0.004], at: [0.03, 0.24, -0.01], color: HAT },
  { size: [0.002, 0.03, 0.05], at: [0.03, 0.27, -0.037], color: PENNANT }
];

export const FIGURE_PARTS: Record<FigureKind, readonly Part[]> = {
  foot: walker,
  rider: [...horse, ...rider],
  mule,
  leader: [...horse, ...rider, ...pennant]
};

/** The boxes a column needs: the parts of every figure added up. */
export function instanceCount(slots: readonly Slot[]): number {
  return slots.reduce((n, s) => n + FIGURE_PARTS[s.kind].length, 0);
}
