import { describe, expect, it } from 'vitest';
import { BATTLE_UNITS } from '../../src/scenes/andes/battleField';
import { FIELD, HILLS, LOOKOUT, WORLD_UNIT_M, heightAt, heightGrid, slopeAt, toWorld } from '../../src/scenes/andes/diorama/field';

describe('heightAt', () => {
  it('is deterministic and has no holes below the base', () => {
    expect(heightAt(123, -456)).toBe(heightAt(123, -456));
    for (let e = -FIELD.halfEastM; e <= FIELD.halfEastM; e += 400) for (let n = -FIELD.halfNorthM; n <= FIELD.halfNorthM; n += 400) expect(heightAt(e, n)).toBeGreaterThanOrEqual(0);
  });

  it('raises each hill above the plain between it and the middle of the field', () => {
    for (const h of HILLS) {
      const d = Math.hypot(h.eastM, h.northM);
      const toward = { e: h.eastM - (h.eastM / d) * h.radiusM * 2.2, n: h.northM - (h.northM / d) * h.radiusM * 2.2 };
      expect(heightAt(h.eastM, h.northM)).toBeGreaterThan(heightAt(toward.e, toward.n) + h.heightM * 0.5);
    }
  });

  it('makes the lookout hill, behind the patriots, a high place that looks over the field', () => {
    const north = BATTLE_UNITS.filter((u) => u.side === 'patriot').map((u) => u.northM);
    expect(LOOKOUT.northM).toBeGreaterThan(Math.max(...north));
    expect(heightAt(LOOKOUT.eastM, LOOKOUT.northM)).toBeGreaterThan(heightAt(0, 0) + 80);
  });

  it('is gentle enough to stand an army on: every unit is on a slope under 20 degrees', () => {
    for (const u of BATTLE_UNITS) expect(slopeAt(u.eastM, u.northM)).toBeLessThan((20 * Math.PI) / 180);
  });
});

describe('heightGrid', () => {
  it('has (n + 1) x (n + 1) samples across the whole field', () => {
    const grid = heightGrid(8, 6);
    expect(grid).toHaveLength(9 * 7);
    expect(grid[0]).toBeCloseTo(heightAt(-FIELD.halfEastM, FIELD.halfNorthM), 4);
    expect(grid[grid.length - 1]).toBeCloseTo(heightAt(FIELD.halfEastM, -FIELD.halfNorthM), 4);
  });
});

describe('toWorld', () => {
  it('turns meters east and north into scene units (x east, z south)', () => {
    expect(toWorld(WORLD_UNIT_M, WORLD_UNIT_M)).toEqual({ x: 1, z: -1 });
    expect(toWorld(0, 0)).toEqual({ x: 0, z: -0 });
  });
});
