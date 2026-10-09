import type { AndesEvent } from './data';
import { metersPerPixel } from './mapGeo';
import { positionAt } from './timeline';
import type { Route } from './timeline';

/** One force of the crossing, as the map names it: its role and the column it is. */
export interface ForceInfo {
  /** `main` for the main column, the `column_id` of the data for the others */
  id: string;
  title: string;
  detail: string;
}

/**
 * The six forces in the order the spotlight lights them. The roles follow the sources (UNCuyo, Historia virtual): the main column and the column
 * of Las Heras, with the artillery and the supplies, were the two real attacks; the four others, two to the north (Guana, Come-Caballos) and
 * two to the south (Portillo, Planchón), crossed to make the royalists divide their forces.
 */
export const FORCES: readonly ForceInfo[] = [
  { id: 'main', title: 'Fuerza principal', detail: 'Columna de Los Patos' },
  { id: 'las-heras', title: 'Artillería y logística', detail: 'Columna de Las Heras · Uspallata' },
  { id: 'cabot', title: 'Flanco norte · distracción', detail: 'Cabot · paso de Guana' },
  { id: 'zelada', title: 'Flanco norte · distracción', detail: 'Zelada · paso de Come-Caballos' },
  { id: 'freire', title: 'Flanco sur · distracción', detail: 'Freire · paso del Planchón' },
  { id: 'lemos', title: 'Flanco sur · distracción', detail: 'Lemos · paso del Portillo' }
];

export const MAIN_FORCE_ID = 'main';

/** What the spotlight says about a force: who commands it, its numbers (label and value), and what it was for. */
export interface ForceFacts {
  commanders: readonly string[];
  units: ReadonlyArray<readonly [label: string, value: string]>;
  goal: string;
}

/**
 * Commanders and numbers of each force, from the sources of `docs/references.md` (UNCuyo, Wikipedia «Rutas sanmartinianas», the municipality of Chacabuco,
 * the Estado general of 1816-12-31). The sources give the animals and the artillery for the whole army, not by column, and the split between infantry and
 * cavalry only for some of the small ones: what they do not give says «sin dato», never zero.
 */
export const FORCE_FACTS: Readonly<Record<string, ForceFacts>> = {
  main: {
    commanders: ['José de San Martín · jefe de la expedición', 'Estanislao Soler · vanguardia', "Bernardo O'Higgins · centro", 'Mariano Necochea · escolta de granaderos', 'Pedro Regalado de la Plaza · retaguardia y maestranza'],
    units: [
      ['Soldados del ejército', '3.987 (3.778 de tropa, 14 jefes y 195 oficiales)'],
      ['La columna', 'unos 3.000 hombres'],
      ['Infantería y caballería', 'sin dato por separado'],
      ['Caballos', '1.600 (todo el ejército)'],
      ['Mulas', '9.281 (todo el ejército)'],
      ['Artillería', '16 piezas (todo el ejército)']
    ],
    goal: 'Cruzar por Los Patos y atacar en el valle de Putaendo'
  },
  'las-heras': {
    commanders: ['Juan Gregorio de Las Heras · jefe', 'Enrique Martínez · segundo', 'fray Luis Beltrán · parque y maestranza'],
    units: [
      ['Hombres', '770 a 1.700 según la fuente'],
      ['Batallón 11', '683'],
      ['Carga', 'el parque y la artillería de la expedición'],
      ['Mulas y caballos', 'sin dato por columna']
    ],
    goal: 'Cruzar por Uspallata con la artillería y la logística, y reunirse con la fuerza principal'
  },
  cabot: {
    commanders: ['Juan Manuel Cabot · teniente coronel'],
    units: [
      ['Hombres', '140 (65 según otra fuente)'],
      ['Caballería', '20 granaderos a caballo'],
      ['Infantería', 'sin dato']
    ],
    goal: 'Cruzar por Guana, tomar La Serena y Coquimbo y distraer al enemigo por el norte'
  },
  zelada: {
    commanders: ['Francisco Zelada · teniente coronel', 'Nicolás Dávila · capitán, segundo'],
    units: [
      ['Hombres', '130'],
      ['Milicianos', '80'],
      ['Infantería', '50']
    ],
    goal: 'Cruzar por Come-Caballos, ocupar Copiapó y distraer al enemigo por el norte'
  },
  freire: {
    commanders: ['Ramón Freire · teniente coronel'],
    units: [
      ['Hombres', '100 (110 según otra fuente), más guerrilleros y reclutas'],
      ['Infantería', '75 a 80'],
      ['Caballería', '25 a 30 granaderos a caballo']
    ],
    goal: 'Cruzar por el Planchón, tomar Talca y Curicó y distraer al enemigo por el sur'
  },
  lemos: {
    commanders: ['José León Lemos · capitán'],
    units: [
      ['Hombres', '55'],
      ['Blandengues', '25'],
      ['Milicianos', '30']
    ],
    goal: 'Cruzar por el Portillo y sorprender el fuerte de San Gabriel, para distraer al enemigo por el sur'
  }
};

