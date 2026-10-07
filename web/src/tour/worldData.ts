import { MOCK_SOURCE } from './tourData.js';

export { MOCK_SOURCE };

export const WORLD_UNIT = 'miles de millones de USD';
export const FIRST_YEAR = 1900;
export const LAST_YEAR = 2026;

/** Made-up growth of the Argentine economy by year, in %: a shape with booms and crises, not a measurement. */
function growth(year: number): number {
  if (year <= 1913) return 6;
  if (year <= 1918) return -2;
  if (year <= 1929) return 4;
  if (year <= 1932) return -3;
  if (year <= 1945) return 3.5;
  if (year <= 1974) return 3.2;
  if (year <= 1982) return year % 3 === 0 ? -3 : 1.5;
  if (year <= 1990) return year % 2 === 0 ? -1.5 : 2;
  if (year <= 1998) return 5;
  if (year <= 2002) return -5;
  if (year <= 2011) return 6.5;
  if (year <= 2019) return 0.4;
  if (year === 2020) return -9.9;
  if (year <= 2022) return 7;
  if (year <= 2024) return -1.3;
  return 3;
}

export interface LongSeries {
  years: number[];
  values: number[];
}

/** Step 0: the GDP of Argentina from 1900 to 2026, made up. */
export function argentinaSince1900(): LongSeries {
  const years: number[] = [];
  const values: number[] = [];
  let value = 18;
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year += 1) {
    if (year > FIRST_YEAR) value *= 1 + growth(year) / 100;
    years.push(year);
    values.push(Math.round(value * 10) / 10);
  }
  return { years, values };
}

export interface CountryGdp {
  country: string;
  value: number;
}

/** Made-up GDP of the world's economies, in billions of USD (Argentina takes its value from the series above). */
const OTHERS: CountryGdp[] = [
  { country: 'Estados Unidos', value: 28000 },
  { country: 'China', value: 18500 },
  { country: 'Alemania', value: 4600 },
  { country: 'Japón', value: 4200 },
  { country: 'India', value: 3900 },
  { country: 'Reino Unido', value: 3500 },
  { country: 'Francia', value: 3100 },
  { country: 'Italia', value: 2300 },
  { country: 'Brasil', value: 2200 },
  { country: 'Canadá', value: 2150 },
  { country: 'Rusia', value: 2100 },
  { country: 'México', value: 1900 },
  { country: 'Corea del Sur', value: 1800 },
  { country: 'Australia', value: 1750 },
  { country: 'España', value: 1700 },
  { country: 'Indonesia', value: 1500 },
  { country: 'Turquía', value: 1400 },
  { country: 'Países Bajos', value: 1200 },
  { country: 'Arabia Saudita', value: 1150 },
  { country: 'Suiza', value: 950 },
  { country: 'Polonia', value: 880 },
  { country: 'Taiwán', value: 800 },
  { country: 'Bélgica', value: 720 },
  { country: 'Tailandia', value: 590 },
  { country: 'Suecia', value: 560 },
  { country: 'Irlanda', value: 520 }
];

export const HOME = 'Argentina';

export interface RankedCountry extends CountryGdp {
  rank: number;
}

/** Every economy ranked from the largest, Argentina included. */
export function worldRanking(argentina: number): RankedCountry[] {
  return [...OTHERS, { country: HOME, value: argentina }].sort((a, b) => b.value - a.value).map((c, i) => ({ ...c, rank: i + 1 }));
}

/** Made-up GDP of the region (Latin America), in billions of USD. */
const REGION: CountryGdp[] = [
  { country: 'Brasil', value: 2200 },
  { country: 'México', value: 1900 },
  { country: 'Colombia', value: 420 },
  { country: 'Chile', value: 360 },
  { country: 'Perú', value: 300 },
  { country: 'Ecuador', value: 130 },
  { country: 'Rep. Dominicana', value: 125 },
  { country: 'Guatemala', value: 110 },
  { country: 'Panamá', value: 90 },
  { country: 'Uruguay', value: 85 }
];

/** The largest economies of the region, Argentina included, ranked. */
export function regionRanking(argentina: number): RankedCountry[] {
  return [...REGION, { country: HOME, value: argentina }].sort((a, b) => b.value - a.value).map((c, i) => ({ ...c, rank: i + 1 }));
}

