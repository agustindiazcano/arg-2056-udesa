import { describe, expect, it } from 'vitest';
import {
  cagr,
  doublingTimeExact,
  growthDecomposition,
  halvingTime,
  logLinearFit,
  multiplier,
  rollingDoublingTime,
  ruleError,
  ruleTime,
  yearReached,
  yearsToMultiple
} from '../../src/core/doubling';

const close = (a: number, b: number, tol = 1e-3) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe('the exact doubling time, ln 2 / ln(1 + r)', () => {
  it.each([
    [10, 7.2725],
    [3, 23.4498],
    [2, 35.0028],
    [8, 9.0065]
  ])('r = %d %% gives %d years', (r, years) => close(doublingTimeExact(r), years));

  it('never doubles with a rate of zero or less', () => {
    expect(doublingTimeExact(0)).toBe(Infinity);
    expect(doublingTimeExact(-2)).toBe(Infinity);
  });

  it('has a halving time for a negative rate and none for a positive one', () => {
    close(halvingTime(-3), Math.log(0.5) / Math.log(0.97), 1e-9);
    close(halvingTime(-3), 22.76, 0.01);
    expect(halvingTime(0)).toBe(Infinity);
    expect(halvingTime(2)).toBe(Infinity);
  });
});

describe('the rules of 69.3, 70 and 72', () => {
  it('divide the constant by the rate in percent', () => {
    close(ruleTime(70, 10), 7.0);
    close(ruleTime(72, 10), 7.2);
    close(ruleTime(70, 3), 23.3333);
    close(ruleTime(72, 3), 24.0);
    close(ruleTime(72, 8), 9.0);
    close(ruleTime(69.3, 5), 13.86);
  });

  it('are not defined for a rate of zero or less', () => {
    expect(() => ruleTime(70, 0)).toThrow(/rate/);
    expect(() => ruleTime(72, -1)).toThrow(/rate/);
  });

  it('report their error against the exact time, in years and in percent (rule minus exact)', () => {
    const e = ruleError(70, 10);
    close(e.years, 7 - 7.2725);
    close(e.percent, ((7 - 7.2725) / 7.2725) * 100, 0.01);
    expect(ruleError(72, 8).years).toBeGreaterThan(-0.01);
    expect(Math.abs(ruleError(72, 8).years)).toBeLessThan(0.01);
  });

  it('approach the exact time as the rate goes to zero: ln(1 + r) ~ r, so the limit constant is 100 ln 2 = 69.3147', () => {
    // 69.3 is that constant rounded: its error shrinks with the rate down to the rounding, 0.021 %
    const errors = [20, 5, 1, 0.1, 0.001].map((r) => Math.abs(ruleError(69.3, r).percent));
    for (let i = 1; i < errors.length; i += 1) expect(errors[i]!).toBeLessThan(errors[i - 1]!);
    expect(errors.at(-1)!).toBeLessThan(0.03);
    // 70 overestimates by about 1 % and 72 by about 3.9 % at the limit
    close(ruleError(70, 0.001).percent, (70 / 69.3147 - 1) * 100, 0.01);
    close(ruleError(72, 0.001).percent, (72 / 69.3147 - 1) * 100, 0.01);
  });
});

describe('compound growth', () => {
  it('multiplies the level by (1 + r)^years, which is not the number of doublings of the rule', () => {
    close(multiplier(10, 28), 14.421, 0.001);
    close(multiplier(3, 28), 2.2879, 0.001);
    close(multiplier(0, 10), 1, 1e-12);
    // 28 years at 10 % are 3.85 doublings of 7.27 years, not 4 doublings of 7 years (16)
    close(28 / doublingTimeExact(10), 3.85, 0.01);
  });

  it('gives back 2 after one exact doubling time', () => {
    for (const r of [0.5, 1, 2, 3, 5, 8, 10, 15, 20]) close(multiplier(r, doublingTimeExact(r)), 2, 1e-9);
  });

  it('finds the years to any multiple', () => {
    close(yearsToMultiple(3, 2), doublingTimeExact(3), 1e-12);
    close(yearsToMultiple(5, 10), Math.log(10) / Math.log(1.05), 1e-12);
    expect(yearsToMultiple(0, 2)).toBe(Infinity);
    expect(yearsToMultiple(-1, 2)).toBe(Infinity);
    expect(yearsToMultiple(0, 1)).toBe(0);
    expect(() => yearsToMultiple(3, 0)).toThrow(/multiple/);
  });

  it('names the calendar year in which a multiple is reached', () => {
    const d = yearReached(2026, 3, 2);
    close(d.years, 23.4498);
    // 2026 + 23.45 = 2049.45: the level of 2049 is 1.97 times that of 2026, the one of 2050 is 2.03, so 2050 is the first year at or above double
    expect(d.year).toBe(2050);
    expect(yearReached(2026, 0, 2)).toEqual({ years: Infinity, year: null });
    expect(yearReached(2026, 2, 4).year).toBe(2097); // 70.02 years at 2 %: 1.02^70 = 3.9996 is still below 4
  });
});

