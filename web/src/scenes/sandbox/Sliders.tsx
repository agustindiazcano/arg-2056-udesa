import React from 'react';
import { FIELD_LABELS, SLIDER_BOUNDS } from './config.js';
import type { SandboxField } from './config.js';
import type { SandboxState } from './state.js';

interface SlidersProps {
  state: SandboxState;
  aiEnabled: boolean;
  onChange: (field: SandboxField, value: number) => void;
}

const FIELDS: SandboxField[] = ['gpcPct', 'popPct', 'aiPp'];

/** Parses what the visitor typed; an empty or non-numeric text is ignored (not read as zero). */
function parse(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function Sliders({ state, aiEnabled, onChange }: SlidersProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {FIELDS.map((field) => {
        const { label, unit, help } = FIELD_LABELS[field];
        const { min, max, step } = SLIDER_BOUNDS[field];
        const disabled = field === 'aiPp' && !aiEnabled;
        const handle = (text: string) => {
          const value = parse(text);
          if (value !== null) onChange(field, value);
        };
        return (
          <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div>{label}</div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <input
                type="range"
                aria-label={label}
                min={min}
                max={max}
                step={step}
                value={state[field]}
                disabled={disabled}
                onChange={(e) => handle(e.target.value)}
              />
              <input
                type="number"
                aria-label={`${label} (number)`}
                min={min}
                max={max}
                step={step}
                value={state[field]}
                disabled={disabled}
                onChange={(e) => handle(e.target.value)}
              />
              <span style={{ color: 'var(--ink-2)' }}>{unit}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{help}</div>
            {disabled && (
              <div style={{ color: 'var(--state-warning)', fontSize: '12px' }}>
                Turn on the AI overlay to use the AI uplift.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
