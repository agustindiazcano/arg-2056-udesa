import { cagr, doublingTimeExact, growthDecomposition, logLinearFit, rollingDoublingTime, ruleTime } from '../core/doubling.js';
import type { LogLinearFit, YearValue } from '../core/doubling.js';
import type { DataTable } from '../datasets/types.js';
import { worldCountries, FIRST_YEAR, LAST_YEAR } from './worldData.js';

/**
 * The country explorer of the rule of 70: for a country, an indicator and a period it computes the rate between the endpoints, the rate
 * fitted on every year, the doubling time they imply (exact and by the rules), how many times the level doubled, and the real series against
 * the path of a constant rate. Real GDP in constant 2015 US dollars from the World Bank (`worldGdp.json`); GDP per person is that GDP over the
 * population of the same file (the INDEC's for Argentina), so there is one source for the GDP of every slide. Years without a value stay empty:
 * nothing is filled in.
 */
export type Indicator = 'gdp' | 'percapita';

export interface Preset {
  id: string;
  label: string;
  code: string;
  indicator: Indicator;
  from: number;
  to: number;
}

/** The cases of the brief; the numbers shown for each one are computed from the data. */
export const PRESETS: readonly Preset[] = [
  { id: 'ARG', label: 'Argentina', code: 'ARG', indicator: 'gdp', from: FIRST_YEAR, to: LAST_YEAR },
  { id: 'CHN', label: 'China 1979-2010', code: 'CHN', indicator: 'gdp', from: 1979, to: 2010 },
  { id: 'KOR', label: 'Corea del Sur 1960-1990', code: 'KOR', indicator: 'percapita', from: 1960, to: 1990 },
  { id: 'IND', label: 'India', code: 'IND', indicator: 'gdp', from: FIRST_YEAR, to: LAST_YEAR },
  { id: 'USA', label: 'Estados Unidos', code: 'USA', indicator: 'gdp', from: FIRST_YEAR, to: LAST_YEAR }
];

export const INDICATOR_LABEL: Record<Indicator, string> = { gdp: 'PBI real', percapita: 'PBI per cápita real' };
export const INDICATOR_UNIT: Record<Indicator, string> = { gdp: 'miles de millones de USD de 2015', percapita: 'USD de 2015 por persona' };

export const ROLLING_WINDOW = 10;