describe('the rate of a real series', () => {
  it('is the compound rate between the endpoints (South Korea, real GDP per capita, 1960 to 1990)', () => {
    close(cagr(1037.73, 9672.58, 30), 7.72, 0.05);
    expect(() => cagr(0, 5, 3)).toThrow(/positive/);
    expect(() => cagr(5, 6, 0)).toThrow(/years/);
  });

  it('is fitted by least squares on ln V against the year, with R² and the residuals', () => {
    const y = [0, 1, 1, 2];
    const fit = logLinearFit(y.map((v, i) => ({ year: 2000 + i, value: Math.exp(v) })));
    close(fit.ratePct, (Math.exp(0.6) - 1) * 100, 1e-9);
    close(fit.slope, 0.6, 1e-12);
    close(fit.r2, 0.9, 1e-12);
    const expected = [-0.1, 0.3, -0.3, 0.1];
    fit.residuals.forEach((r, i) => {
      expect(r.year).toBe(2000 + i);
      close(r.residual, expected[i]!, 1e-12);
    });
  });

  it('recovers an exact constant rate with R² of 1 and zero residuals', () => {
    const series = Array.from({ length: 12 }, (_, i) => ({ year: 1990 + i, value: 100 * 1.05 ** i }));
    const fit = logLinearFit(series);
    close(fit.ratePct, 5, 1e-9);
    close(fit.r2, 1, 1e-12);
    fit.residuals.forEach((r) => close(r.residual, 0, 1e-9));
  });

  it('skips the missing years without filling them, and refuses fewer than two points', () => {
    const series = [
      { year: 2000, value: 100 },
      { year: 2001, value: null },
      { year: 2002, value: 100 * 1.1 ** 2 },
      { year: 2003, value: 100 * 1.1 ** 3 }
    ];
    const fit = logLinearFit(series);
    expect(fit.residuals.map((r) => r.year)).toEqual([2000, 2002, 2003]);
    close(fit.ratePct, 10, 1e-9);
    expect(() => logLinearFit([{ year: 2000, value: 1 }])).toThrow(/two/);
  });

  it('gives a rolling doubling time from the endpoints of each window', () => {
    const series = Array.from({ length: 11 }, (_, i) => ({ year: 1990 + i, value: 50 * 1.03 ** i }));
    const rolling = rollingDoublingTime(series, 5);
    expect(rolling.map((r) => r.year)).toEqual([1995, 1996, 1997, 1998, 1999, 2000]);
    rolling.forEach((r) => {
      close(r.ratePct, 3, 1e-9);
      close(r.doublingYears, 23.4498);
    });
    expect(rollingDoublingTime(series, 20)).toEqual([]);
  });

  it('gives Infinity as the doubling time of a window that shrinks', () => {
    const rolling = rollingDoublingTime([{ year: 2000, value: 10 }, { year: 2005, value: 8 }], 5);
    expect(rolling).toHaveLength(1);
    expect(rolling[0]!.doublingYears).toBe(Infinity);
    expect(rolling[0]!.ratePct).toBeLessThan(0);
  });
});

describe('total, per capita and population growth', () => {
  it('satisfies (1 + total) = (1 + per capita)(1 + population) to 1e-9', () => {
    for (const [total, pop] of [[2.5, 1.0], [-3, 0.5], [7.7, 2.1], [0, 0]] as const) {
      const d = growthDecomposition(total, pop);
      close((1 + d.perCapitaPct / 100) * (1 + d.populationPct / 100), 1 + d.totalPct / 100, 1e-9);
    }
    close(growthDecomposition(3, 1).perCapitaPct, (1.03 / 1.01 - 1) * 100, 1e-12);
  });
});
