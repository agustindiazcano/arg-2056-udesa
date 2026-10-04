import { formatNumber, formatPercent } from '../../charts/format.js';
import { positionPhrase, scenarioLabel } from '../../content/labels.js';
import { selectSeries } from '../../types/index.js';
import type { ForecastOutput, ForecastSeries, Scenario } from '../../types/index.js';
import { cagr } from '../forecast/selectors.js';
import { compound, effectiveGpcPct } from './arithmetic.js';
import type { SandboxState } from './state.js';

const SCENARIOS: readonly Scenario[] = ['pessimistic', 'expected', 'optimistic'];

function arSeries(
  output: ForecastOutput,
  indicator: 'gdp_per_capita_usd' | 'population',
  scenario: Scenario,
  overlay: 'on' | 'off'
): ForecastSeries | undefined {
  return selectSeries(output, { indicator, geo: 'AR', scenario, aiOverlay: overlay });
}

const firstYearOf = (s: ForecastSeries) => Math.min(...s.points.map((p) => p.year));
const lastYearOf = (s: ForecastSeries) => Math.max(...s.points.map((p) => p.year));

export interface BasePoint {
  year: number;
  gpc: number;
  pop: number;
}

/** First forecast year and the p50 of GDP per capita and population for AR (without the AI overlay). */
export function basePoint(
  output: ForecastOutput,
  q: { scenario: Scenario }
): { base: BasePoint | null; reason: string | null } {
  const gpc = arSeries(output, 'gdp_per_capita_usd', q.scenario, 'off');
  if (!gpc || gpc.points.length === 0) {
    return { base: null, reason: `No hay serie de PIB per cápita para AR en el escenario ${scenarioLabel(q.scenario).toLowerCase()}` };
  }
  const pop = arSeries(output, 'population', q.scenario, 'off');
  if (!pop || pop.points.length === 0) {
    return { base: null, reason: `No hay serie de población para AR en el escenario ${scenarioLabel(q.scenario).toLowerCase()}` };
  }
  const year = firstYearOf(gpc);
  const gpcPoint = gpc.points.find((p) => p.year === year);
  const popPoint = pop.points.find((p) => p.year === year);
  if (!gpcPoint || !popPoint) {
    return { base: null, reason: `No hay valor de población para AR en ${year} en el escenario ${scenarioLabel(q.scenario).toLowerCase()}` };
  }
  return { base: { year, gpc: gpcPoint.p50, pop: popPoint.p50 }, reason: null };
}

export interface UserPath {
  years: number[];
  gpc: number[];
  pop: number[];
  gdp: number[];
}

/** The visitor's own compounded path: nothing here comes from the forecasting model. */
export function userPath(q: {
  base: BasePoint;
  years: number;
  gpcPct: number;
  popPct: number;
  aiPp: number;
}): UserPath {
  const rate = effectiveGpcPct(q.gpcPct, q.aiPp);
  const years: number[] = [];
  const gpc: number[] = [];
  const pop: number[] = [];
  const gdp: number[] = [];
  for (let k = 0; k <= q.years; k++) {
    years.push(q.base.year + k);
    gpc.push(compound(q.base.gpc, rate, k));
    pop.push(compound(q.base.pop, q.popPct, k));
    gdp.push(gpc[k]! * pop[k]!);
  }
  return { years, gpc, pop, gdp };
}

export interface Envelope {
  years: number[];
  lower: Array<number | null>;
  upper: Array<number | null>;
  expected: Array<number | null>;
  /** Years where a point needed for the bounds is missing (the bounds are null there). */
  missing: number[];
  unit: string;
}

/** For each year: min of the three scenarios' p10, max of their p90, and the expected p50. Arithmetic only. */
export function modelEnvelope(output: ForecastOutput, q: { aiOverlay: boolean }): Envelope {
  const overlay = q.aiOverlay ? 'on' : 'off';
  const byScenario = SCENARIOS.map((s) => arSeries(output, 'gdp_per_capita_usd', s, overlay));
  const years = [
    ...new Set(byScenario.flatMap((s) => (s ? s.points.map((p) => p.year) : [])))
  ].sort((a, b) => a - b);
  const unit = byScenario.find((s) => s !== undefined)?.unit ?? '';

  const lower: Array<number | null> = [];
  const upper: Array<number | null> = [];
  const expected: Array<number | null> = [];
  const missing: number[] = [];
  for (const year of years) {
    const points = byScenario.map((s) => s?.points.find((p) => p.year === year));
    if (points.some((p) => p === undefined)) {
      lower.push(null);
      upper.push(null);
      missing.push(year);
    } else {
      lower.push(Math.min(...points.map((p) => p!.p10)));
      upper.push(Math.max(...points.map((p) => p!.p90)));
    }
    expected.push(points[1]?.p50 ?? null);
  }
  return { years, lower, upper, expected, missing, unit };
}

export type Position = 'below' | 'inside' | 'above';

export function positionVsRange(value: number | null, lower: number | null, upper: number | null): Position | null {
  if (value === null || lower === null || upper === null) return null;
  if (value < lower) return 'below';
  if (value > upper) return 'above';
  return 'inside';
}

/** Slider values that reproduce the model's central path for a scenario (the AI uplift stays 0). */
export function scenarioPreset(
  output: ForecastOutput,
  q: { scenario: Scenario; aiOverlay: boolean }
): SandboxState | null {
  const overlay = q.aiOverlay ? 'on' : 'off';
  const gpc = arSeries(output, 'gdp_per_capita_usd', q.scenario, overlay);
  const pop = arSeries(output, 'population', q.scenario, overlay);
  if (!gpc || !pop || gpc.points.length === 0) return null;
  const first = firstYearOf(gpc);
  const last = lastYearOf(gpc);
  const gpcPct = cagr(gpc, first, last);
  const popPct = cagr(pop, first, last);
  if (gpcPct === null || popPct === null) return null;
  return { gpcPct, popPct, aiPp: 0 };
}

export interface PathView {
  years: number[];
  visitor: number[];
  lower: Array<number | null>;
  upper: Array<number | null>;
  expected: Array<number | null>;
  unit: string;
}

/** The visitor's GDP per capita aligned by year with the model envelope (null where the model has no year). */
export function pathView(path: UserPath, envelope: Envelope): PathView {
  const at = (values: Array<number | null>, year: number) => {
    const i = envelope.years.indexOf(year);
    return i === -1 ? null : (values[i] ?? null);
  };
  return {
    years: path.years,
    visitor: path.gpc,
    lower: path.years.map((y) => at(envelope.lower, y)),
    upper: path.years.map((y) => at(envelope.upper, y)),
    expected: path.years.map((y) => at(envelope.expected, y)),
    unit: envelope.unit
  };
}

/** The takeaway of the sandbox, built only from the numbers in the view. */
export function summaryText(q: {
  effectivePct: number;
  firstYear: number;
  lastYear: number;
  multiple: number;
  position: Position | null;
}): string {
  const head =
    `Con un crecimiento per cápita de ${formatPercent(q.effectivePct)}, el PIB per cápita en ${q.lastYear} es ` +
    `${formatNumber(q.multiple, 1)} veces su nivel de ${q.firstYear}`;
  return q.position === null
    ? `${head}; el rango del modelo no está disponible para ese año`
    : `${head} y se ubica ${positionPhrase(q.position)}`;
}
