import { describe, it, expect } from 'vitest';
import { MALVINAS_FEATURE, MALVINAS_ID, geoWithMalvinas } from '../../src/geo/malvinas.js';
import type { ProvincesGeo } from '../../src/geo/provinces.js';

describe('Malvinas illustrative outline', () => {
  it('is a feature flagged as illustrative with its own id, never a province id', () => {
    expect(MALVINAS_ID).toBe('MALVINAS');
    expect(MALVINAS_FEATURE.type).toBe('Feature');
    expect(MALVINAS_FEATURE.properties).toEqual({ id: 'MALVINAS', name: 'Malvinas Islands', illustrative: true });
    expect(MALVINAS_ID).not.toMatch(/^AR-[A-Z]$/);
  });

  it('is two coarse closed polygons (the two main islands), as a MultiPolygon', () => {
    const g = MALVINAS_FEATURE.geometry;
    expect(g.type).toBe('MultiPolygon');
    expect(g.coordinates).toHaveLength(2);
    for (const polygon of g.coordinates) {
      expect(polygon).toHaveLength(1);
      const ring = polygon[0]!;
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring.length).toBeLessThanOrEqual(15); // a rough drawing, not a survey
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it('lies in the South Atlantic and the two islands do not overlap', () => {
    const boxes = MALVINAS_FEATURE.geometry.coordinates.map((polygon) => {
      const ring = polygon[0]!;
      const lons = ring.map((p) => p[0]);
      const lats = ring.map((p) => p[1]);
      return { west: Math.min(...lons), east: Math.max(...lons), south: Math.min(...lats), north: Math.max(...lats) };
    });
    for (const b of boxes) {
      expect(b.west).toBeGreaterThan(-62);
      expect(b.east).toBeLessThan(-57);
      expect(b.south).toBeGreaterThan(-53);
      expect(b.north).toBeLessThan(-51);
    }
    const [a, b] = boxes as [(typeof boxes)[number], (typeof boxes)[number]];
    expect(a.east < b.west || b.east < a.west).toBe(true);
  });

  it('geoWithMalvinas appends exactly one feature and does not mutate the input', () => {
    const geo: ProvincesGeo = { type: 'FeatureCollection', features: [] };
    const out = geoWithMalvinas(geo);
    expect(out.features).toHaveLength(1);
    expect(out.features[0]).toBe(MALVINAS_FEATURE);
    expect(geo.features).toHaveLength(0);
    expect(out.type).toBe('FeatureCollection');
  });
});
