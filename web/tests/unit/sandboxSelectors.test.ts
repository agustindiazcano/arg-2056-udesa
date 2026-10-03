import { describe, it, expect } from 'vitest';
import {
  basePoint,
  modelEnvelope,
  pathView,
  positionVsRange,
  scenarioPreset,
  summaryText,
  userPath
} from '../../src/scenes/sandbox/selectors.js';
import { cagr } from '../../src/scenes/forecast/selectors.js';
import type { ForecastOutput, ForecastSeries, Indicator, Scenario } from '../../src/types/index.js';

const YEARS = [2026, 2027, 2028];

function series(
  indicator: Indicator,
  scenario: Scenario,
  overlay: 'on' | 'off',
  p10: number[],
  p50: number[],
  p90: number[],
  years = YEARS
): ForecastSeries {
  return {
    indicator,
    geo: 'AR',
    scenario,
    ai_overlay: overlay,
    unit: indicator === 'population' ? 'people' : 'USD',
    points: years.map((year, i) => ({ year, p10: p10[i]!, p50: p50[i]!, p90: p90[i]! }))
  };
}

function output(all: ForecastSeries[]): ForecastOutput {
  return {
    model_version: 't',
    generated_at: '2026-01-01',
    source: 'MOCK',
    horizon: { start_year: 2026, end_year: 2028 },
    series: all
  };
}

const gpc = {
  pessimistic: series('gdp_per_capita_usd', 'pessimistic', 'off', [80, 85, 90], [90, 95, 100], [100, 105, 110]),
  expected: series('gdp_per_capita_usd', 'expected', 'off', [95, 100, 105], [100, 110, 121], [110, 120, 135]),
  optimistic: series('gdp_per_capita_usd', 'optimistic', 'off', [100, 105, 70], [110, 125, 130], [120, 140, 130])
};
const pop = series('population', 'expected', 'off', [9, 10, 11], [10, 11, 12], [11, 12, 13]);
const full = output([...Object.values(gpc), pop]);

describe('basePoint', () => {
  it('is the first forecast year with the p50 of GDP per capita and population', () => {
    expect(basePoint(full, { scenario: 'expected' })).toEqual({ base: { year: 2026, gpc: 100, pop: 10 }, reason: null });
  });

  it('uses the series of the requested scenario', () => {
    const r = basePoint(full, { scenario: 'optimistic' });
    expect(r.base).toBeNull(); // no optimistic population series in the fixture
    expect(r.reason).toBe('No population series for AR in the optimistic scenario');
  });

  it('returns null with a reason when GDP per capita is missing', () => {
    const r = basePoint(output([pop]), { scenario: 'expected' });
    expect(r).toEqual({ base: null, reason: 'No GDP per capita series for AR in the expected scenario' });
  });
});

describe('userPath', () => {
  const base = { year: 2026, gpc: 100, pop: 10 };
  const path = userPath({ base, years: 3, gpcPct: 2, popPct: 1, aiPp: 0.5 });

  it('starts at the base and compounds the effective per-capita rate and the population rate', () => {
    expect(path.years).toEqual([2026, 2027, 2028, 2029]);
    expect(path.gpc[0]).toBe(100);
    expect(path.pop[0]).toBe(10);
    expect(path.gpc[1]).toBeCloseTo(102.5, 10); // 2% plus 0.5 points
    expect(path.gpc[2]).toBeCloseTo(105.0625, 10);
    expect(path.pop[1]).toBeCloseTo(10.1, 10);
    expect(path.pop[3]).toBeCloseTo(10 * 1.01 ** 3, 10);
  });

  it('has GDP equal to GDP per capita times population at every year', () => {
    path.years.forEach((_, i) => expect(path.gdp[i]).toBe(path.gpc[i]! * path.pop[i]!));
  });

  it('with zero growth keeps the base level', () => {
    const flat = userPath({ base, years: 5, gpcPct: 0, popPct: 0, aiPp: 0 });
    expect(flat.gpc).toEqual([100, 100, 100, 100, 100, 100]);
  });
});

describe('modelEnvelope', () => {
  it('takes the min of p10 and the max of p90 across the three scenarios, and the expected p50', () => {
    const e = modelEnvelope(full, { aiOverlay: false });
    expect(e.years).toEqual(YEARS);
    expect(e.lower).toEqual([80, 85, 70]); // pessimistic, pessimistic, optimistic
    expect(e.upper).toEqual([120, 140, 135]); // optimistic, optimistic, expected
    expect(e.expected).toEqual([100, 110, 121]);
    expect(e.missing).toEqual([]);
    expect(e.unit).toBe('USD');
  });

  it('gives null bounds, never 0, and lists the year when a needed point is missing', () => {
    const noMiddle = series('gdp_per_capita_usd', 'optimistic', 'off', [100, 70], [110, 130], [120, 130], [2026, 2028]);
    const e = modelEnvelope(output([gpc.pessimistic, gpc.expected, noMiddle]), { aiOverlay: false });
    expect(e.years).toEqual(YEARS);
    expect(e.lower).toEqual([80, null, 70]);
    expect(e.upper).toEqual([120, null, 135]);
    expect(e.expected).toEqual([100, 110, 121]);
    expect(e.missing).toEqual([2027]);
  });

  it('has a null expected line where the expected p50 is missing', () => {
    const noExpected = series('gdp_per_capita_usd', 'expected', 'off', [95, 105], [100, 121], [110, 135], [2026, 2028]);
    const e = modelEnvelope(output([gpc.pessimistic, noExpected, gpc.optimistic]), { aiOverlay: false });
    expect(e.expected).toEqual([100, null, 121]);
    expect(e.lower[1]).toBeNull();
  });

  it('uses the overlay series when aiOverlay is true', () => {
    const on = (s: Scenario, shift: number) =>
      series(
        'gdp_per_capita_usd',
        s,
        'on',
        [80 + shift, 85 + shift, 90 + shift],
        [100 + shift, 110 + shift, 120 + shift],
        [130 + shift, 140 + shift, 150 + shift]
      );
    const all = output([...Object.values(gpc), on('pessimistic', 0), on('expected', 5), on('optimistic', 10)]);
    const e = modelEnvelope(all, { aiOverlay: true });
    expect(e.lower).toEqual([80, 85, 90]);
    expect(e.upper).toEqual([140, 150, 160]);
    expect(e.expected).toEqual([105, 115, 125]);
  });

  it('returns empty arrays when there is no GDP per capita series at all', () => {
    const e = modelEnvelope(output([pop]), { aiOverlay: false });
    expect(e.years).toEqual([]);
    expect(e.lower).toEqual([]);
  });
});

