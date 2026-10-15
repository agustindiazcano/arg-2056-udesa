import { ARG_POPULATION_LAST } from './gdpFacts.js';
import { AI_SCENARIOS } from './aiScenarios.js';
import type { AiScenario } from './aiScenarios.js';
import { aiImpactData } from './tourData.js';
import un_ from './unPopulation.json';

/** Population of Argentina 2025 to 2035: the INDEC figure of 2025 (the official one) grown by the yearly change of the UN medium variant. */
export function populationPath(): { years: number[]; values: number[] } {
  const un = un_.population as Record<string, number>;
  const years: number[] = [];
  for (let y = 2025; y <= 2035; y += 1) years.push(y);
  return { years, values: years.map((y) => ARG_POPULATION_LAST * (un[String(y)]! / un['2025']!)) };
}

export interface ScenarioSummary {
  id: AiScenario['id'];
  name: string;
  /** real GDP of 2026 and 2035, billion 2015 USD */
  gdp2026: number;
  gdp2035: number;
  /** change of the GDP between 2026 and 2035, % */
  gdpChange: number;
  /** average yearly growth 2026-2035, % */
  averageGrowth: number;
  /** GDP per person of 2026 and 2035, thousand 2015 USD */
  perCapita2026: number;
  perCapita2035: number;
  perCapitaChange: number;
  /** years to double the GDP at the average growth (rule of 70 exact: ln 2 / ln(1 + r)) */
  doublingYears: number;
}

/** GDP per person by scenario, 2026 to 2035, thousand 2015 USD: the GDP of the scenario over the population path. */
export function perCapitaSeries(): { years: number[]; unit: string; series: Array<{ name: string; color: string; values: number[] }> } {
  const data = aiImpactData();
  const pop = populationPath();
  const idx = (y: number) => pop.years.indexOf(y);
  return {
    years: data.years,
    unit: 'miles de USD de 2015 por habitante',
    series: data.series.map((s) => ({ name: s.name, color: s.color!, values: s.values.map((v, i) => Math.round(((v as number) / pop.values[idx(data.years[i]!)]!) * 100) / 100) }))
  };
}

export function summaries(): ScenarioSummary[] {
  const data = aiImpactData();
  const pc = perCapitaSeries();
  return AI_SCENARIOS.map((s, k) => {
    const g = data.series[k]!.values as number[];
    const p = pc.series[k]!.values;
    const n = g.length - 1;
    const avg = (Math.pow(g[n]! / g[0]!, 1 / n) - 1) * 100;
    return {
      id: s.id,
      name: s.name,
      gdp2026: g[0]!,
      gdp2035: g[n]!,
      gdpChange: (g[n]! / g[0]! - 1) * 100,
      averageGrowth: avg,
      perCapita2026: p[0]!,
      perCapita2035: p[n]!,
      perCapitaChange: (p[n]! / p[0]! - 1) * 100,
      doublingYears: Math.log(2) / Math.log(1 + avg / 100)
    };
  });
}
