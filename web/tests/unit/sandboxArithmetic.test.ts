import { describe, it, expect } from 'vitest';
import {
  combinedGrowthPct,
  compound,
  doublingYears,
  effectiveGpcPct,
  requiredRatePct,
  rule70,
  rule70ErrorPct
} from '../../src/scenes/sandbox/arithmetic.js';

describe('compound', () => {
  it('compounds a base at a yearly rate in percent', () => {
    expect(compound(100, 7, 10)).toBeCloseTo(196.715136, 6);
    expect(compound(100, 0, 30)).toBe(100);
    expect(compound(50, -10, 2)).toBeCloseTo(40.5, 10);
    expect(compound(100, 7, 0)).toBe(100);
  });
});

describe('doublingYears and rule70', () => {
  it('doublingYears is ln 2 / ln(1 + rate)', () => {
    expect(doublingYears(7)).toBeCloseTo(10.244768, 6);
    expect(doublingYears(1)).toBeCloseTo(69.660717, 6);
    expect(doublingYears(10)).toBeCloseTo(7.272541, 6);
  });

  it('rule70 is 70 / rate', () => {
    expect(rule70(7)).toBe(10);
    expect(rule70(2)).toBe(35);
  });

  it('both are null for a rate that is not positive', () => {
    for (const rate of [0, -1, -50]) {
      expect(doublingYears(rate)).toBeNull();
      expect(rule70(rate)).toBeNull();
      expect(rule70ErrorPct(rate)).toBeNull();
    }
  });

  it('rule70ErrorPct is (rule70 - exact) / exact in percent', () => {
    expect(rule70ErrorPct(7)).toBeCloseTo(-2.389203, 6);
    expect(rule70ErrorPct(1)).toBeCloseTo(0.487051, 6);
    expect(rule70ErrorPct(10)).toBeCloseTo(-3.747533, 6);
  });
});

describe('requiredRatePct', () => {
  it('is the yearly rate that multiplies by the target in the given years', () => {
    expect(requiredRatePct(2, 10)).toBeCloseTo(7.177346, 6);
    expect(requiredRatePct(1, 30)).toBeCloseTo(0, 10);
    expect(requiredRatePct(0.5, 2)).toBeCloseTo((Math.sqrt(0.5) - 1) * 100, 10);
  });

  it('is null for a multiple or a horizon that is not positive', () => {
    expect(requiredRatePct(0, 10)).toBeNull();
    expect(requiredRatePct(-2, 10)).toBeNull();
    expect(requiredRatePct(2, 0)).toBeNull();
    expect(requiredRatePct(2, -5)).toBeNull();
  });
});

describe('combinedGrowthPct and effectiveGpcPct', () => {
  it('combines per-capita and population growth multiplicatively (an exact identity)', () => {
    expect(combinedGrowthPct(2, 1)).toBeCloseTo(3.02, 10);
    expect(combinedGrowthPct(0, 0)).toBe(0);
    expect(combinedGrowthPct(-1, 3)).toBeCloseTo((0.99 * 1.03 - 1) * 100, 10);
  });

  it('adds the AI uplift in percentage points to the per-capita rate', () => {
    expect(effectiveGpcPct(2, 1.5)).toBe(3.5);
    expect(effectiveGpcPct(-1, 0)).toBe(-1);
    expect(effectiveGpcPct(2, 0.5)).toBe(2.5);
  });
});