// ---- Year by year -------------------------------------------------------------------------------------------------------

/**
 * Made-up average growth by country, in % a year, and an optional boom window `[from, to, extra %]`: the shape of each
 * country's story (the large ones late, the old ones slow), not a measurement. Countries not listed grow 3 %.
 */
const GROWTH: Record<string, { rate: number; boom?: [number, number, number] }> = {
  'Estados Unidos': { rate: 3.4 },
  China: { rate: 0.9, boom: [1980, 2015, 7] },
  Alemania: { rate: 2.6 },
  Japón: { rate: 2.8, boom: [1950, 1990, 4] },
  India: { rate: 1.8, boom: [1990, 2026, 3.5] },
  'Reino Unido': { rate: 2.4 },
  Francia: { rate: 2.5 },
  Italia: { rate: 2.6 },
  Brasil: { rate: 3.6, boom: [1930, 1980, 2] },
  Canadá: { rate: 3.2 },
  Rusia: { rate: 2.2, boom: [1920, 1970, 1.8] },
  México: { rate: 3.2, boom: [1940, 1980, 1.5] },
  'Corea del Sur': { rate: 2, boom: [1960, 2000, 6] },
  Australia: { rate: 3.2 },
  España: { rate: 2.6, boom: [1960, 2005, 1.8] },
  Indonesia: { rate: 2, boom: [1970, 2020, 3] },
  Turquía: { rate: 3, boom: [1950, 2010, 1.5] },
  'Países Bajos': { rate: 2.6 },
  'Arabia Saudita': { rate: 2.5, boom: [1950, 1985, 6] },
  Suiza: { rate: 2.4 },
  Polonia: { rate: 2.5, boom: [1990, 2020, 2] },
  Taiwán: { rate: 2.2, boom: [1955, 1995, 5] },
  Bélgica: { rate: 2.4 },
  Tailandia: { rate: 2.4, boom: [1960, 1996, 4] },
  Suecia: { rate: 2.6 },
  Irlanda: { rate: 2.4, boom: [1990, 2020, 4] },
  Colombia: { rate: 3.4 },
  Chile: { rate: 3.2, boom: [1985, 2010, 2.2] },
  Perú: { rate: 3.2 },
  Ecuador: { rate: 3.4 },
  'Rep. Dominicana': { rate: 3.4, boom: [1990, 2020, 2] },
  Guatemala: { rate: 3.4 },
  Panamá: { rate: 3.4, boom: [2000, 2020, 3] },
  Uruguay: { rate: 2.8 }
};

/** A small, repeatable wobble of the growth of a country in a year, so that the curves are not smooth exponentials. */
function wobble(country: string, year: number): number {
  let seed = 0;
  for (const ch of country) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
  return 2.2 * Math.sin(year * 1.37 + seed) * Math.cos(year * 0.41 + seed * 0.3);
}

const WORLD_VALUES = new Map<string, number>([...OTHERS, ...REGION].map((c) => [c.country, c.value]));
const YEAR_COUNT = LAST_YEAR - FIRST_YEAR + 1;
const SERIES_CACHE = new Map<string, number[]>();

/** The made-up GDP of a country in every year from 1900 to 2026: it ends in its value of today and goes back with the growth above. */
function countrySeries(country: string): number[] {
  if (country === HOME) return argentinaSince1900().values;
  const cached = SERIES_CACHE.get(country);
  if (cached) return cached;
  const profile = GROWTH[country] ?? { rate: 3 };
  const values = new Array<number>(YEAR_COUNT);
  values[YEAR_COUNT - 1] = WORLD_VALUES.get(country) ?? 100;
  for (let year = LAST_YEAR; year > FIRST_YEAR; year -= 1) {
    const [from, to, extra] = profile.boom ?? [0, -1, 0];
    const growthPct = Math.min(14, Math.max(-8, profile.rate + (year >= from && year <= to ? extra : 0) + wobble(country, year)));
    values[year - FIRST_YEAR - 1] = values[year - FIRST_YEAR]! / (1 + growthPct / 100);
  }
  SERIES_CACHE.set(country, values);
  return values;
}

