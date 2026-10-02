import { describe, it, expect } from 'vitest';
import { parseForecastOutput, selectSeries } from '../../src/types/forecast.js';

describe('forecast contract', () => {
  const minimalValid = {
    model_version: "1.0.0",
    generated_at: "2026-10-02",
    source: "MOCK",
    horizon: { start_year: 2026, end_year: 2056 },
    series: [
      {
        indicator: "gdp_constant_usd",
        geo: "AR",
        scenario: "expected",
        ai_overlay: "off",
        unit: "USD",
        points: [
          { year: 2026, p10: 100, p50: 110, p90: 120 }
        ]
      }
    ]
  };

  it('parseForecastOutput accepts a minimal valid object', () => {
    expect(() => parseForecastOutput(minimalValid)).not.toThrow();
    const result = parseForecastOutput(minimalValid);
    expect(result.model_version).toBe("1.0.0");
  });

  it('parseForecastOutput rejects missing series', () => {
    const invalid = { ...minimalValid };
    // @ts-expect-error
    delete invalid.series;
    expect(() => parseForecastOutput(invalid)).toThrow(/series/i);
  });

  it('parseForecastOutput rejects an invalid scenario', () => {
    const invalid = JSON.parse(JSON.stringify(minimalValid));
    invalid.series[0].scenario = "impossible";
    expect(() => parseForecastOutput(invalid)).toThrow();
  });

  it('parseForecastOutput rejects a missing p90', () => {
    const invalid = JSON.parse(JSON.stringify(minimalValid));
    delete invalid.series[0].points[0].p90;
    expect(() => parseForecastOutput(invalid)).toThrow(/p90/i);
  });

  it('parseForecastOutput rejects a resource_production series without resource', () => {
    const invalid = JSON.parse(JSON.stringify(minimalValid));
    invalid.series[0].indicator = "resource_production";
    expect(() => parseForecastOutput(invalid)).toThrow(/resource/i);
  });

  it('selectSeries returns the right series or undefined', () => {
    const out = parseForecastOutput(minimalValid);
    
    const found = selectSeries(out, {
      indicator: "gdp_constant_usd",
      geo: "AR",
      scenario: "expected",
      aiOverlay: "off"
    });
    expect(found).toBeDefined();
    expect(found?.unit).toBe("USD");

    const notFound = selectSeries(out, {
      indicator: "gdp_constant_usd",
      geo: "AR",
      scenario: "optimistic", // different
      aiOverlay: "off"
    });
    expect(notFound).toBeUndefined();
  });
});
