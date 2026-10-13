import { describe, expect, it } from 'vitest';
import { LOOKOUT, toWorld } from '../../src/scenes/andes/diorama/field';
import { DEFAULT_VIEW, DIORAMA_VIEWS, TARGET_BOX, VERTICAL_EXAGGERATION, groundUnits } from '../../src/scenes/andes/diorama/views';

const cameraOf = (p: { x: number; y: number; z: number; theta: number; phi: number; radius: number }) => ({
  x: p.x + p.radius * Math.sin(p.phi) * Math.sin(p.theta),
  y: p.y + p.radius * Math.cos(p.phi),
  z: p.z + p.radius * Math.sin(p.phi) * Math.cos(p.theta)
});

describe('DIORAMA_VIEWS', () => {
  it('has the five views, each with a label and a pose that stays above the ground (the camera is higher than its target)', () => {
    expect(DIORAMA_VIEWS.map((v) => v.id)).toEqual(['mirador', 'frente', 'flanco', 'aerea', 'sanmartin']);
    for (const v of DIORAMA_VIEWS) {
      expect(v.label.length).toBeGreaterThan(3);
      expect(cameraOf(v.pose).y).toBeGreaterThan(v.pose.y);
      expect(v.pose.phi).toBeGreaterThan(0);
      expect(v.pose.phi).toBeLessThan(1.55);
    }
  });

  it('starts over the shoulder of San Martín: the camera is north of the field (z negative, since z is south) and looks south', () => {
    expect(DEFAULT_VIEW.id).toBe('mirador');
    expect(cameraOf(DEFAULT_VIEW.pose).z).toBeLessThan(DEFAULT_VIEW.pose.z);
  });

  it('shows the field from the royalists side too, with the camera south of its target', () => {
    const frente = DIORAMA_VIEWS.find((v) => v.id === 'frente')!;
    expect(cameraOf(frente.pose).z).toBeGreaterThan(frente.pose.z);
  });

  it('puts the close view on the lookout, near San Martín', () => {
    const w = toWorld(LOOKOUT.eastM, LOOKOUT.northM);
    const close = DIORAMA_VIEWS.find((v) => v.id === 'sanmartin')!;
    expect(Math.hypot(close.pose.x - w.x, close.pose.z - w.z)).toBeLessThan(2);
    expect(close.pose.radius).toBeLessThan(8);
  });

  it('keeps every target inside the box the camera may move in', () => {
    for (const v of DIORAMA_VIEWS) {
      expect(v.pose.x).toBeGreaterThanOrEqual(TARGET_BOX.minX);
      expect(v.pose.x).toBeLessThanOrEqual(TARGET_BOX.maxX);
      expect(v.pose.z).toBeGreaterThanOrEqual(TARGET_BOX.minZ);
      expect(v.pose.z).toBeLessThanOrEqual(TARGET_BOX.maxZ);
    }
  });
});

describe('groundUnits', () => {
  it('exaggerates the height of the ground the way a diorama does', () => {
    expect(groundUnits(100)).toBeCloseTo((100 * VERTICAL_EXAGGERATION) / 100, 6);
    expect(VERTICAL_EXAGGERATION).toBeGreaterThan(1);
  });
});
