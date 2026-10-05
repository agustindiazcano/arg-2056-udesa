import { describe, expect, it } from 'vitest';
import { buildRoute, campaignDay, dwellWeight, paceClock, positionAt } from '../../src/scenes/andes/timeline';
import type { AndesEvent } from '../../src/scenes/andes/data';

const ev = (id: string, day: number, lon: number, lat: number, elevation_m: number | null): AndesEvent => ({
  id,
  name: id,
  day_of_campaign: day,
  date: '1817-01-19',
  date_precision: 'approximate',
  lat,
  lon,
  elevation_m,
  forces: [],
  source: 'TEST',
  retrieved_at: '2026-01-01'
});

// three points: one degree west along the parallel 33 S, then one degree south along the meridian 70 W
const events = [ev('c', 20, -70, -34, 3000), ev('a', 0, -69, -33, 1000), ev('b', 10, -70, -33, null)];
const D1 = 93.25568997927282; // km, haversine on the sphere of radius 6371.0088 km
const D2 = 111.19508023353306;

describe('buildRoute', () => {
  const route = buildRoute(events);

  it('orders the points by campaign day whatever the order of the data', () => {
    expect(route.points.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('has the distance along the route at every point, from 0', () => {
    expect(route.points[0]!.distanceKm).toBe(0);
    expect(route.points[1]!.distanceKm).toBeCloseTo(D1, 6);
    expect(route.points[2]!.distanceKm).toBeCloseTo(D1 + D2, 6);
    expect(route.totalKm).toBeCloseTo(D1 + D2, 6);
  });

  it('knows the first and the last day', () => {
    expect([route.firstDay, route.lastDay]).toEqual([0, 20]);
  });

  it('is empty for no events', () => {
    const empty = buildRoute([]);
    expect(empty.points).toEqual([]);
    expect(empty.totalKm).toBe(0);
    expect(positionAt(empty, 3)).toBeNull();
  });
});

describe('positionAt', () => {
  const route = buildRoute(events);

  it('is the point itself on the day of a point', () => {
    const p = positionAt(route, 10)!;
    expect([p.lon, p.lat]).toEqual([-70, -33]);
    expect(p.distanceKm).toBeCloseTo(D1, 6);
  });

  it('is on the straight line between two points in proportion to the days', () => {
    const p = positionAt(route, 5)!;
    expect(p.lon).toBeCloseTo(-69.5, 10);
    expect(p.lat).toBeCloseTo(-33, 10);
    expect(p.distanceKm).toBeCloseTo(D1 / 2, 6);
    const q = positionAt(route, 15)!;
    expect(q.lon).toBeCloseTo(-70, 10);
    expect(q.lat).toBeCloseTo(-33.5, 10);
    expect(q.distanceKm).toBeCloseTo(D1 + D2 / 2, 6);
  });

  it('interpolates the altitude between the points that have one and skips the one that does not', () => {
    expect(positionAt(route, 0)!.altitudeM).toBe(1000);
    expect(positionAt(route, 5)!.altitudeM).toBeCloseTo(1500, 10);
    expect(positionAt(route, 10)!.altitudeM).toBeCloseTo(2000, 10);
    expect(positionAt(route, 20)!.altitudeM).toBe(3000);
  });

  it('has no altitude when no point has one', () => {
    expect(positionAt(buildRoute([ev('x', 0, -69, -33, null), ev('y', 4, -70, -33, null)]), 2)!.altitudeM).toBeNull();
  });

  it('clamps outside the campaign to the first and the last point', () => {
    expect(positionAt(route, -5)!.lon).toBe(-69);
    expect(positionAt(route, 99)!.lat).toBe(-34);
    expect(positionAt(route, 99)!.distanceKm).toBeCloseTo(D1 + D2, 6);
  });

  it('never goes back: the distance grows with the day', () => {
    let last = -1;
    for (let d = 0; d <= 20; d += 0.5) {
      const km = positionAt(route, d)!.distanceKm;
      expect(km).toBeGreaterThanOrEqual(last);
      last = km;
    }
  });

  it('is the only point when there is one', () => {
    const one = buildRoute([ev('x', 3, -69, -33, 800)]);
    const p = positionAt(one, 100)!;
    expect([p.lon, p.lat, p.altitudeM, p.distanceKm]).toEqual([-69, -33, 800, 0]);
  });

  it('gives the segment the position is on', () => {
    expect(positionAt(route, 5)!.segment).toBe(0);
    expect(positionAt(route, 15)!.segment).toBe(1);
  });
});

describe('campaignDay', () => {
  it('maps the shared clock (1810 to 2056) onto the days of the campaign', () => {
    expect(campaignDay(1810, 20)).toBe(0);
    expect(campaignDay(2056, 20)).toBe(20);
    expect(campaignDay(1933, 20)).toBeCloseTo(10, 10);
  });

  it('clamps a clock outside the range', () => {
    expect(campaignDay(1700, 20)).toBe(0);
    expect(campaignDay(3000, 20)).toBe(20);
  });
});

describe('dwellWeight', () => {
  it('is 1 on low ground and grows with the altitude up to a ceiling', () => {
    expect(dwellWeight(800)).toBe(1);
    expect(dwellWeight(null)).toBe(1);
    expect(dwellWeight(2800)).toBeGreaterThan(1);
    expect(dwellWeight(3900)).toBeGreaterThan(dwellWeight(2800));
    expect(dwellWeight(7000)).toBe(dwellWeight(3900));
    expect(dwellWeight(3900)).toBeGreaterThanOrEqual(2);
  });
});

describe('paceClock', () => {
  const pass = buildRoute([
    ev('a', 0, -68.9, -32.9, 800),
    ev('b', 4, -69.3, -32.6, 1500),
    ev('c', 8, -69.9, -32.6, 3900),
    ev('d', 12, -70.1, -32.8, 3900),
    ev('e', 16, -70.5, -33.0, 800),
    ev('f', 20, -70.7, -32.9, 800)
  ]);
  const clock = paceClock(pass);
  const years = Array.from({ length: 247 }, (_, i) => 1810 + i);

  it('starts at day 0 and ends at the last day, and clamps outside the range', () => {
    expect(clock(1810)).toBe(0);
    expect(clock(2056)).toBeCloseTo(20, 9);
    expect(clock(1700)).toBe(0);
    expect(clock(3000)).toBeCloseTo(20, 9);
  });

  it('never goes back', () => {
    let last = -1;
    for (const y of years) {
      const d = clock(y);
      expect(d).toBeGreaterThanOrEqual(last);
      last = d;
    }
  });

  it('spends more of the clock on the high part of the route than a clock that treats every day the same', () => {
    const yearsInHigh = years.filter((y) => clock(y) >= 8 && clock(y) <= 12).length;
    expect(yearsInHigh).toBeGreaterThan((4 / 20) * 246 * 1.5);
  });

  it('moves faster on low ground than it would at one pace', () => {
    const yearsInLow = years.filter((y) => clock(y) <= 4).length;
    expect(yearsInLow).toBeLessThan((4 / 20) * 246);
  });

  it('is the plain clock on a route with no height to dwell on', () => {
    const flat = buildRoute([ev('a', 0, -69, -33, 800), ev('b', 10, -70, -33, 900), ev('c', 20, -71, -33, null)]);
    const c = paceClock(flat);
    expect(c(1933)).toBeCloseTo(10, 1);
    expect(c(1871)).toBeCloseTo(5, 1);
  });

  it('survives an empty route', () => {
    expect(paceClock(buildRoute([]))(1900)).toBe(0);
  });
});
