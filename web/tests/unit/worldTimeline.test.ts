import { describe, expect, it } from 'vitest';
import { FOLLOW_MS, FOLLOW_TOTAL_MS } from '../../src/charts3d/followAnim';
import { DEFAULT_BARS_VIEW, barsFocus } from '../../src/charts3d/followAnim';
import { elapsedForYear, yearAtElapsed } from '../../src/tour/worldAnim';
import { FIRST_YEAR, HOME, LAST_YEAR, argentinaSince1900, gdpAtYear, gdpPerCapitaAt, populationAt, rankingTable, regionCountries, regionValuesAt, worldRanking, worldRankingAt } from '../../src/tour/worldData';

describe('the made-up GDP of every country, year by year', () => {
  const today = argentinaSince1900().values.at(-1)!;

  it('ends in the value of today and is positive in every year', () => {
    for (const { country, value } of worldRanking(today)) {
      expect(gdpAtYear(country, LAST_YEAR)).toBeCloseTo(value, 6);
      for (let year = FIRST_YEAR; year <= LAST_YEAR; year += 1) expect(gdpAtYear(country, year)).toBeGreaterThan(0);
    }
  });

  it('is interpolated between two years and held outside the range', () => {
    const a = gdpAtYear('Brasil', 1950);
    const b = gdpAtYear('Brasil', 1951);
    expect(gdpAtYear('Brasil', 1950.5)).toBeCloseTo((a + b) / 2, 6);
    expect(gdpAtYear('Brasil', 1800)).toBe(gdpAtYear('Brasil', FIRST_YEAR));
    expect(gdpAtYear('Brasil', 3000)).toBe(gdpAtYear('Brasil', LAST_YEAR));
  });

  it('uses the series of Argentina for Argentina', () => {
    const { years, values } = argentinaSince1900();
    expect(gdpAtYear(HOME, 1950)).toBe(values[years.indexOf(1950)]);
  });
});

describe('the ranking of the world in a year', () => {
  it('has every economy ranked from 1, in every year from 1900 to 2026, Argentina included', () => {
    for (const year of [1900, 1925, 1950, 1975, 2000, 2026]) {
      const ranking = worldRankingAt(year);
      expect(ranking.map((c) => c.rank)).toEqual(ranking.map((_, i) => i + 1));
      expect(ranking.find((c) => c.country === HOME)).toBeDefined();
      for (let i = 1; i < ranking.length; i += 1) expect(ranking[i - 1]!.value).toBeGreaterThanOrEqual(ranking[i]!.value);
    }
  });

  it('is the ranking of today at the last year, and a different one in 1900', () => {
    const today = argentinaSince1900().values.at(-1)!;
    expect(worldRankingAt(LAST_YEAR).map((c) => c.country)).toEqual(worldRanking(today).map((c) => c.country));
    expect(worldRankingAt(FIRST_YEAR).map((c) => c.country)).not.toEqual(worldRanking(today).map((c) => c.country));
  });
});

describe('the region in a year', () => {
  it('keeps one fixed order (the largest of today first) and gives one value per country', () => {
    const countries = regionCountries();
    expect(countries[0]).toBe('Brasil');
    expect(countries).toContain(HOME);
    expect(regionValuesAt(1900)).toHaveLength(countries.length);
    expect(regionValuesAt(2026)[countries.indexOf(HOME)]).toBeCloseTo(argentinaSince1900().values.at(-1)!, 6);
    expect(regionValuesAt(1950).every((v) => v > 0)).toBe(true);
  });
});

describe('the timeline of the animation', () => {
  it('maps a year to the moment the animation shows it, and back', () => {
    expect(elapsedForYear(FIRST_YEAR)).toBe(0);
    expect(elapsedForYear((FIRST_YEAR + LAST_YEAR) / 2)).toBeCloseTo(FOLLOW_MS / 2, 6);
    expect(elapsedForYear(LAST_YEAR)).toBe(FOLLOW_TOTAL_MS); // the last year is the end of the animation, pulled back
    expect(yearAtElapsed(0)).toBe(FIRST_YEAR);
    expect(yearAtElapsed(FOLLOW_MS / 2)).toBeCloseTo((FIRST_YEAR + LAST_YEAR) / 2, 6);
    expect(yearAtElapsed(FOLLOW_TOTAL_MS)).toBe(LAST_YEAR);
  });
});

