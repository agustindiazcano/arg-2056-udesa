import { describe, it, expect } from 'vitest';
import { REGISTERED_COMPONENTS, REGISTERED_SERIES } from '../../src/charts/echarts.js';
import { buildDoublingCurve } from '../../src/charts/builders/doublingCurve.js';
import { buildFan } from '../../src/charts/builders/fan.js';
import { buildLongRun } from '../../src/charts/builders/longRun.js';
import { buildProvinceBars } from '../../src/charts/builders/provinceBars.js';
import { buildProvinceMap } from '../../src/charts/builders/provinceMap.js';
import { buildRankBars } from '../../src/charts/builders/rankBars.js';
import { buildRankHistory } from '../../src/charts/builders/rankHistory.js';
import { buildRanking } from '../../src/charts/builders/ranking.js';
import { buildSandboxPath } from '../../src/charts/builders/sandboxPath.js';
import { buildTreemap } from '../../src/charts/builders/treemap.js';
import { buildTrend } from '../../src/charts/builders/trend.js';
import type { Era } from '../../src/content/eras.js';
import type { Position, ProvincesGeo } from '../../src/geo/provinces.js';
import type { LongRunView } from '../../src/scenes/economy/selectors.js';
import { forecastView } from '../../src/scenes/forecast/selectors.js';
import type { RankRow } from '../../src/scenes/forecast/selectors.js';
import type { MapValues } from '../../src/scenes/forecast/mapSelectors.js';
import type { PathView } from '../../src/scenes/sandbox/selectors.js';
import type {
  CompositionRecord,
  ForecastOutput,
  ForecastSeries,
  ResourceProductionRecord,
  Scenario
} from '../../src/types/index.js';

/** Top-level option keys that are settings, not components: they need nothing registered. */
const NON_COMPONENT_KEYS = new Set(['series', 'animation', 'animationDuration', 'animationDurationUpdate', 'backgroundColor', 'color', 'textStyle']);
/** Series-level keys that ECharts serves with a component of their own. */
const SERIES_COMPONENT_KEYS = ['markLine', 'markArea', 'markPoint'];

interface Collected {
  types: Set<string>;
  components: Set<string>;
}

function collect(options: unknown[], into: Collected): void {
  for (const raw of options) {
    const option = raw as Record<string, unknown>;
    for (const key of Object.keys(option)) {
      if (!NON_COMPONENT_KEYS.has(key)) into.components.add(key);
    }
    for (const s of (option.series ?? []) as Array<Record<string, unknown>>) {
      into.types.add(String(s.type));
      for (const key of SERIES_COMPONENT_KEYS) if (s[key] !== undefined) into.components.add(key);
    }
  }
}

// ---- fixtures: every builder, with the variants that switch features on -------------------------------------------

const src = { source: 'S', retrieved_at: '2026' };

const composition: CompositionRecord[] = [
  { kind: 'exports_by_product', year: 2020, group: 'A', category: 'a1', label: 'a1', value_usd: 100, ...src },
  { kind: 'exports_by_product', year: 2020, group: 'B', category: 'b1', label: 'b1', value_usd: 200, ...src }
];

const production: ResourceProductionRecord[] = [
  { resource: 'lithium', geo: 'AR', year: 2020, value: 600, unit: 't', ...src },
  { resource: 'lithium', geo: 'AR-A', year: 2020, value: 500, unit: 't', ...src },
  { resource: 'lithium', geo: 'AR-B', year: 2020, value: 100, unit: 't', ...src },
  { resource: 'lithium', geo: 'AR', year: 2021, value: 650, unit: 't', ...src }
];

const START: Record<Scenario, number> = { pessimistic: 100, expected: 200, optimistic: 300 };
const YEARS = [2026, 2027, 2028];
function forecastSeries(scenario: Scenario, overlay: 'on' | 'off'): ForecastSeries {
  return {
    indicator: 'gdp_constant_usd',
    geo: 'AR',
    scenario,
    ai_overlay: overlay,
    unit: 'bn USD',
    points: YEARS.map((year, i) => {
      const p50 = START[scenario] + i * 10;
      return { year, p10: p50 - 5, p50, p90: p50 + 5 };
    })
  };
}
const forecast = (overlay: boolean): ForecastOutput => ({
  model_version: 't',
  generated_at: '2026-01-01',
  source: 'MOCK',
  horizon: { start_year: 2026, end_year: 2028 },
  series: (['pessimistic', 'expected', 'optimistic'] as Scenario[]).flatMap((s) => [
    forecastSeries(s, 'off'),
    forecastSeries(s, 'on')
  ]).filter((s) => overlay || s.ai_overlay === 'off')
});

const point = (year: number, value: number | null) => ({ year, value });
const longRunView: LongRunView = {
  years: [1900, 1901, 1902],
  unit: 'USD',
  mode: 'level',
  baseYear: null,
  indexUnavailable: false,
  series: [
    { country: 'ARG', points: [point(1900, 100), point(1901, null), point(1902, 150)] },
    { country: 'BRA', points: [point(1900, 50), point(1901, 60), point(1902, 70)] }
  ]
};
const eras: Era[] = [{ id: 'e0', startYear: 1900, endYear: 1901, label: 'Era 0', source_id: null, placeholder: true }];

