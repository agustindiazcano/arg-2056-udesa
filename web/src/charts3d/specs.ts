import { formatAxisNumber, formatValue } from '../charts/format';
import type { Bars3DSpec, Line3D, Lines3DSpec } from './types';

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

interface LinesSpecOpts {
  title: string;
  unit: string;
  xLabels: string[];
  series: Line3D[];
  band?: Lines3DSpec['band'];
  marker?: number;
  follow?: boolean;
  summary?: string;
}

/** The data of a 3D line chart. */
export function linesSpec(opts: LinesSpecOpts): Lines3DSpec {
  const { title, unit, xLabels, series, band, marker, follow } = opts;
  const span = xLabels.length > 1 ? `, de ${xLabels[0]} a ${xLabels[xLabels.length - 1]}` : '';
  return {
    kind: 'lines',
    title,
    unit,
    xLabels,
    series,
    ...(band ? { band } : {}),
    ...(marker !== undefined ? { marker } : {}),
    ...(follow ? { follow } : {}),
    summary: opts.summary ?? `${title}, vista 3D de líneas${span}: ${series.map((s) => s.name).join(', ')}`
  };
}
