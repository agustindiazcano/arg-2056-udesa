import { tokens } from '../../styles/tokens.js';
import { formatValue } from '../format.js';

/** A doughnut pie of the parts of a whole, one color per part; `highlight` pulls one slice out. Styled after `test/tree-example.html`. */
export function buildPie(rows: Array<{ label: string; value: number; color?: string }>, opts: { unit: string; summary: string; highlight?: string }) {
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
        radius: ['52%', '78%'],
        center: ['50%', '52%'],
        avoidLabelOverlap: true,
        label: { color: tokens.ink, fontSize: 12, fontWeight: 600, formatter: '{b}\n{d} %' },
        labelLine: { lineStyle: { color: tokens.muted } },
        itemStyle: { borderColor: tokens.page, borderWidth: 2, borderRadius: 4 },
        emphasis: { scale: true, scaleSize: 6 },
        data: rows.map((r, i) => ({
          name: r.label,
          value: r.value,
          selected: r.label === opts.highlight,
          itemStyle: { color: r.color ?? tokens.categorical[i % tokens.categorical.length] }
        })),
        selectedMode: 'single',
        selectedOffset: 10
      }
    ]
  };
  return { option, summary: opts.summary };
}
