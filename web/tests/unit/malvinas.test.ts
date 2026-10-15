import { describe, it, expect } from 'vitest';
import outline from '../../src/geo/malvinasOutline.json';
import { MALVINAS_FEATURE, MALVINAS_ID, geoWithMalvinas } from '../../src/geo/malvinas.js';
import type { ProvincesGeo } from '../../src/geo/provinces.js';

type Ring = number[][];

/** Area in km2 of a ring (equirectangular around its mean latitude, positive when counter-clockwise). */
function areaKm2(ring: Ring): number {
  const lat0 = ring.reduce((n, p) => n + p[1]!, 0) / ring.length;
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 111.32;
  let total = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[i + 1]!;
    total += x1! * kx * (y2! * ky) - x2! * kx * (y1! * ky);
  }
  return total / 2;
}

const rings = (): Ring[] => MALVINAS_FEATURE.geometry.coordinates.map((p) => p[0]!);

describe('Malvinas outline', () => {
  it('is a feature with its own id, never a province id, with no data of its own', () => {
    expect(MALVINAS_ID).toBe('MALVINAS');
    expect(MALVINAS_FEATURE.type).toBe('Feature');
    expect(MALVINAS_FEATURE.properties).toEqual({ id: 'MALVINAS', name: 'Malvinas Islands', illustrative: true });
    expect(MALVINAS_ID).not.toMatch(/^AR-[A-Z]$/);
  });

  it('comes from Natural Earth and says so: source, address, license and retrieval date', () => {
    expect(outline.source).toMatch(/Natural Earth/);
    expect(outline.url).toMatch(/^https:\/\/www\.naturalearthdata\.com\//);
    expect(outline.license).toMatch(/public domain/i);
    expect(outline.retrieved_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is the two main islands and the larger islets, as a MultiPolygon of closed rings', () => {
    const g = MALVINAS_FEATURE.geometry;
    expect(g.type).toBe('MultiPolygon');
    expect(g.coordinates.length).toBeGreaterThanOrEqual(8);
    expect(g.coordinates.length).toBeLessThanOrEqual(20);
    for (const polygon of g.coordinates) {
      expect(polygon).toHaveLength(1);
      const ring = polygon[0]!;
      expect(ring.length).toBeGreaterThanOrEqual(9);
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it('keeps the file small: under 800 points in all', () => {
    expect(rings().reduce((n, r) => n + r.length, 0)).toBeLessThan(800);
  });

  it('lies in the South Atlantic, between 61.5 and 57.5 degrees west and 50.9 and 52.5 degrees south', () => {
    for (const ring of rings()) {
      for (const [lon, lat] of ring) {
        expect(lon).toBeGreaterThan(-61.5);
        expect(lon).toBeLessThan(-57.5);
        expect(lat).toBeGreaterThan(-52.5);
        expect(lat).toBeLessThan(-50.9);
      }
    }
  });

  it('has the real size of the two main islands: Soledad about 6,605 km2 and Gran Malvina about 4,532 km2', () => {
    // the real areas (Wikipedia, "East Falkland" and "West Falkland"); the outline is simplified, so it is a little smaller
    const [east, west] = rings().map(areaKm2).sort((a, b) => b - a);
    expect(Math.abs(east! / 6605 - 1)).toBeLessThan(0.1);
    expect(Math.abs(west! / 4532 - 1)).toBeLessThan(0.1);
  });

  it('puts Gran Malvina (west) and Soledad (east) where they are, Soledad reaching Cabo Pembroke', () => {
    const [a, b] = [...rings()].sort((x, y) => areaKm2(y) - areaKm2(x));
    const centre = (r: Ring) => r.reduce((n, p) => n + p[0]!, 0) / r.length;
    expect(centre(a!)).toBeGreaterThan(centre(b!));
    expect(Math.max(...a!.map((p) => p[0]!))).toBeGreaterThan(-57.8);
    expect(Math.min(...b!.map((p) => p[0]!))).toBeLessThan(-60.5);
  });

  it('is drawn with a consistent orientation (counter-clockwise), so the 3D shapes are not inside out', () => {
    for (const ring of rings()) expect(areaKm2(ring)).toBeGreaterThan(0);
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