/** Where a force is on a day, in words: the place when it is at one, and from where to where when it is on the way. */
export function placeLabel(route: Route, day: number): string {
  const at = positionAt(route, day);
  if (!at) return '';
  const a = route.points[at.segment];
  const b = route.points[at.segment + 1];
  if (!a) return '';
  if (!b) return a.name;
  if (Math.abs(at.distanceKm - a.distanceKm) < 0.05) return a.name;
  if (Math.abs(at.distanceKm - b.distanceKm) < 0.05) return b.name;
  return `${a.name} → ${b.name}`;
}

/** The strength of a force: the first force of its first place, or the middle of the range when the count is not known; null when there is nothing. */
export function forceMen(points: readonly AndesEvent[]): number | null {
  const first = points[0];
  if (!first) return null;
  const men = first.forces[0]?.men;
  if (typeof men === 'number') return men;
  return first.estimate_range ? (first.estimate_range.min + first.estimate_range.max) / 2 : null;
}

/** Men that one ball stands for on the far view. */
export const MEN_PER_BALL = 500;
/** A force under this many men is drawn with a smaller ball. */
export const SMALL_FORCE_MEN = 100;

/** How many balls a force has on the far view: one for every 500 men, rounded, and at least one. */
export function ballCount(men: number | null): number {
  return men === null ? 1 : Math.max(1, Math.round(men / MEN_PER_BALL));
}

export function isSmallForce(men: number | null): boolean {
  return men !== null && men < SMALL_FORCE_MEN;
}

/** Kilometers along the route between two balls of a force, so they stand a few pixels apart at this zoom. */
export function ballSpacingKm(zoom: number, latitude: number, pixels = 7): number {
  return (pixels * metersPerPixel(zoom, latitude)) / 1000;
}

