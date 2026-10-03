import { PROVINCES } from '../../../src/types/province.js';

export type Position = [number, number];

/** Input codes P01..P24, mapped to the 24 province ids in order. */
export const CODES = PROVINCES.map((_, i) => `P${String(i + 1).padStart(2, '0')}`);

export function idMap(): Record<string, string> {
  return Object.fromEntries(PROVINCES.map((p, i) => [CODES[i]!, p.id]));
}

export function baseConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    dataset_id: 'geo_example',
    input_file: 'input.geojson',
    id_property: 'code',
    id_map: idMap(),
    target_max_bytes: 100000,
    max_area_change_pct: 2,
    min_island_area_km2: 0,
    coordinate_decimals: 3,
    sanity_bounds: { lon: [-80, -50], lat: [-60, -20] },
    ...overrides
  };
}

const key = (p: Position) => `${p[0]},${p[1]}`;

/** Deterministic zigzag points between a and b; the same list (reversed) for the opposite direction. */
function interior(a: Position, b: Position): Position[] {
  const flip = key(a) > key(b);
  const [p, q] = flip ? [b, a] : [a, b];
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const points: Position[] = [];
  for (let k = 1; k <= 9; k++) {
    const t = k / 10;
    const amp = (k % 2 === 0 ? 1 : -1) * 0.002;
    points.push([p[0] + dx * t - dy * amp, p[1] + dy * t + dx * amp]);
  }
  return flip ? points.reverse() : points;
}

export function cellRing(col: number, row: number, zigzag: boolean): Position[] {
  const x0 = -70 + col;
  const y0 = -34 + row;
  const bl: Position = [x0, y0];
  const br: Position = [x0 + 1, y0];
  const tr: Position = [x0 + 1, y0 + 1];
  const tl: Position = [x0, y0 + 1];
  const side = (a: Position, b: Position) => (zigzag ? [a, ...interior(a, b)] : [a]);
  return [...side(bl, br), ...side(br, tr), ...side(tr, tl), ...side(tl, bl), bl];
}

export function feature(code: string, coordinates: Position[][][] | Position[][], type = 'Polygon') {
  return { type: 'Feature', properties: { code }, geometry: { type, coordinates } };
}

/** 24 unit squares on a 6 x 4 grid (1 degree each). Neighbours share identical border vertices. */
export function gridCollection(opts: { zigzag?: boolean } = {}) {
  const features = CODES.map((code, i) => feature(code, [cellRing(i % 6, Math.floor(i / 6), opts.zigzag ?? false)]));
  return { type: 'FeatureCollection', features };
}
