import { describe, expect, it } from 'vitest';
import { ARG_PER_CAPITA_2026, ARG_POP_2026, ARG_POP_2056, convergenceTable, developedBenchmarks } from '../../src/tour/rule70Convergence';

describe('developedBenchmarks', () => {
  it('computes realistic Argentine per capita baseline for 2026', () => {
    expect(ARG_POP_2026).toBeGreaterThan(46);
    expect(ARG_POP_2026).toBeLessThan(47);
    expect(ARG_POP_2056).toBeGreaterThan(48);
    expect(ARG_PER_CAPITA_2026).toBeGreaterThan(13000);
    expect(ARG_PER_CAPITA_2026).toBeLessThan(14000);
  });

  it('calculates convergence rates for 7 developed benchmark countries', () => {
    const list = developedBenchmarks();
    expect(list).toHaveLength(7);

    const prt = list.find((b) => b.code === 'PRT')!;
    expect(prt.gdpPerCapita2024).toBe(22663);
    expect(prt.ratioOverArg).toBeCloseTo(1.7, 1);
    expect(prt.requiredRate30Years).toBeGreaterThan(1.5);
    expect(prt.requiredRate30Years).toBeLessThan(2.0);

    const esp = list.find((b) => b.code === 'ESP')!;
    expect(esp.gdpPerCapita2024).toBe(29245);
    expect(esp.requiredRate30Years).toBeGreaterThan(2.5);
    expect(esp.requiredRate30Years).toBeLessThan(3.0);

    const kor = list.find((b) => b.code === 'KOR')!;
    expect(kor.gdpPerCapita2024).toBe(37049);
    expect(kor.requiredRate30Years).toBeGreaterThan(3.3);
    expect(kor.requiredRate30Years).toBeLessThan(3.7);

    const usa = list.find((b) => b.code === 'USA')!;
    expect(usa.gdpPerCapita2024).toBe(66856);
    expect(usa.ratioOverArg).toBeCloseTo(5.0, 1);
    expect(usa.requiredRate30Years).toBeGreaterThan(5.3);
    expect(usa.requiredRate30Years).toBeLessThan(5.8);
  });

  it('creates valid convergenceTable for Data section', () => {
    const t = convergenceTable();
    expect(t.id).toBe('rule70-convergence');
    expect(t.columns.length).toBe(7);
    expect(t.rows.length).toBe(7);
    for (const row of t.rows) {
      expect(typeof row[0]).toBe('string');
      expect(Number(row[1])).toBeGreaterThan(20000);
      expect(Number(row[2])).toBeGreaterThan(1.5);
    }
  });
});
