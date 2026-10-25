import { tokens } from '../styles/tokens.js';
import { DEVELOPMENT_INDICATORS_DATA } from './developmentData.js';
import series from './developmentSeries.json';
import { buildLines } from '../charts/builders/tourCharts.js';
import { flagSrc } from './worldCompare.js';

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
    return { years, series: names.map((name) => ({ name, values: yearly.countries[name]!, color: seriesColor(name) })) };
  }
  const own = DEVELOPMENT_INDICATORS_DATA[indicator]?.timeSeries ?? [];
  return { years: own.map((p) => p.year), series: [{ name: 'Argentina', values: own.map((p) => p.value), color: tokens.ink }] };
}

/**
 * One fixed color per peer, taken in order from the first seven colors of the validated palette (`validate_palette.js`): a country keeps its
 * color when the indicator changes. Argentina is the ink color.
 */
const PEER_ORDER = ['Brasil', 'Chile', 'Uruguay', 'México', 'Colombia', 'España', 'Estados Unidos'] as const;
const peerColor = (name: string): string => {
  const at = PEER_ORDER.indexOf(name as (typeof PEER_ORDER)[number]);
  return at < 0 ? tokens.muted : tokens.categorical[at]!;
};
const seriesColor = (name: string): string => (name === 'Argentina' ? tokens.ink : peerColor(name));

/**
 * The option of the big chart: the lines of `buildLines`, with the value axis fitted to the data (the indicators move a few points, from zero
 * they would be flat), Argentina thicker and on top with its name at the end of the line, and the peers thinner under it.
 */
export function lineOption(chart: { years: number[]; series: ChartSeries[] }, opts: { unit: string; summary: string }) {
  const { option } = buildLines(chart.years.map(String), chart.series, { unit: opts.unit, labelEvery: chart.years.length > 12 ? 2 : 0, summary: opts.summary });
  return {
    ...option,
    // room on the right for the name at the end of the line of Argentina
    grid: { ...option.grid, right: 64 },
    yAxis: { ...option.yAxis, scale: true },
    series: option.series.map((s) => {
      const home = s.name === 'Argentina';
      return {
        ...s,
        z: home ? 5 : 3,
        lineStyle: { ...s.lineStyle, width: home ? 4 : 2 },
        ...(home ? { endLabel: { show: true, formatter: '{a}', color: tokens.ink, distance: 6 } } : {})
      };
    })
  };
}

/** The flag file of a country of the slide (Colombia is not among the countries of the first slide). */
export const flagOf = (country: string): string => (country === 'Colombia' ? '/flags/co.svg' : flagSrc(country));
