// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { BoxGeometry, LineSegments, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { createFloor, floorGridLines } from '../../src/three/floor';

describe('floorGridLines', () => {
  it('has a line at every step from edge to edge, centred, and every fifth one is a major line', () => {
    const lines = floorGridLines(10, 1, 5);
    expect(lines.map((l) => l.at)).toEqual([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
    expect(lines.filter((l) => l.major).map((l) => l.at)).toEqual([-5, 0, 5]);
  });

  it('puts the lines in whole units even when the floor is not a whole number wide', () => {
    const lines = floorGridLines(7.4, 1, 5);
    expect(Math.min(...lines.map((l) => l.at))).toBeGreaterThanOrEqual(-3.7);
    expect(Math.max(...lines.map((l) => l.at))).toBeLessThanOrEqual(3.7);
    expect(lines.every((l) => Number.isInteger(l.at))).toBe(true);
  });
});

describe('createFloor', () => {
  const sheetOf = (floor: ReturnType<typeof createFloor>) => floor.children.find((c): c is Mesh => c instanceof Mesh && c.geometry instanceof PlaneGeometry)!;

  it('has a see-through sheet with the grid, lying on the floor and not hiding the bars', () => {
    const sheet = sheetOf(createFloor(12, 4));
    const geometry = sheet.geometry as PlaneGeometry;
    expect(geometry.parameters.width).toBe(12);
    expect(geometry.parameters.height).toBe(4);
    const material = sheet.material as MeshBasicMaterial;
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(sheet.position.y).toBeGreaterThanOrEqual(0);
    expect(sheet.position.y).toBeLessThan(0.05);
    expect(Math.abs(sheet.rotation.x + Math.PI / 2)).toBeLessThan(1e-9); // lying down: its normal points up
  });

  it('has a thin solid slab under the bars, so that from the side the floor is one clean line', () => {
    const floor = createFloor(12, 4);
    const slab = floor.children.find((c): c is Mesh => c instanceof Mesh && c.geometry instanceof BoxGeometry)!;
    const box = slab.geometry as BoxGeometry;
    expect(box.parameters.width).toBe(12);
    expect(box.parameters.depth).toBe(4);
    expect(box.parameters.height).toBeLessThan(0.12); // thinner than the plate it replaces
    expect((slab.material as MeshBasicMaterial).transparent).toBe(false); // solid: it does not blur into the background
    expect(slab.position.y + box.parameters.height / 2).toBeLessThanOrEqual(1e-9); // its top is at the foot of the bars
  });

  it('has a crisp edge line around the floor', () => {
    const floor = createFloor(12, 4);
    const edge = floor.children.find((c) => c instanceof LineSegments)!;
    expect(edge).toBeDefined();
    expect(edge.position.y).toBeGreaterThanOrEqual(0);
  });
});
