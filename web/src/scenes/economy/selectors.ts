import type { EconomyIndicator, EconomyRecord } from '../../types/index.js';

export type LongRunMode = 'level' | 'index';

export interface LongRunSeries {
  country: string;
  points: Array<{ year: number; value: number | null }>;
}

export interface LongRunView {
  series: LongRunSeries[];
  years: number[];
  unit: string;
  /** The mode actually used: `index` falls back to `level` when no base year exists. */
  mode: LongRunMode;
  baseYear: number | null;
  indexUnavailable: boolean;
}

const byCode = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Sorted ids of the countries with at least one non-null value for the indicator. */
export function countriesIn(records: EconomyRecord[], indicator: EconomyIndicator): string[] {
  const found = new Set<string>();
  for (const r of records) {
    if (r.indicator === indicator && r.value !== null) found.add(r.country);
  }
  return [...found].sort(byCode);
}

function valuesByCountry(records: EconomyRecord[], indicator: EconomyIndicator, countries: string[]) {
  const wanted = new Set(countries);
  const map = new Map<string, Map<number, number | null>>();
  for (const country of countries) map.set(country, new Map());
  const years = new Set<number>();
  let unit = '';
  for (const r of records) {
    if (r.indicator !== indicator || !wanted.has(r.country)) continue;
    map.get(r.country)!.set(r.year, r.value);
    years.add(r.year);
    if (unit === '') unit = r.unit;
  }
  return { map, years: [...years].sort((a, b) => a - b), unit };
}

/**
 * One series per requested country over the years present. In `index` mode every series is divided by its own
 * value at the first year in which all the requested countries have a positive value, times 100.
 */
export function longRunView(
  records: EconomyRecord[],
  q: { indicator: EconomyIndicator; countries: string[]; mode: LongRunMode }
): LongRunView {
  const { map, years, unit } = valuesByCountry(records, q.indicator, q.countries);
  const levels: LongRunSeries[] = q.countries.map((country) => ({
    country,
    points: years.map((year) => ({ year, value: map.get(country)!.get(year) ?? null }))
  }));

  if (q.mode === 'level') {
    return { series: levels, years, unit, mode: 'level', baseYear: null, indexUnavailable: false };
  }

  const baseYear =
    years.find((year) =>
      q.countries.every((country) => {
        const value = map.get(country)!.get(year);
        return value !== null && value !== undefined && value > 0;
      })
    ) ?? null;

  if (baseYear === null) {
    return { series: levels, years, unit, mode: 'level', baseYear: null, indexUnavailable: true };
  }

  const series = levels.map((s) => {
    const base = map.get(s.country)!.get(baseYear)!;
    return {
      country: s.country,
      points: s.points.map((p) => ({ year: p.year, value: p.value === null ? null : (p.value / base) * 100 }))
    };
  });
  return { series, years, unit: 'index', mode: 'index', baseYear, indexUnavailable: false };
}

/** Integer year inside the available range. */
export function clampYear(yearFloat: number, years: number[]): number {
  const year = Math.floor(yearFloat);
  if (years.length === 0) return year;
  return Math.min(Math.max(year, Math.min(...years)), Math.max(...years));
}

export interface RankRow {
  geo: string;
  value: number;
  rank: number;
  of: number;
}

function valuesAt(records: EconomyRecord[], indicator: EconomyIndicator, year: number, countries: string[]) {
  const wanted = new Set(countries);
  const values = new Map<string, number>();
  for (const r of records) {
    if (r.indicator === indicator && r.year === year && wanted.has(r.country) && r.value !== null) {
      values.set(r.country, r.value);
    }
  }
  return values;
}

function rankedOf(values: Map<string, number>): Array<{ geo: string; value: number }> {
  return [...values.entries()]
    .map(([geo, value]) => ({ geo, value }))
    .sort((a, b) => b.value - a.value || byCode(a.geo, b.geo));
}

/** Rank among the countries with a value at that year; countries without one are only listed in `missing`. */
export function rankAt(
  records: EconomyRecord[],
  q: { indicator: EconomyIndicator; year: number; countries: string[] }
): { rows: RankRow[]; missing: string[] } {
  const values = valuesAt(records, q.indicator, q.year, q.countries);
  const ranked = rankedOf(values);
  return {
    rows: ranked.map((r, i) => ({ geo: r.geo, value: r.value, rank: i + 1, of: ranked.length })),
    missing: q.countries.filter((c) => !values.has(c))
  };
}

export interface RankPoint {
  year: number;
  rank: number | null;
  of: number | null;
}

/** For each year, the rank of `country` among the countries with a value that year (null without a value). */
export function rankHistory(
  records: EconomyRecord[],
  q: { indicator: EconomyIndicator; country: string; countries: string[] }
): RankPoint[] {
  const wanted = new Set(q.countries);
  const years = [
    ...new Set(records.filter((r) => r.indicator === q.indicator && wanted.has(r.country)).map((r) => r.year))
  ].sort((a, b) => a - b);

  return years.map((year) => {
    const ranked = rankedOf(valuesAt(records, q.indicator, year, q.countries));
    const index = ranked.findIndex((r) => r.geo === q.country);
    return index === -1 ? { year, rank: null, of: null } : { year, rank: index + 1, of: ranked.length };
  });
}

/** Median of the peers (all countries but `country`) with a value that year; null with fewer than 3 peers. */
export function peerMedian(
  records: EconomyRecord[],
  q: { indicator: EconomyIndicator; year: number; country: string; countries: string[] }
): number | null {
  const values = valuesAt(
    records,
    q.indicator,
    q.year,
    q.countries.filter((c) => c !== q.country)
  );
  if (values.size < 3) return null;
  const sorted = [...values.values()].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** (value - median) / median * 100; null when either is null or the median is not positive. */
export function gapPct(value: number | null, median: number | null): number | null {
  if (value === null || median === null || !(median > 0)) return null;
  return ((value - median) / median) * 100;
}
