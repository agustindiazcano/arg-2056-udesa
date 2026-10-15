import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RATE,
  RATE_MAX,
  RATE_MIN,
  argentinaDoubling,
  argentinaTable,
  clampRate,
  compoundPath,
  doublingMarks,
  errorCurve,
  errorTable,
  ruleTable
} from '../../src/tour/rule70Model';
import { ARG_GDP_2026 } from '../../src/tour/gdpFacts';

const close = (a: number, b: number, tol = 1e-3) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe('the table of the rules for one rate', () => {
  it('gives the exact time and the rules of 70 and 72 with their errors (10 % a year)', () => {
    const t = ruleTable(10);
    close(t.exact, 7.2725);
    const r70 = t.rows.find((r) => r.rule === 70)!;
    const r72 = t.rows.find((r) => r.rule === 72)!;
    close(r70.years, 7.0);
    close(r72.years, 7.2);
    close(r70.errorYears, 7 - 7.2725);
    close(r70.errorPct, ((7 - 7.2725) / 7.2725) * 100, 0.01);
    close(r72.errorPct, ((7.2 - 7.2725) / 7.2725) * 100, 0.01);
  });

  it('has 72 closer to the exact time than 70 at 8 % (the rule of 72 exists for that)', () => {
    const t = ruleTable(8);
    expect(Math.abs(t.rows.find((r) => r.rule === 72)!.errorPct)).toBeLessThan(Math.abs(t.rows.find((r) => r.rule === 70)!.errorPct));
  });
});

describe('the error of the rules against the rate', () => {
  const curve = errorCurve();

  it('covers 0.1 % to 20 % in steps of 0.1, computed from the formulas, not typed in', () => {
    expect(curve.rates[0]).toBe(0.1);
    expect(curve.rates.at(-1)).toBe(20);
    expect(curve.rates).toHaveLength(200);
    curve.rates.forEach((r, i) => {
      const t = ruleTable(r);
      close(curve.error70[i]!, t.rows.find((x) => x.rule === 70)!.errorPct, 1e-9);
      close(curve.error72[i]!, t.rows.find((x) => x.rule === 72)!.errorPct, 1e-9);
    });
  });

  it('tends to the small-rate limits at the left end: 70 over-estimates by about 1 %, 72 by about 3.9 %', () => {
    close(curve.error70[0]!, (70 / 69.3147 - 1) * 100, 0.1);
    close(curve.error72[0]!, (72 / 69.3147 - 1) * 100, 0.1);
  });
});

describe('the Data table of the errors', () => {
  it('has one row per rate with the exact time, the rules and the errors, from the same formulas', () => {
    const t = errorTable();
    expect(t.columns[0]).toBe('Tasa (% anual)');
    const row10 = t.rows.find((r) => r[0] === 10)!;
    close(row10[1] as number, 7.27, 0.01);
    expect(row10[2]).toBe(7);
    expect(row10[3]).toBe(7.2);
    expect(t.rows.length).toBeGreaterThanOrEqual(8);
  });
});

describe('compound growth', () => {
  it('multiplies by (1 + r) every year: 10 % for 28 years is x14.42', () => {
    const p = compoundPath(10, 28);
    expect(p.years).toHaveLength(29);
    expect(p.values[0]).toBe(1);
    close(p.values.at(-1)!, 14.421, 0.001);
  });

  it('is a straight line on a log scale: ln V grows by the same amount every year', () => {
    const p = compoundPath(7, 40);
    const steps = p.values.slice(1).map((v, i) => Math.log(v) - Math.log(p.values[i]!));
    for (const s of steps) close(s, Math.log(1.07), 1e-12);
  });

  it('starts from the level it is given', () => {
    expect(compoundPath(3, 5, 200).values[0]).toBe(200);
  });

  it('lists the moments of the doublings inside the horizon', () => {
    const m = doublingMarks(3, 60);
    expect(m).toHaveLength(2);
    close(m[0]!, 23.4498, 1e-3);
    close(m[1]!, 46.8996, 1e-3);
    expect(doublingMarks(0, 60)).toEqual([]);
  });
});

describe('when the GDP of Argentina doubles', () => {
  it('starts from the real GDP of 2026 of the project, the same figure as everywhere else', () => {
    expect(argentinaDoubling(3).startValue).toBe(ARG_GDP_2026);
  });

  it('at 3 % a year takes 23.4 years, so the level of double is first reached in 2050', () => {
    const d = argentinaDoubling(3);
    close(d.years, 23.4498);
    expect(d.year).toBe(2050);
    close(d.valueAtYear!, ARG_GDP_2026 * 1.03 ** 24, 1e-6 * ARG_GDP_2026);
    expect(d.valueAtYear!).toBeGreaterThanOrEqual(2 * ARG_GDP_2026);
    expect(ARG_GDP_2026 * 1.03 ** 23).toBeLessThan(2 * ARG_GDP_2026); // 2049 is still below double
  });

  it('at 5 % it is 2041, and at 2 % 2062 (35.003 years: the level of 2061 is 1.9999 times the one of 2026)', () => {
    expect(argentinaDoubling(5).year).toBe(2041);
    expect(argentinaDoubling(2).year).toBe(2062);
    expect(1.02 ** 35).toBeLessThan(2);
  });

  it('never doubles with a zero or negative rate', () => {
    expect(argentinaDoubling(0)).toMatchObject({ years: Infinity, year: null, valueAtYear: null });
    expect(argentinaDoubling(-1).year).toBeNull();
  });

  it('has a Data table of rates, years and year of doubling, with the GDP of 2026 as its start', () => {
    const t = argentinaTable();
    expect(t.rows.length).toBeGreaterThanOrEqual(6);
    const row3 = t.rows.find((r) => r[0] === 3)!;
    close(row3[1] as number, 23.4, 0.05);
    expect(row3[2]).toBe(2050);
  });
});

describe('the rate the visitor types', () => {
  it('stays between the limits and falls back to the default when it is not a number', () => {
    expect(RATE_MIN).toBe(0.1);
    expect(RATE_MAX).toBe(20);
    expect(clampRate(3.14)).toBe(3.14);
    expect(clampRate(0)).toBe(RATE_MIN);
    expect(clampRate(-5)).toBe(RATE_MIN);
    expect(clampRate(50)).toBe(RATE_MAX);
    expect(clampRate(Number.NaN)).toBe(DEFAULT_RATE);
  });
});