export function countryList(): Array<{ code: string; name: string }> {
  return worldCountries()
    .map((c) => ({ code: c.code, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** One value per year from 1960 to 2025; null where the World Bank (or the population) has none. */
export function seriesOf(code: string, indicator: Indicator): Array<{ year: number; value: number | null }> {
  const c = worldCountries().find((x) => x.code === code);
  if (!c) throw new Error(`unknown country ${code}`);
  return c.gdp.map((gdp, i) => {
    const pop = c.pop[i] ?? null;
    const value = gdp === null || gdp === undefined ? null : indicator === 'gdp' ? gdp : pop === null || pop <= 0 ? null : (gdp * 1000) / pop;
    return { year: FIRST_YEAR + i, value };
  });
}

export interface AnalysisPoint {
  year: number;
  actual: number | null;
  /** the level of a constant rate that starts and ends where the period does */
  constant: number;
}

export interface Analysis {
  ok: true;
  code: string;
  name: string;
  indicator: Indicator;
  from: number;
  to: number;
  years: number;
  v0: number;
  v1: number;
  /** the rate between the endpoints, in percent per year */
  cagrPct: number;
  /** the least-squares rate of ln V on the year over every year with a value */
  fit: LogLinearFit;
  doublingExact: number;
  rule70: number | null;
  rule72: number | null;
  /** how many times the level doubled between the endpoints (log2 of the ratio; negative if it shrank) */
  doublings: number;
  points: AnalysisPoint[];
  /** the largest distance of the real series from the constant-rate path, in percent of the path */
  maxDeviationPct: number;
  rolling: Array<{ year: number; ratePct: number; doublingYears: number }>;
  /** how far each year is from the fitted line, in percent of the line (no threshold: the number and the chart are the diagnosis) */
  residuals: Array<{ year: number; residualPct: number }>;
  maxResidualPct: number;
}

export type AnalysisResult = Analysis | { ok: false; reason: string };

export function analyse(code: string, indicator: Indicator, from: number, to: number): AnalysisResult {
  const country = worldCountries().find((x) => x.code === code);
  if (!country) return { ok: false, reason: `País desconocido: ${code}` };
  if (!(to - from >= 2)) return { ok: false, reason: 'El período tiene que tener al menos dos años.' };
  const all = seriesOf(code, indicator);
  const period: YearValue[] = all.filter((p) => p.year >= from && p.year <= to);
  const first = period.find((p) => p.year === from)?.value ?? null;
  const last = period.find((p) => p.year === to)?.value ?? null;
  if (first === null) return { ok: false, reason: `Sin dato de ${INDICATOR_LABEL[indicator].toLowerCase()} en ${from}.` };
  if (last === null) return { ok: false, reason: `Sin dato de ${INDICATOR_LABEL[indicator].toLowerCase()} en ${to}.` };
  const years = to - from;
  const cagrPct = cagr(first, last, years);
  const doublingExact = doublingTimeExact(cagrPct);
  const factor = 1 + cagrPct / 100;
  const points: AnalysisPoint[] = period.map((p) => ({ year: p.year, actual: p.value, constant: first * factor ** (p.year - from) }));
  const fit = logLinearFit(period);
  const residuals = fit.residuals.map((r) => ({ year: r.year, residualPct: (Math.exp(r.residual) - 1) * 100 }));
  const deviations = points.filter((p) => p.actual !== null).map((p) => Math.abs(p.actual! / p.constant - 1) * 100);
  return {
    ok: true,
    code,
    name: country.name,
    indicator,
    from,
    to,
    years,
    v0: first,
    v1: last,
    cagrPct,
    fit,
    doublingExact,
    rule70: cagrPct > 0 ? ruleTime(70, cagrPct) : null,
    rule72: cagrPct > 0 ? ruleTime(72, cagrPct) : null,
    doublings: Math.log2(last / first),
    points,
    maxDeviationPct: deviations.length ? Math.max(...deviations) : 0,
    rolling: rollingDoublingTime(period, ROLLING_WINDOW),
    residuals,
    maxResidualPct: residuals.length ? Math.max(...residuals.map((r) => Math.abs(r.residualPct))) : 0
  };
}

export interface Decomposition {
  ok: true;
  from: number;
  to: number;
  /** growth rates between the endpoints, percent per year */
  totalPct: number;
  perCapitaPct: number;
  populationPct: number;
  /** |(1 + total) - (1 + per person)(1 + population)|: zero up to rounding, because per person is the total over the population */
  identityError: number;
}

/** Real GDP, real GDP per person and population: the growth between the endpoints and the identity that ties them, (1 + total) = (1 + per person)(1 + population). */
export function decompose(code: string, from: number, to: number): Decomposition | { ok: false; reason: string } {
  const country = worldCountries().find((x) => x.code === code);
  if (!country) return { ok: false, reason: `País desconocido: ${code}` };
  if (!(to - from >= 2)) return { ok: false, reason: 'El período tiene que tener al menos dos años.' };
  const gdp = seriesOf(code, 'gdp');
  const pc = seriesOf(code, 'percapita');
  const at = (series: Array<{ year: number; value: number | null }>, year: number) => series.find((p) => p.year === year)?.value ?? null;
  const pop = (year: number): number | null => {
    const v = country.pop[year - FIRST_YEAR];
    return v === undefined || v === null || v <= 0 ? null : v;
  };
  const g0 = at(gdp, from);
  const g1 = at(gdp, to);
  const p0 = pop(from);
  const p1 = pop(to);
  if (g0 === null || g1 === null) return { ok: false, reason: 'Sin dato de PBI real en un extremo del período.' };
  if (p0 === null || p1 === null) return { ok: false, reason: 'Sin dato de población en un extremo del período.' };
  const years = to - from;
  const totalPct = cagr(g0, g1, years);
  const populationPct = cagr(p0, p1, years);
  const perCapitaPct = cagr(at(pc, from)!, at(pc, to)!, years);
  const check = growthDecomposition(totalPct, populationPct);
  return { ok: true, from, to, totalPct, perCapitaPct, populationPct, identityError: Math.abs(check.perCapitaPct - perCapitaPct) / 100 };
}

const round = (v: number, digits: number): number => Math.round(v * 10 ** digits) / 10 ** digits;

/** The table of the Data page behind the explorer: the five cases, computed. */
export function countriesTable(): DataTable {
  return {
    id: 'rule70-countries',
    title: 'Casos del explorador de la regla del 70: cuánto crecieron y cuántas veces se duplicaron (PBI real en dólares constantes de 2015; per cápita = PBI sobre población; Banco Mundial)',
    columns: ['Caso', 'Indicador', 'Desde', 'Hasta', 'Valor inicial', 'Valor final', 'Tasa entre extremos (% anual)', 'Tasa ajustada (% anual)', 'Duplicación exacta (años)', 'Veces que se duplicó'],
    rows: PRESETS.map((p) => {
      const a = analyse(p.code, p.indicator, p.from, p.to);
      if (!a.ok) throw new Error(a.reason);
      return [p.label, `${INDICATOR_LABEL[p.indicator]} (${INDICATOR_UNIT[p.indicator]})`, a.from, a.to, round(a.v0, 1), round(a.v1, 1), round(a.cagrPct, 2), round(a.fit.ratePct, 2), Number.isFinite(a.doublingExact) ? round(a.doublingExact, 1) : null, round(a.doublings, 2)];
    })
  };
}
