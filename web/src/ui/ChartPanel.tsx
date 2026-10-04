import React, { useState } from 'react';
import { TableToggle } from './TableToggle';

interface ChartPanelProps {
  title: string;
  chart: React.ReactNode;
  /** the table of the same data; without it the panel has no toggle */
  table?: React.ReactNode;
  /** more controls next to the toggle (the map metric, for example) */
  actions?: React.ReactNode;
  startAsTable?: boolean;
}

/** A view of the dashboard: its title, its controls and the chart, swappable for the table of the same data. */
export function ChartPanel({ title, chart, table, actions, startAsTable = false }: ChartPanelProps) {
  const [asTable, setAsTable] = useState(startAsTable);
  return (
    <div className="chart-panel">
      <div className="chart-panel-head">
        <h2>{title}</h2>
        <div className="chart-panel-actions">
          {actions}
          {table !== undefined && <TableToggle pressed={asTable} onToggle={() => setAsTable(!asTable)} />}
        </div>
      </div>
      <div className="chart-panel-body">{asTable && table !== undefined ? table : chart}</div>
    </div>
  );
}
