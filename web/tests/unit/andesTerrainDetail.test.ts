import { describe, expect, it } from 'vitest';
import { TREE_HEIGHT, createTreeGeometry } from '../../src/scenes/andes/detail3d';
import { buildPath } from '../../src/scenes/andes/pathAlong';
import { TRAIL_COLOR, tileableNoise, trailBlend } from '../../src/scenes/andes/relief';
import { TRAIL_CORE, TRAIL_EDGE, buildChunk, buildPatch, createField, treePlacements } from '../../src/scenes/andes/reliefField';
import { sceneScale, toScene } from '../../src/scenes/andes/terrainMesh';
import { syntheticTerrain } from '../../src/terrain/synthetic';

const terrain = syntheticTerrain([-71, -34, -69, -32], 60, 60);
const scale = sceneScale(terrain, { longSide: 20, exaggeration: 6 });
const routePoints = new Float32Array(
  [0, 0.25, 0.5, 0.75, 1].flatMap((f) => {
    const at = toScene(scale, -70.6 + f * 1.2, -33.3 + f * 0.8, 1000);
    return [at.x, at.y, at.z];
  })
);
const field = createField({ terrain, scale, path: buildPath(routePoints), seed: 11, amplitude: 3 });

describe('the painted trail', () => {
  it('is all trail inside the core, none beyond the edge, and smooth between', () => {
    expect(trailBlend(0, 0.14, 0.3)).toBe(1);
    expect(trailBlend(0.14, 0.14, 0.3)).toBe(1);
    expect(trailBlend(0.3, 0.14, 0.3)).toBe(0);
    expect(trailBlend(5, 0.14, 0.3)).toBe(0);
    expect(trailBlend(Infinity, 0.14, 0.3)).toBe(0);
    const mid = trailBlend(0.22, 0.14, 0.3);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it('has a core as wide as the column and an edge a little beyond', () => {
    expect(TRAIL_CORE).toBeGreaterThanOrEqual(0.12);
    expect(TRAIL_EDGE).toBeGreaterThan(TRAIL_CORE);
  });

  it('paints the vertices on the route the color of the trail and leaves the ones far from it as they were', () => {
    const size = 2;
    const x = routePoints[6]!;
    const z = routePoints[8]!;
    const chunk = buildChunk(field, Math.floor(x / size), Math.floor(z / size), size, 40);
    const away = (i: number) =>
      Math.hypot(chunk.colors[i * 3]! - TRAIL_COLOR[0], chunk.colors[i * 3 + 1]! - TRAIL_COLOR[1], chunk.colors[i * 3 + 2]! - TRAIL_COLOR[2]);
    const near: number[] = [];
    const farAway: number[] = [];
    for (let i = 0; i < chunk.positions.length / 3; i += 1) {
      const d = field.distanceToRoute(chunk.positions[i * 3]!, chunk.positions[i * 3 + 2]!);
      if (d < TRAIL_CORE * 0.5) near.push(away(i));
      else if (d > TRAIL_EDGE) farAway.push(away(i));
    }
    const mean = (a: number[]) => a.reduce((t, v) => t + v, 0) / a.length;
    expect(near.length).toBeGreaterThan(3);
    expect(farAway.length).toBeGreaterThan(100);
    expect(mean(near)).toBeLessThan(0.12);
    expect(mean(farAway)).toBeGreaterThan(mean(near) * 1.5);
  });
});

describe('texture coordinates of a chunk', () => {
  const a = buildChunk(field, 0, 0, 2, 12);
  const b = buildChunk(field, 1, 0, 2, 12);

  it('has a pair per vertex, in world space, so a neighbor continues the same texture', () => {
    expect(a.uvs.length).toBe(13 ** 2 * 2);
    for (let j = 0; j <= 12; j += 1) {
      const east = (j * 13 + 12) * 2;
      const west = j * 13 * 2;
      expect(a.uvs[east]!).toBeCloseTo(b.uvs[west]!, 6);
      expect(a.uvs[east + 1]!).toBeCloseTo(b.uvs[west + 1]!, 6);
    }
  });

  it('grows with the ground: a vertex further east has a larger u', () => {
    expect(a.uvs[12 * 2]!).toBeGreaterThan(a.uvs[0]!);
  });
});

describe('buildPatch', () => {
  const patch = buildPatch(field, -3, -2, 6, 4, 12, 8);

  it('has (cx + 1) by (cz + 1) vertices over the rectangle, two triangles per cell, and the height of the field at each', () => {
    const n = 13 * 9;
    expect(patch.positions.length).toBe(n * 3);
    expect(patch.colors.length).toBe(n * 3);
    expect(patch.uvs.length).toBe(n * 2);
    expect(patch.indices.length).toBe(12 * 8 * 6);
    expect(Math.max(...patch.indices)).toBe(n - 1);
    expect(patch.positions[0]).toBeCloseTo(-3, 6);
    expect(patch.positions[2]).toBeCloseTo(-2, 6);
    expect(patch.positions[(n - 1) * 3]).toBeCloseTo(3, 6);
    expect(patch.positions[(n - 1) * 3 + 2]).toBeCloseTo(2, 6);
    const i = 4 * 13 + 5;
    expect(patch.positions[i * 3 + 1]!).toBeCloseTo(field.height(patch.positions[i * 3]!, patch.positions[i * 3 + 2]!), 5);
  });

  it('is what buildChunk gives for a square at the same place', () => {
    const square = buildPatch(field, 0, 0, 2, 2, 12, 12);
    const chunk = buildChunk(field, 0, 0, 2, 12);
    expect(square.positions).toEqual(chunk.positions);
    expect(square.indices).toEqual(chunk.indices);
  });
});

describe('fewer and bigger trees', () => {
  it('has few candidates per chunk: at most one every half unit', () => {
    let most = 0;
    for (let cz = -4; cz < 4; cz += 1) {
      for (let cx = -4; cx < 4; cx += 1) most = Math.max(most, treePlacements(field, cx, cz, 2, 1).length / 4);
    }
    expect(most).toBeLessThanOrEqual(16);
  });

  it('are as tall as several soldiers (a soldier is about 0.07 on the screen)', () => {
    expect(TREE_HEIGHT).toBeGreaterThanOrEqual(0.2);
  });

  it('has a trunk and a crown of two colors, standing on the ground', () => {
    const g = createTreeGeometry();
    g.computeBoundingBox();
    expect(g.boundingBox!.min.y).toBeCloseTo(0, 6);
    expect(g.boundingBox!.max.y).toBeCloseTo(TREE_HEIGHT, 6);
    const color = g.getAttribute('color');
    expect(color).toBeDefined();
    const seen = new Set<string>();
    for (let i = 0; i < color!.count; i += 1) seen.add([color!.getX(i), color!.getY(i), color!.getZ(i)].map((v) => v.toFixed(2)).join(','));
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });
});

describe('tileableNoise', () => {
  const size = 32;
  const n = tileableNoise(size, 3);

  it('has a value per texel, between 0 and 1, and is deterministic', () => {
    expect(n.length).toBe(size * size);
    expect(Math.min(...n)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...n)).toBeLessThanOrEqual(1);
    expect(tileableNoise(size, 3)).toEqual(n);
    expect(tileableNoise(size, 4)).not.toEqual(n);
  });

  it('is not flat', () => {
    expect(new Set([...n].map((v) => v.toFixed(2))).size).toBeGreaterThan(10);
  });

  it('tiles: the last column meets the first as smoothly as two neighbors do, in both directions', () => {
    let wrapX = 0;
    let stepX = 0;
    let wrapY = 0;
    let stepY = 0;
    for (let k = 0; k < size; k += 1) {
      wrapX += Math.abs(n[k * size]! - n[k * size + size - 1]!);
      stepX += Math.abs(n[k * size + 1]! - n[k * size]!);
      wrapY += Math.abs(n[k]! - n[(size - 1) * size + k]!);
      stepY += Math.abs(n[size + k]! - n[k]!);
    }
    expect(wrapX).toBeLessThan(stepX * 3 + 0.5);
    expect(wrapY).toBeLessThan(stepY * 3 + 0.5);
  });
});
