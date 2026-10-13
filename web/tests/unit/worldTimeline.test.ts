import { describe, expect, it } from 'vitest';
import { SIDE_PHI } from '../../src/charts3d/camera';
import { FOLLOW_MS, FOLLOW_TOTAL_MS } from '../../src/charts3d/followAnim';
import { DEFAULT_BARS_VIEW, barsFocus, barsOpeningAngles } from '../../src/charts3d/followAnim';
import { elapsedForYear, yearAtElapsed } from '../../src/tour/worldAnim';
import { FIRST_YEAR, HOME, LAST_YEAR, argentinaNominal, gdpAtYear, gdpPerCapitaAt, populationAt, rankingTable, regionCountries, regionValuesAt, worldRankingAt } from '../../src/tour/worldData';

describe('the nominal GDP of every country, year by year (World Bank)', () => {
  it('has the real values of 2025: the United States first, Argentina with 683 billion', () => {
    expect(gdpAtYear('Estados Unidos', LAST_YEAR)).toBeCloseTo(30769.7, 1);
    expect(gdpAtYear(HOME, LAST_YEAR)).toBeCloseTo(683.1, 1);
    expect(argentinaNominal().values.at(-1)).toBeCloseTo(683.1, 1);
  });

  it('is interpolated between two years and held outside the range', () => {
    const a = gdpAtYear('Brasil', 1990)!;
    const b = gdpAtYear('Brasil', 1991)!;
    expect(gdpAtYear('Brasil', 1990.5)).toBeCloseTo((a + b) / 2, 6);
    expect(gdpAtYear('Brasil', 1800)).toBe(gdpAtYear('Brasil', FIRST_YEAR));
    expect(gdpAtYear('Brasil', 3000)).toBe(gdpAtYear('Brasil', LAST_YEAR));
  });

  it('uses the series of Argentina for Argentina', () => {
    const { years, values } = argentinaNominal();
    expect(gdpAtYear(HOME, 1990)).toBe(values[years.indexOf(1990)]);
  });
});

describe('the ranking of the world in a year', () => {
  it('has every economy with data ranked from 1, in every year from 1960 to 2025, Argentina included', () => {
    for (const year of [1960, 1975, 1990, 2000, 2010, 2025]) {
      const ranking = worldRankingAt(year);
      expect(ranking.map((c) => c.rank)).toEqual(ranking.map((_, i) => i + 1));
      expect(ranking.find((c) => c.country === HOME)).toBeDefined();
      for (let i = 1; i < ranking.length; i += 1) expect(ranking[i - 1]!.value).toBeGreaterThanOrEqual(ranking[i]!.value);
    }
  });

  it('is a different ranking in 1960 than in 2025', () => {
    expect(worldRankingAt(FIRST_YEAR).map((c) => c.country)).not.toEqual(worldRankingAt(LAST_YEAR).map((c) => c.country));
  });
});

describe('the region in a year', () => {
  it('keeps one fixed order (the largest of 2025 first) and gives one value per country', () => {
    const countries = regionCountries();
    expect(countries[0]).toBe('Brasil');
    expect(countries).toContain(HOME);
    expect(countries).toHaveLength(11);
    expect(countries).toContain('Uruguay');
    expect(regionValuesAt(1990)).toHaveLength(countries.length);
    expect(regionValuesAt(LAST_YEAR)[countries.indexOf(HOME)]).toBeCloseTo(argentinaNominal().values.at(-1)!, 6);
    expect(regionValuesAt(2000).every((v) => v > 0)).toBe(true);
  });

  it('gives the three values of the bars: GDP, GDP per person and population', () => {
    const countries = regionCountries();
    const i = countries.indexOf(HOME);
    expect(regionValuesAt(2025, 'population')[i]).toBeCloseTo(46.387, 3); // INDEC, Censo 2022 projection (World Bank 45.85, IMF 47.47)
    expect(regionValuesAt(2025, 'percapita')[i]).toBeCloseTo((683.1 * 1000) / 46.387, -1);
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
    expect(pose.radius).toBeCloseTo(base.radius * DEFAULT_BARS_VIEW.near, 6);
  });

  it('ends at the distance that was chosen for the end, never at the whole chart', () => {
    const end = barsFocus(base, bar, 1);
    expect(end.radius).toBeCloseTo(base.radius * DEFAULT_BARS_VIEW.end, 6);
    expect(end.radius).toBeLessThan(base.radius * 0.9);
    expect(end.x).toBeGreaterThan(0); // still on the side of the bar, not centred on the chart
  });
});

describe('the GDP per capita, year by year', () => {
  it('is the GDP over the population for every country with data', () => {
    for (const { country } of worldRankingAt(LAST_YEAR)) {
      for (const year of [1980, 2000, 2025]) {
        const g = gdpAtYear(country, year);
        const p = populationAt(country, year);
        if (g === null || p === null) continue;
        expect(gdpPerCapitaAt(country, year)).toBeCloseTo((g * 1000) / p, 6);
      }
    }
  });

  it('has fewer people in the past than today', () => {
    expect(populationAt('Brasil', 1960)!).toBeLessThan(populationAt('Brasil', 2025)!);
    expect(populationAt(HOME, 1960)!).toBeLessThan(populationAt(HOME, 2025)!);
  });
});

describe('the two tables of the ranking', () => {
  it('lists the others from the top, and keeps Argentina apart with its place among every country and its value', () => {
    for (const metric of ['gdp', 'percapita'] as const) {
      for (const year of [1960, 1990, 2025]) {
        const { home, others } = rankingTable(year, metric, 20);
        expect(home.country).toBe(HOME);
        expect(home.rank).toBeGreaterThan(0);
        expect(others).toHaveLength(20);
        expect(others.some((c) => c.country === HOME)).toBe(false);
        for (let i = 1; i < others.length; i += 1) expect(others[i]!.value).toBeLessThanOrEqual(others[i - 1]!.value);
      }
    }
    expect(rankingTable(2025, 'gdp', 20).home.rank).toBe(24); // among every country of the World Bank
    expect(rankingTable(2025, 'gdp', 20).home.value).toBeCloseTo(683.1, 1);
  });

  it('ranks by the GDP per capita when asked to', () => {
    const byGdp = worldRankingAt(2025, 'gdp').map((c) => c.country);
    const byPerCapita = worldRankingAt(2025, 'percapita').map((c) => c.country);
    expect(byPerCapita).not.toEqual(byGdp);
  });
});

describe('how every 3D bar chart opens', () => {
  it('faces the chart (turn 0) from almost the side (tilt 89°), the same for all of them', () => {
    const angles = barsOpeningAngles(false);
    expect(angles.theta).toBe(0);
    expect(angles.phi).toBeCloseTo((89 * Math.PI) / 180, 9);
    expect(angles).toEqual({ theta: DEFAULT_BARS_VIEW.theta, phi: DEFAULT_BARS_VIEW.phi });
  });

  it('keeps the side view of the Recorrido where that mode is on', () => {
    expect(barsOpeningAngles(true).theta).toBe(0);
    expect(barsOpeningAngles(true).phi).toBe(SIDE_PHI);
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
