import type { Cell, DataTable } from '../datasets/types.js';
import type { StepData } from '../tour/stepInfo.js';

/** How real a series is: `real` comes from a source, `partial` mixes sourced and made-up values (or is not verified), `placeholder` is made up. */
export type Quality = 'real' | 'partial' | 'placeholder';

export const QUALITIES: readonly Quality[] = ['real', 'partial', 'placeholder'];

export const QUALITY_LABEL: Record<Quality, string> = {
  real: 'Datos reales',
  partial: 'Datos en parte reales',
  placeholder: 'Datos de prueba'
};

/** What every series says about itself. A placeholder has no retrieval date because nothing was retrieved. */
export interface SeriesMeta {
  quality: Quality;
  source: string;
  retrieved_at: string | null;
}

/** One value of one series in one year: the record of the data layer. */
export interface SeriesPoint extends SeriesMeta {
  series_id: string;
  value: number | null;
  unit: string;
  year: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The names of the fields of a series' metadata that are wrong or missing (empty when it is complete). */
export function validateMeta(meta: SeriesMeta): string[] {
  const errors: string[] = [];
  if (!QUALITIES.includes(meta.quality)) errors.push('quality');
  if (!meta.source || meta.source.trim() === '') errors.push('source');
  const dated = typeof meta.retrieved_at === 'string' && ISO_DATE.test(meta.retrieved_at);
  if (!dated && !(meta.quality === 'placeholder' && meta.retrieved_at === null)) errors.push('retrieved_at');
  return errors;
}

export function validatePoint(point: SeriesPoint): string[] {
  const errors = validateMeta(point);
  if (!point.series_id) errors.push('series_id');
  if (!point.unit) errors.push('unit');
  if (!Number.isInteger(point.year)) errors.push('year');
  return errors;
}

/** The quality that a slide of the Recorrido declared in its side panel (`real`, `parcial`, `prueba`). */
export function qualityOfStepData(data: StepData): Quality {
  return data === 'real' ? 'real' : data === 'parcial' ? 'partial' : 'placeholder';
}

/** One record per year and numeric column of a table whose first column is the year (the shape of every time series of the Data page). */
export function tableToPoints(table: DataTable, meta: SeriesMeta & { unit: string }): SeriesPoint[] {
  if (table.columns[0] !== 'Año') throw new Error(`${table.id}: the first column must be "Año"`);
  const points: SeriesPoint[] = [];
  for (const row of table.rows) {
    const year = row[0];
    if (typeof year !== 'number') throw new Error(`${table.id}: the year is not a number`);
    table.columns.slice(1).forEach((column, i) => {
      const value = row[i + 1] ?? null;
      if (value !== null && typeof value !== 'number') throw new Error(`${table.id}: "${column}" is not numeric`);
      points.push({ series_id: `${table.id}:${column}`, value, unit: meta.unit, year, quality: meta.quality, source: meta.source, retrieved_at: meta.retrieved_at });
    });
  }
  return points;
}

/** The inverse of `tableToPoints`: one row per year, in the order the years first appear, one column per series. */
export function pointsToTable(points: readonly SeriesPoint[], shape: { id: string; title: string; columns: string[] }): DataTable {
  const years: number[] = [];
  const byYear = new Map<number, Map<string, number | null>>();
  for (const p of points) {
    if (!byYear.has(p.year)) {
      byYear.set(p.year, new Map());
      years.push(p.year);
    }
    byYear.get(p.year)!.set(p.series_id.slice(p.series_id.indexOf(':') + 1), p.value);
  }
  const rows: Cell[][] = years.map((year) => [year, ...shape.columns.slice(1).map((c) => byYear.get(year)!.get(c) ?? null)]);
  return { id: shape.id, title: shape.title, columns: shape.columns, rows };
}
