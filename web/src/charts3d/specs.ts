import { formatAxisNumber, formatValue } from '../charts/format';
import type { Bars3DSpec } from './types';

interface BarsSpecOpts {
  title: string;
  unit: string;
  /** the label of the bar to highlight (the home country, the selected province) */
  highlight?: string | null;
  summary?: string;
}

/** The data of a 3D bar chart from rows; a row without a value is left out, never drawn as zero. */
export function barsSpec(rows: Array<{ label: string; value: number | null }>, opts: BarsSpecOpts): Bars3DSpec {
  const bars = rows
    .filter((r): r is { label: string; value: number } => r.value !== null)
    .map((r) => ({
      label: r.label,
      value: r.value,
      display: formatValue(r.value, opts.unit),
      short: formatAxisNumber(r.value),
      highlight: opts.highlight !== undefined && opts.highlight !== null && r.label === opts.highlight
    }));
  return {
    kind: 'bars',
    title: opts.title,
    unit: opts.unit,
    bars,
    summary: opts.summary ?? `${opts.title}, vista 3D de barras: ${bars.map((b) => `${b.label} ${b.display}`).join(', ')}`
  };
}
