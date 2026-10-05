import { describe, expect, it } from 'vitest';
import { vo2MaxShare } from '../../src/scenes/andes/physiology';

describe('vo2MaxShare', () => {
  it('is the whole capacity at sea level and low ground, and has no value without an altitude', () => {
    expect(vo2MaxShare(0)).toBe(1);
    expect(vo2MaxShare(300)).toBe(1);
    expect(vo2MaxShare(null)).toBeNull();
  });

  it('falls as the army climbs, and never rises', () => {
    let last = 1;
    for (let m = 0; m <= 5000; m += 100) {
      const v = vo2MaxShare(m)!;
      expect(v).toBeLessThanOrEqual(last + 1e-12);
      last = v;
    }
  });

  it('loses about a fifth by 3,000 m and about three tenths near the 3,900 m of the pass (an estimate, not a measurement)', () => {
    expect(vo2MaxShare(3000)!).toBeGreaterThan(0.76);
    expect(vo2MaxShare(3000)!).toBeLessThan(0.86);
    expect(vo2MaxShare(3900)!).toBeGreaterThan(0.64);
    expect(vo2MaxShare(3900)!).toBeLessThan(0.78);
  });

  it('stays between 0 and 1 for any altitude', () => {
    for (const m of [-500, 0, 9000, 20000]) {
      expect(vo2MaxShare(m)!).toBeGreaterThan(0);
      expect(vo2MaxShare(m)!).toBeLessThanOrEqual(1);
    }
  });
});
