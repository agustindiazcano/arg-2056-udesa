import { describe, it, expect } from 'vitest';
import { PROVINCES } from '../../src/types/province.js';
import {
  PROVINCE_PROFILES,
  PROFILE_METRICS,
  getProfileMetric,
  rankProvincesByProfileMetric,
  formatProfileValue
} from '../../src/tour/provinceProfileData.js';

describe('Province profile data & selectors C6 (province-profile-slide)', () => {
  it('covers all 24 provinces in Argentina', () => {
    expect(getProfileMetric('AR-A', 'pbg_usd_m')).toBe(11200);
    for (const prov of PROVINCES) {
      const data = PROVINCE_PROFILES[prov.id];
      expect(data, `Province ${prov.id} (${prov.name}) should have profile data`).toBeDefined();
      expect(data.pbg_usd_m).toBeGreaterThan(0);
      expect(data.pbg_share).toBeGreaterThan(0);
      expect(data.gdp_per_capita_usd).toBeGreaterThan(0);
      expect(data.coparticipacion_share).toBeGreaterThan(0);
      expect(data.population).toBeGreaterThan(0);
      expect(data.poverty_pct).toBeGreaterThan(0);
      expect(data.unemployment_pct).toBeGreaterThan(0);
      expect(data.private_jobs_k).toBeGreaterThan(0);
      expect(data.public_jobs_k).toBeGreaterThan(0);
      expect(data.registered_jobs_k).toBeGreaterThan(0);
      expect(data.security_rate).toBeGreaterThan(0);
    }
  });

  it('provides all requested metrics in PROFILE_METRICS', () => {
    const metricKeys = PROFILE_METRICS.map((m) => m.id);
    expect(metricKeys).toContain('pbg_usd_m');
    expect(metricKeys).toContain('gdp_per_capita_usd');
    expect(metricKeys).toContain('exports_usd_m');
    expect(metricKeys).toContain('coparticipacion_share');
    expect(metricKeys).toContain('population');
    expect(metricKeys).toContain('poverty_pct');
    expect(metricKeys).toContain('unemployment_pct');
    expect(metricKeys).toContain('registered_jobs_k');
    expect(metricKeys).toContain('security_rate');
  });

  it('ranks provinces accurately by PBG', () => {
    const ranked = rankProvincesByProfileMetric('pbg_usd_m');
    expect(ranked.length).toBe(24);
    // Buenos Aires should be top PBG
    expect(ranked[0]?.id).toBe('AR-B');
    // Values should be in descending order
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i]!.value).toBeGreaterThanOrEqual(ranked[i + 1]!.value);
    }
  });

  it('ranks provinces accurately by GDP per capita', () => {
    const ranked = rankProvincesByProfileMetric('gdp_per_capita_usd');
    expect(ranked.length).toBe(24);
    // CABA should be top per capita
    expect(ranked[0]?.id).toBe('AR-C');
  });

  it('formats metric values correctly for display', () => {
    expect(formatProfileValue('pbg_usd_m', 52000)).toMatch(/52\.000 M USD/);
    expect(formatProfileValue('gdp_per_capita_usd', 13060)).toMatch(/13\.060 USD/);
    expect(formatProfileValue('poverty_pct', 45.2)).toMatch(/45,2 %/);
    expect(formatProfileValue('coparticipacion_share', 8.6)).toMatch(/8,6 %/);
    expect(formatProfileValue('population', 3980000)).toMatch(/3\.980\.000 hab\./);
  });
});
