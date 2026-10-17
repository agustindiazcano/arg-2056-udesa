import { ARG_GDP_2026, ARG_POPULATION_LAST } from './gdpFacts.js';
import { cagr } from '../core/doubling.js';
import type { DataTable } from '../datasets/types.js';
import world from './worldGdp.json';
import un_ from './unPopulation.json';

export interface DevelopedBenchmark {
  code: string;
  name: string;
  label: string;
  description: string;
  /** Real GDP per capita in constant 2015 USD (World Bank, latest year 2024) */
  gdpPerCapita2024: number;
  /** Ratio of benchmark GDP per capita over Argentina's estimated 2026 level */
  ratioOverArg: number;
  /** Annual growth rate needed to reach this benchmark in 20 years (2046) */
  requiredRate20Years: number;
  /** Annual growth rate needed to reach this benchmark in 30 years (2056) */
  requiredRate30Years: number;
  /** Implied total real GDP needed in 2056 given UN projected population (billions 2015 USD) */
  impliedTotalGdp2056: number;
  /** Required total GDP growth rate 2026-2056 */
  requiredTotalGdpGrowth2056: number;
}

export const CONVERGENCE_START_YEAR = 2026;
export const CONVERGENCE_TARGET_YEAR = 2056;

const un = un_.population as Record<string, number>;
/** Projected UN population in 2026 and 2056 (scaled to INDEC 2025 base) */
export const ARG_POP_2026: number = ARG_POPULATION_LAST * (un['2026']! / un['2025']!);
export const ARG_POP_2056: number = ARG_POPULATION_LAST * (un['2056']! / un['2025']!);

/** Argentina 2026 real GDP per capita in constant 2015 USD */
export const ARG_PER_CAPITA_2026: number = (ARG_GDP_2026 * 1000) / ARG_POP_2026;

const BENCHMARK_CODES = [
  { code: 'PRT', label: 'Portugal', description: 'Umbral de altos ingresos europeo' },
  { code: 'ESP', label: 'España', description: 'Economía desarrollada del sur europeo' },
  { code: 'ITA', label: 'Italia', description: 'Miembro del G7 e industrialización avanzada' },
  { code: 'KOR', label: 'Corea del Sur', description: 'Referencia global de convergencia acelerada' },
  { code: 'DEU', label: 'Alemania', description: 'Frontera industrial y tecnológica europea' },
  { code: 'AUS', label: 'Australia', description: 'Altos ingresos basada en recursos naturales y capital' },
  { code: 'USA', label: 'Estados Unidos', description: 'Frontera de productividad e innovación global' }
] as const;

export function developedBenchmarks(): DevelopedBenchmark[] {
  const countries = world.countries as Array<{ code: string; name: string; gdp: Array<number | null>; pop: Array<number | null> }>;
  const idx2024 = world.years.indexOf(2024);

  return BENCHMARK_CODES.map((item) => {
    const c = countries.find((x) => x.code === item.code);
    if (!c) throw new Error(`Benchmark country not found: ${item.code}`);
    const gdp = c.gdp[idx2024];
    const pop = c.pop[idx2024];
    if (gdp === null || gdp === undefined || pop === null || pop === undefined || pop <= 0) {
      throw new Error(`Missing 2024 data for benchmark country: ${item.code}`);
    }
    const gdpPerCapita2024 = Math.round((gdp * 1000) / pop);
    const ratioOverArg = gdpPerCapita2024 / ARG_PER_CAPITA_2026;
    const requiredRate20Years = cagr(ARG_PER_CAPITA_2026, gdpPerCapita2024, 20);
    const requiredRate30Years = cagr(ARG_PER_CAPITA_2026, gdpPerCapita2024, 30);
    
    // Total GDP needed in 2056 with UN 2056 population
    const impliedTotalGdp2056 = (gdpPerCapita2024 * ARG_POP_2056) / 1000;
    const requiredTotalGdpGrowth2056 = cagr(ARG_GDP_2026, impliedTotalGdp2056, 30);

    return {
      code: item.code,
      name: c.name,
      label: item.label,
      description: item.description,
      gdpPerCapita2024,
      ratioOverArg,
      requiredRate20Years,
      requiredRate30Years,
      impliedTotalGdp2056,
      requiredTotalGdpGrowth2056
    };
  });
}

/** Formatted table for the Data section */
export function convergenceTable(): DataTable {
  const benchmarks = developedBenchmarks();
  const round1 = (v: number) => Math.round(v * 10) / 10;
  const round2 = (v: number) => Math.round(v * 100) / 100;

  return {
    id: 'rule70-convergence',
    title: 'Planificación de convergencia a 2056: tasas anuales de crecimiento necesarias para alcanzar a economías desarrolladas (Banco Mundial, precios constantes de 2015)',
    columns: [
      'País de referencia',
      'PBI per cápita 2024 (USD 2015)',
      'Cociente sobre Argentina (2026)',
      'Tasa per cápita necesaria a 20 años (% anual)',
      'Tasa per cápita necesaria a 30 años (2056) (% anual)',
      'PBI total necesario en 2056 (miles de millones USD)',
      'Tasa de PBI total necesaria a 2056 (% anual)'
    ],
    rows: benchmarks.map((b) => [
      `${b.name} (${b.description})`,
      b.gdpPerCapita2024,
      round2(b.ratioOverArg),
      round2(b.requiredRate20Years),
      round2(b.requiredRate30Years),
      round1(b.impliedTotalGdp2056),
      round2(b.requiredTotalGdpGrowth2056)
    ])
  };
}
