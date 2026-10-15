import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compareScenarios, scenariosTable } from '../../src/tour/rule70Scenarios';
import { IMF_VINTAGE_NOTE, averageGrowth, imfCountries, imfImplied, imfTable } from '../../src/tour/rule70Imf';
import imf from '../../src/tour/imfCountries.json';

const close = (a: number, b: number, tol = 1e-3) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe('two rates over N years', () => {
  it('3 % against 10 % for 28 years: x2.29 and x14.42, so the second ends 6.3 times higher', () => {
    const c = compareScenarios({ rateA: 3, rateB: 10, years: 28, startA: 100, startB: 100 });
    close(c.multiplierA, 2.2879, 0.001);
    close(c.multiplierB, 14.421, 0.001);
    close(c.ratioAtEnd, 14.421 / 2.2879, 0.01);
    expect(c.levelsA).toHaveLength(29);
    expect(c.levelsA[0]).toBe(100);
    close(c.levelsB.at(-1)!, 1442.1, 0.1);
    expect(c.crossing).toBeNull(); // they start together
  });

  it('a gap of one point (3 % against 4 %) over 30 years makes the second 33.6 % higher', () => {
    const c = compareScenarios({ rateA: 3, rateB: 4, years: 30, startA: 1, startB: 1 });
    close(c.ratioAtEnd, (1.04 / 1.03) ** 30, 1e-9);
    close(c.ratioAtEnd, 1.3363, 0.001);
    expect(c.gapPoints).toBe(1);
  });

  it('finds when the faster one overtakes the one that starts higher: 200 at 3 % against 100 at 10 % cross after 10.5 years', () => {
    const c = compareScenarios({ rateA: 3, rateB: 10, years: 28, startA: 200, startB: 100 });
    close(c.crossing!, Math.log(0.5) / Math.log(1.03 / 1.1), 1e-9);
    close(c.crossing!, 10.54, 0.01);
    // at the crossing the two levels are equal
    close(200 * 1.03 ** c.crossing!, 100 * 1.1 ** c.crossing!, 1e-6);
    expect(c.crossingInside).toBe(true);
    expect(c.aheadAtEnd).toBe('B');
  });

  it('says the crossing is beyond the horizon when it is', () => {
    const c = compareScenarios({ rateA: 3, rateB: 4, years: 10, startA: 200, startB: 100 });
    expect(c.crossing!).toBeGreaterThan(10);
    expect(c.crossingInside).toBe(false);
    expect(c.aheadAtEnd).toBe('A');
  });

  it('has no crossing when the one that starts higher also grows faster, or when the rates are equal', () => {
    expect(compareScenarios({ rateA: 5, rateB: 3, years: 30, startA: 200, startB: 100 }).crossing).toBeNull();
    expect(compareScenarios({ rateA: 4, rateB: 4, years: 30, startA: 200, startB: 100 }).crossing).toBeNull();
    expect(compareScenarios({ rateA: 4, rateB: 4, years: 30, startA: 200, startB: 100 }).aheadAtEnd).toBe('A');
  });

  it('has a Data table of examples computed with the same formulas', () => {
    const t = scenariosTable();
    expect(t.id).toBe('rule70-scenarios');
    const row = t.rows.find((r) => r[0] === 3 && r[1] === 10)!;
    close(row[3] as number, 2.29, 0.01);
    close(row[4] as number, 14.42, 0.01);
  });
});

describe('the projections of the IMF', () => {
  it('has the eleven countries of the data, Argentina among them, with a growth for 2026 to 2031', () => {
    expect(imfCountries()).toHaveLength(11);
    const arg = imfCountries().find((c) => c.code === 'AR')!;
    expect(arg.name).toBe('Argentina');
    for (let y = 2026; y <= 2031; y += 1) expect(typeof arg.growth[String(y)]).toBe('number');
    close(arg.growth['2026']!, 2.06, 0.01);
  });

  it('is the data of the pipeline, not typed: every value equals the record of data/processed/external_forecasts.json', () => {
    const recs = JSON.parse(readFileSync('../data/processed/external_forecasts.json', 'utf8')) as Array<{ forecaster: string; indicator: string; geo: string; year: number; value: number }>;
    let checked = 0;
    for (const c of imf.countries) {
      for (const [year, value] of Object.entries(c.growth)) {
        const r = recs.find((x) => x.forecaster === 'IMF' && x.indicator === 'gdp_growth_real_pct' && x.geo === c.code && x.year === Number(year))!;
        close(value as number, r.value, 5e-4);
        checked += 1;
      }
    }
    expect(checked).toBe(77);
  });

  it('averages the growth of 2026 to 2031 geometrically, as the one constant rate that gives the same level', () => {
    const g = imfCountries().find((c) => c.code === 'AR')!.growth;
    let level = 1;
    for (let y = 2026; y <= 2031; y += 1) level *= 1 + g[String(y)]! / 100;
    close(averageGrowth('AR'), (level ** (1 / 6) - 1) * 100, 1e-9);
    expect(averageGrowth('AR')).toBeGreaterThan(3);
    expect(averageGrowth('AR')).toBeLessThan(4);
  });

  it('gives the doubling time and the year at that average rate, from 2026', () => {
    const i = imfImplied('AR');
    close(i.years, Math.log(2) / Math.log(1 + averageGrowth('AR') / 100), 1e-9);
    expect(i.year).toBe(Math.ceil(2026 + i.years - 1e-9));
  });

  it('has a Data table of the average and the doubling of each country, and a note on the vintage and on India', () => {
    const t = imfTable();
    expect(t.id).toBe('rule70-imf');
    expect(t.rows).toHaveLength(11);
    expect(IMF_VINTAGE_NOTE).toMatch(/India/);
    expect(IMF_VINTAGE_NOTE).toMatch(/año fiscal/);
  });
});
