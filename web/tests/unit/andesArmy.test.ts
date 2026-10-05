import { describe, expect, it } from 'vitest';
import { DEFAULT_FIGURES, FIGURE_NEAR, MAX_FIGURES, MEN_PER_FIGURE, columnSlots, figureCount, gaitAt, lodFor, startingMen } from '../../src/scenes/andes/column';
import { closePose } from '../../src/scenes/andes/camera';
import { figuresNote } from '../../src/scenes/andes/data';
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
    for (const kind of ['foot', 'rider', 'rider_black', 'mule', 'leader'] as const) {
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
  const kinds = ['leader', 'foot', 'rider', 'rider_black', 'mule'] as const;

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

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
/** the body of the horse: the longest box of the figure */
const horseBody = (kind: 'leader' | 'rider' | 'rider_black') => [...FIGURE_PARTS[kind]].sort((a, b) => b.size[2] - a.size[2])[0]!;

describe('horses', () => {
  it('has a white horse for the leader, a brown one and a black one for the riders', () => {
    expect(luminance(horseBody('leader').color)).toBeGreaterThan(0.75);
    const brown = horseBody('rider').color;
    expect(luminance(brown)).toBeGreaterThan(0.12);
    expect(luminance(brown)).toBeLessThan(0.4);
    expect(luminance(horseBody('rider_black').color)).toBeLessThan(0.1);
  });

  it('puts both brown and black riders in the column, and only one white horse', () => {
    const kinds = columnSlots(100).map((s) => s.kind);
    expect(kinds.filter((k) => k === 'rider').length).toBeGreaterThan(2);
    expect(kinds.filter((k) => k === 'rider_black').length).toBeGreaterThan(2);
    expect(kinds.filter((k) => k === 'leader')).toHaveLength(1);
  });

  it('moves the legs of the black horse like the others', () => {
    const legs = FIGURE_PARTS.rider_black.filter((p) => p.leg);
    expect(legs).toHaveLength(4);
    expect(gaitAt('rider_black', 0.3).swing).not.toBe(0);
  });
});

describe('the leader', () => {
  const hat = (kind: 'leader' | 'rider') => FIGURE_PARTS[kind].find((p) => p.at[1] > 0.2 && p.size[2] > 0.03 && !p.leg && p.size[1] < 0.05 && p.at[2] < 0.05);

  it('wears a bicorn worn front to back (long along the direction of travel), unlike the shako of the others', () => {
    const bicorn = hat('leader')!;
    expect(bicorn).toBeDefined();
    expect(bicorn.size[2]).toBeGreaterThan(bicorn.size[0] * 2.5);
  });

  it('is the only rider with that hat', () => {
    expect(hat('rider')).toBeUndefined();
  });
});

describe('the foot soldier', () => {
  const foot = FIGURE_PARTS.foot;
  const rifle = foot.filter((p) => Math.max(...p.size) >= 0.1 && Math.min(...p.size) >= 0.007);

  it('carries a rifle big enough to see from the close camera', () => {
    expect(rifle.length).toBeGreaterThan(0);
  });

  it('has two arms and only one of them swings (the other holds the rifle)', () => {
    const arms = foot.filter((p) => p.arm);
    expect(arms).toHaveLength(1);
    const holding = foot.filter((p) => !p.arm && !p.leg && p.size[1] >= 0.03 && p.size[0] <= 0.014 && p.size[2] <= 0.014 && p.at[1] > 0.06);
    expect(holding.length).toBeGreaterThan(0);
  });

  it('swings the arm against the leg on its own side', () => {
    const arm = foot.find((p) => p.arm)!;
    const sameSideLeg = foot.find((p) => p.leg && Math.sign(p.at[0]) === Math.sign(arm.at[0]))!;
    expect(arm.arm).toBe(-sameSideLeg.leg!);
  });

  it('keeps the arm out of the legs rule: legs stay balanced', () => {
    const legs = foot.filter((p) => p.leg);
    expect(legs.filter((p) => p.leg === 1)).toHaveLength(1);
    expect(legs.filter((p) => p.leg === -1)).toHaveLength(1);
  });
});

describe('a natural column', () => {
  it('is more than the old one: a force of 5000 men is 100 figures or more', () => {
    expect(figureCount(5000, 1).count).toBeGreaterThanOrEqual(100);
    expect(DEFAULT_FIGURES).toBeGreaterThanOrEqual(48);
  });

  it('is not a grid: laterals and distances vary, but stay deterministic and never behind the leader', () => {
    const slots = columnSlots(90);
    expect(new Set(slots.map((s) => s.lateral.toFixed(3))).size).toBeGreaterThan(20);
    expect(new Set(slots.map((s) => s.along.toFixed(3))).size).toBeGreaterThan(30);
    expect(columnSlots(90)).toEqual(slots);
    for (const s of slots.slice(1)) expect(s.along).toBeGreaterThan(0);
  });

  it('keeps the column on the road: nobody strays further than three abreast plus a little', () => {
    for (const s of columnSlots(150)) expect(Math.abs(s.lateral)).toBeLessThan(0.2);
  });

  it('gives each figure its own size and shade, within a few percent, and the leader none', () => {
    const slots = columnSlots(60);
    expect(slots[0]).toMatchObject({ scale: 1, tint: 0 });
    for (const s of slots) {
      expect(s.scale).toBeGreaterThan(0.9);
      expect(s.scale).toBeLessThan(1.1);
      expect(Math.abs(s.tint)).toBeLessThanOrEqual(0.05);
    }
    expect(new Set(slots.map((s) => s.scale.toFixed(3))).size).toBeGreaterThan(10);
  });

  it('does not stack figures: no two are closer than the body of a horse', () => {
    const slots = columnSlots(150);
    let closest = Infinity;
    for (let i = 0; i < slots.length; i += 1) {
      for (let j = i + 1; j < slots.length; j += 1) {
        closest = Math.min(closest, Math.hypot(slots[i]!.along - slots[j]!.along, slots[i]!.lateral - slots[j]!.lateral));
      }
    }
    expect(closest).toBeGreaterThan(0.05);
  });
});

describe('startingMen', () => {
  it('is the count of the first force of the first point of the route', () => {
    expect(startingMen([{ forces: [{ men: 3600 }, { men: 100 }] }, { forces: [{ men: 3500 }] }])).toBe(3600);
  });

  it('is null (and never 0) when there is no count, no force or no point', () => {
    expect(startingMen([{ forces: [{ men: null }] }])).toBeNull();
    expect(startingMen([{ forces: [] }])).toBeNull();
    expect(startingMen([])).toBeNull();
  });
});

describe('figuresNote', () => {
  it('says what a figure stands for and that the mix is only illustrative', () => {
    const t = figuresNote(true);
    expect(t).toContain(String(MEN_PER_FIGURE));
    expect(t).toContain('ilustrativa');
  });

  it('says when the count is not known and the column has a fixed size', () => {
    const t = figuresNote(false);
    expect(t).toContain('sin dato');
    expect(t).not.toContain(String(MEN_PER_FIGURE));
  });
});

describe('closePose', () => {
  const terrain = syntheticTerrain([-71, -34, -69, -32], 40, 40);
  const scale = sceneScale(terrain, { longSide: 20, exaggeration: 4 });

  it('looks at the army from so close that the figures show, keeping the turn the camera has', () => {
    const p = closePose(scale, { x: 1, y: 2, z: 3 }, { x: 0, y: 0, z: 0, theta: 1.1, phi: 0.2, radius: 30 });
    expect([p.x, p.y, p.z]).toEqual([1, 2, 3]);
    expect(p.theta).toBe(1.1);
    expect(p.radius).toBeLessThan(FIGURE_NEAR);
    expect(p.phi).toBeGreaterThan(0.5);
  });
});
