import { describe, expect, it } from 'vitest';
import { columnSlots } from '../../src/scenes/andes/column';
import { battleSlots, battleWidth } from '../../src/scenes/andes/battleLine';
import { BATTLE_VIEW } from '../../src/scenes/andes/tour';
import { MAX_LINE_SPACING_KM, formationBalls } from '../../src/scenes/andes/forces';

const slots = columnSlots(80);
const offsets = battleSlots(slots);
const at = (kind: string) => slots.map((s, i) => ({ s, o: offsets[i]! })).filter(({ s }) => s.kind === kind);

describe('battleSlots', () => {
  it('gives every figure a place', () => {
    expect(offsets).toHaveLength(slots.length);
    for (const o of offsets) {
      expect(Number.isFinite(o.x)).toBe(true);
      expect(Number.isFinite(o.z)).toBe(true);
    }
  });

  it('puts the infantry in a line across (side by side, in ranks one behind the other), centered', () => {
    const foot = at('foot').map(({ o }) => o);
    expect(foot.length).toBeGreaterThan(10);
    const xs = foot.map((o) => o.x);
    expect((Math.max(...xs) + Math.min(...xs)) / 2).toBeCloseTo(0, 6);
    expect(Math.max(...foot.map((o) => o.z))).toBe(0); // the first rank is the front
    expect(Math.min(...foot.map((o) => o.z))).toBeLessThanOrEqual(0);
  });

  it('keeps the cavalry apart from the infantry, on both wings, in line with its front rank', () => {
    const footX = at('foot').map(({ o }) => Math.abs(o.x));
    const widest = Math.max(...footX);
    const horse = [...at('rider'), ...at('rider_black')].map(({ o }) => o);
    expect(horse.length).toBeGreaterThan(5);
    for (const o of horse) expect(Math.abs(o.x)).toBeGreaterThan(widest);
    expect(horse.some((o) => o.x < 0)).toBe(true);
    expect(horse.some((o) => o.x > 0)).toBe(true);
    expect(Math.max(...horse.map((o) => o.z))).toBe(0);
  });

  it('puts the leader in front of the line and the mules behind it', () => {
    const leader = at('leader')[0]!.o;
    expect(leader.z).toBeGreaterThan(0);
    expect(leader.x).toBe(0);
    const behind = Math.min(...at('foot').map(({ o }) => o.z));
    for (const { o } of at('mule')) expect(o.z).toBeLessThan(behind);
  });

  it('is symmetric: as many places on the left of the center as on the right for the infantry', () => {
    const left = at('foot').filter(({ o }) => o.x < -1e-9).length;
    const right = at('foot').filter(({ o }) => o.x > 1e-9).length;
    expect(Math.abs(left - right)).toBeLessThanOrEqual(at('foot').length / 8);
  });
});

describe('battleWidth', () => {
  it('is how wide the line of a force is, and grows with its size', () => {
    expect(battleWidth(80)).toBeGreaterThan(battleWidth(14));
    expect(battleWidth(14)).toBeGreaterThan(0);
  });
});

describe('formationBalls', () => {
  const groups = [
    { id: 'main', count: 8, small: false },
    { id: 'las-heras', count: 2, small: false }
  ];
  const center: [number, number] = [-70.7, -32.98];
  const balls = formationBalls(groups, center, 0.3);

  it('puts every ball of every group in one row, side by side, the first group first (to the west)', () => {
    expect(balls).toHaveLength(10);
    const lons = balls.map((b) => b.lon);
    expect(lons).toEqual([...lons].sort((a, b) => a - b));
    expect(balls.slice(0, 8).every((b) => b.id === 'main')).toBe(true);
    expect(balls.slice(8).every((b) => b.id === 'las-heras')).toBe(true);
  });

  it('is one line, at the latitude of the center, centered on it', () => {
    for (const b of balls) expect(b.lat).toBe(center[1]);
    const lons = balls.map((b) => b.lon);
    expect((lons[0]! + lons[9]!) / 2).toBeCloseTo(center[0], 6);
  });

  it('never spreads the balls farther apart than a real front: the spacing is capped', () => {
    const far = formationBalls(groups, center, 80);
    const capped = formationBalls(groups, center, MAX_LINE_SPACING_KM);
    expect(far[0]!.lon).toBeCloseTo(capped[0]!.lon, 9);
    expect(MAX_LINE_SPACING_KM).toBeLessThan(1);
  });
});

describe('BATTLE_VIEW', () => {
  it('is the view the reader saved for the battle: close, tilted, over Chacabuco', () => {
    expect(BATTLE_VIEW).toMatchObject({ lon: -70.69952, lat: -32.99905, zoom: 13.64, pitch: 77, bearing: -32 });
  });
});
