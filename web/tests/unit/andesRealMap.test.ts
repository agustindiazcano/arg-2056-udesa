import { describe, expect, it } from 'vitest';
import { buildRoute } from '../../src/scenes/andes/timeline';
import type { AndesEvent } from '../../src/scenes/andes/data';
import {
  FIGURE_HEIGHT_UNITS,
  FIGURE_MIN_ZOOM,
  MIN_METERS_PER_UNIT,
  bearingDeg,
  cameraFor,
  coordAtKm,
  figuresVisible,
  gaitAmount,
  gaitPhaseAt,
  STRIDES_PER_SECOND,
  WALKING_GRACE_MS,
  metersPerPixel,
  metersPerUnit
} from '../../src/scenes/andes/mapGeo';

const ev = (id: string, day: number, lon: number, lat: number): AndesEvent => ({
  id,
  name: id,
  day_of_campaign: day,
  date: '1817-01-19',
  date_precision: 'approximate',
  lat,
  lon,
  elevation_m: 1000,
  forces: [],
  source: 's',
  retrieved_at: '2026-10-08'
});

// two legs: due west, then due south
const route = buildRoute([ev('a', 0, -69, -32), ev('b', 5, -70, -32), ev('c', 9, -70, -33)]);

describe('metersPerPixel', () => {
  it('halves with every zoom level and shrinks away from the equator', () => {
    expect(metersPerPixel(10, 0)).toBeCloseTo(76.437, 2);
    expect(metersPerPixel(11, 0)).toBeCloseTo(metersPerPixel(10, 0) / 2, 6);
    expect(metersPerPixel(10, -32)).toBeCloseTo(metersPerPixel(10, 0) * Math.cos((32 * Math.PI) / 180), 6);
  });
});

describe('metersPerUnit', () => {
  it('keeps a figure the same height on the screen: a unit grows with the meters of a pixel', () => {
    const near = metersPerUnit(14, -32, 24);
    const far = metersPerUnit(12, -32, 24);
    expect(far).toBeCloseTo(near * 4, 6);
    expect(near * FIGURE_HEIGHT_UNITS).toBeCloseTo(24 * metersPerPixel(14, -32), 6);
  });

  it('never makes a figure smaller than a real man: a unit is at least MIN_METERS_PER_UNIT', () => {
    expect(metersPerUnit(22, -32, 24)).toBe(MIN_METERS_PER_UNIT);
  });
});

describe('figuresVisible', () => {
  it('shows the figures from FIGURE_MIN_ZOOM on, with a margin so it does not flicker', () => {
    expect(figuresVisible(FIGURE_MIN_ZOOM + 0.1, false)).toBe(true);
    expect(figuresVisible(FIGURE_MIN_ZOOM - 0.1, false)).toBe(false);
    expect(figuresVisible(FIGURE_MIN_ZOOM - 0.1, true)).toBe(true);
    expect(figuresVisible(FIGURE_MIN_ZOOM - 1, true)).toBe(false);
  });
});

describe('coordAtKm', () => {
  it('walks the route by distance and clamps to its ends', () => {
    expect(coordAtKm(route, 0)).toMatchObject({ lon: -69, lat: -32 });
    expect(coordAtKm(route, -50)).toMatchObject({ lon: -69, lat: -32 });
    const end = coordAtKm(route, route.totalKm + 50);
    expect(end.lon).toBeCloseTo(-70, 9);
    expect(end.lat).toBeCloseTo(-33, 9);
  });

  it('is in the middle of a leg half way along it', () => {
    const leg = route.points[1]!.distanceKm;
    const mid = coordAtKm(route, leg / 2);
    expect(mid.lon).toBeCloseTo(-69.5, 6);
    expect(mid.lat).toBeCloseTo(-32, 6);
  });

  it('heads west on the first leg and south on the second (compass degrees)', () => {
    expect(coordAtKm(route, 1).bearing).toBeCloseTo(270, 0);
    expect(coordAtKm(route, route.points[1]!.distanceKm + 1).bearing).toBeCloseTo(180, 0);
  });
});

describe('bearingDeg', () => {
  it('is the compass bearing between two points', () => {
    expect(bearingDeg(-69, -32, -69, -31)).toBeCloseTo(0, 6);
    expect(bearingDeg(-69, -32, -68, -32)).toBeCloseTo(90, 0);
    expect(bearingDeg(-69, -32, -70, -32)).toBeCloseTo(270, 0);
  });
});

describe('cameraFor', () => {
  const army = { lon: -69.5, lat: -32, bearing: 270 };

  it('follow: centered on the army, kept at its own bearing, tilted', () => {
    const c = cameraFor('follow', army)!;
    expect([c.center[0], c.center[1]]).toEqual([-69.5, -32]);
    expect(c.pitch).toBeGreaterThan(55);
    expect(c.zoom).toBeGreaterThanOrEqual(FIGURE_MIN_ZOOM);
    expect(c.bearing).toBeUndefined();
  });

  it('cine: low behind the column, looking where it goes, close enough for the figures', () => {
    const c = cameraFor('cine', army)!;
    expect(c.bearing).toBe(270);
    expect(c.pitch).toBeGreaterThan(70);
    expect(c.zoom).toBeGreaterThanOrEqual(FIGURE_MIN_ZOOM);
  });

  it('aerial: from above, pointing north-up of the route', () => {
    const c = cameraFor('aerial', army)!;
    expect(c.pitch).toBeLessThan(30);
    expect(c.zoom).toBeLessThan(FIGURE_MIN_ZOOM);
  });

  it('map: the far view of the whole route', () => {
    const c = cameraFor('map', army)!;
    expect(c.zoom).toBeLessThan(10);
  });

  it('free: leaves the camera to the reader', () => {
    expect(cameraFor('free', army)).toBeNull();
  });
});

describe('gait', () => {
  it('has a phase that grows at a fixed pace of strides per second', () => {
    expect(gaitPhaseAt(0)).toBe(0);
    expect(gaitPhaseAt(2000) - gaitPhaseAt(1000)).toBeCloseTo(STRIDES_PER_SECOND, 9);
  });

  it('walks while the position changed a moment ago and stands otherwise', () => {
    expect(gaitAmount(1000, 1000 - WALKING_GRACE_MS)).toBe(1);
    expect(gaitAmount(1000, 1000 - WALKING_GRACE_MS - 1)).toBe(0);
  });
});
