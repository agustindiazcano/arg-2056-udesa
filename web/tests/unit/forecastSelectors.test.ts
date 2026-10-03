import { describe, it, expect } from 'vitest';
import {
  forecastView,
  clampYear,
  endpoint,
  cagr,
  aiDelta,
  rankProvinces
} from '../../src/scenes/forecast/selectors.js';
import type {
  ForecastOutput,
  ForecastSeries,
  ForecastPoint,
  Scenario
} from '../../src/types/index.js';

function pts(from: number, values: number[]): ForecastPoint[] {
  return values.map((v, i) => ({ year: from + i, p10: v * 0.9, p50: v, p90: v * 1.1 }));
}

function series(over: Partial<ForecastSeries> & { points: ForecastPoint[] }): ForecastSeries {
  return {
    indicator: 'gdp_constant_usd',
    geo: 'AR',
    scenario: 'expected',
    ai_overlay: 'off',
    unit: 'u',
    ...over
  };
}

function output(s: ForecastSeries[]): ForecastOutput {
  return {
    model_version: 't',
    generated_at: '2026-01-01',
    source: 'MOCK',
    horizon: { start_year: 2026, end_year: 2028 },
    series: s
  };
}

describe('forecastView', () => {
  const all = (overlay: 'on' | 'off', geo: 'AR' | 'AR-X' = 'AR') =>
    (['pessimistic', 'expected', 'optimistic'] as Scenario[]).map((scenario, i) =>
      series({ scenario, ai_overlay: overlay, geo, points: pts(2026, [10 + i, 20 + i]) })
    );

  it('returns the three scenarios and no reference when the overlay is off', () => {
    const out = output(all('off'));
    const v = forecastView(out, { indicator: 'gdp_constant_usd', aiOverlay: false });
    expect(v.missing).toEqual([]);
    expect(v.reference).toBeNull();
    expect(v.series.pessimistic?.points[0]?.p50).toBe(10);
    expect(v.series.expected?.points[0]?.p50).toBe(11);
    expect(v.series.optimistic?.points[0]?.p50).toBe(12);
  });

  it('with the overlay on returns the on series plus the off series as reference', () => {
    const on = all('on').map((s) => ({ ...s, points: pts(2026, [s.points[0]!.p50 + 100, 200]) }));
    const out = output([...on, ...all('off')]);
    const v = forecastView(out, { indicator: 'gdp_constant_usd', aiOverlay: true });
    expect(v.series.expected?.ai_overlay).toBe('on');
    expect(v.series.expected?.points[0]?.p50).toBe(111);
    expect(v.reference?.expected?.ai_overlay).toBe('off');
    expect(v.reference?.expected?.points[0]?.p50).toBe(11);
    expect(v.missing).toEqual([]);
  });

  it('reports a missing scenario and fabricates nothing', () => {
    const out = output(all('off').filter((s) => s.scenario !== 'optimistic'));
    const v = forecastView(out, { indicator: 'gdp_constant_usd', aiOverlay: false });
    expect(v.missing).toEqual(['optimistic']);
    expect(v.series.optimistic).toBeUndefined();
    expect(v.series.expected).toBeDefined();
  });

  it('uses geo and resource to pick the series', () => {
    const prov = all('off', 'AR-X').map((s) => ({ ...s, indicator: 'resource_production' as const, resource: 'gold' as const }));
    const out = output([...all('off'), ...prov]);
    const v = forecastView(out, { indicator: 'resource_production', resource: 'gold', geo: 'AR-X', aiOverlay: false });
    expect(v.missing).toEqual([]);
    expect(v.series.expected?.geo).toBe('AR-X');
    const none = forecastView(out, { indicator: 'resource_production', resource: 'copper', geo: 'AR-X', aiOverlay: false });
    expect(none.missing).toEqual(['pessimistic', 'expected', 'optimistic']);
  });
});

describe('clampYear', () => {
  const points = pts(2026, [1, 2, 3]); // 2026..2028
  it('clamps below, inside and above the range', () => {
    expect(clampYear(2000, points)).toBe(2026);
    expect(clampYear(2027, points)).toBe(2027);
    expect(clampYear(2100, points)).toBe(2028);
  });
  it('floors non-integer input', () => {
    expect(clampYear(2027.9, points)).toBe(2027);
    expect(clampYear(2025.5, points)).toBe(2026);
  });
});

describe('endpoint', () => {
  const s = series({ points: pts(2026, [100, 200]) });
  it('returns the percentiles at the year', () => {
    const e = endpoint(s, 2027);
    expect(e?.p50).toBe(200);
    expect(e?.p10).toBeCloseTo(180, 10);
    expect(e?.p90).toBeCloseTo(220, 10);
  });
  it('returns null when the point does not exist or the series is missing', () => {
    expect(endpoint(s, 2030)).toBeNull();
    expect(endpoint(undefined, 2026)).toBeNull();
  });
});

