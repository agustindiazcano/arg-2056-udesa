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
  /** for a swinging part that does not hang from its own top (a boot): the point it turns about, and `at` is its centre at rest */
  pivot?: readonly [number, number, number];
  tilt?: number;
}

/** the blue coat of most of the army, the leader included (the Granaderos a Caballo, the Cazadores de los Andes and the line battalions wore blue) */
const COAT = '#2f4a80';
/** the red jacket and white trousers of the pardos y morenos battalions (7 and 8), whose men were Afro-descendant; the sources disagree on how far the red went, so only a fifth of the infantry is drawn so */
const RED_COAT = '#b3262b';
const WHITE_TROUSERS = '#e9e6dc';
/** blue trousers for everyone on the road; only the leader wears white */
const TROUSERS = '#243a66';
const LEADER_TROUSERS = '#f1efe8';
const CELESTE = '#75aadb';
const BOOT = '#1a1614';
const EPAULETTE = '#e8b923';
const VISOR = '#0b0b0b';
const SKIN = '#c9a58a';
const SKIN_DARK = '#6b4630';
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

/** a soldier on foot, in the given coat and trousers */
function walkerOf(coat: string, trousers: string, skin: string): Part[] {
  return [
    // legs, with a boot on each that turns about the hip with it, and the left arm swinging against the left leg
    { size: [0.016, 0.05, 0.016], at: [-0.012, 0.05, 0], color: trousers, leg: 1 },
    { size: [0.016, 0.05, 0.016], at: [0.012, 0.05, 0], color: trousers, leg: -1 },
    { size: [0.018, 0.012, 0.032], at: [-0.012, 0.006, 0.006], color: BOOT, leg: 1, pivot: [-0.012, 0.05, 0] },
    { size: [0.018, 0.012, 0.032], at: [0.012, 0.006, 0.006], color: BOOT, leg: -1, pivot: [0.012, 0.05, 0] },
    { size: [0.012, 0.045, 0.012], at: [0.027, 0.097, 0], color: coat, arm: 1 },
    { size: [0.04, 0.05, 0.024], at: [0, 0.075, 0], color: coat },
    { size: [0.02, 0.02, 0.02], at: [0, 0.11, 0], color: skin },
    // the shako: a tall blue crown and a black visor in front
    { size: [0.026, 0.04, 0.026], at: [0, 0.14, 0], color: COAT },
    { size: [0.024, 0.005, 0.014], at: [0, 0.123, 0.018], color: VISOR },
    // the right arm holds the rifle against the shoulder (it does not swing): forearm, barrel and stock
    { size: [0.012, 0.03, 0.012], at: [-0.027, 0.082, 0.012], color: coat, tilt: -0.6 },
    { size: [0.008, 0.008, 0.12], at: [-0.03, 0.11, -0.005], color: IRON, tilt: 0.9 },
    { size: [0.012, 0.012, 0.04], at: [-0.03, 0.07, 0.022], color: WOOD, tilt: 0.9 }
  ];
}

const walker = walkerOf(COAT, TROUSERS, SKIN);
const walkerAfro = walkerOf(RED_COAT, WHITE_TROUSERS, SKIN_DARK);

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

/** a rider seated on the horse: both arms forward to the reins, and a leg down each side of the horse with a boot; `headgear` is on the head */
function riderOf(coat: string, trousers: string, headgear: Part[]): Part[] {
  return [
    { size: [0.036, 0.05, 0.022], at: [0, 0.155, -0.01], color: coat },
    { size: [0.012, 0.04, 0.012], at: [0.024, 0.165, 0.005], color: coat, tilt: -0.9 },
    { size: [0.012, 0.04, 0.012], at: [-0.024, 0.165, 0.005], color: coat, tilt: -0.9 },
    { size: [0.014, 0.065, 0.016], at: [0.037, 0.107, -0.01], color: trousers },
    { size: [0.014, 0.065, 0.016], at: [-0.037, 0.107, -0.01], color: trousers },
    { size: [0.016, 0.02, 0.03], at: [0.037, 0.078, -0.004], color: BOOT },
    { size: [0.016, 0.02, 0.03], at: [-0.037, 0.078, -0.004], color: BOOT },
    { size: [0.02, 0.02, 0.02], at: [0, 0.19, -0.01], color: SKIN },
    ...headgear
  ];
}

/** the shako of a rider: the same tall blue crown and black visor as on foot */
const shako: Part[] = [
  { size: [0.026, 0.04, 0.026], at: [0, 0.22, -0.01], color: COAT },
  { size: [0.024, 0.005, 0.014], at: [0, 0.203, 0.008], color: VISOR }
];
/** the bicorn of the leader, worn front to back: long along the direction of travel, with a plume; and his yellow epaulettes */
const bicorn: Part[] = [
  { size: [0.014, 0.03, 0.058], at: [0, 0.212, -0.01], color: '#2b2b2b' },
  { size: [0.006, 0.018, 0.006], at: [0, 0.236, -0.01], color: PENNANT }
];
const epaulettes: Part[] = [
  { size: [0.014, 0.008, 0.022], at: [0.021, 0.182, -0.01], color: EPAULETTE },
  { size: [0.014, 0.008, 0.022], at: [-0.021, 0.182, -0.01], color: EPAULETTE }
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
  // two equal halves: white above, celeste below
  { size: [0.002, 0.015, 0.05], at: [0.03, 0.2775, -0.037], color: PENNANT },
  { size: [0.002, 0.015, 0.05], at: [0.03, 0.2625, -0.037], color: CELESTE }
];

export const FIGURE_PARTS: Record<FigureKind, readonly Part[]> = {
  foot: walker,
  foot_afro: walkerAfro,
  rider: [...horseOf(BAY, BAY_DARK), ...riderOf(COAT, TROUSERS, shako)],
  rider_black: [...horseOf(BLACK, BLACK_DARK), ...riderOf(COAT, TROUSERS, shako)],
  mule,
  leader: [...horseOf(WHITE, WHITE_DARK), ...riderOf(COAT, LEADER_TROUSERS, [...bicorn, ...epaulettes]), ...pennant]
};

/** The boxes a column needs: the parts of every figure added up. */
export function instanceCount(slots: readonly Slot[]): number {
  return slots.reduce((n, s) => n + FIGURE_PARTS[s.kind].length, 0);
}
