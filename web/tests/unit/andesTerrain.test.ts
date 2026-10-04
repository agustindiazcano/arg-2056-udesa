import { describe, expect, it } from 'vitest';
import { sampleElevation } from '../../src/terrain/decode';
import { SYNTHETIC_SOURCE, isSyntheticTerrain, syntheticTerrain } from '../../src/terrain/synthetic';
import { buildTerrainMesh, sceneScale, toScene } from '../../src/scenes/andes/terrainMesh';
import type { Terrain } from '../../src/types/terrain';

const BBOX: [number, number, number, number] = [-71, -34, -69, -32];

describe('syntheticTerrain', () => {
  const t = syntheticTerrain(BBOX, 40, 40);

  it('has the size and the box asked for, with consistent metadata', () => {
    expect(t.heights.length).toBe(1600);
    expect(t.meta.width).toBe(40);
    expect(t.meta.height).toBe(40);
    expect(t.meta.bbox).toEqual(BBOX);
    expect(t.meta.pixel_size_deg.x).toBeCloseTo(2 / 40, 12);
    expect(t.meta.pixel_size_deg.y).toBeCloseTo(2 / 40, 12);
    const min = Math.min(...t.heights);
    const max = Math.max(...t.heights);
    expect(t.meta.elevation_min_m).toBe(min);
    expect(t.meta.elevation_max_m).toBe(max);
  });

  it('is the same every time (no randomness)', () => {
    const again = syntheticTerrain(BBOX, 40, 40);
    expect(Array.from(again.heights)).toEqual(Array.from(t.heights));
  });

  it('puts a cordillera in the middle: the ridge is much higher than both sides', () => {
    const ridge = sampleElevation(t, -70, -33)!;
    const east = sampleElevation(t, -69.2, -33)!;
    const west = sampleElevation(t, -70.8, -33)!;
    expect(ridge).toBeGreaterThan(east + 1500);
    expect(ridge).toBeGreaterThan(west + 1500);
  });

  it('keeps every height between 0 and 7000 m', () => {
    expect(t.meta.elevation_min_m).toBeGreaterThanOrEqual(0);
    expect(t.meta.elevation_max_m).toBeLessThanOrEqual(7000);
  });

  it('says what it is: provisional and not a DEM', () => {
    expect(t.meta.source).toBe(SYNTHETIC_SOURCE);
    expect(t.meta.attribution).toMatch(/provisorio/i);
    expect(t.meta.dem_inputs).toEqual([]);
    expect(isSyntheticTerrain(t)).toBe(true);
    expect(isSyntheticTerrain({ ...t, meta: { ...t.meta, source: 'Copernicus' } } as Terrain)).toBe(false);
  });
});

describe('sceneScale and toScene', () => {
  const t = syntheticTerrain(BBOX, 10, 10);
  const scale = sceneScale(t, { longSide: 20, exaggeration: 4 });

  it('makes the long side of the box `longSide` units and keeps the proportion of the ground', () => {
    // 2 degrees of longitude at 33 S are shorter than 2 degrees of latitude
    expect(scale.depth).toBeCloseTo(20, 6);
    expect(scale.width).toBeCloseTo(20 * Math.cos((33 * Math.PI) / 180), 1);
  });

  it('maps the corners: west to -x, east to +x, north to -z, south to +z, centred', () => {
    const nw = toScene(scale, -71, -32, 0);
    const se = toScene(scale, -69, -34, 0);
    expect(nw.x).toBeCloseTo(-scale.width / 2, 6);
    expect(nw.z).toBeCloseTo(-scale.depth / 2, 6);
    expect(se.x).toBeCloseTo(scale.width / 2, 6);
    expect(se.z).toBeCloseTo(scale.depth / 2, 6);
  });

  it('scales the height by the exaggeration over the ground size of a unit', () => {
    const a = toScene(scale, -70, -33, 0).y;
    const b = toScene(scale, -70, -33, 1000).y;
    expect(a).toBe(0);
    expect(b).toBeCloseTo((1000 / scale.metersPerUnit) * 4, 10);
  });
});

describe('buildTerrainMesh', () => {
  const t = syntheticTerrain(BBOX, 30, 20);
  const scale = sceneScale(t, { longSide: 20, exaggeration: 4 });

  it('makes a vertex per sample at full detail and two triangles per cell', () => {
    const m = buildTerrainMesh(t, scale, 1);
    expect(m.columns).toBe(30);
    expect(m.rows).toBe(20);
    expect(m.positions.length).toBe(30 * 20 * 3);
    expect(m.indices.length).toBe(29 * 19 * 6);
  });

  it('puts every vertex where toScene puts that sample', () => {
    const m = buildTerrainMesh(t, scale, 1);
    const i = 7 * 30 + 12; // row 7, column 12
    const lon = t.meta.bbox[0] + (12 + 0.5) * t.meta.pixel_size_deg.x;
    const lat = t.meta.bbox[3] - (7 + 0.5) * t.meta.pixel_size_deg.y;
    const p = toScene(scale, lon, lat, t.heights[i]!);
    expect(m.positions[i * 3]).toBeCloseTo(p.x, 4);
    expect(m.positions[i * 3 + 1]).toBeCloseTo(p.y, 4);
    expect(m.positions[i * 3 + 2]).toBeCloseTo(p.z, 4);
  });

  it('has fewer vertices at lower detail and keeps the corners', () => {
    const full = buildTerrainMesh(t, scale, 1);
    const half = buildTerrainMesh(t, scale, 0.5);
    expect(half.columns).toBe(15);
    expect(half.rows).toBe(10);
    expect(half.positions.length).toBeLessThan(full.positions.length);
    // first and last vertex are the first and the last sample
    expect(half.positions[0]).toBeCloseTo(full.positions[0]!, 4);
    expect(half.positions[half.positions.length - 3]).toBeCloseTo(full.positions[full.positions.length - 3]!, 4);
  });

  it('gives each vertex its height from 0 (lowest) to 1 (highest) of the terrain', () => {
    const m = buildTerrainMesh(t, scale, 1);
    expect(Math.min(...m.heightT)).toBe(0);
    expect(Math.max(...m.heightT)).toBe(1);
  });

  it('never leaves an index outside the vertices', () => {
    const m = buildTerrainMesh(t, scale, 0.4);
    const count = m.positions.length / 3;
    expect(Math.max(...m.indices)).toBeLessThan(count);
  });
});
