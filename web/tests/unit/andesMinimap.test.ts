import { describe, expect, it } from 'vitest';
import { minimapFrame, toMinimap, viewCone } from '../../src/scenes/andes/minimap';

describe('minimapFrame and toMinimap', () => {
  const frame = minimapFrame(16, 20, 160, 6);

  it('puts the middle of the scene in the middle of the map', () => {
    const c = toMinimap(frame, 0, 0);
    expect(c.x).toBeCloseTo(80, 6);
    expect(c.y).toBeCloseTo(80, 6);
  });

  it('keeps the scene inside the square, within the margin, with its proportions', () => {
    const topLeft = toMinimap(frame, -8, -10);
    const bottomRight = toMinimap(frame, 8, 10);
    expect(topLeft.x).toBeGreaterThanOrEqual(6 - 1e-6);
    expect(topLeft.y).toBeGreaterThanOrEqual(6 - 1e-6);
    expect(bottomRight.x).toBeLessThanOrEqual(154 + 1e-6);
    expect(bottomRight.y).toBeLessThanOrEqual(154 + 1e-6);
    expect((bottomRight.x - topLeft.x) / (bottomRight.y - topLeft.y)).toBeCloseTo(16 / 20, 6);
  });

  it('has north up: the more to the north (the smaller z), the higher on the map', () => {
    expect(toMinimap(frame, 0, -5).y).toBeLessThan(toMinimap(frame, 0, 5).y);
  });

  it('has east to the right', () => {
    expect(toMinimap(frame, 5, 0).x).toBeGreaterThan(toMinimap(frame, -5, 0).x);
  });

  it('survives a scene with no size', () => {
    const f = minimapFrame(0, 0, 160, 6);
    expect(Number.isFinite(toMinimap(f, 0, 0).x)).toBe(true);
  });
});

describe('viewCone', () => {
  const frame = minimapFrame(16, 20, 160, 6);

  it('has its point at the camera and opens toward where it looks', () => {
    const cone = viewCone(frame, { x: 0, z: 0 }, { x: 0, z: -5 }, 40, 0.5);
    const apex = toMinimap(frame, 0, 0);
    expect(cone[0]).toEqual(apex);
    // looking north: the two other corners are above the point, one each side
    expect(cone[1].y).toBeLessThan(apex.y);
    expect(cone[2].y).toBeLessThan(apex.y);
    expect(cone[1].x).toBeLessThan(apex.x);
    expect(cone[2].x).toBeGreaterThan(apex.x);
  });

  it('has both corners the length away from the point', () => {
    const cone = viewCone(frame, { x: 1, z: 2 }, { x: 5, z: 4 }, 30, 0.6);
    for (const corner of [cone[1], cone[2]]) expect(Math.hypot(corner.x - cone[0].x, corner.y - cone[0].y)).toBeCloseTo(30, 6);
  });

  it('looks east when the target is to the east', () => {
    const cone = viewCone(frame, { x: 0, z: 0 }, { x: 5, z: 0 }, 40, 0.5);
    expect(cone[1].x).toBeGreaterThan(cone[0].x);
    expect(cone[2].x).toBeGreaterThan(cone[0].x);
  });

  it('survives a camera right above its target', () => {
    const cone = viewCone(frame, { x: 1, z: 1 }, { x: 1, z: 1 }, 30, 0.5);
    for (const p of cone) expect(Number.isFinite(p.x + p.y)).toBe(true);
  });
});
