import { describe, expect, it } from 'vitest';
import type { AndesEvent } from '../../src/scenes/andes/data';
import { buildRoute, paceClock, paceProgress, positionAt } from '../../src/scenes/andes/timeline';

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
  note: '',
  source: 'test',
  retrieved_at: '2026-10-02'
});

describe('paceProgress', () => {
  const route = buildRoute([
    ev('a', 0, -68.9, -32.9, 800),
    ev('b', 5, -69.3, -32.6, 1500),
    ev('c', 10, -69.9, -32.6, 3900),
    ev('d', 15, -70.3, -32.8, 3000),
    ev('e', 20, -70.7, -32.9, 800)
  ]);
  const pace = paceProgress(route);

  it('is 0 at the start of the clock and 1 at the end, and clamps outside it', () => {
    expect(pace.progress(1810)).toBe(0);
    expect(pace.progress(2056)).toBeCloseTo(1, 9);
    expect(pace.progress(1700)).toBe(0);
    expect(pace.progress(3000)).toBeCloseTo(1, 9);
  });

  it('never goes back, and is the share of the route walked (by distance)', () => {
    let last = -1;
    for (let y = 1810; y <= 2056; y += 1) {
      const p = pace.progress(y);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
    const day = paceClock(route)(1950);
    expect(pace.progress(1950)).toBeCloseTo(positionAt(route, day)!.distanceKm / route.totalKm, 9);
  });

  it('is the inverse: the year that gives a progress gives that progress back', () => {
    for (const p of [0, 0.1, 0.25, 0.5, 0.8, 1]) {
      expect(pace.progress(pace.yearAt(p))).toBeCloseTo(p, 2);
    }
  });

  it('clamps a progress outside 0 to 1 to the ends of the clock', () => {
    expect(pace.yearAt(-0.3)).toBe(1810);
    expect(pace.yearAt(7)).toBe(2056);
  });

  it('is 0 for a route with no distance', () => {
    const still = paceProgress(buildRoute([ev('a', 0, -69, -33, 800)]));
    expect(still.progress(1900)).toBe(0);
  });
});
