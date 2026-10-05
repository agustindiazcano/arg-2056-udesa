import { describe, expect, it } from 'vitest';
import { snowAmount, snowCount, snowField, stepSnow, wrapAround } from '../../src/scenes/andes/snow';

describe('snowAmount', () => {
  it('is none low in the valley, none with no altitude, and full at the top', () => {
    expect(snowAmount(800)).toBe(0);
    expect(snowAmount(null)).toBe(0);
    expect(snowAmount(3900)).toBe(1);
    expect(snowAmount(9000)).toBe(1);
  });

  it('grows with the altitude between', () => {
    let last = 0;
    for (let m = 2000; m <= 4000; m += 100) {
      const a = snowAmount(m);
      expect(a).toBeGreaterThanOrEqual(last);
      expect(a).toBeLessThanOrEqual(1);
      last = a;
    }
    expect(snowAmount(3000)).toBeGreaterThan(0);
    expect(snowAmount(3000)).toBeLessThan(1);
  });
});

describe('snowCount', () => {
  it('is the share of the flakes that the amount asks for, and 0 when there is no snow', () => {
    expect(snowCount(0, 600)).toBe(0);
    expect(snowCount(1, 600)).toBe(600);
    expect(snowCount(0.5, 600)).toBe(300);
  });
});

describe('wrapAround', () => {
  it('keeps a value within half a size of the center (the size is the whole width), and leaves one inside alone', () => {
    expect(wrapAround(0.7, 0, 2)).toBeCloseTo(0.7, 12);
    expect(wrapAround(1.5, 0, 2)).toBeCloseTo(-0.5, 12);
    expect(wrapAround(-1.5, 0, 2)).toBeCloseTo(0.5, 12);
    expect(wrapAround(10.2, 10, 2)).toBeCloseTo(10.2, 12);
    for (let v = -50; v <= 50; v += 0.37) {
      const w = wrapAround(v, 3, 2);
      expect(w).toBeGreaterThanOrEqual(2);
      expect(w).toBeLessThan(4);
    }
  });
});

describe('snow field', () => {
  const center = { x: 4, y: 1, z: -2 };

  it('is deterministic and has a flake per three numbers, inside the box around the center', () => {
    const a = snowField(200, 7, center, 3, 2);
    const b = snowField(200, 7, center, 3, 2);
    expect(a.positions).toEqual(b.positions);
    expect(a.positions).toHaveLength(600);
    expect(a.speeds).toHaveLength(200);
    for (let i = 0; i < 200; i += 1) {
      expect(Math.abs(a.positions[i * 3]! - center.x)).toBeLessThanOrEqual(3);
      expect(Math.abs(a.positions[i * 3 + 1]! - center.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(a.positions[i * 3 + 2]! - center.z)).toBeLessThanOrEqual(3);
    }
  });

  it('gives each flake its own speed, so the snow does not fall in a sheet', () => {
    const { speeds } = snowField(200, 7, center, 3, 2);
    expect(new Set([...speeds].map((v) => v.toFixed(3))).size).toBeGreaterThan(50);
    for (const v of speeds) {
      expect(v).toBeGreaterThanOrEqual(0.6);
      expect(v).toBeLessThanOrEqual(1.4);
    }
  });

  it('falls and drifts with the wind', () => {
    const f = snowField(50, 3, center, 3, 2);
    const before = Float32Array.from(f.positions);
    stepSnow(f, 0.1, { x: 1, z: -0.5 }, center, 3, 2);
    let lower = 0;
    for (let i = 0; i < 50; i += 1) {
      if (f.positions[i * 3 + 1]! < before[i * 3 + 1]!) lower += 1;
    }
    expect(lower).toBeGreaterThan(40); // the rest wrapped from the bottom to the top
    expect(f.positions[0]).not.toBeCloseTo(before[0]!, 6);
  });

  it('stays in the box around the center for as long as it runs, even after the center moves', () => {
    const f = snowField(80, 5, center, 3, 2);
    let c = { ...center };
    for (let i = 0; i < 500; i += 1) {
      c = { x: c.x + 0.05, y: c.y + 0.01, z: c.z - 0.03 };
      stepSnow(f, 1 / 60, { x: 0.4, z: 0.2 }, c, 3, 2);
    }
    for (let i = 0; i < 80; i += 1) {
      expect(Math.abs(f.positions[i * 3]! - c.x)).toBeLessThanOrEqual(3 + 1e-4);
      expect(Math.abs(f.positions[i * 3 + 1]! - c.y)).toBeLessThanOrEqual(1 + 1e-4);
      expect(Math.abs(f.positions[i * 3 + 2]! - c.z)).toBeLessThanOrEqual(3 + 1e-4);
      expect(Number.isFinite(f.positions[i * 3]! + f.positions[i * 3 + 1]! + f.positions[i * 3 + 2]!)).toBe(true);
    }
  });

  it('does not move when no time has passed (it only gathers the flakes around the center)', () => {
    const f = snowField(30, 2, center, 3, 2);
    const before = Float32Array.from(f.positions);
    stepSnow(f, 0, { x: 1, z: 1 }, center, 3, 2);
    expect(f.positions).toEqual(before);
  });
});
