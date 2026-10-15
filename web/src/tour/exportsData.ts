import { EXPORTS_TOTAL_2025, EXPORT_COMPLEXES } from './tourData.js';
import type { ColumnRow } from './tourData.js';

/** The years the slide offers; the INDEC report in the repository has two of them (2025 and 2024), the other years stay visible and disabled. */
export const EXPORT_YEARS: readonly number[] = Array.from({ length: 11 }, (_, i) => 2015 + i);
export const EXPORT_YEARS_WITH_DATA: readonly number[] = [2024, 2025];

export type ExportMetric = 'usd' | 'share';

export const COMPLEX_LABELS: readonly string[] = EXPORT_COMPLEXES.map((c) => c.label);

const round1 = (value: number): number => Math.round(value * 10) / 10;

type DataYear = 2024 | 2025;

const isDataYear = (year: number): year is DataYear => EXPORT_YEARS_WITH_DATA.includes(year);

const millions = (label: string, year: DataYear): number => {
  const c = EXPORT_COMPLEXES.find((x) => x.label === label)!;
  return year === 2025 ? c.y2025 : c.y2024;
};

/**
 * The total the percentages are taken of, in millions of USD. 2025 is the total the report publishes (87,111). The repository has no published
 * total for 2024, so it is the sum of the complexes of the same table (the 2024 percentages are therefore calculated).
 */
export function exportTotal(year: number): number {
  if (!isDataYear(year)) throw new Error(`no export data for ${year}`);
  return year === 2025 ? EXPORTS_TOTAL_2025 : EXPORT_COMPLEXES.reduce((n, c) => n + c.y2024, 0);
}

const value = (label: string, year: DataYear, metric: ExportMetric): number =>
  metric === 'usd' ? round1(millions(label, year) / 1000) : round1((millions(label, year) / exportTotal(year)) * 100);

/** The exporting complexes of a year, in the order of the report: billions of USD or percent of the total. Throws for a year without data. */
export function exportRows(year: number, metric: ExportMetric): ColumnRow[] {
  if (!isDataYear(year)) throw new Error(`no export data for ${year}`);
  return COMPLEX_LABELS.map((label) => ({ label, value: value(label, year, metric) }));
}

/** One complex across the years that have data. */
export function complexOverYears(label: string, metric: ExportMetric): ColumnRow[] {
  return EXPORT_YEARS_WITH_DATA.map((year) => ({ label: String(year), value: value(label, year as DataYear, metric) }));
}

export const EXPORT_UNIT: Record<ExportMetric, string> = { usd: 'miles de millones de USD', share: '%' };
