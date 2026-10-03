import { describe, it, expect } from 'vitest';
import {
  checkInput,
  dropIslands,
  geometryAreaKm2,
  polygonAreaKm2,
  ringAreaKm2,
  validateConfig,
  EARTH_RADIUS_KM
} from '../../../scripts/geo/lib.js';
import { baseConfig, feature, gridCollection, type Position } from './geoFixtures.js';

const cfg = () => validateConfig(baseConfig());

/** Closed form for a lat/lon rectangle on a sphere, written independently of the implementation. */
function rectangleKm2(lon1: number, lon2: number, lat1: number, lat2: number): number {
  const R = 6371.0088;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);
  return R * R * dLon * (sin(lat2) - sin(lat1));
}

function rectRing(lon1: number, lon2: number, lat1: number, lat2: number): Position[] {
  return [[lon1, lat1], [lon2, lat1], [lon2, lat2], [lon1, lat2], [lon1, lat1]];
}

function expectRelative(actual: number, expected: number, tolerance = 1e-6) {
  expect(Math.abs(actual - expected) / expected).toBeLessThan(tolerance);
}

describe('area', () => {
  it('uses the mean Earth radius 6371.0088 km', () => {
    expect(EARTH_RADIUS_KM).toBe(6371.0088);
  });

  it('matches the closed form for a rectangle, to 6 significant digits', () => {
    expectRelative(ringAreaKm2(rectRing(-70, -69, -34, -33)), rectangleKm2(-70, -69, -34, -33));
    expectRelative(ringAreaKm2(rectRing(-65.5, -62.25, -45, -30)), rectangleKm2(-65.5, -62.25, -45, -30));
  });

  it('does not depend on the winding direction', () => {
    const ring = rectRing(-70, -69, -34, -33);
    expect(ringAreaKm2([...ring].reverse())).toBeCloseTo(ringAreaKm2(ring), 6);
  });

  it('subtracts holes', () => {
    const outer = rectRing(-70, -68, -34, -32);
    const hole = rectRing(-69.5, -68.5, -33.5, -32.5);
    const expected = rectangleKm2(-70, -68, -34, -32) - rectangleKm2(-69.5, -68.5, -33.5, -32.5);
    expectRelative(polygonAreaKm2([outer, hole]), expected);
  });

  it('sums the polygons of a MultiPolygon', () => {
    const geometry = {
      type: 'MultiPolygon' as const,
      coordinates: [[rectRing(-70, -69, -34, -33)], [rectRing(-60, -59, -34, -33)]]
    };
    expectRelative(geometryAreaKm2(geometry), rectangleKm2(-70, -69, -34, -33) + rectangleKm2(-60, -59, -34, -33));
  });
});