const rankRows: RankRow[] = [
  { geo: 'AR-B', name: 'Buenos Aires', p10: 27, p50: 30, p90: 33, rank: 1, baseRank: 4, rankChange: 3 },
  { geo: 'AR-A', name: 'Salta', p10: 9, p50: 10, p90: 11, rank: 2, baseRank: 2, rankChange: 0 }
];

const pathView: PathView = {
  years: [2026, 2027, 2028],
  visitor: [100, 105, 110],
  lower: [80, 85, 70],
  upper: [120, 140, 135],
  expected: [100, 110, 121],
  unit: 'USD'
};

const ring: Position[] = [[-70, -40], [-60, -40], [-60, -30], [-70, -40]];
const features = ['AR-A', 'AR-B', 'AR-C'].map((id, i) => ({
  type: 'Feature' as const,
  properties: {
    id: id as 'AR-A',
    name: id,
    area_km2: 100 * (i + 1),
    centroid: [-65 + i, -35] as [number, number],
    centroid_inside: true,
    bbox: [-70, -40, -60, -30] as [number, number, number, number]
  },
  geometry: { type: 'Polygon' as const, coordinates: [ring] }
}));
const geo: ProvincesGeo = { type: 'FeatureCollection', features };
const mapValues: MapValues = {
  values: {
    'AR-A': { plotted: 20, p10: 19, p50: 20, p90: 21, rank: 2 },
    'AR-B': { plotted: 25, p10: 24, p50: 25, p90: 26, rank: 1 }
  },
  missing: ['AR-C'],
  domain: [5, 30],
  excluded: 1
};
const centroids = Object.fromEntries(features.map((f) => [f.properties.id, f.properties.centroid]));

function everyBuilderOption(): unknown[] {
  const mapInput = { geo, values: mapValues, centroids, smallIds: ['AR-A', 'AR-C'], unit: 't', indicatorLabel: 'Gold' };
  return [
    buildTreemap(composition).option,
    buildTreemap(composition, { highlightGroup: 'A' }).option,
    buildProvinceBars(production, { resource: 'lithium', year: 2020, topN: 1 }).option,
    buildTrend(production, { resource: 'lithium', geo: 'AR' }).option,
    buildFan(forecastView(forecast(false), { indicator: 'gdp_constant_usd', aiOverlay: false }), { scenario: 'expected', year: 2027 }).option,
    buildFan(forecastView(forecast(true), { indicator: 'gdp_constant_usd', aiOverlay: true }), { scenario: 'expected', year: 2027 }).option,
    buildRanking(rankRows, { unit: 't', scenario: 'expected' }).option,
    buildLongRun(longRunView, { highlight: 'ARG', year: 1901, eras: [], hovered: null, indicatorLabel: 'GDP per capita' }).option,
    buildLongRun(longRunView, { highlight: 'ARG', year: 1901, eras, hovered: 'BRA', indicatorLabel: 'GDP per capita' }).option,
    buildRankBars([{ geo: 'ARG', value: 150, rank: 1, of: 1 }], { highlight: 'ARG', missing: [], unit: 'USD', year: 1902, indicatorLabel: 'GDP per capita' }).option,
    buildRankHistory([{ year: 1900, rank: 3, of: 10 }, { year: 1901, rank: null, of: null }], { year: 1900, highlight: 'ARG', indicatorLabel: 'GDP per capita' }).option,
    buildSandboxPath(pathView, { year: 2027, effectivePct: 2.5 }).option,
    buildDoublingCurve({ ratePct: 2 }).option,
    buildProvinceMap(mapInput, { metric: 'level', selectedId: null, scenario: 'expected', year: 2027 }).option,
    buildProvinceMap(mapInput, { metric: 'change', selectedId: 'AR-A', scenario: 'expected', year: 2027 }).option
  ];
}

describe('ECharts registry coverage', () => {
  const used: Collected = { types: new Set(), components: new Set() };
  collect(everyBuilderOption(), used);

  it('the builders use at least the chart types and components this test knows about (the collector is not empty)', () => {
    expect([...used.types].sort()).toEqual(['bar', 'custom', 'line', 'map', 'scatter', 'treemap']);
    for (const key of ['tooltip', 'grid', 'xAxis', 'yAxis', 'visualMap', 'geo', 'graphic', 'markLine', 'markArea']) {
      expect([...used.components], `component key ${key} is produced by some builder`).toContain(key);
    }
  });

  it('every series type the builders produce is registered in charts/echarts.ts', () => {
    const missing = [...used.types].filter((type) => !REGISTERED_SERIES.has(type));
    expect(missing, `series types used by a builder but not registered: ${missing.join(', ')}`).toEqual([]);
  });

  it('every component key the builders produce is registered in charts/echarts.ts', () => {
    const missing = [...used.components].filter((key) => !REGISTERED_COMPONENTS.has(key));
    expect(missing, `components used by a builder but not registered: ${missing.join(', ')}`).toEqual([]);
  });

  it('registers nothing the builders do not use, so the vendor chunk stays small', () => {
    expect([...REGISTERED_SERIES].filter((type) => !used.types.has(type))).toEqual([]);
    expect([...REGISTERED_COMPONENTS].filter((key) => !used.components.has(key))).toEqual([]);
  });
});
