import { describe, expect, it } from 'vitest';
import { spo2Estimate } from '../../src/scenes/andes/physiology';

describe('spo2Estimate', () => {
  it('is about 98% at sea level and on low ground, and has no value without an altitude', () => {
    expect(spo2Estimate(0)).toBe(98);
    expect(spo2Estimate(800)).toBe(98);
    expect(spo2Estimate(1000)).toBe(98);
    expect(spo2Estimate(null)).toBeNull();
  });

  it('falls as the army climbs, and never rises', () => {
    let last = 100;
    for (let m = 0; m <= 6000; m += 100) {
      const v = spo2Estimate(m)!;
      expect(v).toBeLessThanOrEqual(last + 1e-12);
      last = v;
    }
  });

  it('is in the usual range for the heights of the crossing: mid 90s at 2,500 m, about 90% near the 3,900 m of the pass (an estimate, not a measurement)', () => {
    expect(spo2Estimate(2500)!).toBeGreaterThan(94);
    expect(spo2Estimate(2500)!).toBeLessThan(97);
    expect(spo2Estimate(3900)!).toBeGreaterThan(88);
    expect(spo2Estimate(3900)!).toBeLessThan(92);
  });

  it('stays between 70 and 98 for any altitude', () => {
    for (const m of [-500, 0, 9000, 20000]) {
      expect(spo2Estimate(m)!).toBeGreaterThanOrEqual(70);
      expect(spo2Estimate(m)!).toBeLessThanOrEqual(98);
    }
  });
});