describe('checkInput', () => {
  it('accepts 24 valid features, maps their ids and sorts them by id', () => {
    const collection = gridCollection();
    collection.features.reverse();
    const inputs = checkInput(collection, cfg());
    expect(inputs).toHaveLength(24);
    expect(inputs.map((i) => i.id)).toEqual([...inputs.map((i) => i.id)].sort());
    expect(inputs[0]!.id).toBe('AR-A');
    expect(inputs[23]!.id).toBe('AR-Z');
    expect(inputs[0]!.geometry.type).toBe('Polygon');
  });

  it('accepts MultiPolygon geometries', () => {
    const collection = gridCollection();
    const f = collection.features[0]!;
    collection.features[0] = feature('P01', [f.geometry.coordinates as Position[][]], 'MultiPolygon') as typeof f;
    expect(checkInput(collection, cfg())[0]!.geometry.type).toBe('MultiPolygon');
  });

  it('rejects something that is not a FeatureCollection', () => {
    expect(() => checkInput({ type: 'Feature' }, cfg())).toThrow('input must be a GeoJSON FeatureCollection');
    expect(() => checkInput(null, cfg())).toThrow('input must be a GeoJSON FeatureCollection');
  });

  it('rejects non-polygon geometries, naming the feature', () => {
    const collection = gridCollection();
    collection.features[2] = { type: 'Feature', properties: { code: 'P03' }, geometry: { type: 'Point', coordinates: [-68, -33] as never } };
    expect(() => checkInput(collection, cfg())).toThrow(
      'feature P03 has geometry type Point; only Polygon and MultiPolygon are allowed'
    );
  });

  it('rejects a coordinate outside sanity_bounds, naming the feature and the first bad coordinate', () => {
    const collection = gridCollection();
    const f = collection.features[4]!;
    const ring = (f.geometry.coordinates as Position[][])[0]!;
    ring[1] = [3500000, 6100000]; // a projected coordinate
    expect(() => checkInput(collection, cfg())).toThrow(
      'feature P05 has coordinate [3500000, 6100000] outside sanity_bounds lon [-80, -50] lat [-60, -20]'
    );
  });

  it('rejects a coordinate that is not a finite number', () => {
    const collection = gridCollection();
    const ring = (collection.features[0]!.geometry.coordinates as Position[][])[0]!;
    ring[2] = [Number.NaN, -33];
    expect(() => checkInput(collection, cfg())).toThrow('feature P01 has a coordinate that is not a finite [lon, lat] pair');
  });

  it('rejects a feature without the id property', () => {
    const collection = gridCollection();
    collection.features[7] = { type: 'Feature', properties: {} as never, geometry: collection.features[7]!.geometry };
    expect(() => checkInput(collection, cfg())).toThrow('feature at index 7 has no property code');
  });

  it('lists unmapped, duplicate and missing provinces', () => {
    const collection = gridCollection();
    collection.features.pop(); // P24 -> AR-Z missing
    collection.features.push(feature('P99', collection.features[0]!.geometry.coordinates as Position[][]) as never);
    collection.features.push(feature('P01', collection.features[0]!.geometry.coordinates as Position[][]) as never);
    let message = '';
    try {
      checkInput(collection, cfg());
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain('unmapped input ids: P99');
    expect(message).toContain('duplicate province AR-A (input ids: P01, P01)');
    expect(message).toContain('missing provinces: AR-Z');
  });
});

describe('dropIslands', () => {
  const big = rectRing(-70, -69, -34, -33); // about 10^4 km2
  const small = rectRing(-60, -59.99, -34, -33.99); // about 1 km2
  const tiny = rectRing(-50.5, -50.499, -34, -33.999); // about 0.01 km2

  const province = (id: string, polygons: Position[][]) => ({
    id,
    geometry: { type: 'MultiPolygon' as const, coordinates: polygons.map((r) => [r]) }
  });

  it('drops polygons below the threshold and reports them with their original area', () => {
    const { kept, dropped } = dropIslands([province('AR-A', [big, small, tiny])], 150);
    expect(kept[0]!.geometry.coordinates).toHaveLength(1);
    expect(dropped.map((d) => d.id)).toEqual(['AR-A', 'AR-A']);
    expect(dropped[0]!.area_km2).toBe(Math.round(geometryAreaKm2({ type: 'Polygon', coordinates: [small] }) * 1000) / 1000);
    expect(dropped[1]!.area_km2).toBe(Math.round(geometryAreaKm2({ type: 'Polygon', coordinates: [tiny] }) * 1000) / 1000);
  });

  it('keeps everything when the threshold is 0', () => {
    const { kept, dropped } = dropIslands([province('AR-A', [big, small, tiny])], 0);
    expect(kept[0]!.geometry.coordinates).toHaveLength(3);
    expect(dropped).toEqual([]);
  });

  it('never drops the largest polygon of a province, even below the threshold', () => {
    const { kept, dropped } = dropIslands([province('AR-B', [tiny, small])], 1e9);
    expect(kept[0]!.geometry.coordinates).toHaveLength(1);
    expect(kept[0]!.geometry.coordinates[0]).toEqual([small]);
    expect(dropped).toHaveLength(1);
  });

  it('never drops a province that is a single Polygon', () => {
    const input = { id: 'AR-C', geometry: { type: 'Polygon' as const, coordinates: [tiny] } };
    const { kept, dropped } = dropIslands([input], 1e9);
    expect(kept).toEqual([input]);
    expect(dropped).toEqual([]);
  });
});
