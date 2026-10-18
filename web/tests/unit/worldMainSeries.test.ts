import { describe, expect, it } from 'vitest';
import { FIRST_YEAR, HOME, LAST_YEAR, argentinaReal, gdpPerCapitaAt, mainSeries, rankAt, rankingTable, regionGrowth } from '../../src/tour/worldData';

describe('mainSeries', () => {
  it('is the real GDP of Argentina for the gdp metric', () => {
    expect(mainSeries('gdp')).toEqual(argentinaReal());
  });

  it('is the real GDP per person of Argentina, one value per year, for the per capita metric', () => {
    const s = mainSeries('percapita');
    expect(s.years[0]).toBe(FIRST_YEAR);
    expect(s.years.at(-1)).toBe(LAST_YEAR);
    expect(s.values).toHaveLength(s.years.length);
    expect(s.values.at(-1)).toBeCloseTo(gdpPerCapitaAt(HOME, LAST_YEAR)!, 6);
    expect(s.values.every((v) => v > 0)).toBe(true);
  });

  it('has no NaN: where the data has no value the series holds 0, never an invented figure', () => {
    const s = mainSeries('percapita', 'Argentina');
    expect(s.values.some((v) => Number.isNaN(v))).toBe(false);
  });
});

describe('rankAt', () => {
  it('is the place among every country of the World Bank in the year, for Argentina the one of the ranking table', () => {
    for (const metric of ['gdp', 'percapita'] as const) {
      for (const year of [1960, 1990, 2025]) {
        expect(rankAt(HOME, year, metric), `${metric} ${year}`).toBe(rankingTable(year, metric, 1).home.rank);
      }
    }
  });

  it('knows the largest economy and a small one, rounds a fractional year and has no place for an unknown country', () => {
    expect(rankAt('Estados Unidos', 2025, 'gdp')).toBe(1);
    expect(rankAt('Uruguay', 2025, 'gdp')).toBeGreaterThan(50);
    expect(rankAt('Brasil', 2000.4, 'gdp')).toBe(rankAt('Brasil', 2000, 'gdp'));
    expect(rankAt('Brasil', 2000.6, 'gdp')).toBe(rankAt('Brasil', 2001, 'gdp'));
    expect(rankAt('Narnia', 2025, 'gdp')).toBeNull();
  });
});

describe('regionGrowth', () => {
  it('is the annual growth (%) of the real GDP of Latin America and the Caribbean, World Bank aggregate, one value per year', () => {
    const g = regionGrowth();
    expect(g.years[0]).toBe(FIRST_YEAR);
    expect(g.years.at(-1)).toBe(LAST_YEAR);
    expect(g.values).toHaveLength(g.years.length);
    expect(g.source).toContain('Banco Mundial');
    expect(g.name).toBe('América Latina y el Caribe');
  });

  it('keeps a missing year as null (no first-year growth) and has plausible rates', () => {
    const g = regionGrowth();
    expect(g.values[0]).toBeNull();
    const rates = g.values.filter((v): v is number => v !== null);
    expect(rates.length).toBeGreaterThan(60);
    expect(Math.min(...rates)).toBeGreaterThan(-15);
    expect(Math.max(...rates)).toBeLessThan(15);
  });
});

