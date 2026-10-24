import { describe, expect, it } from 'vitest';
import { PROVINCES } from '../../src/types/province';
import { AGRO_PROVINCE, agroParts, agroValueMusd } from '../../src/tour/agroProvince';
import { SECTOR_VALUES } from '../../src/tour/provinceMock';
import { PROVINCE_AGRO_BREAKDOWN } from '../../src/tour/provinceSectorBreakdown';

describe('agro by province from the MAGyP series', () => {
  it('values each crop of the province at the FOB price of the file, in million USD', () => {
    const parts = agroParts('AR-B');
    expect(parts.find((p) => p.label === 'Soja')!.value).toBeCloseTo((15533596 * 420) / 1e6, 1);
    expect(parts.find((p) => p.label === 'Maíz')!.value).toBeCloseTo((17196317 * 180) / 1e6, 1);
  });

  it('has the value of each province equal to the sum of its crops and to the file', () => {
    for (const p of AGRO_PROVINCE.provinces) {
      const sum = agroParts(p.id as never).reduce((s, x) => s + x.value, 0);
      expect(sum, p.province).toBeCloseTo(agroValueMusd(p.id as never), 6);
      expect(agroValueMusd(p.id as never), p.province).toBeCloseTo(p.estimated_usd_m, 0);
    }
  });

  it('feeds the Agro sector of the provinces slide and its detail, with no made-up value left', () => {
    PROVINCES.forEach((p, i) => expect(SECTOR_VALUES.agro[i], p.name).toBeCloseTo(agroValueMusd(p.id), 0));
    expect(PROVINCE_AGRO_BREAKDOWN['AR-B']!.map((x) => x.label)).toEqual(['Soja', 'Maíz', 'Trigo', 'Girasol']);
    expect(Object.values(PROVINCE_AGRO_BREAKDOWN).flat().some((x) => /Bovinos|Vitivinicultura|Tabaco|Yerba/.test(x.label))).toBe(false);
  });

  it('names the source and the campaign', () => {
    expect(AGRO_PROVINCE.source).toMatch(/SAGyP|MAGyP/);
    expect(AGRO_PROVINCE.campaign).toBe('2024/2025');
  });
});
