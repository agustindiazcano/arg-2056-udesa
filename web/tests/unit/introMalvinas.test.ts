import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MALVINAS_FEATURE } from '../../src/geo/malvinas';
import data from '../../src/intro/provinces.json';
import { INTRO_MALVINAS_ID, MALVINAS_INTRO, introPoint, withMalvinas } from '../../src/intro/malvinasPath';

const nums = (d: string): number[] => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('the Malvinas on the sheet of the intro', () => {
  it('is one more shape of the sheet, with the next free id, so the lights treat it like any province', () => {
    const all = withMalvinas(data.provinces);
    expect(all).toHaveLength(data.provinces.length + 1);
    expect(all.at(-1)!.id).toBe(INTRO_MALVINAS_ID);
    expect(INTRO_MALVINAS_ID).toBe(data.provinces.length);
    expect(all.map((p) => p.id)).toEqual(all.map((_, i) => i));
    expect(data.provinces).toHaveLength(24); // the continental sheet is not touched
  });

  it('has one closed sub-path per island of the outline, inside the sheet and off the coast of Santa Cruz', () => {
    expect(MALVINAS_INTRO.d.match(/M/g)).toHaveLength(MALVINAS_FEATURE.geometry.coordinates.length);
    expect(MALVINAS_INTRO.d.match(/Z/g)).toHaveLength(MALVINAS_FEATURE.geometry.coordinates.length);
    const v = nums(MALVINAS_INTRO.d);
    const xs = v.filter((_, i) => i % 2 === 0);
    const ys = v.filter((_, i) => i % 2 === 1);
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(data.w);
    expect(Math.min(...ys)).toBeGreaterThan(0);
    expect(Math.max(...ys)).toBeLessThan(data.h);
    // to the east of Santa Cruz (whose easternmost point is x = 161 on the sheet) and north of Tierra del Fuego's southern tip
    expect(Math.min(...xs)).toBeGreaterThan(161);
    expect(Math.max(...ys)).toBeLessThan(986);
  });

  it('uses the projection of the sheet: its calibration reproduces the bounding boxes of the provinces within a few percent of the sheet', () => {
    const geo = JSON.parse(readFileSync('public/geo/provinces.geojson', 'utf8')) as {
      features: Array<{ properties: { name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }>;
    };
    const key = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^bcdfghjklmnpqrstvwxyz]/g, '');
    const byKey = new Map(geo.features.map((f) => [key(f.properties.name), f]));
    let checked = 0;
    for (const p of data.provinces) {
      const f = byKey.get(key(p.name.replace(/�/g, '')));
      if (!f || /tierra/i.test(f.properties.name)) continue; // that layer includes the Antarctic sector
      const polys = (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]) as number[][][][];
      const pts = polys.flatMap((poly) => poly[0]!);
      const lonMin = Math.min(...pts.map((q) => q[0]!));
      const lonMax = Math.max(...pts.map((q) => q[0]!));
      const latMin = Math.min(...pts.map((q) => q[1]!));
      const latMax = Math.max(...pts.map((q) => q[1]!));
      const v = nums(p.d);
      const px = v.filter((_, i) => i % 2 === 0);
      const py = v.filter((_, i) => i % 2 === 1);
      // west edge, east edge, north edge (largest latitude, smallest y) and south edge
      expect(Math.abs(introPoint(lonMin, latMax)[0] - Math.min(...px)), `${p.name} west`).toBeLessThan(0.1 * data.w);
      expect(Math.abs(introPoint(lonMax, latMax)[0] - Math.max(...px)), `${p.name} east`).toBeLessThan(0.1 * data.w);
      expect(Math.abs(introPoint(lonMin, latMax)[1] - Math.min(...py)), `${p.name} north`).toBeLessThan(0.03 * data.h);
      expect(Math.abs(introPoint(lonMin, latMin)[1] - Math.max(...py)), `${p.name} south`).toBeLessThan(0.03 * data.h);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(20);
  });
});
