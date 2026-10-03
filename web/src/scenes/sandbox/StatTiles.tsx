import React from 'react';
import { formatValue } from '../../charts/format.js';
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

const NO_DATA = 'no data';

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
      <Tile id="tile-gpc" label={`GDP per capita in ${p.lastYear}`}>
        <Value text={p.gpcMultiple === null ? null : `${p.gpcMultiple.toFixed(2)} times its ${p.firstYear} level`} />
      </Tile>
      <Tile id="tile-pop" label={`Population in ${p.lastYear}`}>
        <Value text={p.popLast === null ? null : formatValue(p.popLast, p.popUnit)} />
      </Tile>
      <Tile id="tile-gdp" label={`GDP in ${p.lastYear}`}>
        <Value text={p.gdpMultiple === null ? null : `${p.gdpMultiple.toFixed(2)} times its ${p.firstYear} level`} />
      </Tile>
      <Tile id="tile-doubling" label="Doubling time of GDP per capita">
        <Value text={exact === null ? 'never' : `${exact.toFixed(1)} years`} />
        {approximate !== null && error !== null && (
          <div style={{ color: 'var(--ink-2)' }}>
            {`rule of 70: ${approximate.toFixed(1)} years (error ${error >= 0 ? '+' : ''}${error.toFixed(1)}%)`}
          </div>
        )}
      </Tile>
      <Tile id="tile-position" label={`Against the model range in ${p.lastYear}`}>
        <Value text={p.position} />
      </Tile>
      <Tile id="tile-required" label="Required per-capita growth">
        <Value text={required === null ? null : `${required.toFixed(1)}% per year`} />
        <label style={{ color: 'var(--ink-2)', fontSize: '12px' }}>
          {`Target multiple of today's GDP per capita by ${p.lastYear}`}
          <input
            type="number"
            aria-label={`Target multiple of today's GDP per capita by ${p.lastYear}`}
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
