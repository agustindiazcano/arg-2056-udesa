import { formatValue } from '../charts/format.js';
import type { Chart3DSpec } from '../charts3d/types.js';
import { PROVINCES } from '../types/province.js';

export interface SpecTable {
  title: string;
  columns: string[];
  rows: string[][];
}

const GAP = '—';

/** The table of the data a chart draws, from the same spec as its 3D version (design.md: every chart has a table). */
export function specTable(spec: Chart3DSpec): SpecTable {
  if (spec.kind === 'bars') {
    return {
      title: spec.title,
      columns: [spec.title, 'Valor'],
      rows: spec.bars.map((b) => [b.label.replace('\n', ' · '), b.display])
    };
  }
  if (spec.kind === 'lines') {
    const band = spec.band;
    const rows = spec.xLabels.map((x, i) => {
      const cells = spec.series.map((s) => (s.values[i] == null ? GAP : formatValue(s.values[i]!, spec.unit)));
      const lo = band?.lower[i];
      const hi = band?.upper[i];
      return [x, ...cells, ...(band ? [lo == null || hi == null ? GAP : `${formatValue(lo, '')}a ${formatValue(hi, spec.unit)}`] : [])];
    });
    return { title: spec.title, columns: ['Año', ...spec.series.map((s) => s.name), ...(band ? ['Rango'] : [])], rows };
  }
  const names = new Map<string, string>(PROVINCES.map((p) => [p.id, p.name]));
  const rows = Object.entries(spec.values.values)
    .sort((a, b) => b[1].plotted - a[1].plotted)
    .map(([id, v]) => [names.get(id) ?? id, spec.formatValue(v.plotted)]);
  return { title: spec.title, columns: ['Provincia', 'Valor'], rows };
}

/** The same data as numbers (not text), for the CSV of the Data section: bars give label and value; lines give the year, each series and the range. */
export function specRaw(spec: Exclude<Chart3DSpec, { kind: 'map' }>): { columns: string[]; rows: Array<Array<string | number | null>> } {
  const unit = spec.unit ? ` (${spec.unit})` : '';
  if (spec.kind === 'bars') {
    return { columns: [spec.title, `Valor${unit}`], rows: spec.bars.map((b) => [b.label.replace('\n', ' · '), b.value]) };
  }
  const band = spec.band;
  return {
    columns: ['Año', ...spec.series.map((s) => `${s.name}${unit}`), ...(band ? [`Rango, mínimo${unit}`, `Rango, máximo${unit}`] : [])],
    rows: spec.xLabels.map((x, i) => [x, ...spec.series.map((s) => s.values[i] ?? null), ...(band ? [band.lower[i] ?? null, band.upper[i] ?? null] : [])])
  };
}
