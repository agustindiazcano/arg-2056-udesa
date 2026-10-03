import { describe, it, expect } from 'vitest';
import {
  clampYear,
  countriesIn,
  gapPct,
  longRunView,
  peerMedian,
  rankAt,
  rankHistory
} from '../../src/scenes/economy/selectors.js';
import type { EconomyIndicator, EconomyRecord } from '../../src/types/index.js';

function rec(country: string, year: number, value: number | null, indicator: EconomyIndicator = 'gdp_per_capita_usd'): EconomyRecord {
  return {
    country,
    year,
    indicator,
    value,
    unit: 'u',
    source: 'S',
    retrieved_at: '2026-01-01',
    ...(value === null ? { note: 'missing' } : {})
  };
}

// ARG 100 110 null 150 | BRA null 50 60 75 | CHL 200 210 220 null, years 1900-1903
const grid: EconomyRecord[] = [
  rec('ARG', 1900, 100), rec('ARG', 1901, 110), rec('ARG', 1902, null), rec('ARG', 1903, 150),
  rec('BRA', 1900, null), rec('BRA', 1901, 50), rec('BRA', 1902, 60), rec('BRA', 1903, 75),
  rec('CHL', 1900, 200), rec('CHL', 1901, 210), rec('CHL', 1902, 220), rec('CHL', 1903, null)
];

describe('countriesIn', () => {
  it('lists the sorted countries with at least one non-null value for the indicator', () => {
    const records = [
      rec('CHL', 1900, 1), rec('ARG', 1900, 1), rec('COL', 1900, null), rec('COL', 1901, null),
      rec('MEX', 1900, 5, 'population')
    ];
    expect(countriesIn(records, 'gdp_per_capita_usd')).toEqual(['ARG', 'CHL']);
    expect(countriesIn(records, 'population')).toEqual(['MEX']);
    expect(countriesIn(records, 'hdi')).toEqual([]);
  });
});

describe('longRunView', () => {
  const countries = ['ARG', 'BRA', 'CHL'];

  it('level mode: one series per country over the union of years, nulls kept as null', () => {
    const v = longRunView(grid, { indicator: 'gdp_per_capita_usd', countries, mode: 'level' });
    expect(v.mode).toBe('level');
    expect(v.baseYear).toBeNull();
    expect(v.indexUnavailable).toBe(false);
    expect(v.years).toEqual([1900, 1901, 1902, 1903]);
    expect(v.unit).toBe('u');
    expect(v.series.map((s) => s.country)).toEqual(countries);
    expect(v.series[0]!.points).toEqual([
      { year: 1900, value: 100 }, { year: 1901, value: 110 }, { year: 1902, value: null }, { year: 1903, value: 150 }
    ]);
    expect(v.series[1]!.points[0]).toEqual({ year: 1900, value: null });
  });

  it('index mode: divides each series by its own value at the first year all countries have a positive value', () => {
    const v = longRunView(grid, { indicator: 'gdp_per_capita_usd', countries, mode: 'index' });
    expect(v.mode).toBe('index');
    expect(v.baseYear).toBe(1901); // 1900 has no BRA, 1901 has all three
    expect(v.indexUnavailable).toBe(false);
    expect(v.unit).toBe('index');
    const values = (c: string) => v.series.find((s) => s.country === c)!.points.map((p) => p.value);
    const arg = values('ARG');
    expect(arg[0]).toBeCloseTo((100 / 110) * 100, 10);
    expect(arg[1]).toBe(100);
    expect(arg[2]).toBeNull(); // null stays null
    expect(arg[3]).toBeCloseTo((150 / 110) * 100, 10);
    const bra = values('BRA');
    expect(bra[0]).toBeNull();
    expect(bra[1]).toBe(100);
    expect(bra[2]).toBeCloseTo(120, 10);
    expect(bra[3]).toBe(150);
    const chl = values('CHL');
    expect(chl[0]).toBeCloseTo((200 / 210) * 100, 10);
    expect(chl[2]).toBeCloseTo((220 / 210) * 100, 10);
    expect(chl[3]).toBeNull();
  });

  it('a zero or negative value cannot be the base year', () => {
    const records = [
      rec('ARG', 1900, 0), rec('ARG', 1901, 10), rec('ARG', 1902, 20),
      rec('BRA', 1900, 5), rec('BRA', 1901, 10), rec('BRA', 1902, 15)
    ];
    const v = longRunView(records, { indicator: 'gdp_per_capita_usd', countries: ['ARG', 'BRA'], mode: 'index' });
    expect(v.baseYear).toBe(1901);
    expect(v.series[0]!.points.map((p) => p.value)).toEqual([0, 100, 200]);
  });

  it('falls back to level and flags it when no year has a positive value for every country', () => {
    const records = [rec('ARG', 1900, 10), rec('ARG', 1901, null), rec('BRA', 1900, null), rec('BRA', 1901, 20)];
    const v = longRunView(records, { indicator: 'gdp_per_capita_usd', countries: ['ARG', 'BRA'], mode: 'index' });
    expect(v.indexUnavailable).toBe(true);
    expect(v.baseYear).toBeNull();
    expect(v.mode).toBe('level');
    expect(v.unit).toBe('u');
    expect(v.series[0]!.points).toEqual([{ year: 1900, value: 10 }, { year: 1901, value: null }]);
  });

  it('ignores other indicators and countries that were not requested', () => {
    const v = longRunView([...grid, rec('ARG', 1900, 999, 'population'), rec('MEX', 1900, 5)], {
      indicator: 'gdp_per_capita_usd',
      countries: ['ARG'],
      mode: 'level'
    });
    expect(v.series).toHaveLength(1);
    expect(v.series[0]!.points[0]!.value).toBe(100);
  });
});

