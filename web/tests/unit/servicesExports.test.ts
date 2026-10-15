import { describe, expect, it } from 'vitest';
import { SERVICES_EXPORTS_2025, SBC_EXPORTS_2025 } from '../../src/tour/servicesExports';

describe('services exports 2025 (CEI of the Cancillería, based on INDEC balance of payments), million USD', () => {
  it('has the published total and the four main categories', () => {
    expect(SERVICES_EXPORTS_2025.total).toBe(18039);
    expect(SERVICES_EXPORTS_2025.categories.find((c) => c.name === 'Otros servicios empresariales')!.value).toBe(6450);
    expect(SERVICES_EXPORTS_2025.categories.find((c) => c.name === 'Viajes')!.value).toBe(4852);
    expect(SERVICES_EXPORTS_2025.categories.find((c) => c.name === 'Telecomunicaciones, informática e información')!.value).toBe(2825);
    expect(SERVICES_EXPORTS_2025.categories.find((c) => c.name === 'Transporte')!.value).toBe(2447);
  });

  it('shares of the text are value / total to one decimal (35.8, 26.9, 15.7, 13.6)', () => {
    const share = (n: string) => Math.round((SERVICES_EXPORTS_2025.categories.find((c) => c.name === n)!.value / SERVICES_EXPORTS_2025.total) * 1000) / 10;
    expect(share('Otros servicios empresariales')).toBe(35.8);
    expect(share('Viajes')).toBe(26.9);
    expect(share('Telecomunicaciones, informática e información')).toBe(15.7);
    expect(share('Transporte')).toBe(13.6);
  });

  it('knowledge-based services (narrow definition) are 9,563, 53.0 % of the services, and the rows sum to it', () => {
    expect(SBC_EXPORTS_2025.total).toBe(9563);
    expect(Math.round((SBC_EXPORTS_2025.total / SERVICES_EXPORTS_2025.total) * 1000) / 10).toBe(53);
    const sum = SBC_EXPORTS_2025.rows.reduce((a, r) => a + r.value, 0);
    expect(Math.abs(sum - SBC_EXPORTS_2025.total)).toBeLessThanOrEqual(2);
  });
});
