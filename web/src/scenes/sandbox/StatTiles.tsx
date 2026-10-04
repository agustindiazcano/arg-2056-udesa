import React from 'react';
import { formatNumber, formatPercent, formatValue } from '../../charts/format.js';
import { positionLabel } from '../../content/labels.js';
import { doublingYears, requiredRatePct, rule70, rule70ErrorPct } from './arithmetic.js';
import type { Position } from './selectors.js';

interface StatTilesProps {
  firstYear: number;
  lastYear: number;
  gpcMultiple: number | null;
  popLast: number | null;
  popUnit: string;
  gdpMultiple: number | null;
  effectivePct: number;
  position: Position | null;
  target: number;
  onTargetChange: (value: number) => void;
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

function Value({ text }: { text: string | null }) {
  return (
    <div style={{ fontSize: 'var(--font-xl)', color: text === null ? 'var(--muted)' : 'var(--ink)' }}>
      {text ?? NO_DATA}
    </div>
  );
}

export function StatTiles(p: StatTilesProps) {
  const exact = doublingYears(p.effectivePct);
  const approximate = rule70(p.effectivePct);
  const error = rule70ErrorPct(p.effectivePct);
  const years = p.lastYear - p.firstYear;
  const required = requiredRatePct(p.target, years);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
      <Tile id="tile-gpc" label={`PIB per cápita en ${p.lastYear}`}>
        <Value text={p.gpcMultiple === null ? null : `${formatNumber(p.gpcMultiple, 2)} veces su nivel de ${p.firstYear}`} />
      </Tile>
      <Tile id="tile-pop" label={`Población en ${p.lastYear}`}>
        <Value text={p.popLast === null ? null : formatValue(p.popLast, p.popUnit)} />
      </Tile>
      <Tile id="tile-gdp" label={`PIB en ${p.lastYear}`}>
        <Value text={p.gdpMultiple === null ? null : `${formatNumber(p.gdpMultiple, 2)} veces su nivel de ${p.firstYear}`} />
      </Tile>
      <Tile id="tile-doubling" label="Tiempo de duplicación del PIB per cápita">
        <Value text={exact === null ? 'nunca' : `${formatNumber(exact, 1)} años`} />
        {approximate !== null && error !== null && (
          <div style={{ color: 'var(--ink-2)' }}>
            {`regla del 70: ${formatNumber(approximate, 1)} años (error ${formatPercent(error, { signed: true })})`}
          </div>
        )}
      </Tile>
      <Tile id="tile-position" label={`Frente al rango del modelo en ${p.lastYear}`}>
        <Value text={p.position === null ? null : positionLabel(p.position)} />
      </Tile>
      <Tile id="tile-required" label="Crecimiento per cápita requerido">
        <Value text={required === null ? null : `${formatPercent(required)} por año`} />
        <label style={{ color: 'var(--ink-2)', fontSize: '12px' }}>
          {`Meta: múltiplo del PIB per cápita actual en ${p.lastYear}`}
          <input
            type="number"
            aria-label={`Meta: múltiplo del PIB per cápita actual en ${p.lastYear}`}
            min={0}
            step={0.1}
            value={p.target}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (e.target.value.trim() !== '' && Number.isFinite(value)) p.onTargetChange(value);
            }}
          />
        </label>
      </Tile>
    </div>
  );
}
