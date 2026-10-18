import data from './worldGdp.json';

/**
 * Step 0 of the Recorrido: the REAL GDP (constant 2015 US dollars) of Argentina and of the world's economies from 1960 to 2025,
 * from the World Bank (WDI `NY.GDP.MKTP.KD`, `SP.POP.TOTL`). Built by `scripts/build_world_gdp.py`; the growth is checked against the IMF in `scripts/imf_compare.py`.
 * The last observed year is 2025: 2026 is an estimate and is not drawn here.
 */
export const WORLD_UNIT = 'miles de millones de USD de 2015 (PBI real, a precios constantes)';
export const WORLD_SOURCE = 'Banco Mundial (WDI), PBI real en dólares constantes de 2015';
export const FIRST_YEAR: number = data.firstYear;
export const LAST_YEAR: number = data.lastYear;
export const HOME = 'Argentina';

interface CountryRow {
  code: string;
  name: string;
  /** real GDP in billions of constant 2015 USD, one per year from `FIRST_YEAR` (null where the World Bank has no value) */
  gdp: Array<number | null>;
  /** population in millions */
  pop: Array<number | null>;
}

const COUNTRIES = data.countries as CountryRow[];

/** Every country of the data (real GDP in billions of constant 2015 USD and population in millions, one value per year from `FIRST_YEAR`), for the rule-of-70 explorer. */
export const worldCountries = (): readonly CountryRow[] => COUNTRIES;
const BY_NAME = new Map(COUNTRIES.map((c) => [c.name, c]));
const YEAR_COUNT = LAST_YEAR - FIRST_YEAR + 1;

export interface LongSeries {
  years: number[];
  values: number[];
}

export interface CountryGdp {
  country: string;
  value: number;
}

export interface RankedCountry extends CountryGdp {
  rank: number;
}

export type RankMetric = 'gdp' | 'percapita';
export type RegionMetric = 'gdp' | 'percapita' | 'population';

/** What each metric of the bars of the region is called and measured in. */
export const REGION_METRICS: Record<RegionMetric, { label: string; unit: string }> = {
  gdp: { label: 'PBI real', unit: 'miles de millones de USD de 2015' },
  percapita: { label: 'PBI per cápita real', unit: 'USD de 2015 por persona' },
  population: { label: 'Población', unit: 'millones de personas' }
};

const clampYear = (year: number): number => Math.min(LAST_YEAR, Math.max(FIRST_YEAR, year));

/** A value of a country at a (fractional) year, interpolated between two years; null when either of them has no value. */
function at(values: Array<number | null>, year: number): number | null {
  const t = clampYear(year) - FIRST_YEAR;
  const i = Math.min(Math.floor(t), YEAR_COUNT - 2);
  const a = values[i];
  const b = values[i + 1];
  if (a === null || a === undefined || b === null || b === undefined) return null;
  return a + (b - a) * (t - i);
}

/** The real GDP of Argentina, 1960 to 2025, in billions of constant 2015 USD. */
export function argentinaReal(): LongSeries {
  const arg = BY_NAME.get(HOME)!;
  return { years: Array.from({ length: YEAR_COUNT }, (_, i) => FIRST_YEAR + i), values: arg.gdp.map((v) => v ?? 0) };
}

/** The series the big chart draws: the real GDP or the real GDP per person of a country (Argentina by default), one value per year; a year without data is 0, as in `argentinaReal`. */
export function mainSeries(metric: RankMetric, country: string = HOME): LongSeries {
  const years = Array.from({ length: YEAR_COUNT }, (_, i) => FIRST_YEAR + i);
  return { years, values: years.map((y) => (metric === 'gdp' ? gdpAtYear(country, y) : gdpPerCapitaAt(country, y)) ?? 0) };
}

