import { describe, expect, it } from 'vitest';
import { FOLLOW_MS, FOLLOW_TOTAL_MS, followFrame } from '../../src/charts3d/followAnim';
import { FOLLOW_WINDOW_YEARS, niceTop, seriesFrame, valueAt } from '../../src/tour/worldAnim';
import { FIRST_YEAR, HOME, LAST_YEAR, argentinaReal, regionCountries, regionValuesAt, worldRankingAt } from '../../src/tour/worldData';

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

describe('the real GDP of Argentina since 1960 (World Bank, constant 2015 dollars)', () => {
  const { years, values } = argentinaReal();

  it('has one value per year from 1960 to 2025, all positive, and the figure of 2025', () => {
    expect(years[0]).toBe(FIRST_YEAR);
    expect(years.at(-1)).toBe(LAST_YEAR);
    expect(LAST_YEAR).toBe(2025);
    expect(values).toHaveLength(years.length);
    expect(values.every((v) => v > 0)).toBe(true);
    expect(values.at(-1)).toBeCloseTo(609.2, 1); // World Bank 2025, billions of constant 2015 USD
  });

  it('interpolates between two years', () => {
    expect(valueAt(years, values, FIRST_YEAR)).toBe(values[0]);
    expect(valueAt(years, values, FIRST_YEAR + 0.5)).toBeCloseTo((values[0]! + values[1]!) / 2);
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

describe('the rankings of 2025', () => {
  it('ranks the economies of the world from the United States, Argentina included in the list of the region', () => {
    const world = worldRankingAt(LAST_YEAR);
    expect(world.map((c) => c.rank)).toEqual(world.map((_, i) => i + 1));
    expect(world.slice(0, 20)).toHaveLength(20);
    expect(world[0]!.country).toBe('Estados Unidos');
    expect(world[1]!.country).toBe('China');
    const countries = regionCountries();
    const values = regionValuesAt(LAST_YEAR);
    expect(countries[0]).toBe('Brasil');
    expect(countries.indexOf(HOME)).toBe(2);
    expect(values[countries.indexOf(HOME)]).toBeCloseTo(609.2, 1);
  });
});
