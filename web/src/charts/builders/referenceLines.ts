import { tokens } from '../../styles/tokens.js';
import { formatValue } from '../format.js';
import type { CountryReference } from '../../tour/countryReferences.js';

/** Two lines closer than this share of the range of the axis would pile their flags on top of each other. */
const CLOSE_SHARE = 0.045;
const FLAG_STEP = 30;

/**
 * Adds horizontal dashed lines to a line chart option, one per country, each with its flag and value at the right end. A flag that sits too close to
 * the line under it moves left, so the flags of a cluster read side by side. `range` is the span of the y axis.
 */
export function addReferenceLines(option: object, refs: readonly CountryReference[], opts: { range: number; unit?: string }): object {
  if (refs.length === 0) return option;
  const sorted = [...refs].sort((a, b) => a.value - b.value);
  let cluster = 0;
  const data = sorted.map((r, i) => {
    cluster = i > 0 && (r.value - sorted[i - 1]!.value) / opts.range < CLOSE_SHARE ? cluster + 1 : 0;
    return {
      yAxis: r.value,
      name: r.country,
      lineStyle: { color: tokens.muted, type: 'dashed', width: 1, opacity: 0.7 },
      label: {
        show: true,
        position: 'insideEndTop',
        offset: [cluster ? -cluster * FLAG_STEP : 0, 0],
        formatter: opts.unit ? `{f|} {v|${formatValue(r.value, opts.unit)}}` : '{f|}',
        rich: {
          f: { width: 22, height: 16, backgroundColor: { image: r.flag } },
          v: { color: tokens.muted, fontSize: 11 }
        }
      }
    };
  });
  const o = option as { series: Array<Record<string, unknown>> };
  const [first, ...rest] = o.series;
  return { ...o, series: [{ ...first, markLine: { silent: true, symbol: 'none', animation: false, data } }, ...rest] };
}
