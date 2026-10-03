import { describe, it, expect } from 'vitest';
import {
  buildProvinces,
  findGeometryProblems,
  geometryAreaKm2,
  polygonProperties,
  simplifyFeatures,
  validateConfig,
  type ProvinceInput,
  type Position
} from '../../../scripts/geo/lib.js';
import { baseConfig, feature, gridCollection } from './geoFixtures.js';

const config = (overrides: Record<string, unknown> = {}) => validateConfig(baseConfig(overrides));

function rectangleKm2(lon1: number, lon2: number, lat1: number, lat2: number): number {
  const R = 6371.0088;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);
  return R * R * dLon * (sin(lat2) - sin(lat1));
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

describe('simplifyFeatures (topology)', () => {
  // Two adjacent squares sharing the edge x = 1, which has an extra collinear and two near-collinear vertices.
  const edge: Position[] = [[1, 0.25], [1, 0.4], [1.0001, 0.5], [1, 0.6]];
  const a: ProvinceInput = {
    id: 'AR-A',
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], ...edge, [1, 1], [0, 1], [0, 0]]] }
  };
  const b: ProvinceInput = {
    id: 'AR-B',
    geometry: { type: 'Polygon', coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], ...[...edge].reverse(), [1, 0]]] }
  };
  const count = (inputs: Array<{ geometry: { coordinates: unknown } }>) =>
    (JSON.stringify(inputs.map((i) => i.geometry.coordinates)).match(/\[-?[\d.]+,-?[\d.]+\]/g) ?? []).length;
  const unique = (positions: Position[]) => [...new Set(positions.map((p) => JSON.stringify(p)))].sort();

  it('keeps neighbouring provinces on exactly the same shared border (no gap, no overlap)', () => {
    const out = simplifyFeatures([a, b], 1e-4, 3);
    const ring = (id: string) => (out.find((f) => f.id === id)!.geometry.coordinates as Position[][])[0]!;
    const onEdge = (r: Position[]) => unique(r.filter((p) => p[0] === 1));
    expect(onEdge(ring('AR-A'))).toEqual(['[1,0]', '[1,1]']);
    expect(onEdge(ring('AR-B'))).toEqual(onEdge(ring('AR-A')));
    expect(ring('AR-A')).toHaveLength(5);
    expect(ring('AR-B')).toHaveLength(5);
  });

  it('reduces the number of vertices', () => {
    const out = simplifyFeatures([a, b], 1e-4, 3);
    expect(count(out)).toBeLessThan(count([a, b]));
  });

  it('with a zero threshold keeps every vertex of the shared edge on both sides', () => {
    const out = simplifyFeatures([a, b], 0, 4);
    const ring = (id: string) => (out.find((f) => f.id === id)!.geometry.coordinates as Position[][])[0]!;
    const onEdge = (r: Position[]) => unique(r.filter((p) => p[0] === 1 || p[0] === 1.0001));
    expect(onEdge(ring('AR-A'))).toEqual(onEdge(ring('AR-B')));
    expect(onEdge(ring('AR-A'))).toHaveLength(6); // (1,0) (1,.25) (1,.4) (1.0001,.5) (1,.6) (1,1)
    expect(ring('AR-A')).toHaveLength(9);
  });

  it('rounds coordinates to the requested decimals without making the shared border differ', () => {
    const inputs: ProvinceInput[] = [
      { id: 'AR-A', geometry: { type: 'Polygon', coordinates: [[[0, 0], [1.00012345, 0], [1.00012345, 1], [0, 1], [0, 0]]] } },
      { id: 'AR-B', geometry: { type: 'Polygon', coordinates: [[[1.00012345, 0], [2, 0], [2, 1], [1.00012345, 1], [1.00012345, 0]]] } }
    ];
    const out = simplifyFeatures(inputs, 0, 3);
    const numbers = JSON.stringify(out.map((f) => f.geometry.coordinates)).match(/-?[\d.]+/g)!.map(Number);
    expect(numbers.every((n) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-9)).toBe(true);
    const ring = (id: string) => (out.find((f) => f.id === id)!.geometry.coordinates as Position[][])[0]!;
    expect(unique(ring('AR-A').filter((p) => p[0] === 1))).toEqual(unique(ring('AR-B').filter((p) => p[0] === 1)));
  });
});

