import type { RankRow } from '../../scenes/economy/selectors.js';
import { tokens } from '../../styles/tokens.js';
import { formatValue, ordinal, formatAxisNumber } from '../format.js';

interface RankBarsOpts {
  highlight: string;
  missing: string[];
  unit: string;
  year: number;
  indicatorLabel: string;
}

export function buildRankBars(rows: RankRow[], opts: RankBarsOpts) {
  const { highlight, missing, unit, year, indicatorLabel } = opts;

  const option = {
    animation: false,
    tooltip: {
      trigger: 'item',
      formatter: (p: { dataIndex: number }) => {
        const row = rows[p.dataIndex];
        return row ? `${row.geo}<br/>${formatValue(row.value, unit)}<br/>puesto ${row.rank} de ${row.of}` : '';
      }
    },
    grid: { left: '2%', right: '14%', bottom: '2%', top: '4%', containLabel: true },
    xAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((r) => `${r.rank}. ${r.geo}`),
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.ink2 }
    },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: rows.map((r) => ({
          value: r.value,
          itemStyle: { color: r.geo === highlight ? tokens.blue : tokens.muted, borderRadius: [0, 4, 4, 0] },
          label: { formatter: formatValue(r.value, unit) }
        })),
        label: { show: true, position: 'right', color: tokens.ink2 }
      }
    ]
  };

  const leader = rows[0];
  const home = rows.find((r) => r.geo === highlight);
  const noData = missing.length > 0 ? `sin datos de ${missing.join(', ')}` : '';
  let summary: string;
  if (!leader) {
    summary = `Sin datos de ${indicatorLabel} en ${year}${noData ? `; ${noData}` : '.'}`;
  } else {
    const parts = [`${indicatorLabel} en ${year}: ${leader.geo} lidera con ${formatValue(leader.value, unit)}`];
    if (home) parts.push(`${highlight} ocupa el ${ordinal(home.rank)} puesto de ${home.of}`);
    if (noData) parts.push(noData);
    summary = parts.join('; ');
  }

  return { option, excluded: missing.length, summary };
}