describe('cagr', () => {
  it('computes the compound annual growth of p50 in percent', () => {
    const s = series({ points: pts(2026, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 200]) });
    const v = cagr(s, 2026, 2036);
    expect(v).not.toBeNull();
    expect(v!.toFixed(6)).toBe('7.177346');
  });
  it('returns null when a value is missing, not positive, or n <= 0', () => {
    const s = series({ points: pts(2026, [100, 200, 0]) });
    expect(cagr(s, 2026, 2030)).toBeNull(); // missing year
    expect(cagr(s, 2026, 2028)).toBeNull(); // zero end value
    expect(cagr(series({ points: pts(2026, [-5, 200]) }), 2026, 2027)).toBeNull(); // negative start
    expect(cagr(s, 2027, 2027)).toBeNull(); // n = 0
    expect(cagr(s, 2027, 2026)).toBeNull(); // n < 0
    expect(cagr(undefined, 2026, 2027)).toBeNull();
  });
});

describe('aiDelta', () => {
  const on = series({ ai_overlay: 'on', points: pts(2026, [110, 330]) });
  const off = series({ points: pts(2026, [100, 300]) });
  it('returns the relative difference of p50 in percent', () => {
    expect(aiDelta(on, off, 2026)).toBeCloseTo(10, 10);
    expect(aiDelta(on, off, 2027)).toBeCloseTo(10, 10);
  });
  it('returns null when a value is missing or off is zero', () => {
    expect(aiDelta(on, off, 2040)).toBeNull();
    expect(aiDelta(undefined, off, 2026)).toBeNull();
    expect(aiDelta(on, undefined, 2026)).toBeNull();
    expect(aiDelta(on, series({ points: pts(2026, [0, 1]) }), 2026)).toBeNull();
  });
});

describe('rankProvinces', () => {
  const prov = (geo: ForecastSeries['geo'], values: number[], overlay: 'on' | 'off' = 'off') =>
    series({ indicator: 'resource_production', resource: 'gold', geo, ai_overlay: overlay, points: pts(2026, values) });

  const base = [
    prov('AR', [1000, 1000]),
    prov('AR-A', [10, 10]), // Salta
    prov('AR-B', [20, 30]), // Buenos Aires
    prov('AR-C', [30, 20]), // CABA
    prov('AR-D', [5, 5]) // San Luis
  ];
  const q = { indicator: 'resource_production' as const, resource: 'gold' as const, scenario: 'expected' as const, aiOverlay: false };

  it('sorts descending by p50, excludes AR and resolves names', () => {
    const { rows, excluded } = rankProvinces(output(base), { ...q, year: 2027 });
    expect(excluded).toBe(0);
    expect(rows.map((r) => r.geo)).toEqual(['AR-B', 'AR-C', 'AR-A', 'AR-D']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(rows[0]?.name).toBe('Buenos Aires');
    expect(rows[1]?.name).toBe('Ciudad Autónoma de Buenos Aires');
    expect(rows[0]?.p50).toBe(30);
    expect(rows[0]?.p10).toBeCloseTo(27, 10);
    expect(rows[0]?.p90).toBeCloseTo(33, 10);
  });

  it('computes baseRank at the first year and rankChange = baseRank - rank', () => {
    const { rows } = rankProvinces(output(base), { ...q, year: 2027 });
    // 2026 order: AR-C (30), AR-B (20), AR-A (10), AR-D (5)
    const byGeo = Object.fromEntries(rows.map((r) => [r.geo, r]));
    expect(byGeo['AR-B']?.baseRank).toBe(2);
    expect(byGeo['AR-B']?.rankChange).toBe(1); // climbed from 2 to 1
    expect(byGeo['AR-C']?.baseRank).toBe(1);
    expect(byGeo['AR-C']?.rankChange).toBe(-1); // fell from 1 to 2
    expect(byGeo['AR-A']?.rankChange).toBe(0);
  });

  it('breaks ties by geo id, deterministically', () => {
    const tied = [prov('AR-D', [7, 7]), prov('AR-A', [7, 7]), prov('AR-B', [7, 7])];
    const { rows } = rankProvinces(output(tied), { ...q, year: 2027 });
    expect(rows.map((r) => r.geo)).toEqual(['AR-A', 'AR-B', 'AR-D']);
  });

  it('excludes provinces without a point at the year and counts them', () => {
    const short = prov('AR-D', [5]); // only 2026
    const { rows, excluded } = rankProvinces(output([...base.filter((s) => s.geo !== 'AR-D'), short]), { ...q, year: 2027 });
    expect(rows.map((r) => r.geo)).toEqual(['AR-B', 'AR-C', 'AR-A']);
    expect(excluded).toBe(1);
  });

  it('keeps only topN rows', () => {
    const { rows } = rankProvinces(output(base), { ...q, year: 2027, topN: 2 });
    expect(rows.map((r) => r.geo)).toEqual(['AR-B', 'AR-C']);
  });

  it('uses the overlay series when aiOverlay is true and ignores the other state', () => {
    const on = [prov('AR-A', [999, 999], 'on'), prov('AR-B', [1, 1], 'on')];
    const { rows } = rankProvinces(output([...base, ...on]), { ...q, aiOverlay: true, year: 2027 });
    expect(rows.map((r) => r.geo)).toEqual(['AR-A', 'AR-B']);
    expect(rows[0]?.p50).toBe(999);
  });

  it('returns no rows and excluded 0 when no province series match', () => {
    const { rows, excluded } = rankProvinces(output([prov('AR', [1, 1])]), { ...q, year: 2027 });
    expect(rows).toEqual([]);
    expect(excluded).toBe(0);
  });
});
