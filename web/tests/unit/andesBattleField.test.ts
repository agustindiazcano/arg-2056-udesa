import { describe, expect, it } from 'vitest';
import { BATTLE_NOTICE, BATTLE_UNITS } from '../../src/scenes/andes/battleField';

describe('BATTLE_UNITS', () => {
  const patriots = BATTLE_UNITS.filter((u) => u.side === 'patriot');
  const royalists = BATTLE_UNITS.filter((u) => u.side === 'royalist');

  it("has the two patriot divisions, Soler on the west (the right of an army that faces south) and O'Higgins on the east", () => {
    const soler = patriots.find((u) => /Soler/.test(u.name))!;
    const ohiggins = patriots.find((u) => /O'Higgins/.test(u.name))!;
    expect(soler.eastM).toBeLessThan(ohiggins.eastM);
  });

  it('puts the royalists south of the patriots, who come down from the north', () => {
    expect(Math.max(...royalists.map((u) => u.northM))).toBeLessThan(Math.min(...patriots.map((u) => u.northM)));
  });

  it('gives each unit a name, the men that the sources give and an arm', () => {
    expect(royalists.map((u) => u.name)).toEqual(expect.arrayContaining([expect.stringMatching(/Talavera/), expect.stringMatching(/Chiloé/), expect.stringMatching(/Valdivia/)]));
    for (const u of BATTLE_UNITS) {
      expect(u.men).toBeGreaterThan(0);
      expect(['infantry', 'cavalry']).toContain(u.arm);
    }
    expect(patriots.reduce((sum, u) => sum + u.men, 0)).toBeGreaterThanOrEqual(3400);
  });
});

describe('BATTLE_NOTICE', () => {
  it('says that it is a recreation, that the terrain is made up and that the positions are approximate', () => {
    expect(BATTLE_NOTICE).toMatch(/recreación/i);
    expect(BATTLE_NOTICE).toMatch(/terreno es inventado/i);
    expect(BATTLE_NOTICE).toMatch(/aproximad/i);
  });
});
