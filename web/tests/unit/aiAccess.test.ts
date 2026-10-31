import { describe, expect, it } from 'vitest';
import { ACCESS_COUNTRIES, PLANS, accessRows, effectiveCost, taxPct } from '../../src/tour/aiAccess';

describe('cost of the AI plans by country', () => {
  it('adds the taxes over the list price: Argentina pays the digital VAT and the 30 % advance on top', () => {
    const arg = ACCESS_COUNTRIES.find((c) => c.name === 'Argentina')!;
    expect(taxPct(arg)).toBe(51);
    expect(effectiveCost(20, arg)).toBeCloseTo(30.2, 6);
    expect(effectiveCost(200, arg)).toBeCloseTo(302, 6);
  });

  it('charges no national tax in the United States, and includes Chile, Peru and Latin American peers', () => {
    const usa = ACCESS_COUNTRIES.find((c) => c.name === 'Estados Unidos')!;
    const chl = ACCESS_COUNTRIES.find((c) => c.name === 'Chile')!;
    const per = ACCESS_COUNTRIES.find((c) => c.name === 'Perú')!;
    const col = ACCESS_COUNTRIES.find((c) => c.name === 'Colombia')!;
    const bra = ACCESS_COUNTRIES.find((c) => c.name === 'Brasil')!;
    expect(taxPct(usa)).toBe(0);
    expect(effectiveCost(100, usa)).toBe(100);
    expect(taxPct(chl)).toBe(19);
    expect(effectiveCost(20, chl)).toBeCloseTo(23.8, 6);
    expect(taxPct(per)).toBe(18);
    expect(effectiveCost(20, per)).toBeCloseTo(23.6, 6);
    expect(taxPct(col)).toBe(19);
    expect(taxPct(bra)).toBeCloseTo(3.5, 6);
  });

  it('offers the plans of 20, 100 and 200 dollars', () => {
    expect(PLANS.map((p) => p.price)).toEqual([20, 100, 200]);
  });

  it('gives one row per country, from the most expensive, with the extra cost and the yearly extra', () => {
    const rows = accessRows(20);
    expect(rows).toHaveLength(ACCESS_COUNTRIES.length);
    expect(rows[0]!.country).toBe('Argentina');
    expect(rows.map((r) => r.total)).toEqual([...rows.map((r) => r.total)].sort((a, b) => b - a));
    const arg = rows[0]!;
    expect(arg.list).toBe(20);
    expect(arg.taxes).toBeCloseTo(10.2, 6);
    expect(arg.yearlyExtra).toBeCloseTo(122.4, 6);
  });
});
