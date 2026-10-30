import { describe, expect, it } from 'vitest';
import { API_PRICES, PERSONAL_USAGE, TOKEN_PROVIDERS, apiCost, paidPopulationShare, accessBand } from '../../src/tour/aiEvidence.js';
import { ACCESS_COUNTRIES } from '../../src/tour/aiAccess.js';

describe('AI evidence: comparable units and explicit limits', () => {
  it('prices input, output and cache reads separately, without treating a subscription as tokens', () => {
    const sonnet = API_PRICES.find((p) => p.id === 'sonnet')!;
    expect(apiCost(sonnet, { input: 1_000_000, output: 2_000_000, cached: 3_000_000 })).toBeCloseTo(33.9);
    expect(apiCost(sonnet, { input: 0, output: 0, cached: 0 })).toBe(0);
    expect(() => apiCost(sonnet, { input: -1, output: 0, cached: 0 })).toThrow(RangeError);
  });
  it('does not assign a population percentile to a personal observation or to aggregate provider traffic', () => {
    expect(PERSONAL_USAGE.tokens).toBe(8_000_000_000);
    expect(PERSONAL_USAGE.days).toBe(30);
    expect(PERSONAL_USAGE.percentile).toBeNull();
    expect(PERSONAL_USAGE.cacheIncluded).toBeNull();
    expect(TOKEN_PROVIDERS.map((p) => p.name)).toEqual(['Claude', 'Grok', 'Cursor', 'Gemini', 'ChatGPT']);
    for (const p of TOKEN_PROVIDERS) expect(p.monthlyUserPercentiles).toBeNull();
  });
  it('labels the paid share as a lower-bound dated ratio, not all LLM subscribers', () => {
    expect(paidPopulationShare(50_000_000, 8_200_000_000)).toBeCloseTo(0.609756);
    expect(() => paidPopulationShare(1, 0)).toThrow(RangeError);
  });
  it('uses explicit surcharge thresholds for the Latin America traffic light', () => {
    expect(accessBand(16)).toBe('low');
    expect(accessBand(20)).toBe('middle');
    expect(accessBand(22)).toBe('middle');
    expect(accessBand(25)).toBe('middle');
    expect(accessBand(26)).toBe('high');
    expect(accessBand(null)).toBe('missing');
    expect(ACCESS_COUNTRIES.find((c) => c.name === 'Argentina')).toBeDefined();
  });
  it('attaches a source and retrieval date to all API price records', () => {
    for (const p of API_PRICES) {
      expect(p.source.url).toMatch(/^https:\/\//);
      expect(p.retrieved_at).toBe('2026-10-30');
    }
  });
});
