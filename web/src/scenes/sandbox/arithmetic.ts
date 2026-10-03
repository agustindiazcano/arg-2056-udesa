/**
 * Exact arithmetic of the sandbox. All rates are percentages per year (7 means 7%). This is illustrative arithmetic
 * on the visitor's own assumptions: nothing here is the forecasting model.
 */

export function compound(base: number, ratePct: number, years: number): number {
  return base * (1 + ratePct / 100) ** years;
}

/** Exact doubling time, ln 2 / ln(1 + rate); null when the rate is not positive. */
export function doublingYears(ratePct: number): number | null {
  if (!(ratePct > 0)) return null;
  return Math.log(2) / Math.log(1 + ratePct / 100);
}

/** The rule of 70: doubling time of about 70 / rate; null when the rate is not positive. */
export function rule70(ratePct: number): number | null {
  if (!(ratePct > 0)) return null;
  return 70 / ratePct;
}

/** (rule of 70 - exact) / exact, in percent. */
export function rule70ErrorPct(ratePct: number): number | null {
  const approximate = rule70(ratePct);
  const exact = doublingYears(ratePct);
  if (approximate === null || exact === null) return null;
  return ((approximate - exact) / exact) * 100;
}

/** The yearly rate that multiplies a level by `multiple` in `years` years; null for a non-positive multiple or horizon. */
export function requiredRatePct(multiple: number, years: number): number | null {
  if (!(multiple > 0) || !(years > 0)) return null;
  return (multiple ** (1 / years) - 1) * 100;
}

/** GDP growth from per-capita growth and population growth: (1 + g) * (1 + p) - 1, an exact identity. */
export function combinedGrowthPct(gpcPct: number, popPct: number): number {
  return ((1 + gpcPct / 100) * (1 + popPct / 100) - 1) * 100;
}

/**
 * Convention: the AI uplift is ADDED, in percentage points, to the per-capita growth rate (for example 2% plus
 * 0.5 points is 2.5%). It is not a multiplier of the rate and not an effect on the level.
 */
export function effectiveGpcPct(gpcPct: number, aiPp: number): number {
  return gpcPct + aiPp;
}
