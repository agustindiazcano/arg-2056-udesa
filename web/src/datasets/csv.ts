import type { Cell, DataTable, Reference, SlideData } from './types.js';

const BOM = '﻿';
const EOL = '\r\n';

function field(cell: Cell): string {
  if (cell === null || cell === undefined) return '';
  const text = String(cell);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const line = (cells: Cell[]): string => cells.map(field).join(',') + EOL;
const body = (t: DataTable): string => line(t.columns) + t.rows.map(line).join('');

/** The CSV of one table: UTF-8 with a byte order mark (so Excel reads the accents), CRLF lines, numbers as they are. */
export function tableCsv(t: DataTable): string {
  return BOM + body(t);
}

/** Every table of a slide in one file, each after its title and a blank line between them. */
export function slideCsv(s: SlideData): string {
  return BOM + s.tables.map((t) => line([t.title]) + body(t)).join(EOL);
}

export function referencesCsv(refs: readonly Reference[]): string {
  return BOM + line(['id', 'fuente', 'url', 'estado']) + refs.map((r) => line([r.id, r.label, r.url, r.status])).join('');
}

/** A file name without accents or spaces: "diapositiva-14-productividad". */
export function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Hands the text to the browser as a file to save. */
export function downloadCsv(fileName: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