/** A closed ring of `sides` points around a place at `radiusM` meters (for the column of light). */
export function circlePolygon(lon: number, lat: number, radiusM: number, sides = 24): Array<[number, number]> {
  const dLat = radiusM / 111320;
  const dLon = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const ring: Array<[number, number]> = [];
  for (let i = 0; i < sides; i += 1) {
    const a = (2 * Math.PI * i) / sides;
    ring.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  ring.push(ring[0]!);
  return ring;
}

/** The first move (to the main force) is short: the camera is already near it. */
const FIRST_MOVE_MS = 600;
/** The camera goes to the next force before its light turns on. */
const MOVE_MS = 1400;
/** How long each force is lit, fade in and fade out included. */
const LIGHT_MS = 2400;
const FADE_MS = 450;
/** The way back to the main force and the zoom onto it, after the last light. */
export const SPOTLIGHT_FINAL_MS = 4200;

export interface SpotStep {
  id: string;
  /** the camera starts to move to the force */
  startMs: number;
  /** its light turns on */
  lightFromMs: number;
  /** its light is off */
  endMs: number;
}

/** One light at a time, in the order of FORCES: the main force, the artillery and logistics, and then each of the others. */
export const SPOT_STEPS: readonly SpotStep[] = (() => {
  const steps: SpotStep[] = [];
  let t = 0;
  FORCES.forEach((force, i) => {
    const move = i === 0 ? FIRST_MOVE_MS : MOVE_MS;
    steps.push({ id: force.id, startMs: t, lightFromMs: t + move, endMs: t + move + LIGHT_MS });
    t += move + LIGHT_MS;
  });
  return steps;
})();

const LIGHTS_END_MS = SPOT_STEPS[SPOT_STEPS.length - 1]!.endMs;
/** When the whole spotlight, the way back included, is over. */
export const SPOTLIGHT_END_MS = LIGHTS_END_MS + SPOTLIGHT_FINAL_MS;

const DIM_IN_MS = 700;
const DIM_OUT_MS = 900;

/** How dark the map and the sky are (0 to 1) `ms` after the spotlight started: they dim as the first light turns on, stay dim while the lights go on, and come back on the way to the main force. */
export function spotlightDimAt(ms: number): number {
  if (ms <= 0) return 0;
  if (ms < DIM_IN_MS) return ms / DIM_IN_MS;
  if (ms < LIGHTS_END_MS) return 1;
  return Math.max(0, 1 - (ms - LIGHTS_END_MS) / DIM_OUT_MS);
}

export interface SpotlightState {
  /** the index in SPOT_STEPS of the force the camera is on or the light is on; -1 once the lights are over */
  step: number;
  /** the level of the light (0 to 1): 0 while the camera moves */
  o: number;
  /** the lights are over: the camera goes back to the main force and zooms onto it */
  final: boolean;
  done: boolean;
}

/** Which force the spotlight is on `ms` after it started, how bright, and whether it is on the way back to the main force. */
export function spotlightStateAt(ms: number): SpotlightState {
  if (ms >= SPOTLIGHT_END_MS) return { step: -1, o: 0, final: true, done: true };
  if (ms >= LIGHTS_END_MS) return { step: -1, o: 0, final: true, done: false };
  const step = SPOT_STEPS.findIndex((st) => ms < st.endMs);
  const st = SPOT_STEPS[Math.max(0, step)]!;
  if (ms < st.lightFromMs) return { step, o: 0, final: false, done: false };
  const into = ms - st.lightFromMs;
  const left = st.endMs - ms;
  return { step, o: Math.max(0, Math.min(1, into / FADE_MS, left / FADE_MS)), final: false, done: false };
}

/** The light on the screen: a trapezoid from above the top of the map to the force, and the glow on the ground. */
export interface BeamGeometry {
  /** the four corners: top left, top right, bottom right, bottom left */
  polygon: Array<[number, number]>;
  ellipse: { cx: number; cy: number; rx: number; ry: number };
}

/** How far above the top of the map the light starts, in pixels. */
const BEAM_TOP = -40;

/**
 * Where to draw the light of a reflector that stands over `ground` (a point of the screen): it starts above the top edge of the map, a little to
 * the side so it comes in at a slant, and spreads to `radiusPx` on the ground, with a flat glow there. Drawn blurred and lit with a gradient, it is a beam of
 * light and not a 3D shape.
 */
export function beamGeometry(ground: { x: number; y: number }, radiusPx = 80, topHalfPx = 9): BeamGeometry {
  const topX = ground.x - 0.12 * (ground.y - BEAM_TOP);
  return {
    polygon: [
      [topX - topHalfPx, BEAM_TOP],
      [topX + topHalfPx, BEAM_TOP],
      [ground.x + radiusPx, ground.y],
      [ground.x - radiusPx, ground.y]
    ],
    ellipse: { cx: ground.x, cy: ground.y, rx: radiusPx * 1.15, ry: radiusPx * 0.42 }
  };
}
