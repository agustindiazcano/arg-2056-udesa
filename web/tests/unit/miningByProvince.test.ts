import { describe, expect, it } from 'vitest';
import { MINING_BY_PROVINCE_2025, MINING_BY_PROVINCE_2026_JAN_AUG } from '../../src/tour/miningByProvince';

describe('mining exports by province (Secretaría de Minería, Aduana), million USD FOB', () => {
  it('2025 full year: all 5 provinces disaggregated from the official treemap', () => {
    expect(MINING_BY_PROVINCE_2025.total).toBe(6037);
    expect(MINING_BY_PROVINCE_2025.santaCruz).toBe(2383);
    expect(MINING_BY_PROVINCE_2025.sanJuan).toBe(1757);
    expect(MINING_BY_PROVINCE_2025.jujuy).toBe(953);
    expect(MINING_BY_PROVINCE_2025.salta).toBe(498);
    expect(MINING_BY_PROVINCE_2025.catamarca).toBe(351);
    expect(MINING_BY_PROVINCE_2025.noa).toBe(1802);
    expect(MINING_BY_PROVINCE_2025.resto).toBe(95);
  });

  it('January-August 2026: all 5 provinces disaggregated from the official treemap', () => {
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.total).toBe(6059);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.santaCruz).toBe(2360);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.sanJuan).toBe(1302);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.jujuy).toBe(1156);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.salta).toBe(706);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.catamarca).toBe(419);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.noa).toBe(2281);
    expect(MINING_BY_PROVINCE_2026_JAN_AUG.resto).toBe(115);
  });

  it('keeps the periods apart: the five provinces plus resto add up to the total within rounding', () => {
    const a = MINING_BY_PROVINCE_2025;
    expect(a.santaCruz + a.sanJuan + a.jujuy + a.salta + a.catamarca + a.resto).toBe(a.total);
    const b = MINING_BY_PROVINCE_2026_JAN_AUG;
    expect(Math.abs(b.santaCruz + b.sanJuan + b.jujuy + b.salta + b.catamarca + b.resto - b.total)).toBeLessThanOrEqual(1);
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
