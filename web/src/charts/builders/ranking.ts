import { tokens } from '../../styles/tokens.js';
import { scenarioLabel } from '../../content/labels.js';
import { formatValue, formatAxisNumber } from '../format.js';
import type { ProvinceId, Scenario } from '../../types/index.js';
import type { RankRow } from '../../scenes/forecast/selectors.js';

interface RankingOpts {
  scenario: Scenario;
  unit: string;
  highlight?: ProvinceId | null;
  excluded?: number;
}

function categoryLabel(row: RankRow): string {
  if (row.rankChange === null || row.rankChange === 0) return row.name;
  const direction = row.rankChange > 0 ? 'sube' : 'baja';
  return `${row.name} (${direction} ${Math.abs(row.rankChange)})`;
}

export function buildRanking(rows: RankRow[], opts: RankingOpts) {
  const color = tokens.scenario[opts.scenario];

  const bars = rows.map((row) => ({
    value: row.p50,
    itemStyle: {
      color: opts.highlight && row.geo !== opts.highlight ? tokens.muted : color,
      borderRadius: [0, 4, 4, 0]
    },
    label: { formatter: formatValue(row.p50, opts.unit) }
  }));

  // Whisker from p10 to p90: [low, high, category index]
  const whiskerData = rows.map((row, i) => [row.p10, row.p90, i]);

  const renderWhisker = (
    _params: unknown,
    api: {
      value: (dim: number) => number;
      coord: (v: [number, number]) => [number, number];
      size: (v: [number, number]) => [number, number];
    }
  ) => {
    const index = api.value(2);
    const low = api.coord([api.value(0), index]);
    const high = api.coord([api.value(1), index]);
    const half = api.size([0, 1])[1] * 0.2;
    const style = { stroke: tokens.ink, lineWidth: 1 };
    return {
      type: 'group',
      children: [
        { type: 'line', shape: { x1: low[0], y1: low[1], x2: high[0], y2: high[1] }, style },
        { type: 'line', shape: { x1: low[0], y1: low[1] - half, x2: low[0], y2: low[1] + half }, style },
        { type: 'line', shape: { x1: high[0], y1: high[1] - half, x2: high[0], y2: high[1] + half }, style }
      ]
    };
  };

  const option = {
    animation: false,
    tooltip: {
      trigger: 'item',
      formatter: (p: { dataIndex: number }) => {
        const row = rows[p.dataIndex];
        if (!row) return '';
        return [
          row.name,
          'p10-p90: 80% de los resultados simulados',
          `p10 ${formatValue(row.p10, opts.unit)}`,
          `p50 ${formatValue(row.p50, opts.unit)}`,
          `p90 ${formatValue(row.p90, opts.unit)}`
        ].join('<br/>');
      }
    },
    grid: { left: '2%', right: '12%', bottom: '2%', top: '4%', containLabel: true },
    xAxis: {
      type: 'value',
      name: opts.unit,
      nameTextStyle: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map(categoryLabel),
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.ink2 }
    },
    series: [
      {
        name: 'p50',
        type: 'bar',
        barWidth: 12,
        data: bars,
        label: { show: true, position: 'right', color: tokens.ink2 }
      },
      {
        name: 'p10-p90',
        type: 'custom',
        silent: true,
        z: 10,
        encode: { x: [0, 1], y: 2 },
        data: whiskerData,
        renderItem: renderWhisker
      }
    ]
  };

  const leader = rows[0];
  const summary = leader
    ? `Escenario ${scenarioLabel(opts.scenario).toLowerCase()}: ${leader.name} lidera con mediana ` +
      `${formatValue(leader.p50, opts.unit)} (p10-p90 de ${formatValue(leader.p10, opts.unit)} ` +
      `a ${formatValue(leader.p90, opts.unit)})`
    : 'No hay series provinciales para esta selección.';

  return { option, excluded: opts.excluded ?? 0, summary };
}
