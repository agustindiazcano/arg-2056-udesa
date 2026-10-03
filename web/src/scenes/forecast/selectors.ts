import { PROVINCES, SCENARIOS, selectSeries } from '../../types/index.js';
import type {
  ForecastOutput,
  ForecastSeries,
  Indicator,
  ProvinceId,
  ResourceId,
  Scenario
} from '../../types/index.js';

export type ScenarioSeries = Record<Scenario, ForecastSeries | undefined>;

export interface ForecastView {
  series: ScenarioSeries;
  reference: ScenarioSeries | null;
  missing: Scenario[];
}

interface ViewQuery {
  indicator: Indicator;
  resource?: ResourceId;
  geo?: 'AR' | ProvinceId;
  aiOverlay: boolean;
}

export function forecastView(output: ForecastOutput, q: ViewQuery): ForecastView {
  const geo = q.geo ?? 'AR';
  const pick = (aiOverlay: 'on' | 'off'): ScenarioSeries => {
    const result = {} as ScenarioSeries;
    for (const scenario of SCENARIOS) {
      result[scenario] = selectSeries(output, {
        indicator: q.indicator,
        resource: q.resource,
        geo,
        scenario,
        aiOverlay
      });
    }
    return result;
  };

  const series = pick(q.aiOverlay ? 'on' : 'off');
  const reference = q.aiOverlay ? pick('off') : null;
  const missing = SCENARIOS.filter((s) => series[s] === undefined);
  return { series, reference, missing };
}

export function clampYear(yearFloat: number, points: { year: number }[]): number {
  const year = Math.floor(yearFloat);
  if (points.length === 0) return year;
  let first = points[0]!.year;
  let last = points[0]!.year;
  for (const p of points) {
    if (p.year < first) first = p.year;
    if (p.year > last) last = p.year;
  }
  return Math.min(Math.max(year, first), last);
}

export function endpoint(
  series: ForecastSeries | undefined,
  year: number
): { p10: number; p50: number; p90: number } | null {
  const point = series?.points.find((p) => p.year === year);
  if (!point) return null;
  return { p10: point.p10, p50: point.p50, p90: point.p90 };
}

export function cagr(series: ForecastSeries | undefined, fromYear: number, toYear: number): number | null {
  const from = endpoint(series, fromYear);
  const to = endpoint(series, toYear);
  const n = toYear - fromYear;
  if (!from || !to || n <= 0) return null;
  if (!(from.p50 > 0) || !(to.p50 > 0)) return null;
  return ((to.p50 / from.p50) ** (1 / n) - 1) * 100;
}

export function aiDelta(
  onSeries: ForecastSeries | undefined,
  offSeries: ForecastSeries | undefined,
  year: number
): number | null {
  const on = endpoint(onSeries, year);
  const off = endpoint(offSeries, year);
  if (!on || !off || off.p50 === 0) return null;
  return ((on.p50 - off.p50) / off.p50) * 100;
}

export interface RankRow {
  geo: ProvinceId;
  name: string;
  p10: number;
  p50: number;
  p90: number;
  rank: number;
  baseRank: number | null;
  rankChange: number | null;
}

interface RankQuery {
  indicator: Indicator;
  resource?: ResourceId;
  year: number;
  scenario: Scenario;
  aiOverlay: boolean;
  topN?: number;
}

type Ranked = { geo: ProvinceId; p10: number; p50: number; p90: number };

function sortRanked(items: Ranked[]): Ranked[] {
  return [...items].sort((a, b) => b.p50 - a.p50 || (a.geo < b.geo ? -1 : a.geo > b.geo ? 1 : 0));
}

export function rankProvinces(output: ForecastOutput, q: RankQuery): { rows: RankRow[]; excluded: number } {
  const overlay = q.aiOverlay ? 'on' : 'off';
  const candidates = output.series.filter(
    (s) =>
      s.indicator === q.indicator &&
      s.resource === q.resource &&
      s.scenario === q.scenario &&
      s.ai_overlay === overlay &&
      s.geo !== 'AR'
  );

  let firstYear: number | null = null;
  for (const s of candidates) {
    for (const p of s.points) {
      if (firstYear === null || p.year < firstYear) firstYear = p.year;
    }
  }

  const at = (year: number): Ranked[] => {
    const items: Ranked[] = [];
    for (const s of candidates) {
      const e = endpoint(s, year);
      if (e) items.push({ geo: s.geo as ProvinceId, ...e });
    }
    return items;
  };

  const current = sortRanked(at(q.year));
  const excluded = candidates.length - current.length;
  const baseRanks = new Map<string, number>();
  if (firstYear !== null) {
    sortRanked(at(firstYear)).forEach((item, i) => baseRanks.set(item.geo, i + 1));
  }

  const rows = current.slice(0, q.topN ?? 10).map((item): RankRow => {
    const rank = current.indexOf(item) + 1;
    const baseRank = baseRanks.get(item.geo) ?? null;
    const province = PROVINCES.find((p) => p.id === item.geo);
    return {
      geo: item.geo,
      name: province ? province.name : item.geo,
      p10: item.p10,
      p50: item.p50,
      p90: item.p90,
      rank,
      baseRank,
      rankChange: baseRank === null ? null : baseRank - rank
    };
  });

  return { rows, excluded };
}
