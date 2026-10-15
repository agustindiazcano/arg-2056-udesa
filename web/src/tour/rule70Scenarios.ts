import { multiplier } from '../core/doubling.js';
import type { DataTable } from '../datasets/types.js';

/**
 * Two levels growing at two constant rates over N years: where each one ends, how many times higher one ends than the other, and, when
 * they start at different levels, when the faster one overtakes the other. Pure arithmetic on what the visitor types.
 */
export interface ScenarioInput {
  rateA: number;
  rateB: number;
  years: number;
  startA: number;
  startB: number;
}

export interface ScenarioResult {
  years: number[];
  levelsA: number[];
  levelsB: number[];
  multiplierA: number;
  multiplierB: number;
  /** B over A at the end */
  ratioAtEnd: number;
  /** rate B minus rate A, in percentage points */
  gapPoints: number;
  /** years until the two levels are equal, or null if they start together, grow at the same rate or never meet */
  crossing: number | null;
  /** is that moment inside the horizon */
  crossingInside: boolean;
  aheadAtEnd: 'A' | 'B' | 'tie';
}

export function compareScenarios(i: ScenarioInput): ScenarioResult {
  const years = Array.from({ length: i.years + 1 }, (_, t) => t);
  const levelsA = years.map((t) => i.startA * multiplier(i.rateA, t));
  const levelsB = years.map((t) => i.startB * multiplier(i.rateB, t));
  const growthA = 1 + i.rateA / 100;
  const growthB = 1 + i.rateB / 100;
  // A0 (1 + a)^t = B0 (1 + b)^t  ->  t = ln(B0 / A0) / ln((1 + a) / (1 + b)); only a positive t is a moment in the future
  const t = growthA === growthB ? NaN : Math.log(i.startB / i.startA) / Math.log(growthA / growthB);
  const crossing = Number.isFinite(t) && t > 0 ? t : null;
  const endA = levelsA[levelsA.length - 1]!;
  const endB = levelsB[levelsB.length - 1]!;
  return {
    years,
    levelsA,
    levelsB,
    multiplierA: multiplier(i.rateA, i.years),
    multiplierB: multiplier(i.rateB, i.years),
    ratioAtEnd: endB / endA,
    gapPoints: i.rateB - i.rateA,
    crossing,
    crossingInside: crossing !== null && crossing <= i.years,
    aheadAtEnd: endA === endB ? 'tie' : endA > endB ? 'A' : 'B'
  };
}

const EXAMPLES: ReadonlyArray<readonly [number, number, number]> = [
  [3, 10, 28],
  [1, 2, 30],
  [2, 3, 30],
  [3, 4, 30],
  [2, 4, 30],
  [3, 5, 30]
];

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** The table of the Data page behind the comparison: examples of two rates over N years starting from the same level. */
export function scenariosTable(): DataTable {
  return {
    id: 'rule70-scenarios',
    title: 'Dos tasas de crecimiento anual constantes durante N años, desde el mismo nivel (multiplicadores y cociente entre los niveles finales; calculado con (1 + r)^N)',
    columns: ['Tasa A (% anual)', 'Tasa B (% anual)', 'Años', 'Multiplicador de A', 'Multiplicador de B', 'Nivel final de B sobre el de A'],
    rows: EXAMPLES.map(([a, b, n]) => {
      const c = compareScenarios({ rateA: a, rateB: b, years: n, startA: 1, startB: 1 });
      return [a, b, n, round2(c.multiplierA), round2(c.multiplierB), round2(c.ratioAtEnd)];
    })
  };
}
