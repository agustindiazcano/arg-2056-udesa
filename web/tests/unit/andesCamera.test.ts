import { describe, expect, it } from 'vitest';
import { NO_STEER, addSteer, battlePose, followPose, lookPoint, overviewPose, steered } from '../../src/scenes/andes/camera';
import { FIGURE_NEAR } from '../../src/scenes/andes/column';
import { sceneScale, toScene } from '../../src/scenes/andes/terrainMesh';
import { syntheticTerrain } from '../../src/terrain/synthetic';
import { sampleElevation } from '../../src/terrain/decode';

const terrain = syntheticTerrain([-71, -34, -69, -32], 40, 40);
const scale = sceneScale(terrain, { longSide: 20, exaggeration: 4 });

describe('overviewPose', () => {
  it('looks at the middle of the terrain from a distance that shows all of it', () => {
    const p = overviewPose(scale);
    expect(p.x).toBe(0);
    expect(p.z).toBe(0);
    expect(p.radius).toBeGreaterThan(scale.depth);
    expect(p.phi).toBeGreaterThan(0.3);
    expect(p.phi).toBeLessThan(1.4);
  });
});

describe('battlePose', () => {
  const event = { lon: -69.6, lat: -32.5558, elevation_m: 3100 };

  it('looks at the event on the terrain (not in the air or under it), closer than the overview', () => {
    const p = battlePose(scale, terrain, event);
    const ground = sampleElevation(terrain, -69.6, -32.5558)!;
    const at = toScene(scale, -69.6, -32.5558, ground);
    expect([p.x, p.y, p.z]).toEqual([at.x, at.y, at.z]);
    expect(p.radius).toBeLessThan(overviewPose(scale).radius);
  });

  it('uses the altitude of the event when the point is outside the terrain', () => {
    const p = battlePose(scale, terrain, { lon: 10, lat: 10, elevation_m: 3100 });
    expect(p.y).toBeCloseTo(toScene(scale, 10, 10, 3100).y, 6);
  });

  it('falls back to the lowest point of the terrain, never 0, with no altitude anywhere', () => {
    const p = battlePose(scale, terrain, { lon: 10, lat: 10, elevation_m: null });
    expect(p.y).toBeCloseTo(toScene(scale, 10, 10, terrain.meta.elevation_min_m).y, 6);
    expect(p.y).toBeGreaterThan(0);
  });
});

describe('followPose', () => {
  it('looks at the army from where the camera already is around it, a bit closer than the overview', () => {
    const current = { x: 5, y: 1, z: 5, theta: 1.2, phi: 0.6, radius: 30 };
    const p = followPose(scale, { x: 1, y: 2, z: 3 }, current);
    expect([p.x, p.y, p.z]).toEqual([1, 2, 3]);
    expect(p.theta).toBe(1.2);
    expect(p.radius).toBeLessThan(overviewPose(scale).radius);
  });

  it('keeps the camera low enough to see the horizon and the mountains, never straight above or past it', () => {
    const low = followPose(scale, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, theta: 0, phi: 1.54, radius: 5 });
    expect(low.phi).toBeLessThanOrEqual(1.45);
    expect(low.phi).toBeGreaterThanOrEqual(1);
    const high = followPose(scale, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, theta: 0, phi: 0.1, radius: 5 });
    expect(high.phi).toBeGreaterThanOrEqual(1);
  });

  it('is close enough for the figures and the far mountains to show: nearer than where the figures give way to the marker', () => {
    const p = followPose(scale, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, theta: 0, phi: 1, radius: 30 });
    expect(p.radius).toBeLessThan(FIGURE_NEAR);
  });
});

describe('lookPoint', () => {
  const eye = { x: 0, y: 1, z: 0 };
  const target = { x: 0, y: 1, z: -4 };

  it('is the target while the camera is not past the horizon', () => {
    expect(lookPoint(eye, target, 1.2)).toEqual(target);
    expect(lookPoint(eye, target, Math.PI / 2)).toEqual(target);
  });

  it('looks up from the horizon by the angle past it, at the same distance, toward the same side', () => {
    const p = lookPoint(eye, target, Math.PI / 2 + 0.5);
    expect(p.y).toBeCloseTo(1 + 4 * Math.sin(0.5), 9);
    expect(p.z).toBeCloseTo(-4 * Math.cos(0.5), 9);
    expect(p.x).toBeCloseTo(0, 9);
    expect(Math.hypot(p.x - eye.x, p.y - eye.y, p.z - eye.z)).toBeCloseTo(4, 9);
  });

  it('survives a target straight above the eye', () => {
    const p = lookPoint(eye, { x: 0, y: 5, z: 0 }, 2);
    expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
  });
});

describe('steering the cinematic camera', () => {
  const left = { x: 1, y: 2, z: 3, theta: 0.5, phi: 1, radius: 2 };

  it('adds nothing when the user did not touch the camera', () => {
    expect(addSteer(NO_STEER, left, { ...left })).toEqual(NO_STEER);
  });

  it('adds the turn, the tilt and the zoom the user made since the camera was left', () => {
    const s = addSteer(NO_STEER, left, { ...left, theta: 0.8, phi: 1.3, radius: 1 });
    expect(s.theta).toBeCloseTo(0.3, 9);
    expect(s.phi).toBeCloseTo(0.3, 9);
    expect(s.zoom).toBeCloseTo(0.5, 9);
  });

  it('turns the short way around the circle', () => {
    const s = addSteer(NO_STEER, { ...left, theta: 3 }, { ...left, theta: -3 });
    expect(Math.abs(s.theta)).toBeLessThan(0.3);
  });

  it('keeps what it had and adds to it', () => {
    const once = addSteer(NO_STEER, left, { ...left, theta: 0.7 });
    const twice = addSteer(once, left, { ...left, theta: 0.7 });
    expect(twice.theta).toBeCloseTo(0.4, 9);
  });

  it('puts the turn of the user on top of where the cinematic camera wants to be, and never moves the target', () => {
    const base = { x: 1, y: 2, z: 3, theta: 1, phi: 0.9, radius: 3 };
    const p = steered(base, { theta: 0.5, phi: 0.2, zoom: 0.5 }, 1.9);
    expect([p.x, p.y, p.z]).toEqual([1, 2, 3]);
    expect(p.theta).toBeCloseTo(1.5, 9);
    expect(p.phi).toBeCloseTo(1.1, 9);
    expect(p.radius).toBeCloseTo(1.5, 9);
  });

  it('keeps the tilt between almost straight down and the highest angle', () => {
    const base = { x: 0, y: 0, z: 0, theta: 0, phi: 1, radius: 1 };
    expect(steered(base, { theta: 0, phi: 5, zoom: 1 }, 1.9).phi).toBe(1.9);
    expect(steered(base, { theta: 0, phi: -5, zoom: 1 }, 1.9).phi).toBeGreaterThan(0);
    expect(steered(base, { theta: 0, phi: -5, zoom: 1 }, 1.9).phi).toBeLessThan(0.2);
  });
});
