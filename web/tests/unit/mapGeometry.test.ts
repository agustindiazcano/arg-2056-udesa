import { describe, expect, it } from 'vitest';
import { projectFeatures, provinceStyle } from '../../src/charts3d/mapGeometry';
import type { ProvincesGeo } from '../../src/geo/provinces';
import { DIVERGING, NO_DATA, SEQUENTIAL_BLUE } from '../../src/styles/tokens';

const square = (lon: number, lat: number, size: number): number[][] => [
  [lon, lat],
  [lon + size, lat],
  [lon + size, lat + size],
  [lon, lat + size],
  [lon, lat]
];

const feature = (id: string, geometry: unknown) =>
  ({
    type: 'Feature',
    properties: { id, name: `Provincia ${id}`, area_km2: 1, centroid: [0, 0], centroid_inside: true, bbox: [0, 0, 0, 0] },
    geometry
  }) as unknown as ProvincesGeo['features'][number];

const geo = {
  type: 'FeatureCollection',
  features: [
    feature('AR-A', { type: 'Polygon', coordinates: [square(-70, -40, 10)] }),
    feature('AR-B', {
      type: 'MultiPolygon',
      coordinates: [[square(-60, -40, 5)], [square(-58, -34, 2), square(-57.5, -33.5, 1).reverse()]]
    })
  ]
} as unknown as ProvincesGeo;

describe('projectFeatures', () => {
  const out = projectFeatures(geo, { scale: 1 });

  it('keeps the ids and names, one entry per province', () => {
    expect(out.provinces.map((p) => [p.id, p.name])).toEqual([
      ['AR-A', 'Provincia AR-A'],
      ['AR-B', 'Provincia AR-B']
    ]);
  });

  it('puts the east at larger x and the north at larger y', () => {
    const [a, b] = out.provinces;
    expect(b!.polygons[0]!.outer[0]![0]).toBeGreaterThan(a!.polygons[0]!.outer[0]![0]);
    const ring = a!.polygons[0]!.outer;
    expect(Math.max(...ring.map((p) => p[1]))).toBeGreaterThan(Math.min(...ring.map((p) => p[1])));
  });

  it('shrinks the east-west distances by the cosine of the middle latitude, so shapes keep their proportions', () => {
    const { bounds } = out;
    // the data spans lon -70 to -55 (15 degrees) and lat -40 to -30 (10 degrees), middle latitude -35
    expect(bounds.width / bounds.height).toBeCloseTo((15 * Math.cos((35 * Math.PI) / 180)) / 10, 6);
  });

  it('drops the closing point of each ring (a shape closes itself)', () => {
    expect(out.provinces[0]!.polygons[0]!.outer).toHaveLength(4);
  });

  it('handles a MultiPolygon, keeping each polygon and its holes', () => {
    const b = out.provinces[1]!;
    expect(b.polygons).toHaveLength(2);
    expect(b.polygons[1]!.holes).toHaveLength(1);
  });

  it('centres the map on the origin: the bounds are symmetric around it', () => {
    const { bounds } = out;
    expect(bounds.minX + bounds.maxX).toBeCloseTo(0, 6);
    expect(bounds.minY + bounds.maxY).toBeCloseTo(0, 6);
  });

  it('scales every coordinate by the scale given', () => {
    const half = projectFeatures(geo, { scale: 0.5 });
    expect(half.bounds.height).toBeCloseTo(out.bounds.height / 2, 6);
  });
});

describe('provinceStyle', () => {
  it('draws a province without a value flat, in the no-data color', () => {
    const s = provinceStyle(undefined, [0, 10], 'level');
    expect(s.hasData).toBe(false);
    expect(s.color).toBe(NO_DATA);
    expect(s.height).toBeLessThan(0.1);
  });

  it('draws everything flat when there is no domain', () => {
    expect(provinceStyle(5, null, 'level').hasData).toBe(false);
  });

  it('level: the lowest value is the darkest and lowest, the highest the lightest and tallest', () => {
    const low = provinceStyle(0, [0, 10], 'level');
    const high = provinceStyle(10, [0, 10], 'level');
    expect(low.color).toBe(SEQUENTIAL_BLUE[0]);
    expect(high.color).toBe(SEQUENTIAL_BLUE[SEQUENTIAL_BLUE.length - 1]);
    expect(high.height).toBeGreaterThan(low.height);
    expect(low.hasData).toBe(true);
  });

  it('level: a middle value sits in the middle of the ramp and of the heights', () => {
    const mid = provinceStyle(5, [0, 10], 'level');
    const low = provinceStyle(0, [0, 10], 'level');
    const high = provinceStyle(10, [0, 10], 'level');
    expect(mid.height).toBeCloseTo((low.height + high.height) / 2, 6);
  });

  it('level: a single-value domain is drawn at the top', () => {
    expect(provinceStyle(7, [7, 7], 'level').color).toBe(SEQUENTIAL_BLUE[SEQUENTIAL_BLUE.length - 1]);
  });

  it('change: uses the diverging ramp, neutral at zero, and rises with the size of the change either way', () => {
    const neg = provinceStyle(-5, [-5, 5], 'change');
    const zero = provinceStyle(0, [-5, 5], 'change');
    const pos = provinceStyle(5, [-5, 5], 'change');
    expect(neg.color).toBe(DIVERGING[0]);
    expect(pos.color).toBe(DIVERGING[DIVERGING.length - 1]);
    expect(DIVERGING).toContain(zero.color);
    expect(neg.height).toBeGreaterThan(zero.height);
    expect(pos.height).toBeGreaterThan(zero.height);
    expect(neg.height).toBeCloseTo(pos.height, 6);
  });

  it('clamps a value outside the domain', () => {
    expect(provinceStyle(99, [0, 10], 'level').color).toBe(SEQUENTIAL_BLUE[SEQUENTIAL_BLUE.length - 1]);
    expect(provinceStyle(-99, [0, 10], 'level').color).toBe(SEQUENTIAL_BLUE[0]);
  });
});
