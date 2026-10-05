import type { FigureKind, Slot } from './column';

/**
 * A figure built of boxes, in scene units, facing +z with its feet on y = 0. A part either stands where `at` puts its centre,
 * or (`leg`, `arm`) hangs from `at` as the pivot at its top and swings with the gait: `leg` and `arm` are 1 or -1, the two
 * groups swing against each other (an arm against the leg on its own side). `tilt` turns the part about its own x axis (a neck,
 * a rifle).
 *
 * These are schematic shapes and first-pass colors. They are not the uniform of any army: nothing here is a historical claim.
 */
export interface Part {
  size: readonly [number, number, number];
  at: readonly [number, number, number];
  color: string;
  leg?: 1 | -1;
  arm?: 1 | -1;
  tilt?: number;
}

const COAT = '#6b6f5a';
const LEADER_COAT = '#2f3f66';
const SKIN = '#c9a58a';
const HAT = '#2b2b2b';
const IRON = '#3a3a3a';
const WOOD = '#6b4a2b';
const BAY = '#6a4a32';
const BAY_DARK = '#4a3322';
const BLACK = '#161413';
const BLACK_DARK = '#0e0d0c';
const WHITE = '#ece9e1';
const WHITE_DARK = '#d2cdc2';
const MULE = '#7a6a58';
const PACK = '#8a7355';
const PENNANT = '#eef3fb';

const walker: Part[] = [
  // legs, and the left arm swinging against the left leg
  { size: [0.016, 0.05, 0.016], at: [-0.012, 0.05, 0], color: HAT, leg: 1 },
  { size: [0.016, 0.05, 0.016], at: [0.012, 0.05, 0], color: HAT, leg: -1 },
  { size: [0.012, 0.045, 0.012], at: [0.027, 0.097, 0], color: COAT, arm: 1 },
  { size: [0.04, 0.05, 0.024], at: [0, 0.075, 0], color: COAT },
  { size: [0.02, 0.02, 0.02], at: [0, 0.11, 0], color: SKIN },
  { size: [0.026, 0.022, 0.026], at: [0, 0.131, 0], color: HAT },
  // the right arm holds the rifle against the shoulder (it does not swing): forearm, barrel and stock
  { size: [0.012, 0.03, 0.012], at: [-0.027, 0.082, 0.012], color: COAT, tilt: -0.6 },
  { size: [0.008, 0.008, 0.12], at: [-0.03, 0.11, -0.005], color: IRON, tilt: 0.9 },
  { size: [0.012, 0.012, 0.04], at: [-0.03, 0.07, 0.022], color: WOOD, tilt: 0.9 }
];

/** a horse of the given coat: body, neck, head, tail and four legs in diagonal pairs */
function horseOf(coat: string, dark: string): Part[] {
  return [
    { size: [0.06, 0.06, 0.16], at: [0, 0.1, 0], color: coat },
    { size: [0.03, 0.07, 0.03], at: [0, 0.15, 0.085], color: coat, tilt: -0.5 },
    { size: [0.026, 0.026, 0.06], at: [0, 0.18, 0.12], color: dark },
    { size: [0.012, 0.045, 0.012], at: [0, 0.095, -0.085], color: dark, tilt: 0.3 },
    { size: [0.014, 0.07, 0.014], at: [-0.02, 0.07, 0.06], color: dark, leg: 1 },
    { size: [0.014, 0.07, 0.014], at: [0.02, 0.07, 0.06], color: dark, leg: -1 },
    { size: [0.014, 0.07, 0.014], at: [-0.02, 0.07, -0.06], color: dark, leg: -1 },
    { size: [0.014, 0.07, 0.014], at: [0.02, 0.07, -0.06], color: dark, leg: 1 }
  ];
}

/** a rider seated on the horse, both arms forward to the reins; `headgear` is on top of the head */
function riderOf(coat: string, headgear: Part[]): Part[] {
  return [
    { size: [0.036, 0.05, 0.022], at: [0, 0.155, -0.01], color: coat },
    { size: [0.012, 0.04, 0.012], at: [0.024, 0.165, 0.005], color: coat, tilt: -0.9 },
    { size: [0.012, 0.04, 0.012], at: [-0.024, 0.165, 0.005], color: coat, tilt: -0.9 },
    { size: [0.02, 0.02, 0.02], at: [0, 0.19, -0.01], color: SKIN },
    ...headgear
  ];
}

/** the shako of a soldier */
const shako: Part[] = [{ size: [0.026, 0.022, 0.026], at: [0, 0.211, -0.01], color: HAT }];
/** the bicorn of the leader, worn front to back: long along the direction of travel, with a plume */
const bicorn: Part[] = [
  { size: [0.014, 0.03, 0.058], at: [0, 0.212, -0.01], color: HAT },
  { size: [0.006, 0.018, 0.006], at: [0, 0.236, -0.01], color: PENNANT }
];

const mule: Part[] = [
  { size: [0.05, 0.05, 0.13], at: [0, 0.085, 0], color: MULE },
  { size: [0.024, 0.055, 0.024], at: [0, 0.125, 0.07], color: MULE, tilt: -0.5 },
  { size: [0.022, 0.022, 0.05], at: [0, 0.15, 0.1], color: BAY_DARK },
  { size: [0.01, 0.035, 0.01], at: [0, 0.08, -0.07], color: BAY_DARK, tilt: 0.3 },
  { size: [0.012, 0.055, 0.012], at: [-0.016, 0.055, 0.048], color: BAY_DARK, leg: 1 },
  { size: [0.012, 0.055, 0.012], at: [0.016, 0.055, 0.048], color: BAY_DARK, leg: -1 },
  { size: [0.012, 0.055, 0.012], at: [-0.016, 0.055, -0.048], color: BAY_DARK, leg: -1 },
  { size: [0.012, 0.055, 0.012], at: [0.016, 0.055, -0.048], color: BAY_DARK, leg: 1 },
  { size: [0.07, 0.05, 0.09], at: [0, 0.135, -0.005], color: PACK }
];

const pennant: Part[] = [
  { size: [0.004, 0.1, 0.004], at: [0.03, 0.24, -0.01], color: HAT },
  { size: [0.002, 0.03, 0.05], at: [0.03, 0.27, -0.037], color: PENNANT }
];

export const FIGURE_PARTS: Record<FigureKind, readonly Part[]> = {
  foot: walker,
  rider: [...horseOf(BAY, BAY_DARK), ...riderOf(COAT, shako)],
  rider_black: [...horseOf(BLACK, BLACK_DARK), ...riderOf(COAT, shako)],
  mule,
  leader: [...horseOf(WHITE, WHITE_DARK), ...riderOf(LEADER_COAT, bicorn), ...pennant]
};

/** The boxes a column needs: the parts of every figure added up. */
export function instanceCount(slots: readonly Slot[]): number {
  return slots.reduce((n, s) => n + FIGURE_PARTS[s.kind].length, 0);
}
