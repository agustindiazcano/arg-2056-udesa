import type { AndesEvent } from './data';
import { coordAtKm, metersPerPixel } from './mapGeo';
import { positionOfColumn } from './columns';
import type { Column } from './columns';
import { buildRoute, distanceKm, positionAt } from './timeline';
import type { Route } from './timeline';

/** The royalist army at Chacabuco: not one of the patriot forces (no button, no spotlight), but it has its balls, its bubble and its flag on the map. */
export const ENEMY_ID = 'royalists';

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
 * two to the south (Portillo, Planchón), crossed to make the royalists divide their forces. They are called secondary columns (the word of the sources:
 * «columnas secundarias», «destacamentos secundarios») and not flanks: they did not guard the sides of the army, they crossed hundreds of kilometers away from it.
 */
export const FORCES: readonly ForceInfo[] = [
  { id: 'main', title: 'Fuerza principal', detail: 'Columna de Los Patos' },
  { id: 'las-heras', title: 'Columna de Uspallata', detail: 'Las Heras · artillería y parque' },
  { id: 'cabot', title: 'Columna secundaria del norte', detail: 'Cabot · paso de Guana' },
  { id: 'zelada', title: 'Columna secundaria del norte', detail: 'Zelada · paso de Come-Caballos' },
  { id: 'freire', title: 'Columna secundaria del sur', detail: 'Freire · paso del Planchón' },
  { id: 'lemos', title: 'Columna secundaria del sur', detail: 'Lemos · paso del Portillo' }
];

export const MAIN_FORCE_ID = 'main';

/** What the spotlight says about a force: who commands it, its numbers (label and value), and what it was for. */
export interface ForceFacts {
  /** the short name the group carries on the map */
  short: string;
  /** how many men, in words (a number, or a range when the sources differ) */
  men: string;
  /** what the number of men counts, when it is not just the men of the force (the whole army when it left, for the main force); `Hombres` when missing */
  menLabel?: string;
  /** the commanders as the map names them under the role: a few names, short */
  leaders: string;
  /** the units it is made of: the battalions of the big columns, the kind of men of the small detachments */
  battalions: string;
  /** how many of them are infantry, in words; null when the sources do not say (then the map says nothing about it) */
  infantry: string | null;
  commanders: readonly string[];
  units: ReadonlyArray<readonly [label: string, value: string]>;
  goal: string;
}

/**
 * The battalions of the main force and of Las Heras follow the order of battle of Chacabuco (the municipality of Chacabuco, by report: battalions 1, 7, 8 and 11 and
 * the squadrons of Granaderos), not a list of the crossing; the small columns were detachments and the sources give the kind of men, not battalions.
 * The column of Uspallata is named by its road and its commander: it was the infantry column of Las Heras (Battalion 11, 30 mounted grenadiers and two pieces); the artillery
 * and the parque (munitions and supplies, the word of the time) of fray Luis Beltrán left a day later and followed the same road. «Logística» is a modern word the sources do not use.
 * Commanders and numbers of each force, from the sources of `docs/references.md` (UNCuyo, Wikipedia «Rutas sanmartinianas», the municipality of Chacabuco,
 * the Estado general of 1816-12-31). The sources give the animals and the artillery for the whole army, not by column, and the split between infantry and
 * cavalry only for some of the small ones: what they do not give is left out, never written as zero.
 */