describe('the camera on the bar of Argentina', () => {
  const base = { x: 0, y: 1.4, z: 0, theta: 0.2, phi: 1.1, radius: 14 };
  const bar = { x: 3, top: 1.2 };

  it('looks at the bar and stands close while the years go by', () => {
    const pose = barsFocus(base, bar, 0);
    expect(pose.x).toBeCloseTo(bar.x, 6);
    expect(pose.radius).toBeLessThan(base.radius * 0.5);
  });

  it('pulls back a little at the end, never to the whole chart', () => {
    const near = barsFocus(base, bar, 0);
    const end = barsFocus(base, bar, 1);
    expect(end.radius).toBeGreaterThan(near.radius);
    expect(end.radius).toBeLessThan(base.radius * 0.6); // a few bars more, never all of them
    expect(end.x).toBeGreaterThan(0); // still on the side of the bar, not centred on the chart
  });
});

describe('the GDP per capita, year by year', () => {
  it('is the GDP over the population: positive in every year and for every country', () => {
    for (const { country } of worldRankingAt(LAST_YEAR)) {
      for (const year of [1900, 1950, 2000, 2026]) {
        expect(populationAt(country, year)).toBeGreaterThan(0);
        expect(gdpPerCapitaAt(country, year)).toBeCloseTo((gdpAtYear(country, year) * 1000) / populationAt(country, year), 6);
      }
    }
  });

  it('has fewer people in the past than today', () => {
    expect(populationAt('Brasil', 1900)).toBeLessThan(populationAt('Brasil', 2026));
    expect(populationAt(HOME, 1900)).toBeLessThan(populationAt(HOME, 2026));
  });
});

describe('the two tables of the ranking', () => {
  it('lists the others from the top with the place they have among everyone, and keeps Argentina apart with its own place and value', () => {
    for (const metric of ['gdp', 'percapita'] as const) {
      for (const year of [1900, 1960, 2026]) {
        const { home, others } = rankingTable(year, metric, 20);
        const all = worldRankingAt(year, metric);
        expect(home.country).toBe(HOME);
        expect(home.rank).toBe(all.find((c) => c.country === HOME)!.rank);
        expect(others).toHaveLength(20);
        expect(others.some((c) => c.country === HOME)).toBe(false);
        expect(others[0]!.rank).toBe(home.rank === 1 ? 2 : 1);
        for (let i = 1; i < others.length; i += 1) expect(others[i]!.value).toBeLessThanOrEqual(others[i - 1]!.value);
      }
    }
  });

  it('ranks by the GDP per capita when asked to', () => {
    const byGdp = worldRankingAt(2026, 'gdp').map((c) => c.country);
    const byPerCapita = worldRankingAt(2026, 'percapita').map((c) => c.country);
    expect(byPerCapita).not.toEqual(byGdp);
  });
});

describe('the camera of the region bars with the numbers of the tuner', () => {
  const base = { x: 0, y: 1.4, z: 0, theta: 0.2, phi: 1.1, radius: 14 };
  const bar = { x: 3, top: 1.2 };

  it('uses the distances and the height that were set', () => {
    const tuned = barsFocus(base, bar, 0, { near: 0.3, end: 0.8, height: 2 });
    expect(tuned.radius).toBeCloseTo(base.radius * 0.3, 6);
    expect(barsFocus(base, bar, 1, { near: 0.3, end: 0.8, height: 2 }).radius).toBeCloseTo(base.radius * 0.8, 6);
    expect(tuned.y).toBeCloseTo(barsFocus(base, bar, 0).y + 2, 6);
  });

  it('keeps the defaults when nothing is set, and the angles of the base', () => {
    const plain = barsFocus(base, bar, 0);
    expect(plain.radius).toBeCloseTo(base.radius * DEFAULT_BARS_VIEW.near, 6);
    expect(plain.theta).toBe(base.theta);
    expect(plain.phi).toBe(base.phi);
  });
});