describe('buildProvinces: budget search', () => {
  const grid = () => gridCollection({ zigzag: true });
  const full = buildProvinces(grid(), config({ max_area_change_pct: 100, target_max_bytes: 10_000_000 }));
  const target = Math.floor(full.meta.simplification.bytes * 0.6);

  it('does not simplify when the data already fits', () => {
    expect(full.meta.simplification.parameter).toBe(0);
    expect(full.meta.simplification.vertices_after).toBe(full.meta.simplification.vertices_before);
  });

  it('fits target_max_bytes with the smallest simplification found, and bytes equals the file size', () => {
    const r = buildProvinces(grid(), config({ max_area_change_pct: 100, target_max_bytes: target }));
    expect(r.meta.simplification.bytes).toBeLessThanOrEqual(target);
    expect(Buffer.byteLength(r.geojson)).toBe(r.meta.simplification.bytes);
    expect(r.meta.simplification.parameter).toBeGreaterThan(0);
    expect(r.meta.simplification.vertices_after).toBeLessThan(r.meta.simplification.vertices_before);

    const tighter = buildProvinces(grid(), config({ max_area_change_pct: 100, target_max_bytes: r.meta.simplification.bytes - 1 }));
    expect(tighter.meta.simplification.parameter).toBeGreaterThan(r.meta.simplification.parameter);
    expect(tighter.meta.simplification.bytes).toBeLessThanOrEqual(r.meta.simplification.bytes - 1);
  });

  it('gives the same parameter and bytes on two runs', () => {
    const run = () => buildProvinces(grid(), config({ max_area_change_pct: 100, target_max_bytes: target }));
    const one = run();
    const two = run();
    expect(two.meta).toEqual(one.meta);
    expect(two.geojson).toBe(one.geojson);
  });

  it('fails and prints the achieved size when the budget is impossible', () => {
    expect(() => buildProvinces(grid(), config({ max_area_change_pct: 100, target_max_bytes: 10 }))).toThrow(
      /cannot fit target_max_bytes 10: achieved size \d+ bytes at maximum simplification/
    );
  });
});

describe('buildProvinces: islands', () => {
  it('drops small polygons, reports them, and counts vertices after the drop', () => {
    const collection = gridCollection();
    const f = collection.features[0]!;
    const main = (f.geometry.coordinates as Position[][])[0]!;
    const island: Position[] = [[-60, -33], [-59.999, -33], [-59.999, -32.999], [-60, -32.999], [-60, -33]];
    collection.features[0] = feature('P01', [[main], [island]] as never, 'MultiPolygon') as typeof f;
    const r = buildProvinces(collection, config({ min_island_area_km2: 1 }));
    expect(r.meta.dropped_polygons).toEqual([
      { id: 'AR-A', area_km2: round3(rectangleKm2(-60, -59.999, -33, -32.999)) }
    ]);
    expect(r.meta.simplification.vertices_before).toBe(24 * 5);
  });
});

describe('buildProvinces: quality gates', () => {
  it('fails naming the province and the numbers when the area change is too large', () => {
    const full = buildProvinces(gridCollection({ zigzag: true }), config({ target_max_bytes: 10_000_000 }));
    const target = Math.floor(full.meta.simplification.bytes * 0.6);
    expect(() =>
      buildProvinces(gridCollection({ zigzag: true }), config({ target_max_bytes: target, max_area_change_pct: 0 }))
    ).toThrow(/province AR-[A-Z] area changed [0-9.]+% which exceeds max_area_change_pct 0/);
  });

  it('records the area change per province in the metadata', () => {
    const r = buildProvinces(gridCollection(), config());
    expect(Object.keys(r.meta.area_change_pct)).toHaveLength(24);
    expect(Object.values(r.meta.area_change_pct).every((v) => v === 0)).toBe(true);
  });

  it('detects unclosed rings, short rings, non-finite coordinates and empty geometries', () => {
    const closed: Position[] = [[0, 0], [1, 0], [1, 1], [0, 0]];
    expect(findGeometryProblems({ type: 'Polygon', coordinates: [closed] })).toEqual([]);
    expect(findGeometryProblems({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] })).toEqual(['ring is not closed']);
    expect(findGeometryProblems({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 0]]] })).toEqual(['ring has 3 positions, at least 4 are required']);
    expect(findGeometryProblems({ type: 'Polygon', coordinates: [[[0, 0], [Number.NaN, 0], [1, 1], [0, 0]]] })).toEqual(['coordinate is not finite']);
    expect(findGeometryProblems({ type: 'Polygon', coordinates: [[[0, 0], [Infinity, 0], [1, 1], [0, 0]]] })).toEqual(['coordinate is not finite']);
    expect(findGeometryProblems({ type: 'MultiPolygon', coordinates: [] })).toEqual(['geometry is empty']);
  });
});