describe('clampYear', () => {
  const years = [1880, 1881, 1882, 2025];
  it('clamps below, inside and above the range', () => {
    expect(clampYear(1700, years)).toBe(1880);
    expect(clampYear(1881, years)).toBe(1881);
    expect(clampYear(3000, years)).toBe(2025);
  });
  it('floors non-integer input and copes with no years', () => {
    expect(clampYear(1881.9, years)).toBe(1881);
    expect(clampYear(1879.5, years)).toBe(1880);
    expect(clampYear(1913.7, [])).toBe(1913);
  });
});

describe('rankAt', () => {
  const records = [
    rec('ARG', 1913, 100), rec('BRA', 1913, 80), rec('CHL', 1913, 100), rec('COL', 1913, null), rec('MEX', 1913, 50)
  ];
  const countries = ['ARG', 'BRA', 'CHL', 'COL', 'MEX', 'PER'];

  it('ranks descending with ties by geo and reports how many countries are ranked', () => {
    const { rows } = rankAt(records, { indicator: 'gdp_per_capita_usd', year: 1913, countries });
    expect(rows).toEqual([
      { geo: 'ARG', value: 100, rank: 1, of: 4 },
      { geo: 'CHL', value: 100, rank: 2, of: 4 },
      { geo: 'BRA', value: 80, rank: 3, of: 4 },
      { geo: 'MEX', value: 50, rank: 4, of: 4 }
    ]);
  });

  it('lists countries without a value (null or no record) in missing and never ranks them', () => {
    const { rows, missing } = rankAt(records, { indicator: 'gdp_per_capita_usd', year: 1913, countries });
    expect(missing).toEqual(['COL', 'PER']);
    expect(rows.map((r) => r.geo)).not.toContain('COL');
    expect(rows.map((r) => r.geo)).not.toContain('PER');
  });

  it('returns no rows for a year without data', () => {
    const r = rankAt(records, { indicator: 'gdp_per_capita_usd', year: 1800, countries: ['ARG'] });
    expect(r.rows).toEqual([]);
    expect(r.missing).toEqual(['ARG']);
  });
});

describe('rankHistory', () => {
  it('gives the rank of the country among those with a value each year, null when it has none', () => {
    const h = rankHistory(grid, { indicator: 'gdp_per_capita_usd', country: 'ARG', countries: ['ARG', 'BRA', 'CHL'] });
    expect(h).toEqual([
      { year: 1900, rank: 2, of: 2 }, // BRA has no value: ARG 100 < CHL 200
      { year: 1901, rank: 2, of: 3 }, // CHL 210 > ARG 110 > BRA 50
      { year: 1902, rank: null, of: null }, // ARG has no value
      { year: 1903, rank: 1, of: 2 } // ARG 150 > BRA 75, CHL has no value
    ]);
  });

  it('only ranks among the requested countries', () => {
    const h = rankHistory(grid, { indicator: 'gdp_per_capita_usd', country: 'ARG', countries: ['ARG', 'BRA'] });
    expect(h.find((p) => p.year === 1901)).toEqual({ year: 1901, rank: 1, of: 2 });
  });
});

describe('peerMedian', () => {
  const at = (entries: Array<[string, number | null]>) => entries.map(([c, v]) => rec(c, 1913, v));
  const q = { indicator: 'gdp_per_capita_usd' as const, year: 1913, country: 'ARG', countries: ['ARG', 'BRA', 'CHL', 'COL', 'MEX'] };

  it('is the median of the peers with a value, excluding the country itself (odd count)', () => {
    expect(peerMedian(at([['ARG', 999], ['BRA', 80], ['CHL', 100], ['COL', 60]]), q)).toBe(80);
  });

  it('averages the two middle peers for an even count', () => {
    expect(peerMedian(at([['ARG', 999], ['BRA', 80], ['CHL', 100], ['COL', 60], ['MEX', 50]]), q)).toBe(70);
  });

  it('is null with fewer than 3 peers with a value', () => {
    expect(peerMedian(at([['ARG', 1], ['BRA', 80], ['CHL', 100]]), q)).toBeNull();
    expect(peerMedian(at([['ARG', 1], ['BRA', 80], ['CHL', 100], ['COL', null]]), q)).toBeNull();
  });
});

describe('gapPct', () => {
  it('is (value - median) / median * 100', () => {
    expect(gapPct(120, 100)).toBe(20);
    expect(gapPct(75, 100)).toBe(-25);
  });
  it('is null when a value is missing or the median is not positive', () => {
    expect(gapPct(null, 100)).toBeNull();
    expect(gapPct(100, null)).toBeNull();
    expect(gapPct(100, 0)).toBeNull();
    expect(gapPct(100, -5)).toBeNull();
  });
});
