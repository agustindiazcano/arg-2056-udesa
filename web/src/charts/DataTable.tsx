import React from 'react';
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
}

export function DataTable<T>({ columns, data, caption }: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto', width: '100%', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <caption style={{ padding: '8px', fontWeight: 'bold' }}>{caption}</caption>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{ padding: '8px', borderBottom: '1px solid var(--grid)' }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(c => {
                let val = (row as any)[c.key];
                if (c.format === 'unit' && c.unit) {
                  val = formatValue(val, c.unit);
                } else if (c.format === 'usd') {
                  val = formatValue(val, 'USD');
                } else if (val === null || val === undefined) {
                  val = '-';
                }
                return (
                  <td key={c.key} style={{ padding: '8px', borderBottom: '1px solid var(--grid)' }}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
