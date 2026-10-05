import { describe, expect, it } from 'vitest';
import type { AndesEvent } from '../../src/scenes/andes/data';
import { altitudeAtProgress, altitudeProfile, profileAreaPath, profileFrame, profilePath, profileTicks, profileX, profileY } from '../../src/scenes/andes/profile';
import { buildRoute } from '../../src/scenes/andes/timeline';

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

const route = buildRoute([
  ev('a', 0, -68.9, -32.9, 800),
  ev('b', 5, -69.3, -32.6, 1500),
  ev('c', 10, -69.9, -32.6, 3900),
  ev('d', 15, -70.3, -32.8, 2300),
  ev('e', 20, -70.7, -32.9, 800)
]);

describe('altitudeProfile', () => {
  const points = altitudeProfile(route, 120);

  it('goes from the start of the route to its end, never back', () => {
    expect(points[0]!.progress).toBe(0);
    expect(points[points.length - 1]!.progress).toBeCloseTo(1, 9);
    for (let i = 1; i < points.length; i += 1) expect(points[i]!.progress).toBeGreaterThanOrEqual(points[i - 1]!.progress);
  });

  it('has the altitude of the events at their places: the start, the pass and the end', () => {
    expect(points[0]!.altitudeM).toBe(800);
    expect(points[points.length - 1]!.altitudeM).toBe(800);
    expect(Math.max(...points.map((p) => p.altitudeM))).toBe(3900);
  });

  it('never misses the pass: the day of every event is sampled even when it falls between the even steps', () => {
    const odd = buildRoute([
      ev('a', 0, -68.9, -32.9, 800),
      ev('b', 11, -69.9, -32.6, 3900),
      ev('c', 21, -70.7, -32.9, 800)
    ]);
    expect(Math.max(...altitudeProfile(odd, 120).map((p) => p.altitudeM))).toBe(3900);
  });

  it('has no profile when there is no altitude anywhere, no route or no distance', () => {
    expect(altitudeProfile(buildRoute([ev('a', 0, -69, -33, null), ev('b', 5, -70, -33, null)]))).toEqual([]);
    expect(altitudeProfile(buildRoute([]))).toEqual([]);
    expect(altitudeProfile(buildRoute([ev('a', 0, -69, -33, 800)]))).toEqual([]);
  });
});

describe('altitudeAtProgress', () => {
  const points = [
    { progress: 0, altitudeM: 1000 },
    { progress: 0.5, altitudeM: 3000 },
    { progress: 1, altitudeM: 2000 }
  ];

  it('joins the points in a straight line and clamps at the ends', () => {
    expect(altitudeAtProgress(points, 0.25)).toBeCloseTo(2000, 9);
    expect(altitudeAtProgress(points, 0.75)).toBeCloseTo(2500, 9);
    expect(altitudeAtProgress(points, -1)).toBe(1000);
    expect(altitudeAtProgress(points, 5)).toBe(2000);
  });

  it('has no altitude with no points', () => {
    expect(altitudeAtProgress([], 0.5)).toBeNull();
  });
});

describe('the frame of the chart', () => {
  const points = altitudeProfile(route, 120);
  const frame = profileFrame(points, 300, 120);

  it('brackets the altitudes with multiples of 500', () => {
    expect(frame.min % 500).toBe(0);
    expect(frame.max % 500).toBe(0);
    expect(frame.min).toBeLessThanOrEqual(800);
    expect(frame.max).toBeGreaterThanOrEqual(3900);
  });

  it('puts the start at the left edge of the plot, the end at the right, the top altitude at the top and the bottom one at the bottom', () => {
    expect(profileX(frame, 0)).toBe(frame.padL);
    expect(profileX(frame, 1)).toBe(frame.width - frame.padR);
    expect(profileY(frame, frame.max)).toBe(frame.padT);
    expect(profileY(frame, frame.min)).toBe(frame.height - frame.padB);
  });

  it('has a tick at every 1,000 m inside the range', () => {
    const ticks = profileTicks(frame);
    expect(ticks.length).toBeGreaterThan(1);
    for (const t of ticks) {
      expect(t % 1000).toBe(0);
      expect(t).toBeGreaterThanOrEqual(frame.min);
      expect(t).toBeLessThanOrEqual(frame.max);
    }
  });

  it('draws the line as one path through every point, inside the frame, and the area closed down to the bottom', () => {
    const line = profilePath(frame, points);
    expect(line.startsWith('M')).toBe(true);
    expect(line.split('L')).toHaveLength(points.length);
    const numbers = line.match(/-?\d+(\.\d+)?/g)!.map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]!).toBeGreaterThanOrEqual(frame.padL - 0.01);
      expect(numbers[i]!).toBeLessThanOrEqual(frame.width - frame.padR + 0.01);
      expect(numbers[i + 1]!).toBeGreaterThanOrEqual(frame.padT - 0.01);
      expect(numbers[i + 1]!).toBeLessThanOrEqual(frame.height - frame.padB + 0.01);
    }
    const area = profileAreaPath(frame, points);
    expect(area.endsWith('Z')).toBe(true);
  });

  it('survives no points: an empty path and a plain frame', () => {
    expect(profilePath(profileFrame([], 300, 120), [])).toBe('');
    expect(profileAreaPath(profileFrame([], 300, 120), [])).toBe('');
  });
});
