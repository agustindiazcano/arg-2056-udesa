import { COMPARE_OPTIONS, flagSrc } from './worldCompare.js';
import { LAST_YEAR, gdpAtYear, gdpPerCapitaAt } from './worldData.js';
import type { RankMetric } from './worldData.js';

export interface CountryReference {
  country: string;
  /** the latest real value of the country (World Bank, `LAST_YEAR`), in the unit of the chart it is drawn on */
  value: number;
  flag: string;
}

/**
 * The horizontal reference lines of the AI slide: where each compared country stands today (real GDP, or real GDP per person divided by `scale`),
 * from the lowest, keeping only those inside the range of the chart (`min` to `max`) so that they do not stretch its axis. A country without a
 * value is left out.
 */
export function countryReferences(metric: RankMetric, range: { min: number; max: number; scale?: number }): CountryReference[] {
  const scale = range.scale ?? 1;
  return COMPARE_OPTIONS.flatMap((o) => {
    const raw = metric === 'gdp' ? gdpAtYear(o.name, LAST_YEAR) : gdpPerCapitaAt(o.name, LAST_YEAR);
    if (raw === null) return [];
    const value = raw / scale;
    return value >= range.min && value <= range.max ? [{ country: o.name, value, flag: flagSrc(o.name) }] : [];
  }).sort((a, b) => a.value - b.value);
}
