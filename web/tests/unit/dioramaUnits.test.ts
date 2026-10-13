import { describe, expect, it } from 'vitest';
import { BATTLE_UNITS } from '../../src/scenes/andes/battleField';
import { MEN_PER_FIGURE } from '../../src/scenes/andes/column';
import { unitSlots } from '../../src/scenes/andes/diorama/unitSlots';

describe('unitSlots', () => {
  it('draws a figure for every 50 men of a unit, at least one', () => {
    for (const u of BATTLE_UNITS) expect(unitSlots(u)).toHaveLength(Math.max(1, Math.round(u.men / MEN_PER_FIGURE)));
  });

  it('is foot soldiers for an infantry unit and riders for the cavalry, with no mules and no leader on a white horse', () => {
    for (const u of BATTLE_UNITS) {
      const kinds = new Set(unitSlots(u).map((s) => s.kind));
      if (u.arm === 'cavalry') expect([...kinds].every((k) => k === 'rider' || k === 'rider_black')).toBe(true);
      else expect([...kinds].every((k) => k === 'foot' || k === 'foot_afro')).toBe(true);
    }
  });

  it('dresses part of the battalions of pardos y morenos (7 and 8, with O\'Higgins) in red, and none of the royalists', () => {
    const ohiggins = unitSlots(BATTLE_UNITS.find((u) => u.id === 'ohiggins')!);
    expect(ohiggins.filter((s) => s.kind === 'foot_afro').length).toBeGreaterThan(ohiggins.length * 0.3);
    for (const u of BATTLE_UNITS.filter((x) => x.side === 'royalist')) expect(unitSlots(u).some((s) => s.kind === 'foot_afro')).toBe(false);
  });

  it('is the same every time', () => {
    const u = BATTLE_UNITS[0]!;
    expect(unitSlots(u)).toEqual(unitSlots(u));
  });
});
