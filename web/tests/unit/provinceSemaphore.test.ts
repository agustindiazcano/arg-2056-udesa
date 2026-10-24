import { describe, expect, it } from 'vitest';
import { PROVINCES } from '../../src/types/province';
import { TONE_COLORS, hasSemaphore, semaphoreTones } from '../../src/tour/provinceSemaphore';
import { getProfileMetric } from '../../src/tour/provinceProfileData';

describe('semaphoreTones', () => {
  it('colours the best third green, the middle third yellow and the worst third red, 8 provinces each', () => {
    const tones = semaphoreTones('gdp_per_capita_usd');
    const counts = { good: 0, mid: 0, bad: 0 };
    for (const p of PROVINCES) counts[tones.get(p.id)!] += 1;
    expect(counts).toEqual({ good: 8, mid: 8, bad: 8 });
  });

  it('gives green to the highest value when higher is better', () => {
    const tones = semaphoreTones('pbg_usd_m');
    const top = [...PROVINCES].sort((a, b) => getProfileMetric(b.id, 'pbg_usd_m') - getProfileMetric(a.id, 'pbg_usd_m'))[0]!;
    expect(tones.get(top.id)).toBe('good');
  });

  it('gives green to the lowest value when lower is better (poverty, unemployment, crime)', () => {
    for (const metric of ['poverty_pct', 'unemployment_pct', 'security_rate'] as const) {
      const tones = semaphoreTones(metric);
      const best = [...PROVINCES].sort((a, b) => getProfileMetric(a.id, metric) - getProfileMetric(b.id, metric))[0]!;
      expect(tones.get(best.id), metric).toBe('good');
    }
  });

  it('has no semaphore where better and worse is not the point (population, share of the transfers)', () => {
    expect(hasSemaphore('population')).toBe(false);
    expect(hasSemaphore('coparticipacion_share')).toBe(false);
    expect(hasSemaphore('poverty_pct')).toBe(true);
    expect(semaphoreTones('population').size).toBe(0);
  });

  it('uses the green, yellow and red of the design tokens', () => {
    expect(TONE_COLORS.good).toContain('--state-good');
    expect(TONE_COLORS.mid).toContain('--state-warning');
    expect(TONE_COLORS.bad).toContain('--state-critical');
  });
});
