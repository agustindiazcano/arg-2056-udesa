import { MALVINAS_FEATURE } from '../geo/malvinas.js';

/** One shape of the sheet of the intro (`provinces.json`). */
export interface IntroShape {
  id: number;
  name: string;
  d: string;
  cx: number;
  cy: number;
}

/**
 * The sheet of the intro draws the 24 provinces on a flat 489.5 x 1000 plane. Its projection was recovered by a least-squares fit of the
 * bounding boxes of the provinces against the ones of `public/geo/provinces.geojson` (x = A lon + B, y = C lat + D; residuals up to
 * 42 units in x and 14 in y, tested in `introMalvinas.test.ts`). It is only used to place the illustrative Malvinas outline of
 * `geo/malvinas.ts` on the sheet, so a few units of error do not matter.
 */
const A = 24.2498;
const B = 1755.5823;
const C = -29.0706;
const D = -612.7067;

export const introPoint = (lon: number, lat: number): [number, number] => [A * lon + B, C * lat + D];

const one = (n: number): string => (Math.round(n * 10) / 10).toString();

/** The Malvinas as a shape of the intro: the two islands as two sub-paths, in the style of the other shapes ("M x y L x y ... Z"). */
function build(id: number): IntroShape {
  const rings = MALVINAS_FEATURE.geometry.coordinates.map((poly) => poly[0]!.slice(0, -1).map(([lon, lat]) => introPoint(lon!, lat!)));
  const d = rings.map((ring) => `M${ring.map(([x, y]) => `${one(x)} ${one(y)}`).join('L')}Z`).join('');
  const all = rings.flat();
  const cx = all.reduce((n, p) => n + p[0], 0) / all.length;
  const cy = all.reduce((n, p) => n + p[1], 0) / all.length;
  return { id, name: 'Islas Malvinas', d, cx: Math.round(cx * 10) / 10, cy: Math.round(cy * 10) / 10 };
}

/** The id the Malvinas take on the sheet: the next one after the 24 provinces (the lights pick an id between 0 and the number of shapes). */
export const INTRO_MALVINAS_ID = 24;

export const MALVINAS_INTRO: IntroShape = build(INTRO_MALVINAS_ID);

/** The provinces of the sheet and, after them, the Malvinas. */
export function withMalvinas<T extends IntroShape>(provinces: readonly T[]): IntroShape[] {
  return [...provinces, MALVINAS_INTRO];
}