export const FORCE_FACTS: Readonly<Record<string, ForceFacts>> = {
  [ENEMY_ID]: {
    short: 'Fuerzas realistas',
    men: '2.080 a 2.500',
    leaders: 'Rafael Maroto · Piquero · Arenas · Quintanilla · Barañao',
    battalions: 'Talavera · Chiloé · Valdivia · caballería (Concordia y Abascal) · 2 a 5 piezas',
    infantry: '880',
    commanders: [
      'Rafael Maroto · jefe en el campo, coronel del Talavera',
      'José Piquero · batallón de Chiloé',
      'José Arenas · batallón de Valdivia',
      'Antonio de Quintanilla · caballería (Concordia)',
      'Manuel Barañao · caballería (Abascal)'
    ],
    units: [
      ['Hombres', '2.080 a 2.500 según la fuente; 1.220 de infantería y caballería según otra'],
      ['Talavera', '440 (170 peninsulares), 4 compañías'],
      ['Chiloé', '220, 2 compañías'],
      ['Valdivia', '220, 2 compañías'],
      ['Caballería', '340: Concordia 120 y Abascal 220'],
      ['Artillería', '2 a 5 piezas de montaña']
    ],
    goal: 'Defender la cuesta de Chacabuco, en el camino a Santiago, contra el ataque patriota del 12 de febrero'
  },

  [`${ENEMY_ID}-achupallas`]: {
    short: 'Realistas en Las Achupallas',
    men: 'más de 100',
    leaders: 'jefe de la guarnición de San Felipe',
    battalions: 'guarnición de San Felipe',
    infantry: null,
    commanders: ['Jefe de la guarnición de San Felipe · las fuentes no dan su nombre'],
    units: [
      ['Hombres', 'más de 100 (en emboscada)'],
      ['Enfrente', '200 granaderos con Antonio Arcos; Lavalle llegó con 25']
    ],
    goal: 'Atacar la avanzada patriota de Arcos el 4 de febrero; fueron rechazados y dejaron Putaendo y San Felipe: el primer triunfo de la campaña'
  },
  [`${ENEMY_ID}-coimas`]: {
    short: 'Realistas en Las Coimas',
    men: 'unos 700',
    leaders: 'Miguel María de Atero',
    battalions: 'caballería e infantería · 2 piezas',
    infantry: '300',
    commanders: ['Miguel María de Atero · jefe realista'],
    units: [
      ['Hombres', 'unos 700'],
      ['Caballería', '400'],
      ['Artillería', '2 piezas'],
      ['Enfrente', '140 Granaderos a Caballo con Mariano Necochea'],
      ['Bajas', 'unos 30 muertos realistas']
    ],
    goal: 'Cortar el avance de la vanguardia patriota el 7 de febrero; Necochea los atrajo con una falsa retirada, los venció y se retiraron hacia Santiago'
  },

  main: {
    short: 'Fuerza principal',
    men: '3.987',
    menLabel: 'Hombres al partir',
    leaders: "San Martín · Soler · O'Higgins",
    battalions: "Batallones 1 (Cazadores), 7 y 8 · Granaderos a Caballo",
    infantry: null,
    commanders: ['José de San Martín · jefe de la expedición', 'Estanislao Soler · vanguardia', "Bernardo O'Higgins · centro", 'Mariano Necochea · escolta de granaderos', 'Pedro Regalado de la Plaza · retaguardia y maestranza'],
    units: [
      ['Ejército al partir', '3.987 (3.778 de tropa, 14 jefes y 195 oficiales), con todas las columnas'],
      ['La columna', 'unos 3.000 hombres (solo la de Los Patos)'],
      ['En Chacabuco', 'unos 3.500 patriotas (con la columna de Las Heras)'],
      ['Caballos', '1.600 (todo el ejército)'],
      ['Mulas', '9.281 (todo el ejército)'],
      ['Artillería', '16 piezas (todo el ejército)']
    ],
    goal: 'Cruzar por Los Patos y atacar en el valle de Putaendo'
  },
  'las-heras': {
    short: 'Columna de Uspallata',
    men: '770 a 1.700',
    leaders: "Las Heras · Martínez · Beltrán",
    battalions: "Batallón 11 · 30 granaderos a caballo · artillería y parque",
    infantry: '683 en el Batallón 11',
    commanders: ['Juan Gregorio de Las Heras · jefe', 'Enrique Martínez · segundo', 'fray Luis Beltrán · parque y maestranza'],
    units: [
      ['Hombres', '770 a 1.700 según la fuente'],
      ['Batallón 11', '683'],
      ['Carga', 'el parque y la artillería de la expedición']
    ],
    goal: 'Cruzar por Uspallata (la artillería y el parque de fray Luis Beltrán salieron un día después por el mismo camino) y reunirse con la fuerza principal'
  },
  cabot: {
    short: 'Columna del norte · Cabot',
    men: '140',
    leaders: "Cabot",
    battalions: "Destacamento con 20 granaderos a caballo",
    infantry: null,
    commanders: ['Juan Manuel Cabot · teniente coronel'],
    units: [
      ['Hombres', '140 (65 según otra fuente)'],
      ['Caballería', '20 granaderos a caballo']
    ],
    goal: 'Cruzar por Guana, tomar La Serena y Coquimbo y distraer al enemigo por el norte'
  },
  zelada: {
    short: 'Columna del norte · Zelada',
    men: '130',
    leaders: "Zelada · Dávila",
    battalions: "Destacamento: 50 infantes y 80 milicianos",
    infantry: '50',
    commanders: ['Francisco Zelada · teniente coronel', 'Nicolás Dávila · capitán, segundo'],
    units: [
      ['Hombres', '130'],
      ['Milicianos', '80'],
      ['Infantería', '50']
    ],
    goal: 'Cruzar por Come-Caballos, ocupar Copiapó y distraer al enemigo por el norte'
  },
  freire: {
    short: 'Columna del sur · Freire',
    men: '100 a 110',
    leaders: "Freire",
    battalions: "Destacamento: 75 a 80 infantes y 25 a 30 granaderos a caballo",
    infantry: '75 a 80',
    commanders: ['Ramón Freire · teniente coronel'],
    units: [
      ['Hombres', '100 (110 según otra fuente), más guerrilleros y reclutas'],
      ['Infantería', '75 a 80'],
      ['Caballería', '25 a 30 granaderos a caballo']
    ],
    goal: 'Cruzar por el Planchón, tomar Talca y Curicó y distraer al enemigo por el sur'
  },
  lemos: {
    short: 'Columna del sur · Lemos',
    men: '55',
    leaders: "Lemos",
    battalions: "Destacamento: 25 blandengues y 30 milicianos",
    infantry: null,
    commanders: ['José León Lemos · capitán'],
    units: [
      ['Hombres', '55'],
      ['Blandengues', '25'],
      ['Milicianos', '30']
    ],
    goal: 'Cruzar por el Portillo y sorprender el fuerte de San Gabriel, para distraer al enemigo por el sur'
  }
};

