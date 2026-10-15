import { doublingTimeExact, multiplier, ruleError, ruleTime, yearReached } from '../core/doubling.js';
import type { RuleConstant } from '../core/doubling.js';
import type { DataTable } from '../datasets/types.js';
import { ARG_GDP_2026, GDP_UNIT } from './gdpFacts.js';

/**
 * What the "regla del 70" slide shows, as pure functions over `core/doubling.ts`: the exact time and the rules for a rate, the error of the
 * rules against the rate, the compound growth of a level, and when the real GDP of Argentina doubles. Everything is arithmetic on the rate
 * the visitor chooses; the only datum is the real GDP of 2026 (`gdpFacts.ts`, the same figure as in the other slides).
 */
export const RATE_MIN = 0.1;
export const RATE_MAX = 20;
export const RATE_STEP = 0.1;
export const DEFAULT_RATE = 3;
export const START_YEAR = 2026;

/** The rate held between the limits; what is not a number falls back to the default. */
export function clampRate(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_RATE;
  return Math.min(RATE_MAX, Math.max(RATE_MIN, value));
}

export const RULES: readonly RuleConstant[] = [70, 72];

export interface RuleRow {
  rule: RuleConstant;
  years: number;
  /** rule minus exact, in years */
  errorYears: number;
  /** that over the exact time, in percent */
  errorPct: number;
}

export function ruleTable(ratePct: number): { exact: number; rows: RuleRow[] } {
  return {
    exact: doublingTimeExact(ratePct),
    rows: RULES.map((rule) => {
      const e = ruleError(rule, ratePct);
      return { rule, years: ruleTime(rule, ratePct), errorYears: e.years, errorPct: e.percent };
    })
  };
}

const round1 = (v: number): number => Math.round(v * 10) / 10;
const round2 = (v: number): number => Math.round(v * 100) / 100;

/** The error of the rules of 70 and 72 for every rate from 0.1 % to 20 % in steps of 0.1: computed, so it shows where each rule is best. */
export function errorCurve(): { rates: number[]; error70: number[]; error72: number[] } {
  const rates = Array.from({ length: Math.round((RATE_MAX - RATE_MIN) / RATE_STEP) + 1 }, (_, i) => round1(RATE_MIN + i * RATE_STEP));
  return {
    rates,
    error70: rates.map((r) => ruleError(70, r).percent),
    error72: rates.map((r) => ruleError(72, r).percent)
  };
}

/** A level growing at a constant rate: one value per year from 0 to the horizon, from `start`. */
export function compoundPath(ratePct: number, horizonYears: number, start = 1): { years: number[]; values: number[] } {
  const years = Array.from({ length: horizonYears + 1 }, (_, i) => i);
  return { years, values: years.map((t) => start * multiplier(ratePct, t)) };
}

/** The moments (in years from the start) at which the level has doubled once, twice, ... inside the horizon. */
export function doublingMarks(ratePct: number, horizonYears: number): number[] {
  const t = doublingTimeExact(ratePct);
  if (!Number.isFinite(t)) return [];
  const marks: number[] = [];
  for (let k = 1; k * t <= horizonYears; k += 1) marks.push(k * t);
  return marks;
}

export interface ArgentinaDoubling {
  startYear: number;
  startValue: number;
  years: number;
  /** the first year whose level is at or above double, or null if it is never reached */
  year: number | null;
  /** the real GDP of that year, billions of constant 2015 USD */
  valueAtYear: number | null;
}

/** When the real GDP of Argentina, from its 2026 level, doubles at a constant rate. */
export function argentinaDoubling(ratePct: number): ArgentinaDoubling {
  const d = yearReached(START_YEAR, ratePct, 2);
  return {
    startYear: START_YEAR,
    startValue: ARG_GDP_2026,
    years: d.years,
    year: d.year,
    valueAtYear: d.year === null ? null : ARG_GDP_2026 * multiplier(ratePct, d.year - START_YEAR)
  };
}

const ERROR_RATES = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20];
const ARGENTINA_RATES = [1, 2, 3, 4, 5, 6, 7, 8];

/** The table of the Data page behind the error chart. */
export function errorTable(): DataTable {
  return {
    id: 'rule70-errors',
    title: 'Regla del 70 y regla del 72 contra el tiempo exacto de duplicación, por tasa de crecimiento (años y %; calculado con t = ln 2 / ln(1 + r))',
    columns: ['Tasa (% anual)', 'Tiempo exacto (años)', 'Regla del 70 (años)', 'Regla del 72 (años)', 'Error regla del 70 (años)', 'Error regla del 72 (años)', 'Error regla del 70 (%)', 'Error regla del 72 (%)'],
    rows: ERROR_RATES.map((r) => {
      const t = ruleTable(r);
      const r70 = t.rows.find((x) => x.rule === 70)!;
      const r72 = t.rows.find((x) => x.rule === 72)!;
      return [r, round2(t.exact), round2(r70.years), round2(r72.years), round2(r70.errorYears), round2(r72.errorYears), round2(r70.errorPct), round2(r72.errorPct)];
    })
  };
}

/** The table of the Data page behind the Argentina box: when the real GDP of 2026 doubles at each rate. */
export function argentinaTable(): DataTable {
  return {
    id: 'rule70-argentina',
    title: `Cuándo se duplica el PBI real de Argentina desde 2026, por tasa de crecimiento anual constante (${GDP_UNIT}; el año es el primero cuyo nivel llega al doble)`,
    columns: ['Tasa (% anual)', 'Años para duplicarse', 'Año en que se duplica', 'PBI real de 2026', 'PBI real de ese año'],
    rows: ARGENTINA_RATES.map((r) => {
      const d = argentinaDoubling(r);
      return [r, round1(d.years), d.year, round1(d.startValue), d.valueAtYear === null ? null : round1(d.valueAtYear)];
    })
  };
}
