import { describe, expect, it } from 'vitest';
import { SKY_RAMP } from '../../src/styles/tokens';
import { skyColorHex, starPositions } from '../../src/scenes/andes/sky';

describe('skyColorHex', () => {
  it('is the horizon color at the horizon and below it', () => {
    expect(skyColorHex(0)).toBe(SKY_RAMP[0]);
    expect(skyColorHex(-0.5)).toBe(SKY_RAMP[0]);
  });

  it('is the zenith color straight up', () => {
    expect(skyColorHex(1)).toBe(SKY_RAMP[SKY_RAMP.length - 1]);
    expect(skyColorHex(2)).toBe(SKY_RAMP[SKY_RAMP.length - 1]);
  });

  it('blends between two steps in the middle', () => {
    // 1/3 of the way up is exactly the second step of four
    expect(skyColorHex(1 / 3).toLowerCase()).toBe(SKY_RAMP[1]);
    const mid = skyColorHex(1 / 6);
    expect(mid).not.toBe(SKY_RAMP[0]);
    expect(mid).not.toBe(SKY_RAMP[1]);
  });

  it('keeps the fog the horizon color: the first step', () => {
    expect(SKY_RAMP[0]).toBe('#d6a77f');
  });
});

describe('starPositions', () => {
  const stars = starPositions(200, 100);

  it('has the number asked for, three numbers each', () => {
    expect(stars).toHaveLength(600);
  });

  it('is the same every time (no randomness)', () => {
    expect(Array.from(starPositions(200, 100))).toEqual(Array.from(stars));
  });

  it('puts every star on the sphere, in the upper part of the sky', () => {
    for (let i = 0; i < 200; i++) {
      const [x, y, z] = [stars[i * 3]!, stars[i * 3 + 1]!, stars[i * 3 + 2]!];
      expect(Math.hypot(x, y, z)).toBeCloseTo(100, 3);
      expect(y / 100).toBeGreaterThan(0.25);
    }
  });

  it('is empty for no stars', () => {
    expect(starPositions(0, 100)).toHaveLength(0);
  });
});
