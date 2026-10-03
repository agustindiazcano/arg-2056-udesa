import { SLIDER_BOUNDS } from './config.js';
import type { SandboxField } from './config.js';

export interface SandboxState {
  gpcPct: number;
  popPct: number;
  aiPp: number;
}

export type SandboxAction =
  | { type: 'set'; field: SandboxField; value: number }
  | { type: 'applyPreset'; preset: SandboxState }
  | { type: 'reset'; initial: SandboxState };

export const ZERO_STATE: SandboxState = { gpcPct: 0, popPct: 0, aiPp: 0 };

/** Clamps to the bounds of the field and rounds to its step; null for a value that is not finite. */
export function normalize(field: SandboxField, value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const { min, max, step } = SLIDER_BOUNDS[field];
  const factor = Math.round(1 / step);
  const rounded = Math.round(value * factor) / factor;
  return Math.min(Math.max(rounded, min), max) + 0; // "+ 0" turns -0 into 0
}

function applyFields(base: SandboxState, source: SandboxState): SandboxState {
  const next = { ...base };
  for (const field of ['gpcPct', 'popPct', 'aiPp'] as const) {
    const value = normalize(field, source[field]);
    if (value !== null) next[field] = value;
  }
  return next;
}

export function sandboxReducer(state: SandboxState, action: SandboxAction): SandboxState {
  switch (action.type) {
    case 'set': {
      const value = normalize(action.field, action.value);
      return value === null ? state : { ...state, [action.field]: value };
    }
    case 'applyPreset':
      return applyFields(state, action.preset);
    case 'reset':
      return applyFields(state, action.initial);
  }
}
