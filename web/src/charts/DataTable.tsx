import React, { useLayoutEffect, useRef, useState } from 'react';
import { formatValue } from './format.js';

interface Column {
  key: string;
  header: string;
  format?: 'unit' | 'usd';
  unit?: string;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column[];
  data: T[];
  caption: string;
  /**
   * Rows per page: a number, or 'fit' to page by the room the table has (nothing ever scrolls). Without it every row
   * is shown. When the room cannot be measured, 'fit' shows every row.
   */
  pageSize?: number | 'fit';
}

/** Height of a table row (see `.data-table td` in dashboard.css) and of what the table needs besides its rows. */
export const ROW_HEIGHT = 32;
export const RESERVED_HEIGHT = 112; // caption, header row and pager

/** The whole rows that fit in `height` once `reserved` is taken away; never fewer than one. */
export function rowsThatFit({ height, rowHeight, reserved }: { height: number; rowHeight: number; reserved: number }): number {
  return Math.max(1, Math.floor((height - reserved) / rowHeight));
}

export function DataTable<T>({ columns, data, caption, pageSize }: DataTableProps<T>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fitRows, setFitRows] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  useLayoutEffect(() => {
    if (pageSize !== 'fit' || typeof ResizeObserver === 'undefined') return;
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const height = el.getBoundingClientRect().height;
      if (height > 0) setFitRows(rowsThatFit({ height, rowHeight: ROW_HEIGHT, reserved: RESERVED_HEIGHT }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [pageSize]);

  const perPage = pageSize === 'fit' ? fitRows : (pageSize ?? null);
  const pages = perPage === null ? 1 : Math.max(1, Math.ceil(data.length / perPage));
  const current = Math.min(page, pages - 1);
  const rows = perPage === null ? data : data.slice(current * perPage, (current + 1) * perPage);

  return (
    <div className="data-table-wrap" ref={wrapRef}>
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={current * (perPage ?? 0) + i}>
              {columns.map((c) => {
                let val = (row as Record<string, unknown>)[c.key];
                if (c.format === 'unit' && c.unit) {
                  val = formatValue(val as number | null, c.unit);
                } else if (c.format === 'usd') {
                  val = formatValue(val as number | null, 'USD');
                } else if (val === null || val === undefined) {
                  val = '-';
                }
                return <td key={c.key}>{String(val)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <div className="pager">
          <button type="button" className="btn" aria-label="Página anterior" disabled={current === 0} onClick={() => setPage(current - 1)}>
            ‹
          </button>
          <span>{`Página ${current + 1} de ${pages}`}</span>
          <button type="button" className="btn" aria-label="Página siguiente" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}
