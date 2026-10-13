import { ARG_GDP_2026 } from './gdpFacts';

/**
 * The GDP simulator of the Simulador section: plain arithmetic, not the forecast model. The yearly growth is the base rate plus the
 * effect of each factor around its default (population, investment, productivity) and the AI, which comes in over 15 years. Every
 * coefficient is a first value to be replaced by the model's elasticities (PENDING.md).
 */
export interface SimParams {
  /** growth of the GDP per year, % */
  baseGrowth: number;
  /** extra growth per year at full adoption of the AI, percentage points */
  ai: number;
  /** growth of the population, % per year */
  population: number;
  /** extra growth per year from productivity reforms, percentage points */
  productivity: number;
  /** investment, % of the GDP */
  investment: number;
}

export type SimKey = keyof SimParams;

export const SIM_START = 2026;
export const SIM_END = 2056;
/** Nominal GDP of 2026, billion current USD: the estimate of the IMF, the same figure as in the GDP chart (the made-up part starts after it). */
export const SIM_START_GDP = Math.round(ARG_GDP_2026 * 10) / 10;
/** years for the AI to reach its full effect */
export const AI_RAMP_YEARS = 15;
/** percentage points of growth for each point of investment over the default */
export const INVESTMENT_PP_PER_POINT = 0.1;

export const DEFAULT_SIM: SimParams = { baseGrowth: 2.5, ai: 0.6, population: 0.5, productivity: 0, investment: 17.5 };

export interface SimField {
  key: SimKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  help: string;
}

export const SIM_FIELDS: readonly SimField[] = [
  { key: 'baseGrowth', label: 'Crecimiento anual base', unit: '% anual', min: 0, max: 6, step: 0.1, help: 'La tasa a la que crece el PBI antes de los demás factores.' },
  { key: 'ai', label: 'Impacto de la IA', unit: 'pp por año', min: 0, max: 3, step: 0.1, help: 'Crecimiento extra con la IA plenamente adoptada; llega en 15 años.' },
  { key: 'population', label: 'Crecimiento de la población', unit: '% anual', min: -0.5, max: 2, step: 0.1, help: 'Más gente suma al PBI un punto por punto, medido contra el 0,5 % base.' },
  { key: 'productivity', label: 'Mejora de productividad', unit: 'pp por año', min: -1, max: 2, step: 0.1, help: 'Reformas que suben (o bajan) lo que produce cada trabajador.' },
  { key: 'investment', label: 'Inversión', unit: '% del PBI', min: 10, max: 30, step: 0.5, help: 'Cada punto sobre el 17,5 % suma una décima al crecimiento anual.' }
];

/** Growth of the year, in %. */
export function growthAt(p: SimParams, year: number): number {
  const ramp = Math.min(1, Math.max(0, (year - SIM_START) / AI_RAMP_YEARS));
  return p.baseGrowth + p.ai * ramp + (p.population - DEFAULT_SIM.population) + p.productivity + (p.investment - DEFAULT_SIM.investment) * INVESTMENT_PP_PER_POINT;
}

export function simulate(p: SimParams): { years: number[]; gdp: number[] } {
  const years: number[] = [];
  const gdp: number[] = [];
  let value = SIM_START_GDP;
  for (let year = SIM_START; year <= SIM_END; year += 1) {
    years.push(year);
    gdp.push(Math.round(value * 10) / 10);
    value *= 1 + growthAt(p, year) / 100;
  }
  return { years, gdp };
}

/** Rule of 70: years to double at a yearly growth in %, or null when it does not grow. */
export function doublingYears(growthPct: number): number | null {
  return growthPct > 0 ? 70 / growthPct : null;
}

/** The average yearly growth between the first and the last year, in %. */
export function averageGrowth(gdp: number[]): number {
  const n = gdp.length - 1;
  return n > 0 && gdp[0]! > 0 && gdp[n]! > 0 ? (Math.pow(gdp[n]! / gdp[0]!, 1 / n) - 1) * 100 : 0;
}
