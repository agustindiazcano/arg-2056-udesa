import React from 'react';
import { cagr, aiDelta, endpoint } from './selectors.js';
import type { ForecastView } from './selectors.js';
import { formatPercent, formatValue } from '../../charts/format.js';
import { CountUp } from '../../motion/CountUp.js';
import type { Scenario } from '../../types/index.js';

interface StatTilesProps {
  view: ForecastView;
  scenario: Scenario;
  aiOverlay: boolean;
}

const NO_DATA = 'sin datos';

function Tile({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div
      data-testid={id}
      role="group"
      aria-label={label}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-md)', flex: 1 }}
    >
      <div style={{ color: 'var(--ink-2)', fontSize: '12px' }}>{label}</div>
      {children}
    </div>
  );
}

export function StatTiles({ view, scenario, aiOverlay }: StatTilesProps) {
  const selected = view.series[scenario];
  const reference = view.reference?.[scenario];
  const years = selected ? selected.points.map((p) => p.year) : [];
  const first = years.length > 0 ? Math.min(...years) : null;
  const last = years.length > 0 ? Math.max(...years) : null;

  const end = last === null ? null : endpoint(selected, last);
  const growth = first === null || last === null ? null : cagr(selected, first, last);
  const delta = last === null ? null : aiDelta(selected, reference, last);
  const unit = selected?.unit ?? '';

  return (
    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
      <Tile id="tile-value" label={last === null ? 'Mediana en el último año' : `Mediana en ${last}`}>
        {end ? (
          <>
            <div style={{ fontSize: 'var(--font-xl)', color: 'var(--ink)' }}>
              <CountUp value={end.p50} format={(n) => formatValue(n, unit)} />
            </div>
            <div style={{ color: 'var(--ink-2)' }}>
              p10-p90: {formatValue(end.p10, unit)} a {formatValue(end.p90, unit)}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 'var(--font-xl)', color: 'var(--muted)' }}>{NO_DATA}</div>
        )}
      </Tile>
      <Tile id="tile-growth" label={first === null || last === null ? 'Crecimiento' : `Crecimiento ${first}-${last}`}>
        <div style={{ fontSize: 'var(--font-xl)', color: growth === null ? 'var(--muted)' : 'var(--ink)' }}>
          {growth === null ? NO_DATA : `${formatPercent(growth)} por año`}
        </div>
      </Tile>
      {aiOverlay && (
        <Tile id="tile-ai" label={last === null ? 'Efecto de la IA' : `Efecto de la IA en ${last}`}>
          <div style={{ fontSize: 'var(--font-xl)', color: delta === null ? 'var(--muted)' : 'var(--ink)' }}>
            {delta === null ? NO_DATA : formatPercent(delta, { signed: true })}
          </div>
        </Tile>
      )}
    </div>
  );
}
