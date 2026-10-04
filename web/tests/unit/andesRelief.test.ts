import { describe, expect, it } from 'vitest';
import { cinePose, clearEye } from '../../src/scenes/andes/camera';
import { FIGURE_NEAR } from '../../src/scenes/andes/column';
import { buildPath } from '../../src/scenes/andes/pathAlong';
import { corridorFactor, hash2, noise2, reliefOffset, ridged, terrainColor } from '../../src/scenes/andes/relief';
import { buildChunk, createField, treePlacements } from '../../src/scenes/andes/reliefField';
import { sceneScale, toScene } from '../../src/scenes/andes/terrainMesh';
import { syntheticTerrain } from '../../src/terrain/synthetic';

describe('noise', () => {
  it('is deterministic, and the seed changes it', () => {
    expect(hash2(3, 4, 1)).toBe(hash2(3, 4, 1));
    expect(hash2(3, 4, 1)).not.toBe(hash2(3, 4, 2));
    expect(noise2(1.3, 2.7, 5)).toBe(noise2(1.3, 2.7, 5));
    expect(ridged(1.3, 2.7, 5)).toBe(ridged(1.3, 2.7, 5));
    expect(ridged(1.3, 2.7, 5)).not.toBe(ridged(1.3, 2.7, 6));
  });

  it('stays in range: hash 0 to 1, noise within -1 to 1, ridged 0 to 1', () => {
    for (let i = 0; i < 300; i += 1) {
      const x = i * 0.173 - 20;
      const y = i * 0.311 - 40;
      const h = hash2(i, -i, 9);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
      expect(Math.abs(noise2(x, y, 9))).toBeLessThanOrEqual(1);
      const r = ridged(x, y, 9);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it('is continuous: a tiny step moves it a tiny amount', () => {
    for (let i = 0; i < 50; i += 1) {
      const x = i * 0.37;
      expect(Math.abs(noise2(x + 1e-4, 1.1, 3) - noise2(x, 1.1, 3))).toBeLessThan(0.01);
    }
  });

  it('has relief of both signs and a spread that scales with the amplitude', () => {
    const values: number[] = [];
    for (let i = 0; i < 400; i += 1) values.push(reliefOffset(i * 0.05, i * 0.031, 7, 1));
    expect(Math.max(...values)).toBeGreaterThan(0);
    expect(Math.min(...values)).toBeLessThan(0);
    expect(reliefOffset(2.2, 3.3, 7, 2)).toBeCloseTo(2 * reliefOffset(2.2, 3.3, 7, 1), 9);
  });
});

describe('corridorFactor', () => {
  it('is 0 on the route, 1 far from it, and grows with the distance', () => {
    expect(corridorFactor(0, 0.3, 1.2)).toBe(0);
    expect(corridorFactor(0.3, 0.3, 1.2)).toBe(0);
    expect(corridorFactor(5, 0.3, 1.2)).toBe(1);
    let last = 0;
    for (let d = 0; d <= 1.5; d += 0.1) {
      const f = corridorFactor(d, 0.3, 1.2);
      expect(f).toBeGreaterThanOrEqual(last);
      last = f;
    }
  });
});

describe('terrainColor', () => {
  const c = (t: number, slope: number, n = 0) => {
    const out = { r: 0, g: 0, b: 0 };
    terrainColor(t, slope, n, n, out);
    return out;
  };

  it('puts snow on high gentle ground and not on a high cliff', () => {
    const snow = c(0.95, 0.05);
    const cliff = c(0.95, 0.9);
    expect(snow.b).toBeGreaterThan(0.9);
    expect(cliff.b).toBeLessThan(snow.b - 0.2);
  });

  it('shows bare rock, grey, on a steep slope at middle height', () => {
    const rock = c(0.5, 0.9);
    expect(Math.abs(rock.r - rock.b)).toBeLessThan(0.12);
    const soil = c(0.5, 0.05);
    expect(soil.r - soil.b).toBeGreaterThan(Math.abs(rock.r - rock.b));
  });

  it('is green in the low gentle valleys', () => {
    const v = c(0.05, 0.05);
    expect(v.g).toBeGreaterThan(v.r);
    expect(v.g).toBeGreaterThan(v.b);
  });

  it('stays within 0 to 1 and is deterministic', () => {
    for (let t = 0; t <= 1; t += 0.1) for (let s = 0; s <= 1; s += 0.2) {
      const a = c(t, s, 0.5);
      for (const v of [a.r, a.g, a.b]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(c(t, s, 0.5)).toEqual(a);
    }
  });
});

const terrain = syntheticTerrain([-71, -34, -69, -32], 60, 60);
const scale = sceneScale(terrain, { longSide: 20, exaggeration: 6 });
const routePoints = new Float32Array(
  [0, 0.25, 0.5, 0.75, 1].flatMap((f) => {
    const lon = -70.6 + f * 1.2;
    const lat = -33.3 + f * 0.8;
    const at = toScene(scale, lon, lat, 1000);
    return [at.x, at.y, at.z];
  })
);
const path = buildPath(routePoints);
const field = createField({ terrain, scale, path, seed: 11, amplitude: 3 });

describe('relief field', () => {
  it('has the base height exactly on the route: the army walks on the terrain it was placed on', () => {
    for (let i = 0; i < 5; i += 1) {
      const x = routePoints[i * 3]!;
      const z = routePoints[i * 3 + 2]!;
      expect(field.height(x, z)).toBeCloseTo(field.baseHeight(x, z), 4);
    }
  });

  it('adds relief away from the route, and is deterministic', () => {
    const x = routePoints[0]! + 3;
    const z = routePoints[2]! + 3;
    expect(field.distanceToRoute(x, z)).toBeGreaterThan(1.5);
    expect(Math.abs(field.height(x, z) - field.baseHeight(x, z))).toBeGreaterThan(0.01);
    expect(field.height(x, z)).toBe(field.height(x, z));
  });

  it('measures the distance to the route on the ground plane', () => {
    expect(field.distanceToRoute(routePoints[0]!, routePoints[2]!)).toBeCloseTo(0, 6);
    expect(field.distanceToRoute(routePoints[0]! - 2, routePoints[2]!)).toBeGreaterThanOrEqual(1.9);
  });
});

describe('relief field at the edge of the terrain', () => {
  it('goes on flat beyond the edge instead of falling to the lowest point (no cliff at the border)', () => {
    const edge = scale.width / 2;
    const z = routePoints[2]!;
    expect(Number.isFinite(field.baseHeight(edge + 5, z))).toBe(true);
    expect(field.baseHeight(edge + 0.2, z)).toBeCloseTo(field.baseHeight(edge + 5, z), 9);
    expect(Math.abs(field.baseHeight(edge - 0.01, z) - field.baseHeight(edge + 0.2, z))).toBeLessThan(0.3);
  });

  it('does not fall to the lowest point on any side, in a scan across each edge', () => {
    for (const [x0, z0, dx, dz] of [
      [scale.width / 2 - 1, 0, 0.02, 0],
      [-scale.width / 2 + 1, 0, -0.02, 0],
      [0, scale.depth / 2 - 1, 0, 0.02],
      [0, -scale.depth / 2 + 1, 0, -0.02]
    ] as const) {
      let last = field.baseHeight(x0, z0);
      for (let i = 1; i <= 100; i += 1) {
        const h = field.baseHeight(x0 + dx * i, z0 + dz * i);
        expect(Math.abs(h - last)).toBeLessThan(0.1); // a smooth slope, not a cliff down to the lowest point
        last = h;
      }
    }
  });
});

describe('buildChunk', () => {
  const size = 2;
  const cells = 12;
  const a = buildChunk(field, 0, 0, size, cells);
  const b = buildChunk(field, 1, 0, size, cells);

  it('has a grid of (cells + 1) squared vertices, two triangles per cell and a color and normal per vertex', () => {
    const n = (cells + 1) ** 2;
    expect(a.positions.length).toBe(n * 3);
    expect(a.normals.length).toBe(n * 3);
    expect(a.colors.length).toBe(n * 3);
    expect(a.indices.length).toBe(cells * cells * 6);
    expect(Math.max(...a.indices)).toBe(n - 1);
  });

  it('is deterministic', () => {
    expect(buildChunk(field, 0, 0, size, cells).positions).toEqual(a.positions);
  });

  it('meets its neighbor with no gap: the heights and the normals of the shared edge are equal', () => {
    for (let j = 0; j <= cells; j += 1) {
      const east = (j * (cells + 1) + cells) * 3; // last column of a
      const west = j * (cells + 1) * 3; // first column of b
      expect(a.positions[east]!).toBeCloseTo(b.positions[west]!, 6);
      expect(a.positions[east + 1]!).toBeCloseTo(b.positions[west + 1]!, 5);
      expect(a.positions[east + 2]!).toBeCloseTo(b.positions[west + 2]!, 6);
      expect(a.normals[east + 1]!).toBeCloseTo(b.normals[west + 1]!, 5);
    }
  });

  it('has unit normals that point up, and colors within 0 to 1', () => {
    for (let i = 0; i < a.normals.length; i += 3) {
      expect(Math.hypot(a.normals[i]!, a.normals[i + 1]!, a.normals[i + 2]!)).toBeCloseTo(1, 4);
      expect(a.normals[i + 1]!).toBeGreaterThan(0);
    }
    expect(Math.min(...a.colors)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...a.colors)).toBeLessThanOrEqual(1);
  });

  it('takes the height of the field at every vertex', () => {
    const i = 5 * (cells + 1) + 7;
    expect(a.positions[i * 3 + 1]!).toBeCloseTo(field.height(a.positions[i * 3]!, a.positions[i * 3 + 2]!), 5);
  });
});

describe('treePlacements', () => {
  const trees = treePlacements(field, 0, 0, 2);

  it('is deterministic and gives x, y, z and a size per tree', () => {
    expect(trees.length % 4).toBe(0);
    expect(treePlacements(field, 0, 0, 2)).toEqual(trees);
  });

  it('keeps every tree inside its chunk, on the ground, off the route and with a positive size', () => {
    for (let i = 0; i < trees.length; i += 4) {
      const [x, y, z, s] = [trees[i]!, trees[i + 1]!, trees[i + 2]!, trees[i + 3]!];
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(2);
      expect(z).toBeGreaterThanOrEqual(0);
      expect(z).toBeLessThan(2);
      expect(y).toBeCloseTo(field.height(x, z), 4);
      expect(field.distanceToRoute(x, z)).toBeGreaterThan(0.1);
      expect(s).toBeGreaterThan(0);
    }
  });

  it('has a bare chunk with a density of 0', () => {
    const high = treePlacements(field, 6, -6, 2, 0.0);
    expect(high.length).toBe(0);
  });
});

describe('cinePose', () => {
  const target = { x: 1, y: 2, z: 3 };
  const current = { x: 0, y: 0, z: 0, theta: 0.2, phi: 0.5, radius: 20 };

  it('looks at the target from the place given, with the angles and the distance that put the camera there', () => {
    const cam = { x: 1 - 3, y: 2 + 0.5, z: 3 }; // 3 to the west and a bit above
    const p = cinePose(target, cam, current, 1);
    expect([p.x, p.y, p.z]).toEqual([1, 2, 3]);
    expect(p.radius).toBeCloseTo(Math.hypot(3, 0.5), 9);
    // the camera position of the orbit: target + radius * (sin phi sin theta, cos phi, sin phi cos theta)
    expect(target.x + p.radius * Math.sin(p.phi) * Math.sin(p.theta)).toBeCloseTo(cam.x, 6);
    expect(target.y + p.radius * Math.cos(p.phi)).toBeCloseTo(cam.y, 6);
    expect(target.z + p.radius * Math.sin(p.phi) * Math.cos(p.theta)).toBeCloseTo(cam.z, 6);
  });

  it('is close enough for the figures and low enough to see the mountains', () => {
    const p = cinePose(target, { x: -2, y: 2.5, z: 3 }, current, 1);
    expect(p.radius).toBeLessThan(FIGURE_NEAR);
    expect(p.phi).toBeGreaterThan(1);
  });

  it('turns smoothly: k = 0 keeps the angles and the distance, and the angle goes the short way around the circle', () => {
    const cam = { x: 1, y: 2.5, z: 0 }; // south of... theta = pi
    const kept = cinePose(target, cam, current, 0);
    expect(kept.theta).toBeCloseTo(current.theta, 9);
    expect(kept.phi).toBeCloseTo(current.phi, 9);
    expect(kept.radius).toBeCloseTo(current.radius, 9);
    // from theta = pi - 0.1 to theta = -pi + 0.1: the short way crosses pi (cos = -1), the long way would cross 0 (cos = 1)
    const p = cinePose(target, { x: 1 - 0.3, y: 2.5, z: 0 }, { ...current, theta: Math.PI - 0.1 }, 0.5);
    expect(Math.cos(p.theta)).toBeLessThan(-0.9);
  });
});

describe('clearEye', () => {
  const target = { x: 10, y: 0.1, z: 0 };

  it('keeps the camera where it is when nothing is in the way', () => {
    expect(clearEye({ x: 0, y: 0.25, z: 0 }, target, () => 0, 0.1)).toBeCloseTo(0.25, 9);
  });

  it('raises it just enough for the line of sight to clear a hill in between, and never lowers it', () => {
    const hill = (x: number) => (Math.abs(x - 5) < 1 ? 2 : 0);
    const y = clearEye({ x: 0, y: 0.25, z: 0 }, target, hill, 0.1);
    expect(y).toBeGreaterThan(2);
    // the line from the raised eye to the target passes above the hill
    expect(y + (target.y - y) * 0.5).toBeGreaterThanOrEqual(2.1 - 1e-6);
    expect(clearEye({ x: 0, y: 50, z: 0 }, target, hill, 0.1)).toBe(50);
  });
});
