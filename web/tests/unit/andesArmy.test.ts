import { describe, expect, it } from 'vitest';
import { DEFAULT_FIGURES, FIGURE_NEAR, MAX_FIGURES, MEN_PER_FIGURE, columnSlots, figureCount, gaitAt, lodFor } from '../../src/scenes/andes/column';
import { FIGURE_PARTS, instanceCount } from '../../src/scenes/andes/figureParts';
import { arcAt, buildPath, sampleAlong, sampleAlongExtended } from '../../src/scenes/andes/pathAlong';
import { fromScene, sceneScale, toScene } from '../../src/scenes/andes/terrainMesh';
import { syntheticTerrain } from '../../src/terrain/synthetic';

describe('figureCount', () => {
  it('is one figure per MEN_PER_FIGURE men, and says the count is known', () => {
    expect(figureCount(3600, 1)).toEqual({ count: 3600 / MEN_PER_FIGURE, known: true });
  });

  it('draws a fixed schematic column and says the count is not known when there is no number (never 0)', () => {
    expect(figureCount(null, 1)).toEqual({ count: DEFAULT_FIGURES, known: false });
  });

  it('keeps at least one figure for a small force', () => {
    expect(figureCount(10, 1).count).toBe(1);
  });

  it('is capped by the quality tier', () => {
    expect(figureCount(1_000_000, 1).count).toBe(MAX_FIGURES);
    expect(figureCount(1_000_000, 0.2).count).toBe(Math.round(MAX_FIGURES * 0.2));
  });
});

