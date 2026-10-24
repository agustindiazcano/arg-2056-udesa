import { describe, expect, it } from 'vitest';
import { PROVINCES } from '../../src/types/province';
import { PROFILE_METRICS, PROVINCE_PROFILES, formatProfileValue, getProfileMetric, rankProvincesByProfileMetric } from '../../src/tour/provinceProfileData';
import { hasSemaphore, semaphoreTones } from '../../src/tour/provinceSemaphore';

describe('provincial HDI', () => {
  it('has a value between 0.8 and 0.9 for each of the 24 jurisdictions', () => {
    for (const p of PROVINCES) {
      const v = PROVINCE_PROFILES[p.id].hdi;
      expect(v, p.name).toBeGreaterThan(0.8);
      expect(v, p.name).toBeLessThan(0.9);
    }
  });

  it('ranks the City of Buenos Aires first and Chaco last', () => {
    const rows = rankProvincesByProfileMetric('hdi');
    expect(rows[0]!.id).toBe('AR-C');
    expect(rows.at(-1)!.id).toBe('AR-H');
    expect(getProfileMetric('AR-C', 'hdi')).toBe(0.882);
  });

  it('is a metric of the slide with its source, a traffic light (higher is better) and three decimals', () => {
    const def = PROFILE_METRICS.find((m) => m.id === 'hdi')!;
    expect(def.shortLabel).toBe('IDH');
    expect(def.source).toMatch(/PNUD/);
    expect(hasSemaphore('hdi')).toBe(true);
    expect(semaphoreTones('hdi').get('AR-C')).toBe('good');
    expect(semaphoreTones('hdi').get('AR-H')).toBe('bad');
    expect(formatProfileValue('hdi', 0.842)).toBe('0,842');
  });
});