describe('properties', () => {
  it('has exactly the documented properties, in order, sorted by id, with names from PROVINCES', () => {
    const r = buildProvinces(gridCollection(), config());
    const collection = JSON.parse(r.geojson);
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(24);
    expect(collection.features.map((f: { properties: { id: string } }) => f.properties.id)).toEqual(
      [...collection.features.map((f: { properties: { id: string } }) => f.properties.id)].sort()
    );
    const first = collection.features[0];
    expect(Object.keys(first)).toEqual(['type', 'properties', 'geometry']);
    expect(Object.keys(first.properties)).toEqual(['id', 'name', 'area_km2', 'centroid', 'centroid_inside', 'bbox']);
    expect(first.properties).toEqual({
      id: 'AR-A',
      name: 'Salta',
      area_km2: round3(rectangleKm2(-70, -69, -34, -33)),
      centroid: [-69.5, -33.5],
      centroid_inside: true,
      bbox: [-70, -34, -69, -33]
    });
  });

  it('computes area_km2 from the original geometry, not the simplified one', () => {
    const grid = gridCollection({ zigzag: true });
    const full = buildProvinces(grid, config({ max_area_change_pct: 100, target_max_bytes: 10_000_000 }));
    const target = Math.floor(full.meta.simplification.bytes * 0.6);
    const r = buildProvinces(grid, config({ max_area_change_pct: 100, target_max_bytes: target }));
    const original = geometryAreaKm2({ type: 'Polygon', coordinates: grid.features[0]!.geometry.coordinates as Position[][] });
    expect(JSON.parse(r.geojson).features[0].properties.area_km2).toBe(round3(original));
  });

  it('flags a centroid outside a C-shaped polygon', () => {
    const c: Position[] = [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [3, 2], [3, 3], [0, 3], [0, 0]];
    const p = polygonProperties({ type: 'Polygon', coordinates: [c] }, 3);
    expect(p.centroid).toEqual([1.357, 1.5]);
    expect(p.centroid_inside).toBe(false);
    expect(p.bbox).toEqual([0, 0, 3, 3]);
  });

  it('uses the largest polygon for the centroid and the whole geometry for the bbox', () => {
    const big: Position[] = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]];
    const small: Position[] = [[10, 0], [11, 0], [11, 1], [10, 1], [10, 0]];
    const p = polygonProperties({ type: 'MultiPolygon', coordinates: [[small], [big]] }, 3);
    expect(p.centroid).toEqual([2, 2]);
    expect(p.centroid_inside).toBe(true);
    expect(p.bbox).toEqual([0, 0, 11, 4]);
  });

  it('subtracts holes from the centroid', () => {
    const outer: Position[] = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]];
    const hole: Position[] = [[2, 0.5], [3.5, 0.5], [3.5, 3.5], [2, 3.5], [2, 0.5]];
    const p = polygonProperties({ type: 'Polygon', coordinates: [outer, hole] }, 3);
    // outer 16 at (2, 2), hole 4.5 at (2.75, 2): centroid x = (16 * 2 - 4.5 * 2.75) / 11.5
    expect(p.centroid[0]).toBe(Math.round(((16 * 2 - 4.5 * 2.75) / 11.5) * 1000) / 1000);
    expect(p.centroid[1]).toBe(2);
  });
});