/**
 * The text that follows a group on the map: its role, under it its commanders, then its men and, when the sources say it, its infantry, and last its
 * units (battalions or detachment). What the sources do not give is left out.
 */
export function forceLabel(id: string): string {
  const facts = FORCE_FACTS[id];
  if (!facts) return '';
  const numbers = `${facts.men} hombres${facts.infantry ? ` · infantería: ${facts.infantry}` : ''}`;
  return `${facts.short}\n${facts.leaders}\n${numbers}\n${facts.battalions}`;
}

const CHIPS: Readonly<Record<string, string>> = { main: 'Principal', 'las-heras': 'Las Heras', cabot: 'Cabot', zelada: 'Zelada', freire: 'Freire', lemos: 'Lemos' };

/** The short name on the round button of a force. */
export function forceChip(id: string): string {
  return CHIPS[id] ?? '';
}

/** The whole name of a force, for the hover of its button: its role and its detail. */
export function forceFullName(id: string): string {
  const f = FORCES.find((x) => x.id === id);
  return f ? `${f.title} · ${f.detail}` : '';
}

/** Where the royalists stood: on the plain of the hacienda of Chacabuco, before the cerro de la Victoria, a short way south of the place of the battle (-70.684, -32.993, as Wikipedia gives it); schematic, the sources give no coordinates for the lines. */
export const ENEMY_POSITION = { lon: -70.686, lat: -33.008 };

/**
 * The royalist forces of the two skirmishes before Chacabuco. Each has a red ball (or a few) and a bubble with its flag on the place of the combat of the route (the event
 * whose name matches `match`), from half a day before its day until two days after it. The men are the ones the sources give (Wikipedia, «Paso de Los Patos»; El Arcón de la Historia).
 */
export interface Skirmish {
  id: string;
  name: string;
  /** the name of the event of the route that is the place of the combat */
  match: RegExp;
  men: number;
}
export const SKIRMISHES: readonly Skirmish[] = [
  { id: `${ENEMY_ID}-achupallas`, name: 'Combate de Las Achupallas', match: /Achupallas/, men: 100 },
  { id: `${ENEMY_ID}-coimas`, name: 'Combate de Las Coimas', match: /Coimas/, men: 700 }
];
/** The royalists show from this many days before the day of their combat... */
export const SKIRMISH_BEFORE_DAYS = 0.5;
/** ...until this many days after it. */
export const SKIRMISH_AFTER_DAYS = 2;

