import { describe, it, expect } from 'vitest';
import { FIELD_LABELS, SLIDER_BOUNDS } from '../../src/scenes/sandbox/config.js';
import { sandboxReducer, ZERO_STATE } from '../../src/scenes/sandbox/state.js';
import type { SandboxState } from '../../src/scenes/sandbox/state.js';

const start: SandboxState = { gpcPct: 1, popPct: 0.5, aiPp: 0.5 };

describe('slider configuration', () => {
  it('has the suggested interface bounds and a 0.1 step', () => {
    expect(SLIDER_BOUNDS.gpcPct).toEqual({ min: -2, max: 8, step: 0.1 });
    expect(SLIDER_BOUNDS.popPct).toEqual({ min: -1, max: 3, step: 0.1 });
    expect(SLIDER_BOUNDS.aiPp).toEqual({ min: 0, max: 3, step: 0.1 });
  });

  it('has a label, a unit and a help text for every field', () => {
    for (const field of ['gpcPct', 'popPct', 'aiPp'] as const) {
      expect(FIELD_LABELS[field].label.length).toBeGreaterThan(0);
      expect(FIELD_LABELS[field].unit.length).toBeGreaterThan(0);
      expect(FIELD_LABELS[field].help.length).toBeGreaterThan(0);
    }
    expect(FIELD_LABELS.aiPp.help).toMatch(/puntos porcentuales/);
    expect(FIELD_LABELS.aiPp.help).toMatch(/se suma/);
  });
});

describe('sandboxReducer set', () => {
  it('sets a field to a valid value', () => {
    expect(sandboxReducer(start, { type: 'set', field: 'gpcPct', value: 2.5 })).toEqual({ ...start, gpcPct: 2.5 });
  });

  it('clamps at both bounds of each field', () => {
    const set = (field: 'gpcPct' | 'popPct' | 'aiPp', value: number) =>
      sandboxReducer(start, { type: 'set', field, value })[field];
    expect(set('gpcPct', 100)).toBe(8);
    expect(set('gpcPct', -100)).toBe(-2);
    expect(set('popPct', 10)).toBe(3);
    expect(set('popPct', -5)).toBe(-1);
    expect(set('aiPp', 99)).toBe(3);
    expect(set('aiPp', -1)).toBe(0);
  });

  it('rounds to the 0.1 step', () => {
    const set = (value: number) => sandboxReducer(start, { type: 'set', field: 'gpcPct', value }).gpcPct;
    expect(set(2.34)).toBe(2.3);
    expect(set(2.36)).toBe(2.4);
    expect(set(2.349)).toBe(2.3);
    expect(set(0.04)).toBe(0);
  });

  it('never produces negative zero', () => {
    const value = sandboxReducer(start, { type: 'set', field: 'popPct', value: -0.04 }).popPct;
    expect(Object.is(value, 0)).toBe(true);
  });

  it('ignores a value that is not finite and leaves the state unchanged', () => {
    for (const value of [Number.NaN, Infinity, -Infinity]) {
      expect(sandboxReducer(start, { type: 'set', field: 'gpcPct', value })).toBe(start);
    }
  });
});

describe('sandboxReducer applyPreset and reset', () => {
  it('applies a preset, clamping and rounding every field', () => {
    expect(sandboxReducer(start, { type: 'applyPreset', preset: { gpcPct: 1.6377, popPct: 0.0996, aiPp: 0 } })).toEqual({
      gpcPct: 1.6,
      popPct: 0.1,
      aiPp: 0
    });
    expect(sandboxReducer(start, { type: 'applyPreset', preset: { gpcPct: 12, popPct: -4, aiPp: 7 } })).toEqual({
      gpcPct: 8,
      popPct: -1,
      aiPp: 3
    });
  });

  it('keeps the current value of a preset field that is not finite', () => {
    expect(sandboxReducer(start, { type: 'applyPreset', preset: { gpcPct: Number.NaN, popPct: 2, aiPp: 0 } })).toEqual({
      gpcPct: 1,
      popPct: 2,
      aiPp: 0
    });
  });

  it('resets to the given initial state', () => {
    const changed = sandboxReducer(start, { type: 'set', field: 'gpcPct', value: 6 });
    expect(sandboxReducer(changed, { type: 'reset', initial: start })).toEqual(start);
    expect(sandboxReducer(changed, { type: 'reset', initial: ZERO_STATE })).toEqual({ gpcPct: 0, popPct: 0, aiPp: 0 });
  });
});
