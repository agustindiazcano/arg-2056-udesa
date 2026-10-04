import type { RankPoint } from '../../scenes/economy/selectors.js';
import { tokens } from '../../styles/tokens.js';
import { ordinal } from '../format.js';

interface RankHistoryOpts {
  year: number;
  highlight: string;
  indicatorLabel: string;
}

export function buildRankHistory(history: RankPoint[], opts: RankHistoryOpts) {
  const { year, highlight, indicatorLabel } = opts;
  const categories = history.map((p) => String(p.year));
  const ranks = history.map((p) => p.rank);
  const worst = Math.max(1, ...history.map((p) => p.of ?? 1));

  const rank = {
    name: 'rank',
    type: 'line',
    step: 'end',
    data: ranks,
    connectNulls: false,
    symbol: 'none',
    lineStyle: { color: tokens.ink, width: 2 },
    itemStyle: { color: tokens.ink }
  };

  const markers = {
    name: 'markers',
    type: 'line',
    data: [],
    symbol: 'none',
    silent: true,
    markLine: {
      symbol: 'none',
      animation: false,
      data: history.some((p) => p.year === year)
        ? [
            {
              xAxis: String(year),
              name: `Año ${year}`,
              lineStyle: { color: tokens.ink2, width: 1, type: 'solid' },
              label: { formatter: `Año ${year}`, color: tokens.ink2 }
            }
          ]
        : []
    }
  };

  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ dataIndex: number }>) => {
        const point = history[params[0]?.dataIndex ?? -1];
        if (!point) return '';
        return point.rank === null ? `${point.year}<br/>Sin datos` : `${point.year}<br/>puesto ${point.rank} de ${point.of}`;
      }
    },
    grid: { left: '2%', right: '4%', bottom: '2%', top: '10%', containLabel: true },
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
      name: 'Puesto',
      inverse: true,
      min: 1,
      max: worst,
      minInterval: 1,
      nameTextStyle: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
      axisLabel: { color: tokens.muted }
    },
    series: [rank, markers]
  };

  const known = history.filter((p) => p.rank !== null && p.of !== null);
  let summary = `Sin datos de puesto para ${highlight}.`;
  if (known.length === 1) {
    const a = known[0]!;
    summary = `${highlight}: ${ordinal(a.rank!)} de ${a.of} en ${a.year} (${indicatorLabel})`;
  } else if (known.length > 1) {
    const a = known[0]!;
    const b = known[known.length - 1]!;
    summary =
      `${highlight}: ${ordinal(a.rank!)} de ${a.of} en ${a.year} y ` +
      `${ordinal(b.rank!)} de ${b.of} en ${b.year} (${indicatorLabel})`;
  }

  return { option, excluded: ranks.filter((r) => r === null).length, summary };
}