describe('columnSlots', () => {
  it('has the leader first at the head of the column, then the rest behind it', () => {
    const slots = columnSlots(30);
    expect(slots).toHaveLength(30);
    expect(slots[0]).toMatchObject({ kind: 'leader', along: 0, lateral: 0 });
    for (const s of slots.slice(1)) expect(s.along).toBeGreaterThan(0);
  });

  it('is deterministic (no randomness)', () => {
    expect(columnSlots(40)).toEqual(columnSlots(40));
  });

  it('puts the figures in pairs left and right of the route, never on top of one another', () => {
    const slots = columnSlots(60);
    const seen = new Set<string>();
    for (const s of slots) {
      const key = `${s.along.toFixed(4)}:${s.lateral.toFixed(4)}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(slots.some((s) => s.lateral < 0)).toBe(true);
    expect(slots.some((s) => s.lateral > 0)).toBe(true);
  });

  it('mixes foot soldiers, riders and mules, mostly on foot', () => {
    const kinds = columnSlots(100).map((s) => s.kind);
    expect(kinds.filter((k) => k === 'foot').length).toBeGreaterThan(kinds.filter((k) => k === 'rider').length);
    expect(kinds).toContain('rider');
    expect(kinds).toContain('mule');
  });

  it('grows backwards with the count', () => {
    const last = (n: number) => columnSlots(n)[n - 1]!.along;
    expect(last(60)).toBeGreaterThan(last(20));
  });
});

describe('gaitAt', () => {
  it('moves the two legs in opposite directions and repeats every phase of 1', () => {
    for (const kind of ['foot', 'rider', 'mule', 'leader'] as const) {
      const a = gaitAt(kind, 0.3);
      expect(a.swing).toBeCloseTo(gaitAt(kind, 1.3).swing, 6);
      expect(Math.abs(a.swing)).toBeGreaterThan(0);
    }
    expect(gaitAt('foot', 0.25).swing).toBeCloseTo(-gaitAt('foot', 0.75).swing, 6);
  });

  it('bobs up (never below the ground) twice per stride', () => {
    for (let p = 0; p <= 1; p += 0.05) expect(gaitAt('foot', p).bob).toBeGreaterThanOrEqual(0);
    expect(gaitAt('foot', 0).bob).toBeCloseTo(gaitAt('foot', 0.5).bob, 6);
  });

  it('does not move when the army stands still (amount 0)', () => {
    expect(gaitAt('foot', 0.3, 0)).toEqual({ swing: 0, bob: 0 });
  });
});

describe('lodFor', () => {
  it('shows figures when the camera is near and the marker when it is far', () => {
    expect(lodFor(FIGURE_NEAR * 0.5, 'marker')).toBe('figures');
    expect(lodFor(FIGURE_NEAR * 3, 'figures')).toBe('marker');
  });

  it('has a margin so it does not flicker at the threshold', () => {
    expect(lodFor(FIGURE_NEAR * 1.1, 'figures')).toBe('figures');
    expect(lodFor(FIGURE_NEAR * 1.1, 'marker')).toBe('marker');
  });
});

describe('path sampling', () => {
  // an L: 3 units east, then 4 units south, flat on y except a rise of 2 on the first leg
  const path = buildPath(new Float32Array([0, 0, 0, 3, 2, 0, 3, 2, 4]));

  it('has the cumulative length along the polyline', () => {
    expect(path.length).toBeCloseTo(Math.hypot(3, 2) + 4, 6);
  });

  it('samples a point by arc length with its height and the direction of travel', () => {
    const out = { x: 0, y: 0, z: 0, heading: 0 };
    sampleAlong(path, 0, out);
    expect([out.x, out.y, out.z]).toEqual([0, 0, 0]);
    expect(out.heading).toBeCloseTo(Math.atan2(3, 0), 6); // east
    sampleAlong(path, Math.hypot(3, 2) + 2, out);
    expect(out.x).toBeCloseTo(3, 6);
    expect(out.z).toBeCloseTo(2, 6);
    expect(out.heading).toBeCloseTo(Math.atan2(0, 4), 6); // south
  });

  it('clamps to the ends instead of leaving the route', () => {
    const out = { x: 0, y: 0, z: 0, heading: 0 };
    sampleAlong(path, -5, out);
    expect([out.x, out.z]).toEqual([0, 0]);
    sampleAlong(path, 999, out);
    expect([out.x, out.z]).toEqual([3, 4]);
  });

  it('gives the arc length at a fractional sample index', () => {
    expect(arcAt(path, 0)).toBe(0);
    expect(arcAt(path, 1)).toBeCloseTo(Math.hypot(3, 2), 6);
    expect(arcAt(path, 0.5)).toBeCloseTo(Math.hypot(3, 2) / 2, 6);
    expect(arcAt(path, 5)).toBeCloseTo(path.length, 6);
  });

  it('survives a path of one point or a repeated point', () => {
    const out = { x: 9, y: 9, z: 9, heading: 0 };
    sampleAlong(buildPath(new Float32Array([1, 2, 3])), 4, out);
    expect([out.x, out.y, out.z]).toEqual([1, 2, 3]);
    const dup = buildPath(new Float32Array([0, 0, 0, 0, 0, 0, 2, 0, 0]));
    sampleAlong(dup, 1, out);
    expect(out.x).toBeCloseTo(1, 6);
    expect(Number.isFinite(out.heading)).toBe(true);
  });
});

describe('fromScene', () => {
  const terrain = syntheticTerrain([-71, -34, -69, -32], 40, 40);
  const scale = sceneScale(terrain, { longSide: 20, exaggeration: 4 });

  it('is the inverse of toScene on the ground plane', () => {
    const at = toScene(scale, -69.7, -32.4, 1500);
    const back = fromScene(scale, at.x, at.z);
    expect(back.lon).toBeCloseTo(-69.7, 9);
    expect(back.lat).toBeCloseTo(-32.4, 9);
  });
});

describe('sampleAlongExtended', () => {
  const path = buildPath(new Float32Array([0, 0, 0, 3, 0, 0]));

  it('goes on in a straight line behind the start, so the tail of the column does not pile up on the first point', () => {
    const out = { x: 0, y: 0, z: 0, heading: 0 };
    sampleAlongExtended(path, -2, out);
    expect(out.x).toBeCloseTo(-2, 6);
    expect(out.z).toBeCloseTo(0, 6);
    expect(out.heading).toBeCloseTo(Math.PI / 2, 6);
  });

  it('is the plain sample inside the path', () => {
    const out = { x: 0, y: 0, z: 0, heading: 0 };
    sampleAlongExtended(path, 1, out);
    expect(out.x).toBeCloseTo(1, 6);
  });
});

describe('figure parts', () => {
  const kinds = ['leader', 'foot', 'rider', 'mule'] as const;

  it('every kind has parts with a real size', () => {
    for (const kind of kinds) {
      expect(FIGURE_PARTS[kind].length).toBeGreaterThan(3);
      for (const p of FIGURE_PARTS[kind]) expect(p.size.every((v) => v > 0)).toBe(true);
    }
  });

  it('stands on the ground: the lowest point of every kind is at 0 and nothing is below it', () => {
    for (const kind of kinds) {
      const bottoms = FIGURE_PARTS[kind].map((p) => (p.leg ? p.at[1] - p.size[1] : p.at[1] - p.size[1] / 2));
      expect(Math.min(...bottoms)).toBeCloseTo(0, 6);
    }
  });

  it('swings the legs of the horse and the mule in diagonal pairs and the soldier in opposite ones', () => {
    for (const kind of kinds) {
      const legs = FIGURE_PARTS[kind].filter((p) => p.leg);
      expect(legs.filter((p) => p.leg === 1).length).toBe(legs.filter((p) => p.leg === -1).length);
    }
    const horse = FIGURE_PARTS.rider.filter((p) => p.leg);
    expect(horse).toHaveLength(4);
    const front = horse.filter((p) => p.at[2] > 0);
    expect(front[0]!.leg).toBe(-front[1]!.leg!);
    const back = horse.filter((p) => p.at[2] < 0);
    const fl = front.find((p) => p.at[0] < 0)!;
    const bl = back.find((p) => p.at[0] < 0)!;
    expect(fl.leg).toBe(-bl.leg!);
  });

  it('has the pennant only on the leader', () => {
    expect(FIGURE_PARTS.leader.length).toBeGreaterThan(FIGURE_PARTS.rider.length);
  });

  it('counts the instances a column needs, kind by kind', () => {
    const slots = columnSlots(10);
    const total = slots.reduce((n, s) => n + FIGURE_PARTS[s.kind].length, 0);
    expect(instanceCount(slots)).toBe(total);
  });
});
