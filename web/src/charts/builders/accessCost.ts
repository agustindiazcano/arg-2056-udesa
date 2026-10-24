import { tokens } from '../../styles/tokens.js';
import { formatNumber } from '../format.js';
import type { AccessRow } from '../../tour/aiAccess.js';

/**
 * Horizontal stacked bars, one per country: the list price of a plan and, on top, the taxes the person pays over it. The most expensive country is
 * the first (at the top). The label at the end of each bar is the total in dollars.
 */
export function buildAccessStack(rows: readonly AccessRow[], opts: { summary: string }) {
  const ordered = [...rows].reverse();
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const r = ordered[params[0]!.dataIndex]!;
        return `<strong>${r.country}</strong><br/>Precio de lista: ${formatNumber(r.list, 0)} USD<br/>Impuestos: ${formatNumber(r.taxes, 1)} USD<br/>Total por mes: ${formatNumber(r.total, 1)} USD`;
      }
    },
    grid: { left: 8, right: 72, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: tokens.grid } }, axisLabel: { color: tokens.muted } },
    yAxis: { type: 'category', data: ordered.map((r) => r.country), axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.baseline } }, axisLabel: { color: tokens.ink2 } },
    series: [
      { name: 'Precio de lista', type: 'bar', stack: 'cost', barMaxWidth: 28, data: ordered.map((r) => r.list), itemStyle: { color: tokens.blue } },
      {
        name: 'Impuestos',
        type: 'bar',
        stack: 'cost',
        barMaxWidth: 28,
        data: ordered.map((r) => r.taxes),
        itemStyle: { color: tokens.scenario.pessimistic },
        label: { show: true, position: 'right', color: tokens.ink, fontWeight: 600, formatter: (p: { dataIndex: number }) => `${formatNumber(ordered[p.dataIndex]!.total, 1)} USD` }
      }
    ]
  };
  return { option, summary: opts.summary };
}
