import { describe, expect, it } from 'vitest';
import {
  PHI_MAX,
  PHI_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
  cameraLimits,
  blendCamera,
  copyCamera,
  ndcOf,
  orbit,
  pan,
  presetCamera,
  resetCamera,
  zoomAt,
  zoomBy
} from '../../src/charts3d/camera';
import type { CameraState } from '../../src/charts3d/camera';

const start = (): CameraState => ({ x: 0, y: 0.5, z: 0, theta: 0.4, phi: 1, radius: 10 });
const box = { minX: -5, maxX: 5, minY: 0, maxY: 3, minZ: -4, maxZ: 4 };
const limits = cameraLimits(start(), box);
const FOV = 32;

describe('cameraLimits', () => {
  it('allows 0.25 to 3 times the start radius and the wide polar range', () => {
    expect(limits.minRadius).toBeCloseTo(2.5, 10);
    expect(limits.maxRadius).toBeCloseTo(30, 10);
    expect(PHI_MIN).toBe(0.05);
    expect(PHI_MAX).toBe(1.55);
    expect(ZOOM_MIN).toBe(0.25);
    expect(ZOOM_MAX).toBe(3);
  });
});

describe('orbit', () => {
  it('turns the azimuth with the horizontal drag and the polar angle with the vertical one', () => {
    const s = start();
    orbit(s, 50, 20, limits);
    expect(s.theta).toBeCloseTo(0.4 - 50 * 0.008, 10);
    expect(s.phi).toBeCloseTo(1 - 20 * 0.006, 10);
  });

  it('has no azimuth limit: it wraps into -pi..pi', () => {
    const s = start();
    orbit(s, -1000, 0, limits);
    expect(s.theta).toBeGreaterThanOrEqual(-Math.PI);
    expect(s.theta).toBeLessThan(Math.PI);
    expect(Math.cos(s.theta)).toBeCloseTo(Math.cos(0.4 + 8), 10);
    expect(Math.sin(s.theta)).toBeCloseTo(Math.sin(0.4 + 8), 10);
  });

  it('clamps the polar angle at both limits', () => {
    const a = start();
    orbit(a, 0, 10000, limits);
    expect(a.phi).toBe(PHI_MIN);
    const b = start();
    orbit(b, 0, -10000, limits);
    expect(b.phi).toBe(PHI_MAX);
  });

  it('does not move the target or the radius', () => {
    const s = start();
    orbit(s, 30, 30, limits);
    expect([s.x, s.y, s.z, s.radius]).toEqual([0, 0.5, 0, 10]);
  });
});

describe('pan', () => {
  it('moves the target along the right axis of the camera for a horizontal drag', () => {
    const s = { ...start(), theta: 0, phi: Math.PI / 2, y: 1 };
    // looking along -z from +z: right is +x. Dragging right moves the scene right: the target goes left
    pan(s, 100, 0, 800, FOV, limits);
    const perPixel = (2 * 10 * Math.tan((FOV * Math.PI) / 360)) / 800;
    expect(s.x).toBeCloseTo(-100 * perPixel, 8);
    expect(s.y).toBeCloseTo(1, 8);
    expect(s.z).toBeCloseTo(0, 8);
  });

  it('moves the target up for a drag down (the scene follows the pointer)', () => {
    const s = { ...start(), theta: 0, phi: Math.PI / 2, y: 1 };
    pan(s, 0, 100, 800, FOV, limits);
    expect(s.y).toBeGreaterThan(1);
  });

  it('clamps the target to the bounding box', () => {
    const s = start();
    pan(s, -100000, -100000, 800, FOV, limits);
    expect(s.x).toBeGreaterThanOrEqual(box.minX);
    expect(s.x).toBeLessThanOrEqual(box.maxX);
    expect(s.y).toBeGreaterThanOrEqual(box.minY);
    expect(s.y).toBeLessThanOrEqual(box.maxY);
    expect(s.z).toBeGreaterThanOrEqual(box.minZ);
    expect(s.z).toBeLessThanOrEqual(box.maxZ);
    const t = start();
    pan(t, 100000, 100000, 800, FOV, limits);
    expect(t.x).toBeGreaterThanOrEqual(box.minX);
    expect(t.x).toBeLessThanOrEqual(box.maxX);
    expect(t.y).toBeLessThanOrEqual(box.maxY);
  });
});

describe('zoomBy', () => {
  it('scales the radius', () => {
    const s = start();
    zoomBy(s, 0.5, limits);
    expect(s.radius).toBeCloseTo(5, 10);
  });

  it('clamps at both radius limits', () => {
    const a = start();
    zoomBy(a, 0.001, limits);
    expect(a.radius).toBeCloseTo(2.5, 10);
    const b = start();
    zoomBy(b, 1000, limits);
    expect(b.radius).toBeCloseTo(30, 10);
  });
});

