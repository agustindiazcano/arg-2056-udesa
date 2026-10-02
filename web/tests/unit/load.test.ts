import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadForecast, isMock } from '../../src/data/load';

describe('load.ts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('isMock', () => {
    it('returns true if source is MOCK', () => {
      expect(isMock({ source: 'MOCK' })).toBe(true);
    });
    it('returns false for other sources', () => {
      expect(isMock({ source: 'argmodel@0.1.0' })).toBe(false);
      expect(isMock({ source: '' })).toBe(false);
    });
  });

  describe('loadForecast', () => {
    it('throws if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      } as Response);

      await expect(loadForecast('url')).rejects.toThrow('Failed to load forecast: Not Found');
    });

    it('throws if JSON is invalid according to schema', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ source: 'MOCK' }) // missing required fields
      } as Response);

      await expect(loadForecast('url')).rejects.toThrow(/Forecast validation failed/);
    });

    it('returns parsed forecast if valid', async () => {
      const validDoc = {
        model_version: '1.0.0',
        generated_at: '2026-10-02',
        source: 'MOCK',
        horizon: { start_year: 2026, end_year: 2056 },
        series: [
          {
            geo: 'AR',
            indicator: 'population',
            scenario: 'expected',
            ai_overlay: 'off',
            unit: 'people',
            points: [{ year: 2026, p10: 100, p50: 110, p90: 120 }]
          }
        ]
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => validDoc
      } as Response);

      const res = await loadForecast('url');
      expect(res).toEqual(validDoc);
    });
  });
});
