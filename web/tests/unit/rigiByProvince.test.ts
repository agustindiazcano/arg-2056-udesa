import { describe, expect, it } from 'vitest';
import { RIGI_MINING, RIGI_OIL_GAS } from '../../src/tour/rigiProjects';
import { provinceIdsOf, rigiByProvince, rigiProjectsOf, rigiTotals } from '../../src/tour/rigiByProvince';

const ALL = [...RIGI_MINING, ...RIGI_OIL_GAS];

describe('provinceIdsOf', () => {
  it('maps the province names of a project to ids, splitting «A y B»', () => {
    expect(provinceIdsOf('San Juan')).toEqual(['AR-J']);
    expect(provinceIdsOf('Salta y Catamarca')).toEqual(['AR-A', 'AR-K']);
    expect(provinceIdsOf('Neuquén y Río Negro')).toEqual(['AR-Q', 'AR-R']);
  });

  it('knows every province of the RIGI list', () => {
    for (const p of ALL) expect(provinceIdsOf(p.province).length, p.name).toBeGreaterThan(0);
  });
});

describe('rigiByProvince', () => {
  it('splits the investment of a project that crosses provinces equally, so the provinces add up to the total', () => {
    const rows = rigiByProvince('todos');
    const total = ALL.reduce((s, p) => s + (p.investment ?? 0), 0);
    expect(rows.reduce((s, r) => s + r.investment, 0)).toBeCloseTo(total, 6);
  });

  it('counts a project in every province it touches', () => {
    const salta = rigiByProvince('todos').find((r) => r.id === 'AR-A')!;
    expect(salta.count).toBe(rigiProjectsOf('AR-A', 'todos').length);
    expect(salta.count).toBeGreaterThan(1);
  });

  it('filters by status', () => {
    const approved = ALL.filter((p) => p.status === 'aprobado').reduce((s, p) => s + (p.investment ?? 0), 0);
    expect(rigiByProvince('aprobado').reduce((s, r) => s + r.investment, 0)).toBeCloseTo(approved, 6);
  });
});

describe('rigiTotals', () => {
  it('gives the number of projects by status and the investment of the approved ones', () => {
    const t = rigiTotals();
    expect(t.approved + t.evaluating).toBe(ALL.length);
    expect(t.approvedInvestment).toBe(ALL.filter((p) => p.status === 'aprobado').reduce((s, p) => s + (p.investment ?? 0), 0));
  });
});
