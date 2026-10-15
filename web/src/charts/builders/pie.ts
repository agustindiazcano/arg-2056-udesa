import { tokens } from '../../styles/tokens.js';
import { formatValue } from '../format.js';

/** A pie of the parts of a whole, one color per part; `highlight` pulls one slice out. Used where a part of a sector is chosen by a click. */
export function buildPie(rows: Array<{ label: string; value: number }>, opts: { unit: string; summary: string; highlight?: string }) {
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(13,13,13,0.92)',
      borderColor: tokens.border,
      textStyle: { color: tokens.ink },
      formatter: (p: { name: string; value: number; percent: number }) => `${p.name}<br/>${formatValue(p.value, opts.unit)} (${p.percent.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %)`
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '72%'],
        center: ['50%', '52%'],
        label: { color: tokens.ink, fontSize: 13, formatter: '{b}\n{d} %' },
        labelLine: { lineStyle: { color: tokens.muted } },
        itemStyle: { borderColor: tokens.page, borderWidth: 2 },
        data: rows.map((r, i) => ({
          name: r.label,
          value: r.value,
          selected: r.label === opts.highlight,
          itemStyle: { color: tokens.categorical[i % tokens.categorical.length] }
        })),
        selectedMode: 'single',
        selectedOffset: 12
      }
    ]
  };
  return { option, summary: opts.summary };
}
