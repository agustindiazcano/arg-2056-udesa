/**
 * The doubling-time rule, as pure functions. Model: V(t) = V0 (1 + r)^t with a constant annual rate r.
 * Every rate in this module is in percent per year (3 means 3 %), every time in years.
 * Exact doubling time: ln 2 / ln(1 + r). Rules: k / r% with k = 69.3, 70 or 72. For a small r, ln(1 + r) ~ r, so the time tends to
 * 100 ln 2 / r% = 69.3147 / r%; 72 compensates the error of discrete compounding near 8 %.
 */

/** The constants of the rules: 69.3 is the small-rate limit rounded, 70 and 72 are the popular ones. */
export type RuleConstant = 69.3 | 70 | 72;

const LN2 = Math.log(2);

const growthFactor = (ratePct: number): number => 1 + ratePct / 100;

/** Years for a level to double at a constant rate; Infinity when the rate is zero or negative (it never doubles). */
export function doublingTimeExact(ratePct: number): number {
  if (!(ratePct > 0)) return Infinity;
  return LN2 / Math.log(growthFactor(ratePct));
}

/** Years for a level to halve at a constant negative rate; Infinity when the rate is zero or positive. */
export function halvingTime(ratePct: number): number {
  if (!(ratePct < 0) || ratePct <= -100) return Infinity;
  return Math.log(0.5) / Math.log(growthFactor(ratePct));
}

/** The rule of k: k / rate. Not defined for a rate of zero or less. */
export function ruleTime(k: RuleConstant, ratePct: number): number {
  if (!(ratePct > 0)) throw new Error(`the rule needs a positive rate, got ${ratePct}`);
  return k / ratePct;
}

/** How far a rule is from the exact time: `years` is rule minus exact (negative when the rule is short), `percent` is that over the exact time. */
export function ruleError(k: RuleConstant, ratePct: number): { years: number; percent: number } {
  const exact = doublingTimeExact(ratePct);
  const years = ruleTime(k, ratePct) - exact;
  return { years, percent: (years / exact) * 100 };
}

/** The factor a level is multiplied by after some years at a constant rate: (1 + r)^years. */
export function multiplier(ratePct: number, years: number): number {
  return growthFactor(ratePct) ** years;
}

/** Years to reach a multiple of the starting level (2 is the doubling time); Infinity if the rate never gets there. */
export function yearsToMultiple(ratePct: number, multiple: number): number {
  if (!(multiple > 0)) throw new Error(`the multiple must be positive, got ${multiple}`);
  if (multiple === 1) return 0;
  const step = Math.log(growthFactor(ratePct));
  if (step === 0) return Infinity;
  const years = Math.log(multiple) / step;
  return years > 0 ? years : Infinity;
}

/**
 * The calendar year in which a multiple is reached at a constant rate, starting from the level of `startYear`: `years` is the exact time and
 * `year` is the first year whose (annual) level is at or above the multiple, or null if it is never reached.
 */
export function yearReached(startYear: number, ratePct: number, multiple: number): { years: number; year: number | null } {
  const years = yearsToMultiple(ratePct, multiple);
  return { years, year: Number.isFinite(years) ? Math.ceil(startYear + years - 1e-9) : null };
}

/** The compound annual rate in percent between two levels `years` apart (the endpoints only). */
export function cagr(v0: number, v1: number, years: number): number {
  if (!(v0 > 0) || !(v1 > 0)) throw new Error('both levels must be positive');
  if (!(years > 0)) throw new Error('years must be positive');
  return ((v1 / v0) ** (1 / years) - 1) * 100;
}

export interface YearValue {
  year: number;
  value: number | null;
}

export interface LogLinearFit {
  /** the annual rate in percent, exp(slope) - 1 */
  ratePct: number;
  /** growth of ln V per year */
  slope: number;
  intercept: number;
  r2: number;
  /** ln V minus the fitted line, one per year used */
  residuals: Array<{ year: number; residual: number }>;
}

const usable = (series: readonly YearValue[]): Array<{ year: number; value: number }> =>
  series.filter((p): p is { year: number; value: number } => p.value !== null && p.value > 0);

/** Ordinary least squares of ln V on the year. Missing or non-positive values are skipped, never filled in. */
export function logLinearFit(series: readonly YearValue[]): LogLinearFit {
  const pts = usable(series);
  if (pts.length < 2) throw new Error('a fit needs at least two points');
  const n = pts.length;
  const xs = pts.map((p) => p.year);
  const ys = pts.map((p) => Math.log(p.value));
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    sxy += (xs[i]! - mx) * (ys[i]! - my);
    sxx += (xs[i]! - mx) ** 2;
    syy += (ys[i]! - my) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const residuals = pts.map((p, i) => ({ year: p.year, residual: ys[i]! - (intercept + slope * p.year) }));
  const ssRes = residuals.reduce((a, r) => a + r.residual ** 2, 0);
  return { ratePct: (Math.exp(slope) - 1) * 100, slope, intercept, r2: syy === 0 ? 1 : 1 - ssRes / syy, residuals };
}

/** For every year with a value `windowYears` earlier, the rate between the two endpoints and its exact doubling time. */
export function rollingDoublingTime(series: readonly YearValue[], windowYears: number): Array<{ year: number; ratePct: number; doublingYears: number }> {
  const byYear = new Map(usable(series).map((p) => [p.year, p.value]));
  const out: Array<{ year: number; ratePct: number; doublingYears: number }> = [];
  for (const year of [...byYear.keys()].sort((a, b) => a - b)) {
    const start = byYear.get(year - windowYears);
    if (start === undefined) continue;
    const ratePct = cagr(start, byYear.get(year)!, windowYears);
    out.push({ year, ratePct, doublingYears: doublingTimeExact(ratePct) });
  }
  return out;
}

/** (1 + total) = (1 + per capita)(1 + population): the per-capita growth that goes with a total growth and a population growth, all in percent. */
export function growthDecomposition(totalPct: number, populationPct: number): { totalPct: number; perCapitaPct: number; populationPct: number } {
  return { totalPct, populationPct, perCapitaPct: (growthFactor(totalPct) / growthFactor(populationPct) - 1) * 100 };
}