/** The skirmishes on the map on `day` of the campaign: the royalists of each, at the place of its combat. */
export function activeSkirmishes(route: Route, day: number): Array<{ id: string; lon: number; lat: number; men: number }> {
  const out: Array<{ id: string; lon: number; lat: number; men: number }> = [];
  for (const k of SKIRMISHES) {
    const place = route.points.find((p) => k.match.test(p.name));
    if (place && day >= place.day_of_campaign - SKIRMISH_BEFORE_DAYS && day <= place.day_of_campaign + SKIRMISH_AFTER_DAYS) out.push({ id: k.id, lon: place.lon, lat: place.lat, men: k.men });
  }
  return out;
}

/** The fewest red balls a skirmish has, so the royalists can be seen even when the sources give a hundred men (a ball stands for about 500). */
export const SKIRMISH_MIN_BALLS = 3;

/** The red balls of the skirmishes on `day`: a short row across each place, `spacingKm` apart. */
export function skirmishBalls(route: Route, day: number, spacingKm: number): Array<{ id: string; lon: number; lat: number; small: boolean }> {
  const out: Array<{ id: string; lon: number; lat: number; small: boolean }> = [];
  for (const k of activeSkirmishes(route, day)) {
    const count = Math.max(SKIRMISH_MIN_BALLS, ballCount(k.men));
    const dLon = Math.min(spacingKm, MAX_LINE_SPACING_KM) / (111.32 * Math.cos((k.lat * Math.PI) / 180));
    for (let i = 0; i < count; i += 1) out.push({ id: k.id, lon: k.lon + (i - (count - 1) / 2) * dLon, lat: k.lat, small: false });
  }
  return out;
}

/** The men of the royalist army, as the sources give them: 2,080 (municipality of Chacabuco) to about 2,500; the balls count at the middle. */
export const ENEMY_MEN = 2290;

/**
 * The colors of the figures of the royalists: the same figures, in white where the patriot ones wear blue. The sources disagree on the uniforms of the royalist army at
 * Chacabuco (blue, green or all white for the Talavera, blue jackets with white trousers for others); a contemporary account says the Talavera was «all white, from the cover of
 * the helmet to the boots», and white is also what the reader remembers. A schematic choice, said in `docs/references.md`.
 */
export const ENEMY_PALETTE: Readonly<Record<string, string>> = { '#2f4a80': '#ecece4', '#243a66': '#dcdcd2', '#b3262b': '#ecece4', '#e9e6dc': '#dcdcd2', '#75aadb': '#b3262b' };

/** A route that does not go anywhere (two points a kilometer apart, north-south) for a force that stands still: its figures need a path to stand on. */
export function stationaryRoute(lon: number, lat: number): Route {
  const event = (name: string, dLat: number) => ({
    id: name,
    name,
    day_of_campaign: 0,
    date: '1817-02-12',
    date_precision: 'day' as const,
    lat: lat + dLat,
    lon,
    elevation_m: null,
    forces: [],
    source: 'schematic',
    retrieved_at: '2026-10-09',
    note: 'Posición esquemática'
  });
  return buildRoute([event('a', 0), event('b', 0.009)]);
}

/** The most a line of balls spreads on the ground: a front of 3,500 men was about a kilometer, so a ball every 0.35 km, however far the camera is. */
export const MAX_LINE_SPACING_KM = 0.35;

/**
 * The balls of forces that have formed to fight: all in one row, side by side, centered on `center`, the first group at the west end. The spacing is the one of the
 * map (a few pixels) but never more than `MAX_LINE_SPACING_KM`.
 */
export function formationBalls(
  groups: ReadonlyArray<{ id: string; count: number; small: boolean }>,
  center: [number, number],
  spacingKm: number
): Array<{ id: string; lon: number; lat: number; small: boolean }> {
  const step = Math.min(spacingKm, MAX_LINE_SPACING_KM);
  const dLon = step / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const total = groups.reduce((n, g) => n + g.count, 0);
  const out: Array<{ id: string; lon: number; lat: number; small: boolean }> = [];
  let i = 0;
  for (const g of groups) {
    for (let k = 0; k < g.count; k += 1) {
      out.push({ id: g.id, lon: center[0] + (i - (total - 1) / 2) * dLon, lat: center[1], small: g.small });
      i += 1;
    }
  }
  return out;
}

/** The places of the red balls of the royalists: a row across the place of the army, `spacingKm` apart, centered on it. */
export function enemyBalls(spacingKm: number): Array<[number, number]> {
  const count = ballCount(ENEMY_MEN);
  const dLon = Math.min(spacingKm, MAX_LINE_SPACING_KM) / (111.32 * Math.cos((ENEMY_POSITION.lat * Math.PI) / 180));
  return Array.from({ length: count }, (_, i): [number, number] => [ENEMY_POSITION.lon + (i - (count - 1) / 2) * dLon, ENEMY_POSITION.lat]);
}