describe('positionVsRange', () => {
  it('is below, inside or above, with the boundary counting as inside', () => {
    expect(positionVsRange(79, 80, 120)).toBe('below');
    expect(positionVsRange(100, 80, 120)).toBe('inside');
    expect(positionVsRange(121, 80, 120)).toBe('above');
    expect(positionVsRange(80, 80, 120)).toBe('inside');
    expect(positionVsRange(120, 80, 120)).toBe('inside');
  });
  it('is null when any argument is null', () => {
    expect(positionVsRange(null, 80, 120)).toBeNull();
    expect(positionVsRange(100, null, 120)).toBeNull();
    expect(positionVsRange(100, 80, null)).toBeNull();
  });
});

describe('scenarioPreset', () => {
  it('reproduces the central path: the compound growth of the p50 between the first and last forecast year', () => {
    const preset = scenarioPreset(full, { scenario: 'expected', aiOverlay: false })!;
    expect(preset.aiPp).toBe(0);
    expect(preset.gpcPct).toBeCloseTo(10, 10); // 100 -> 121 in 2 years
    expect(preset.popPct).toBeCloseTo((Math.sqrt(12 / 10) - 1) * 100, 10);
    expect(preset.gpcPct).toBe(cagr(gpc.expected, 2026, 2028));
    expect(preset.popPct).toBe(cagr(pop, 2026, 2028));
  });

  it('is null when a series is missing', () => {
    expect(scenarioPreset(output([gpc.expected]), { scenario: 'expected', aiOverlay: false })).toBeNull();
    expect(scenarioPreset(full, { scenario: 'optimistic', aiOverlay: false })).toBeNull();
  });

  it('uses the overlay series when aiOverlay is true', () => {
    const gpcOn = series('gdp_per_capita_usd', 'expected', 'on', [95, 100, 105], [100, 120, 144], [110, 130, 150]);
    const popOn = series('population', 'expected', 'on', [9, 10, 11], [10, 10, 10], [11, 12, 13]);
    const preset = scenarioPreset(output([gpc.expected, pop, gpcOn, popOn]), { scenario: 'expected', aiOverlay: true })!;
    expect(preset.gpcPct).toBeCloseTo(20, 10); // 100 -> 144 in 2 years
    expect(preset.popPct).toBeCloseTo(0, 10);
  });
});

describe('pathView', () => {
  it('aligns the visitor path with the model envelope by year', () => {
    const path = userPath({ base: { year: 2026, gpc: 100, pop: 10 }, years: 3, gpcPct: 0, popPct: 0, aiPp: 0 });
    const view = pathView(path, modelEnvelope(full, { aiOverlay: false }));
    expect(view.years).toEqual([2026, 2027, 2028, 2029]);
    expect(view.visitor).toEqual([100, 100, 100, 100]);
    expect(view.lower).toEqual([80, 85, 70, null]); // 2029 is beyond the model
    expect(view.upper).toEqual([120, 140, 135, null]);
    expect(view.expected).toEqual([100, 110, 121, null]);
    expect(view.unit).toBe('USD');
  });
});

describe('summaryText', () => {
  const q = { effectivePct: 2.5, firstYear: 2026, lastYear: 2056, multiple: 2.097568 };
  it('states the multiple and the position against the model range', () => {
    expect(summaryText({ ...q, position: 'above' })).toBe(
      'At 2.5% per-capita growth, GDP per capita in 2056 is 2.1 times its 2026 level and sits above the model range'
    );
    expect(summaryText({ ...q, position: 'inside' })).toContain('and sits inside the model range');
    expect(summaryText({ ...q, position: 'below' })).toContain('and sits below the model range');
  });
  it('says the range is not available when the position is null', () => {
    expect(summaryText({ ...q, position: null })).toBe(
      'At 2.5% per-capita growth, GDP per capita in 2056 is 2.1 times its 2026 level; the model range is not available for that year'
    );
  });
  it('never calls the visitor path a forecast', () => {
    expect(summaryText({ ...q, position: 'above' }).toLowerCase()).not.toContain('forecast');
  });
});