/** The GDP of a country at a (fractional) year, between 1900 and 2026, interpolated between two years. */
export function gdpAtYear(country: string, year: number): number {
  const values = countrySeries(country);
  const t = Math.min(LAST_YEAR, Math.max(FIRST_YEAR, year)) - FIRST_YEAR;
  const i = Math.min(Math.floor(t), YEAR_COUNT - 2);
  const k = t - i;
  return values[i]! + (values[i + 1]! - values[i]!) * k;
}

export type RankMetric = 'gdp' | 'percapita';

/** Made-up population of each country today, in millions of people. */
const POPULATION_2026: Record<string, number> = {
  'Estados Unidos': 335,
  China: 1410,
  Alemania: 84,
  Japón: 124,
  India: 1430,
  'Reino Unido': 68,
  Francia: 68,
  Italia: 59,
  Brasil: 216,
  Canadá: 40,
  Rusia: 144,
  México: 130,
  'Corea del Sur': 52,
  Australia: 27,
  España: 48,
  Indonesia: 277,
  Turquía: 86,
  'Países Bajos': 18,
  'Arabia Saudita': 36,
  Suiza: 9,
  Polonia: 38,
  Taiwán: 24,
  Bélgica: 12,
  Tailandia: 71,
  Suecia: 10.5,
  Irlanda: 5.3,
  Argentina: 46.6,
  Colombia: 52,
  Chile: 19.6,
  Perú: 34,
  Ecuador: 18,
  'Rep. Dominicana': 11,
  Guatemala: 17.5,
  Panamá: 4.5,
  Uruguay: 3.4
};

/** Made-up growth of the population in % a year, going back to 1900 (the old economies slowly, the others faster). */
const POPULATION_GROWTH: Record<string, number> = {
  'Estados Unidos': 1.2,
  Alemania: 0.5,
  Japón: 0.9,
  'Reino Unido': 0.5,
  Francia: 0.4,
  Italia: 0.5,
  Rusia: 0.5,
  Argentina: 1.8,
  Brasil: 2.1,
  México: 2.0,
  Suiza: 0.9,
  Suecia: 0.7,
  Bélgica: 0.5,
  'Países Bajos': 1
};

/** The made-up population of a country at a (fractional) year, in millions: it grows at a steady rate up to its value of today. */
export function populationAt(country: string, year: number): number {
  const clamped = Math.min(LAST_YEAR, Math.max(FIRST_YEAR, year));
  const rate = (POPULATION_GROWTH[country] ?? 1.4) / 100;
  return (POPULATION_2026[country] ?? 10) / (1 + rate) ** (LAST_YEAR - clamped);
}

/** The made-up GDP per capita of a country at a (fractional) year, in USD per person. */
export function gdpPerCapitaAt(country: string, year: number): number {
  return (gdpAtYear(country, year) * 1000) / populationAt(country, year);
}

/** Every economy of the world ranked from the largest in a year, by its GDP or by its GDP per capita, Argentina included. */
export function worldRankingAt(year: number, metric: RankMetric = 'gdp'): RankedCountry[] {
  const valueOf = metric === 'gdp' ? gdpAtYear : gdpPerCapitaAt;
  return [...OTHERS.map((c) => c.country), HOME]
    .map((country) => ({ country, value: valueOf(country, year) }))
    .sort((a, b) => b.value - a.value)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

/**
 * One of the two tables of the ranking in a year: Argentina apart (its place among everyone and its value, always shown) and
 * the first `count` of the others, each with the place it has among everyone.
 */
export function rankingTable(year: number, metric: RankMetric, count: number): { home: RankedCountry; others: RankedCountry[] } {
  const all = worldRankingAt(year, metric);
  return { home: all.find((c) => c.country === HOME)!, others: all.filter((c) => c.country !== HOME).slice(0, count) };
}

/** The countries of the region in one fixed order, the largest of today first (the bars keep their place while the years go by). */
export function regionCountries(): string[] {
  return regionRanking(argentinaSince1900().values.at(-1) ?? 0).map((c) => c.country);
}

/** The GDP of each country of the region at a (fractional) year, in the order of `regionCountries`. */
export function regionValuesAt(year: number): number[] {
  return regionCountries().map((country) => gdpAtYear(country, year));
}
