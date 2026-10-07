import { describe, expect, it } from 'vitest';
import { FOLLOW_MS, FOLLOW_TOTAL_MS, followFrame } from '../../src/charts3d/followAnim';
import { FOLLOW_WINDOW_YEARS, niceTop, seriesFrame, valueAt } from '../../src/tour/worldAnim';
import { FIRST_YEAR, HOME, LAST_YEAR, argentinaSince1900, regionRanking, worldRanking } from '../../src/tour/worldData';

describe('followFrame', () => {
  it('draws the line at a steady pace and then pulls back', () => {
    expect(followFrame(0)).toEqual({ reveal: 0, out: 0 });
    expect(followFrame(FOLLOW_MS / 2).reveal).toBeCloseTo(0.5);
    expect(followFrame(FOLLOW_MS)).toEqual({ reveal: 1, out: 0 });
    expect(followFrame(FOLLOW_TOTAL_MS)).toEqual({ reveal: 1, out: 1 });
    expect(followFrame(FOLLOW_TOTAL_MS * 3)).toEqual({ reveal: 1, out: 1 });
    const mid = followFrame(FOLLOW_MS + (FOLLOW_TOTAL_MS - FOLLOW_MS) / 2).out;
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(0.8);
  });
});

describe('the made-up GDP since 1900', () => {
  const { years, values } = argentinaSince1900();

  it('has one value per year from 1900 to 2026, all positive', () => {
    expect(years[0]).toBe(FIRST_YEAR);
    expect(years.at(-1)).toBe(LAST_YEAR);
    expect(values).toHaveLength(years.length);
    expect(values.every((v) => v > 0)).toBe(true);
  });

  it('interpolates between two years', () => {
    expect(valueAt(years, values, 1900)).toBe(values[0]);
    expect(valueAt(years, values, 1900.5)).toBeCloseTo((values[0]! + values[1]!) / 2);
    expect(valueAt(years, values, 3000)).toBe(values.at(-1));
  });

  it('follows the head with a window of a few decades and then opens to the whole chart', () => {
    const start = seriesFrame(0, years, values);
    expect(start.year).toBe(FIRST_YEAR);
    expect(start.xMin).toBe(FIRST_YEAR);
    expect(start.xMax - start.xMin).toBe(FOLLOW_WINDOW_YEARS);
    const mid = seriesFrame(FOLLOW_MS / 2, years, values);
    expect(mid.year).toBeCloseTo(FIRST_YEAR + (LAST_YEAR - FIRST_YEAR) / 2, 0);
    expect(mid.xMax - mid.xMin).toBe(FOLLOW_WINDOW_YEARS);
    expect(mid.xMin).toBeLessThanOrEqual(mid.year);
    expect(mid.xMax).toBeGreaterThanOrEqual(mid.year);
    const end = seriesFrame(FOLLOW_TOTAL_MS, years, values);
    expect(end.year).toBe(LAST_YEAR);
    expect(end.xMin).toBe(FIRST_YEAR);
    expect(end.xMax).toBeGreaterThanOrEqual(LAST_YEAR);
    expect(end.yMax).toBeGreaterThanOrEqual(Math.max(...values));
    expect(end.visibleCount).toBe(years.length);
  });

  it('rounds the top of an axis up to a round number', () => {
    expect(niceTop(130)).toBe(150);
    expect(niceTop(400)).toBe(400);
    expect(niceTop(401)).toBe(500);
  });
});

describe('the rankings', () => {
  const today = argentinaSince1900().values.at(-1)!;

  it('ranks Argentina among the economies of the world and of the region', () => {
    const world = worldRanking(today);
    expect(world.map((c) => c.rank)).toEqual(world.map((_, i) => i + 1));
    expect(world.find((c) => c.country === HOME)).toBeDefined();
    expect(world.slice(0, 20)).toHaveLength(20);
    const region = regionRanking(today);
    expect(region[0]!.country).toBe('Brasil');
    expect(region.find((c) => c.country === HOME)!.rank).toBe(3);
  });
});
