import { tokens } from '../styles/tokens.js';
import { HOME, mainSeries } from './worldData.js';
import type { RankMetric } from './worldData.js';

/** The countries the big chart of slide 1 can compare with Argentina, each shown as its flag (`code` is the ISO 3166-1 alpha-2 of the file in `public/flags`). */
export const COMPARE_OPTIONS = [
  { name: 'Brasil', code: 'br' },
  { name: 'México', code: 'mx' },
  { name: 'Estados Unidos', code: 'us' },
  { name: 'Australia', code: 'au' },
  { name: 'Japón', code: 'jp' },
  { name: 'Alemania', code: 'de' },
  { name: 'Chile', code: 'cl' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'España', code: 'es' }
] as const;

/** The countries drawn next to Argentina when the slide opens. */
export const DEFAULT_COMPARE: readonly string[] = ['Brasil', 'México'];

const CODES = new Map<string, string>([[HOME, 'ar'], ...COMPARE_OPTIONS.map((o) => [o.name, o.code] as [string, string])]);

/** The flag file of a country (flags of the `flag-icons` project, MIT, in `public/flags`). */
export const flagSrc = (country: string): string => `/flags/${CODES.get(country)}.svg`;

export interface CompareLine {
  country: string;
  values: number[];
}

/** The lines of the big chart: Argentina first, then the chosen countries in the order of `COMPARE_OPTIONS`; unknown names and repeats are dropped. */
export function compareSeries(selected: readonly string[], metric: RankMetric): CompareLine[] {
  const chosen = COMPARE_OPTIONS.filter((o) => selected.includes(o.name)).map((o) => o.name as string);
  return [HOME, ...chosen].map((country) => ({ country, values: mainSeries(metric, country).values }));
}

/** A line is squashed when its highest value stays under this share of the highest value of all the lines. */
export const SQUASHED_SHARE = 0.1;

/** Whether some line is so small next to the largest that it reads as flat on a linear scale: then the chart offers the logarithmic one. */
export function isSquashed(lines: readonly CompareLine[]): boolean {
  if (lines.length < 2) return false;
  const tops = lines.map((l) => Math.max(...l.values));
  const top = Math.max(...tops);
  return tops.some((t) => t < top * SQUASHED_SHARE);
}

/** The color of the line of a country: Argentina in white, the others one color of the palette each, always the same for the same country. */
export function countryColor(country: string): string {
  const at = COMPARE_OPTIONS.findIndex((o) => o.name === country);
  return at < 0 ? tokens.ink : tokens.categorical[at % tokens.categorical.length]!;
}
