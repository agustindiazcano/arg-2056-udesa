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

  it('is two closed polygons (the two main islands), as a MultiPolygon, drawn with enough points to read as the islands', () => {
    const g = MALVINAS_FEATURE.geometry;
    expect(g.type).toBe('MultiPolygon');
    expect(g.coordinates).toHaveLength(2);
    for (const polygon of g.coordinates) {
      expect(polygon).toHaveLength(1);
      const ring = polygon[0]!;
      expect(ring.length).toBeGreaterThanOrEqual(15); // Soledad has its peninsula and bays, Gran Malvina its irregular coast
      expect(ring.length).toBeLessThanOrEqual(40); // still a hand drawing, not a survey
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

  it('puts Gran Malvina (west) and Soledad (east) where they are: the sound between them, Soledad reaching further south-east', () => {
    const [west, east] = MALVINAS_FEATURE.geometry.coordinates.map((p) => p[0]!);
    const lon = (r: number[][]) => r.map((p) => p[0]!);
    expect(Math.max(...lon(west!))).toBeLessThan(Math.min(...lon(east!)));
    expect(Math.min(...lon(west!))).toBeLessThan(-61); // the west island reaches 61 degrees west
    expect(Math.max(...lon(east!))).toBeGreaterThan(-57.8); // Cape Pembroke
  });

  it('is drawn with a consistent orientation (counter-clockwise), so the 3D shapes are not inside out', () => {
    for (const polygon of MALVINAS_FEATURE.geometry.coordinates) {
      const r = polygon[0]!;
      const area = r.reduce((sum, a, i) => {
        const b = r[(i + 1) % r.length]!;
        return sum + (a[0]! * b[1]! - b[0]! * a[1]!);
      }, 0);
      expect(area).toBeGreaterThan(0);
    }
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
