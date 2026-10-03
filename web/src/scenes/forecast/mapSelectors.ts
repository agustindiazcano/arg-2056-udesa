import { formatValue } from '../../charts/format.js';
import type { ProvincesGeo } from '../../geo/provinces.js';
import { PROVINCES, selectSeries } from '../../types/index.js';
import type { ForecastOutput, ForecastSeries, Indicator, ResourceId, Scenario } from '../../types/index.js';
import { cagr, endpoint } from './selectors.js';

export type MapMetric = 'level' | 'change';

export interface MapValue {
  plotted: number;
  p10: number;
  p50: number;
  p90: number;
  rank: number;
}

export interface MapValues {
  values: Record<string, MapValue>;
  missing: string[];
  /** Color domain over all years of the selected scenario; symmetric around 0 for `change`; null without data. */
  domain: [number, number] | null;
  excluded: number;
}

interface MapQuery {
  indicator: Indicator;
  resource?: ResourceId;
  year: number;
  scenario: Scenario;
  aiOverlay: boolean;
  metric: MapMetric;
}

function firstYearOf(series: ForecastSeries): number {
  return Math.min(...series.points.map((p) => p.year));
}

function computeDomain(seriesList: ForecastSeries[], metric: MapMetric): [number, number] | null {
  const plotted: number[] = [];
  for (const series of seriesList) {
    if (metric === 'level') {
      for (const p of series.points) plotted.push(p.p50);
    } else {
      const first = firstYearOf(series);
      for (const p of series.points) {
        const change = cagr(series, first, p.year);
        if (change !== null) plotted.push(change);
      }
    }
  }
  if (plotted.length === 0) return null;
  const min = Math.min(...plotted);
  const max = Math.max(...plotted);
  if (metric === 'level') return [min, max];
  const m = Math.max(Math.abs(min), Math.abs(max));
  return [-m, m];
}

export function provinceMapValues(output: ForecastOutput, geo: ProvincesGeo, q: MapQuery): MapValues {
  const overlay = q.aiOverlay ? 'on' : 'off';
  const ids = geo.features.map((f) => f.properties.id);
  const seriesById = new Map<string, ForecastSeries>();
  for (const id of ids) {
    const series = selectSeries(output, {
      indicator: q.indicator,
      resource: q.resource,
      geo: id,
      scenario: q.scenario,
      aiOverlay: overlay
    });
    if (series) seriesById.set(id, series);
  }

  const found: Array<{ id: string; plotted: number; p10: number; p50: number; p90: number }> = [];
  const missing: string[] = [];
  for (const id of ids) {
    const series = seriesById.get(id);
    const point = endpoint(series, q.year);
    const plotted =
      !series || !point ? null : q.metric === 'level' ? point.p50 : cagr(series, firstYearOf(series), q.year);
    if (!point || plotted === null) {
      missing.push(id);
    } else {
      found.push({ id, plotted, ...point });
    }
  }

  const ranked = [...found].sort((a, b) => b.p50 - a.p50 || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const values: Record<string, MapValue> = {};
  for (const item of found) {
    values[item.id] = {
      plotted: item.plotted,
      p10: item.p10,
      p50: item.p50,
      p90: item.p90,
      rank: ranked.findIndex((r) => r.id === item.id) + 1
    };
  }

  return {
    values,
    missing,
    domain: computeDomain([...seriesById.values()], q.metric),
    excluded: missing.length
  };
}

/** Ids of the n provinces with the smallest area, ascending (ties by id): they get a marker on the map. */
export function smallestProvinces(geo: ProvincesGeo, n = 3): string[] {
  return [...geo.features]
    .sort(
      (a, b) =>
        a.properties.area_km2 - b.properties.area_km2 ||
        (a.properties.id < b.properties.id ? -1 : a.properties.id > b.properties.id ? 1 : 0)
    )
    .slice(0, Math.max(n, 0))
    .map((f) => f.properties.id);
}

function nameOf(id: string): string {
  return PROVINCES.find((p) => p.id === id)?.name ?? id;
}

export function mapSummary(
  values: MapValues,
  metric: MapMetric,
  indicatorLabel: string,
  year: number,
  unit = ''
): string {
  const entries = Object.entries(values.values).map(([id, v]) => ({ id, plotted: v.plotted }));
  if (entries.length === 0) return `No province data for ${indicatorLabel} in ${year}.`;

  const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const highest = [...entries].sort((a, b) => b.plotted - a.plotted || byId(a, b))[0]!;
  const lowest = [...entries].sort((a, b) => a.plotted - b.plotted || byId(a, b))[0]!;
  const show = (x: number) => (metric === 'level' ? formatValue(x, unit) : `${x.toFixed(1)}% per year`);

  const head =
    metric === 'level'
      ? `Map of ${indicatorLabel} by province in ${year}`
      : `Map of the change in ${indicatorLabel} by province up to ${year}`;
  let text = `${head}: highest ${nameOf(highest.id)} at ${show(highest.plotted)}, lowest ${nameOf(lowest.id)} at ${show(lowest.plotted)}`;
  const n = values.missing.length;
  if (n > 0) text += `; ${n} ${n === 1 ? 'province' : 'provinces'} with no data`;
  return text;
}
