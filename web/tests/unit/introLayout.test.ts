import { describe, it, expect } from 'vitest';
import { pathBox, boxStyle, lightStep, TARGET_SHARE } from '../../src/intro/layout';

describe('pathBox', () => {
  it('returns the bounding box of an SVG path padded on every side', () => {
    expect(pathBox('M10 20L30 20L30 60L10 60Z', 2)).toEqual({ x: 8, y: 18, w: 24, h: 44 });
  });

  it('reads negative and decimal coordinates', () => {
    expect(pathBox('M-5.5 1.5L4.5 11.5', 0)).toEqual({ x: -5.5, y: 1.5, w: 10, h: 10 });
  });
});

describe('boxStyle', () => {
  it('expresses the box as percentages of the map, so the layer scales with it', () => {
    const style = boxStyle({ x: 50, y: 100, w: 100, h: 200 }, 200, 400);
    expect(style).toEqual({ '--x': '25%', '--y': '25%', '--w': '50%', '--h': '50%' });
  });
});

describe('lightStep', () => {
  const total = 10;

  it('lights an unlit province when too few are lit', () => {
    const step = lightStep(new Set(), total, () => 0);
    expect(step).toEqual({ id: 0, on: true });
  });

  it('only picks a province that is off when lighting', () => {
    const lit = new Set([0, 1, 2]);
    const step = lightStep(lit, total, () => 0);
    expect(step?.on).toBe(true);
    expect(lit.has(step!.id)).toBe(false);
  });

  it('turns a lit province off when too many are lit', () => {
    const lit = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
    const step = lightStep(lit, total, () => 0.99);
    expect(step?.on).toBe(false);
    expect(lit.has(step!.id)).toBe(true);
  });

  it('keeps the share of lit provinces near the target over many steps', () => {
    const lit = new Set<number>();
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 500; i++) {
      const step = lightStep(lit, total, random);
      if (!step) continue;
      if (step.on) lit.add(step.id);
      else lit.delete(step.id);
    }
    expect(Math.abs(lit.size - Math.round(total * TARGET_SHARE))).toBeLessThanOrEqual(3);
  });

  it('does nothing when there are no provinces', () => {
    expect(lightStep(new Set(), 0, () => 0.5)).toBeNull();
  });
});
