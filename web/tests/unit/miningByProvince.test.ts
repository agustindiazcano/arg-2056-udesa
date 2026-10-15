import { describe, expect, it } from 'vitest';
import { MINING_BY_PROVINCE_2025, MINING_BY_PROVINCE_2026_JAN_AUG } from '../../src/tour/miningByProvince';

describe('mining exports by province (Secretaría de Minería, Aduana), million USD FOB', () => {
  it('2025 full year: the three published values and the national total', () => {
    expect(MINING_BY_PROVINCE_2025.total).toBe(6037);
    expect(MINING_BY_PROVINCE_2025.santaCruz).toBe(2383);
    expect(MINING_BY_PROVINCE_2025.sanJuan).toBe(1757);
    expect(MINING_BY_PROVINCE_2025.noa).toBe(1803);
  });

  it('January-August 2026: Jujuy is the only NOA province published separately', () => {
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.total).toBe(6059);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.santaCruz).toBe(2360);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.sanJuan).toBe(1302);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.jujuy).toBe(1156);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.noa).toBe(2281);
  });

  it('keeps the periods apart: the five provinces never add up to the total (the rest is 1.6 % and 1.9 %), and never mix a half-year with a year', () => {
    const a = MINING_BY_PROVINCE_2025;
    expect(a.santaCruz + a.sanJuan + a.noa).toBeLessThanOrEqual(a.total);
    expect(a.santaCruz + a.sanJuan + a.noa).toBeGreaterThan(a.total * 0.98);
    const b = MINING_BY_PROVINCE_2026_JAN_AUG;
    expect(b.santaCruz + b.sanJuan + b.noa).toBeLessThanOrEqual(b.total);
    expect(b.santaCruz + b.sanJuan + b.noa).toBeGreaterThan(b.total * 0.98);
  });
});

import { RIGI_MINING, RIGI_OIL_GAS } from '../../src/tour/rigiProjects';

describe('corrections of 2026-10-14 in the RIGI list', () => {
  it('Taca Taca carries the NI 43-101 initial capex (4.232) and not the old press figure', () => {
    expect(RIGI_MINING.find((p) => p.name === 'Taca Taca')!.investment).toBe(4232);
  });
  it('Bajo del Choique-La Invernada is listed as approved with the discrepancy noted', () => {
    const p = RIGI_OIL_GAS.find((x) => x.name.startsWith('Bajo del Choique'))!;
    expect(p.status).toBe('aprobado');
    expect(p.note).toContain('12.240');
  });
});