describe('zoomAt', () => {
  const aspect = 16 / 9;

  it('keeps the point of the target plane under the cursor fixed', () => {
    const s = start();
    const before = copyCamera(s);
    const cursor = { x: 0.5, y: -0.3 };
    // the world point under the cursor on the plane through the target
    zoomAt(s, 0.7, cursor.x, cursor.y, aspect, FOV, limits);
    expect(s.radius).toBeCloseTo(7, 10);
    // the same point, seen from the new camera, is at the same place on the screen
    const half = Math.tan((FOV * Math.PI) / 360) * before.radius;
    const right = [Math.cos(before.theta), 0, -Math.sin(before.theta)];
    const up = [-Math.cos(before.phi) * Math.sin(before.theta), Math.sin(before.phi), -Math.cos(before.phi) * Math.cos(before.theta)];
    const point = {
      x: before.x + right[0]! * cursor.x * half * aspect + up[0]! * cursor.y * half,
      y: before.y + right[1]! * cursor.x * half * aspect + up[1]! * cursor.y * half,
      z: before.z + right[2]! * cursor.x * half * aspect + up[2]! * cursor.y * half
    };
    const after = ndcOf(s, point, aspect, FOV);
    const old = ndcOf(before, point, aspect, FOV);
    expect(old.x).toBeCloseTo(cursor.x, 8);
    expect(old.y).toBeCloseTo(cursor.y, 8);
    expect(after.x).toBeCloseTo(cursor.x, 8);
    expect(after.y).toBeCloseTo(cursor.y, 8);
  });

  it('with the cursor at the centre it only changes the radius', () => {
    const s = start();
    zoomAt(s, 0.5, 0, 0, aspect, FOV, limits);
    expect([s.x, s.y, s.z]).toEqual([0, 0.5, 0]);
    expect(s.radius).toBeCloseTo(5, 10);
  });

  it('clamps the radius and moves the target only as much as the zoom really changed', () => {
    const s = start();
    zoomAt(s, 0.0001, 0.8, 0.8, aspect, FOV, limits);
    expect(s.radius).toBeCloseTo(2.5, 10);
    expect(s.x).toBeGreaterThanOrEqual(box.minX);
    expect(s.x).toBeLessThanOrEqual(box.maxX);
  });
});

describe('resetCamera and presetCamera', () => {
  it('returns every field to the start pose', () => {
    const s = start();
    orbit(s, 300, 100, limits);
    pan(s, 50, 50, 800, FOV, limits);
    zoomBy(s, 0.3, limits);
    resetCamera(s, limits);
    expect(s).toEqual(start());
  });

  it('"Cenital" looks straight down from the same distance and target', () => {
    const s = start();
    presetCamera(s, 'top', limits);
    expect(s.phi).toBe(PHI_MIN);
    expect(s.radius).toBe(10);
    expect([s.x, s.y, s.z]).toEqual([0, 0.5, 0]);
  });

  it('"Perspectiva" is the start pose', () => {
    const s = start();
    orbit(s, 100, 100, limits);
    presetCamera(s, 'perspective', limits);
    expect(s).toEqual(start());
  });
});

describe('blendCamera', () => {
  it('goes from one pose to the other by the shortest way around the azimuth', () => {
    const a: CameraState = { x: 0, y: 0, z: 0, theta: 3, phi: 1, radius: 10 };
    const b: CameraState = { x: 2, y: 4, z: 0, theta: -3, phi: 0.5, radius: 20 };
    const out = copyCamera(a);
    blendCamera(out, a, b, 0.5);
    // 3 to -3 is 0.283 rad through pi, not 6 rad back through 0
    expect(Math.cos(out.theta)).toBeCloseTo(Math.cos(Math.PI), 1);
    expect(out.x).toBeCloseTo(1, 10);
    expect(out.y).toBeCloseTo(2, 10);
    expect(out.phi).toBeCloseTo(0.75, 10);
    expect(out.radius).toBeCloseTo(15, 10);
  });

  it('is the first pose at 0 and the second at 1', () => {
    const a = start();
    const b: CameraState = { x: 1, y: 1, z: 1, theta: -1, phi: 0.7, radius: 5 };
    const out = copyCamera(a);
    blendCamera(out, a, b, 0);
    expect(out).toEqual(a);
    blendCamera(out, a, b, 1);
    expect(out.x).toBe(1);
    expect(out.radius).toBe(5);
    expect(out.theta).toBeCloseTo(-1, 10);
  });
});