/** The place of a country among every country of the World Bank in a year (a fractional year rounds), by GDP or by GDP per person (null without a place or without the country). */
export function rankAt(country: string, year: number, metric: RankMetric): number | null {
  const code = BY_NAME.get(country)?.code;
  const ranks = code ? (data.ranks as Record<string, { gdp: Array<number | null>; perCapita: Array<number | null> }>)[code] : undefined;
  if (!ranks) return null;
  return (metric === 'gdp' ? ranks.gdp : ranks.perCapita)[Math.round(clampYear(year)) - FIRST_YEAR] ?? null;
}

export interface RegionGrowth {
  name: string;
  source: string;
  years: number[];
  /** annual growth of the real GDP in %, one per year; null where the World Bank has no value (the first year) */
  values: Array<number | null>;
}

/** The annual growth (%) of the real GDP of Latin America and the Caribbean: the World Bank aggregate `LCN` (it weights every country by its GDP). */
export function regionGrowth(): RegionGrowth {
  const a = data.regionAggregate;
  return { name: a.name, source: a.source, years: Array.from({ length: YEAR_COUNT }, (_, i) => FIRST_YEAR + i), values: a.growth as Array<number | null> };
}

/** The real GDP of a country at a (fractional) year, in billions of 2015 USD (null without data). */
export function gdpAtYear(country: string, year: number): number | null {
  const c = BY_NAME.get(country);
  return c ? at(c.gdp, year) : null;
}

/** The population of a country at a (fractional) year, in millions (null without data). */
export function populationAt(country: string, year: number): number | null {
  const c = BY_NAME.get(country);
  return c ? at(c.pop, year) : null;
}

/** The real GDP per person of a country at a (fractional) year, in 2015 USD (null without data). */
export function gdpPerCapitaAt(country: string, year: number): number | null {
  const g = gdpAtYear(country, year);
  const p = populationAt(country, year);
  return g === null || p === null || p === 0 ? null : (g * 1000) / p;
}

/** The countries with data in a year, ranked from the largest by their GDP or by their GDP per person (the second only among countries of a million people or more). */
export function worldRankingAt(year: number, metric: RankMetric = 'gdp'): RankedCountry[] {
  return COUNTRIES.map((c) => {
    const value = metric === 'gdp' ? at(c.gdp, year) : (at(c.pop, year) ?? 0) >= 1 ? gdpPerCapitaAt(c.name, year) : null;
    return { country: c.name, value }; // the countries without a value do not take a place
  })
    .filter((c): c is CountryGdp => c.value !== null && c.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

/**
 * One of the two tables of the ranking in a year: Argentina apart (its place among every country of the World Bank, computed when the data was
 * built, and its value) and the first `count` of the others, each with the place it has in the list.
 */
export function rankingTable(year: number, metric: RankMetric, count: number): { home: RankedCountry; others: RankedCountry[] } {
  const all = worldRankingAt(year, metric);
  const mine = all.find((c) => c.country === HOME);
  const ranks = metric === 'gdp' ? data.argentinaRank.gdp : data.argentinaRank.perCapita;
  const place = ranks[Math.round(clampYear(year)) - FIRST_YEAR] ?? mine?.rank ?? 0;
  return { home: { country: HOME, value: mine?.value ?? 0, rank: place }, others: all.filter((c) => c.country !== HOME).slice(0, count) };
}

/** The ten largest economies of Latin America and the Caribbean today (Argentina included), in one fixed order: the largest of 2025 first. */
export function regionCountries(): string[] {
  return (data.region as string[]).map((code) => COUNTRIES.find((c) => c.code === code)!.name);
}

/** The metric of each country of the region at a (fractional) year, in the order of `regionCountries` (0 where there is no data). */
export function regionValuesAt(year: number, metric: RegionMetric = 'gdp'): number[] {
  return regionCountries().map((country) => {
    const v = metric === 'gdp' ? gdpAtYear(country, year) : metric === 'percapita' ? gdpPerCapitaAt(country, year) : populationAt(country, year);
    return v ?? 0;
  });
}
