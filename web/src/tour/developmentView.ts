import { tokens } from '../styles/tokens.js';
import { DEVELOPMENT_INDICATORS_DATA } from './developmentData.js';
import series from './developmentSeries.json';
import { countryColor, flagSrc } from './worldCompare.js';

/** Indicators where a lower value is the better one; every other indicator of the slide improves upwards. */
const LOWER_IS_BETTER: ReadonlySet<string> = new Set(['Mortalidad infantil', 'Índice de Gini', 'Pobreza monetaria']);

export const higherIsBetter = (indicator: string): boolean => !LOWER_IS_BETTER.has(indicator);

export interface RankingRow {
  rank: number;
  country: string;
  value: number;
  note?: string;
  isArgentina: boolean;
}

/** The regional comparison of an indicator, best first (the direction depends on the indicator), with the place of each country. */
export function rankingRows(indicator: string): RankingRow[] {
  const data = DEVELOPMENT_INDICATORS_DATA[indicator];
  if (!data) return [];
  const sign = higherIsBetter(indicator) ? -1 : 1;
  return [...data.regionalComparison]
    .sort((a, b) => sign * (a.value - b.value))
    .map((r, i) => ({ rank: i + 1, country: r.country, value: r.value, ...(r.note ? { note: r.note } : {}), isArgentina: r.country === 'Argentina' }));
}

export interface ChartSeries {
  name: string;
  values: Array<number | null>;
  color: string;
}

const YEARLY = series.indicators as Record<string, { countries: Record<string, Array<number | null>> }>;

/** What the big chart draws: Argentina and its peers year by year where there is a yearly series, otherwise the series of Argentina alone. */
export function chartSeries(indicator: string): { years: number[]; series: ChartSeries[] } {
  const yearly = YEARLY[indicator];
  if (yearly) {
    const years = Array.from({ length: series.lastYear - series.firstYear + 1 }, (_, i) => series.firstYear + i);
    const names = Object.keys(yearly.countries).sort((a, b) => (a === 'Argentina' ? -1 : b === 'Argentina' ? 1 : a.localeCompare(b)));
    return { years, series: names.map((name) => ({ name, values: yearly.countries[name]!, color: peerColor(name) })) };
  }
  const own = DEVELOPMENT_INDICATORS_DATA[indicator]?.timeSeries ?? [];
  return { years: own.map((p) => p.year), series: [{ name: 'Argentina', values: own.map((p) => p.value), color: tokens.ink }] };
}

const EXTRA_COLORS: Record<string, string> = { Colombia: tokens.categorical[7 % tokens.categorical.length]! };
const peerColor = (name: string): string => EXTRA_COLORS[name] ?? countryColor(name);

/** The flag file of a country of the slide (Colombia is not among the countries of the first slide). */
export const flagOf = (country: string): string => (country === 'Colombia' ? '/flags/co.svg' : flagSrc(country));