/** A bubble over the head of one force, or of two that march together. */
export interface Bubble {
  /** the id of the first force of the bubble */
  id: string;
  /** every force the bubble speaks for */
  ids: string[];
  lon: number;
  lat: number;
}

/**
 * The bubbles of the map: one over the head of each force, the main one first; the column of Uspallata shares the bubble of the main force only once the two
 * roads have crossed, at Curimón before Chacabuco (the day of that place in its route), and while they are within `MERGE_KM` of each other. Before that
 * (they both leave from El Plumerillo) each has its own. The royalists of a skirmish have a bubble on its day, and the royalist army the last one.
 */
export function bubblesFor(main: Route, mainKm: number, columns: readonly Column[], day: number): Bubble[] {
  const head = coordAtKm(main, mainKm);
  const mainBubble: Bubble = { id: MAIN_FORCE_ID, ids: [MAIN_FORCE_ID], lon: head.lon, lat: head.lat };
  const out: Bubble[] = [mainBubble];
  for (const c of columns) {
    const at = positionOfColumn(c, day);
    if (!at) continue;
    const meeting = c.route.points.find((p) => /^Curimón/.test(p.name))?.day_of_campaign;
    if (c.id === 'las-heras' && meeting !== undefined && day >= meeting && distanceKm(head.lon, head.lat, at.lon, at.lat) < MERGE_KM) {
      mainBubble.ids.push(c.id);
      continue;
    }
    out.push({ id: c.id, ids: [c.id], lon: at.lon, lat: at.lat });
  }
  for (const k of activeSkirmishes(main, day)) out.push({ id: k.id, ids: [k.id], lon: k.lon, lat: k.lat });
  out.push({ id: ENEMY_ID, ids: [ENEMY_ID], lon: ENEMY_POSITION.lon, lat: ENEMY_POSITION.lat });
  return out;
}

/** Two forces closer than this (km) march as one on the map: their texts are one. */
export const MERGE_KM = 12;

/** The short text of forces that march together: their roles joined. */
export function joinedShortLabel(ids: readonly string[]): string {
  return ids.map(forceShortLabel).filter(Boolean).join(' + ');
}

/**
 * The text of forces that march together (the main force and the column of Uspallata from Curimón on), in the same four lines as one force: the roles joined,
 * the commanders of all, the men of each added up in words, and all the units.
 */
export function joinedLabel(ids: readonly string[]): string {
  const facts = ids.map((id) => FORCE_FACTS[id]).filter((f): f is ForceFacts => Boolean(f));
  if (facts.length === 0) return '';
  if (facts.length === 1) return forceLabel(ids[0]!);
  const unique = (parts: string[]) => [...new Set(parts)].join(' · ');
  return [
    facts.map((f) => f.short).join(' + '),
    unique(facts.flatMap((f) => f.leaders.split(' · '))),
    `${facts.map((f) => f.men).join(' + ')} hombres`,
    unique(facts.flatMap((f) => f.battalions.split(' · ')))
  ].join('\n');
}

/** Just the role of the group: what shows on the map from far away, where the commanders and the units would pile up. */
export function forceShortLabel(id: string): string {
  return FORCE_FACTS[id]?.short ?? '';
}

/** The infantry of each force as a number, where the sources give it (a range counts at its middle): the figures up close stand for it. */
const FORCE_INFANTRY: Readonly<Record<string, number>> = { 'las-heras': 683, zelada: 50, freire: 78 };

/** The men the figures of a force stand for: its infantry when the sources give it, otherwise all its men; null when there is nothing. */
export function figureMen(id: string, men: number | null): number | null {
  return FORCE_INFANTRY[id] ?? men;
}

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

/** The places of the balls of a force: the first at the head (`km` along its route) and the others behind it, one `spacingKm` apart, never before the start. */
export function ballPositions(route: Route, km: number, count: number, spacingKm: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < count; i += 1) {
    const c = coordAtKm(route, km - i * spacingKm);
    out.push([c.lon, c.lat]);
  }
  return out;
}

/** Kilometers along the route between two balls of a force, so they stand a few pixels apart at this zoom. */
export function ballSpacingKm(zoom: number, latitude: number, pixels = 14): number {
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
