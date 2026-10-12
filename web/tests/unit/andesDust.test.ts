import { describe, expect, it } from 'vitest';
import { DUST_MAX, DUST_RISE, dustAge, dustCount, fillDust } from '../../src/scenes/andes/dust';
import type { DustSlot } from '../../src/scenes/andes/dust';

const SLOTS: DustSlot[] = Array.from({ length: 40 }, (_, n) => ({ along: n * 0.3, lateral: (n % 3) - 1 }));
const place = (s: number, lateral: number, out: { x: number; y: number; z: number }) => {
  out.x = lateral;
  out.y = 0;
  out.z = -s;
};

describe('dustCount', () => {
  it('is zero with no figures or no particles, grows with the column and is capped', () => {
    expect(dustCount(0, 1)).toBe(0);
    expect(dustCount(40, 0)).toBe(0);
    expect(dustCount(40, 1)).toBeGreaterThan(dustCount(10, 1));
    expect(dustCount(10_000, 1)).toBe(DUST_MAX);
  });

  it('is smaller on a weaker tier', () => {
    expect(dustCount(60, 0.5)).toBeLessThan(dustCount(60, 1));
  });
});

describe('dustAge', () => {
  it('stays in [0, 1), moves with the clock and gives each puff its own point of the cycle', () => {
    for (let i = 0; i < 20; i += 1) {
      const a = dustAge(i, 1234);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(1);
    }
    expect(dustAge(3, 0)).not.toBe(dustAge(3, 400));
    expect(dustAge(0, 500)).not.toBe(dustAge(1, 500));
  });
});

describe('fillDust', () => {
  const make = (n: number) => ({ position: new Float32Array(n * 3), color: new Float32Array(n * 4) });

  it('puts every puff behind its figure and lifts it with its age', () => {
    const out = make(10);
    fillDust(out, 10, SLOTS, 5, 700, 1, place);
    for (let i = 0; i < 10; i += 1) {
      const age = dustAge(i, 700);
      expect(out.position[i * 3 + 1]).toBeCloseTo(age * DUST_RISE, 5);
    }
  });

  it('fades out with age and is invisible when the army stands still', () => {
    const out = make(10);
    fillDust(out, 10, SLOTS, 5, 700, 1, place);
    const alphas = Array.from({ length: 10 }, (_, i) => out.color[i * 4 + 3]!);
    expect(Math.max(...alphas)).toBeGreaterThan(0);
    expect(Math.max(...alphas)).toBeLessThanOrEqual(0.5);
    const still = make(10);
    fillDust(still, 10, SLOTS, 5, 700, 0, place);
    expect(Array.from(still.color).filter((_, k) => k % 4 === 3).every((a) => a === 0)).toBe(true);
  });

  it('is deterministic: the same clock gives the same puffs', () => {
    const a = make(10);
    const b = make(10);
    fillDust(a, 10, SLOTS, 5, 900, 1, place);
    fillDust(b, 10, SLOTS, 5, 900, 1, place);
    expect(Array.from(a.position)).toEqual(Array.from(b.position));
  });

  it('does nothing without slots', () => {
    const out = make(4);
    fillDust(out, 4, [], 5, 100, 1, place);
    expect(Array.from(out.color).every((v) => v === 0)).toBe(true);
  });
});
