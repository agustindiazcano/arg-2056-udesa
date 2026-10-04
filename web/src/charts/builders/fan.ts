import { tokens, BAND_ALPHA } from '../../styles/tokens.js';
import { indicatorSentence, scenarioLabel } from '../../content/labels.js';
import { formatPercent, formatValue } from '../format.js';
import { SCENARIOS } from '../../types/index.js';
import type { ForecastSeries, Scenario } from '../../types/index.js';
import { aiDelta, endpoint } from '../../scenes/forecast/selectors.js';
import type { ForecastView } from '../../scenes/forecast/selectors.js';

interface FanOpts {
  scenario: Scenario;
  year: number;
}

const SELECTED_WIDTH = 3;
const NORMAL_WIDTH = 2;

function valuesByYear(series: ForecastSeries, years: number[], pick: (p: ForecastSeries['points'][number]) => number) {
  const byYear = new Map(series.points.map((p) => [p.year, p]));
  return years.map((y) => {
    const p = byYear.get(y);
    return p ? pick(p) : null;
  });
}

export function buildFan(view: ForecastView, opts: FanOpts) {
  const drawn = SCENARIOS.filter((s) => view.series[s] !== undefined);
  const selected = view.series[opts.scenario];
  const reference = view.reference?.[opts.scenario];

  const yearSet = new Set<number>();
  for (const s of drawn) for (const p of view.series[s]!.points) yearSet.add(p.year);
  if (reference) for (const p of reference.points) yearSet.add(p.year);
  const years = [...yearSet].sort((a, b) => a - b);
  const categories = years.map(String);

  const unit = (selected ?? view.series[drawn[0] as Scenario])?.unit ?? '';

  let excluded = 0;
  const lines = drawn.map((s) => {
    const series = view.series[s]!;
    const data = valuesByYear(series, years, (p) => p.p50);
    excluded += data.filter((v) => v === null).length;
    const lastPoint = [...series.points].sort((a, b) => a.year - b.year).at(-1);
    const color = tokens.scenario[s];
    return {
      name: s,
      type: 'line',
      data,
      connectNulls: false,
      symbol: 'none',
      lineStyle: { color, width: s === opts.scenario ? SELECTED_WIDTH : NORMAL_WIDTH },
      itemStyle: { color },
      endLabel: {
        show: true,
        color,
        formatter: lastPoint
          ? `${scenarioLabel(s)} ${formatValue(lastPoint.p50, series.unit)}`
          : `${scenarioLabel(s)} sin datos`
      }
    };
  });

  const band = selected
    ? [
        {
          name: 'p10',
          type: 'line',
          stack: 'band',
          data: valuesByYear(selected, years, (p) => p.p10),
          symbol: 'none',
          connectNulls: false,
          lineStyle: { opacity: 0 },
          tooltip: { show: false }
        },
        {
          name: 'p10-p90',
          type: 'line',
          stack: 'band',
          data: valuesByYear(selected, years, (p) => p.p90 - p.p10),
          symbol: 'none',
          connectNulls: false,
          lineStyle: { opacity: 0 },
          areaStyle: { color: tokens.scenario[opts.scenario], opacity: BAND_ALPHA },
          tooltip: { show: false }
        }
      ]
    : [];

  const referenceLine = reference
    ? [
        {
          name: 'sin IA',
          type: 'line',
          data: valuesByYear(reference, years, (p) => p.p50),
          connectNulls: false,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: tokens.muted, width: 1 },
          itemStyle: { color: tokens.muted },
          endLabel: { show: true, color: tokens.muted, formatter: 'Sin IA' }
        }
      ]
    : [];

  const markerData: Array<Record<string, unknown>> = [];
  if (years.includes(opts.year)) {
    markerData.push({
      xAxis: String(opts.year),
      name: `Año ${opts.year}`,
      lineStyle: { color: tokens.ink, width: 1, type: 'solid' },
      label: { formatter: `Año ${opts.year}`, color: tokens.ink2 }
    });
  }
  if (years.length > 0) {
    markerData.push({
      xAxis: String(years[0]),
      name: 'inicio del pronóstico',
      lineStyle: { color: tokens.muted, width: 1, type: 'dashed' },
      label: { formatter: 'inicio del pronóstico', color: tokens.muted }
    });
  }

  const markers = {
    name: 'markers',
    type: 'line',
    data: [],
    symbol: 'none',
    silent: true,
    markLine: { symbol: 'none', animation: false, data: markerData }
  };

  const tooltipFormatter = (params: Array<{ dataIndex: number }>) => {
    const first = params[0];
    if (!first || !selected) return '';
    const year = years[first.dataIndex];
    const e = year === undefined ? null : endpoint(selected, year);
    if (!e) return `${year ?? ''}<br/>Sin datos`;
    return [
      String(year),
      'p10-p90: 80% de los resultados simulados',
      `p10 ${formatValue(e.p10, selected.unit)}`,
      `p50 ${formatValue(e.p50, selected.unit)}`,
      `p90 ${formatValue(e.p90, selected.unit)}`
    ].join('<br/>');
  };

  const option = {
    animation: false,
    tooltip: { trigger: 'axis', formatter: tooltipFormatter },
    grid: { left: '2%', right: '14%', bottom: '2%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisLabel: { color: tokens.muted },
      axisTick: { lineStyle: { color: tokens.baseline } }
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
      axisLabel: { color: tokens.muted }
    },
    series: [...band, ...lines, ...referenceLine, markers]
  };

  let summary = 'Sin datos de pronóstico para el escenario seleccionado.';
  if (selected) {
    const last = [...selected.points].sort((a, b) => a.year - b.year).at(-1);
    if (last) {
      const label = indicatorSentence(selected.indicator, selected.resource);
      summary =
        `Escenario ${scenarioLabel(opts.scenario).toLowerCase()}, ${last.year}: ${label}, mediana ` +
        `${formatValue(last.p50, selected.unit)}, p10-p90 de ${formatValue(last.p10, selected.unit)} ` +
        `a ${formatValue(last.p90, selected.unit)}`;
      const delta = reference ? aiDelta(selected, reference, last.year) : null;
      if (delta !== null) summary += `; el efecto de la IA suma ${formatPercent(delta)} en la mediana`;
    }
  }

  return { option, excluded, summary };
}
