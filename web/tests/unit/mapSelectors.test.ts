import { describe, it, expect } from 'vitest';
import { mapSummary, provinceMapValues, smallestProvinces } from '../../src/scenes/forecast/mapSelectors.js';
import type { ProvincesGeo, ProvinceFeature } from '../../src/geo/provinces.js';
import type { ForecastOutput, ForecastSeries, ProvinceId, Scenario } from '../../src/types/index.js';

function geoOf(areas: Partial<Record<ProvinceId, number>>): ProvincesGeo {
  const features = (Object.entries(areas) as Array<[ProvinceId, number]>).map(
    ([id, area]): ProvinceFeature => ({
      type: 'Feature',
      properties: {
        id,
        name: id,
        area_km2: area,
        centroid: [-65, -35],
        centroid_inside: true,
        bbox: [-70, -40, -60, -30]
      },
      geometry: { type: 'Polygon', coordinates: [[[-70, -40], [-60, -40], [-60, -30], [-70, -40]]] }
    })
  );
  return { type: 'FeatureCollection', features };
}

const YEARS = [2026, 2027, 2028];

function series(
  geo: ProvinceId,
  values: number[],
  opts: { scenario?: Scenario; overlay?: 'on' | 'off'; years?: number[] } = {}
): ForecastSeries {
  const years = opts.years ?? YEARS;
  return {
    indicator: 'resource_production',
    resource: 'gold',
    geo,
    scenario: opts.scenario ?? 'expected',
    ai_overlay: opts.overlay ?? 'off',
    unit: 't',
    points: values.map((v, i) => ({ year: years[i]!, p10: v - 1, p50: v, p90: v + 1 }))
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

const geo = geoOf({ 'AR-A': 500, 'AR-B': 100, 'AR-C': 100, 'AR-D': 900 });
const base = [
  series('AR-A', [10, 20, 30]),
  series('AR-B', [30, 25, 20]),
  // AR-C has no series; AR-D has a single point in 2026
  series('AR-D', [5], { years: [2026] }),
  // another scenario with huge values must not affect the domain of the selected one
  series('AR-A', [1000, 2000, 3000], { scenario: 'optimistic' })
];
const q = {
  indicator: 'resource_production' as const,
  resource: 'gold' as const,
  scenario: 'expected' as const,
  aiOverlay: false
};

describe('provinceMapValues: level', () => {
  const result = provinceMapValues(output(base), geo, { ...q, year: 2027, metric: 'level' });

  it('plots p50 at the year with p10, p90 and the rank', () => {
    expect(result.values['AR-A']).toEqual({ plotted: 20, p10: 19, p50: 20, p90: 21, rank: 2 });
    expect(result.values['AR-B']).toEqual({ plotted: 25, p10: 24, p50: 25, p90: 26, rank: 1 });
  });

  it('lists provinces without a usable value in missing and never in values', () => {
    expect(result.missing).toEqual(['AR-C', 'AR-D']); // AR-C has no series, AR-D has no point in 2027
    expect(Object.keys(result.values).sort()).toEqual(['AR-A', 'AR-B']);
    expect(result.excluded).toBe(2);
  });

  it('breaks rank ties by id', () => {
    const tied = [series('AR-B', [7, 7, 7]), series('AR-A', [7, 7, 7]), series('AR-C', [9, 9, 9])];
    const r = provinceMapValues(output(tied), geo, { ...q, year: 2027, metric: 'level' });
    expect(r.values['AR-C']!.rank).toBe(1);
    expect(r.values['AR-A']!.rank).toBe(2);
    expect(r.values['AR-B']!.rank).toBe(3);
  });

  it('computes the domain over all years of the selected scenario, not only the current year', () => {
    // maxima (30 in 2028 for AR-A, 30 in 2026 for AR-B) and the minimum (5, AR-D in 2026) are not at 2027
    expect(result.domain).toEqual([5, 30]);
    const other = provinceMapValues(output(base), geo, { ...q, year: 2028, metric: 'level' });
    expect(other.domain).toEqual([5, 30]);
    const first = provinceMapValues(output(base), geo, { ...q, year: 2026, metric: 'level' });
    expect(first.domain).toEqual([5, 30]);
  });

  it('uses the overlay series when aiOverlay is true', () => {
    const withOverlay = [...base, series('AR-A', [100, 200, 300], { overlay: 'on' })];
    const r = provinceMapValues(output(withOverlay), geo, { ...q, aiOverlay: true, year: 2027, metric: 'level' });
    expect(r.values['AR-A']!.plotted).toBe(200);
    expect(r.domain).toEqual([100, 300]);
    expect(r.missing).toEqual(['AR-B', 'AR-C', 'AR-D']);
  });

  it('returns a null domain and every province as missing when there is no data', () => {
    const r = provinceMapValues(output([]), geo, { ...q, year: 2027, metric: 'level' });
    expect(r.domain).toBeNull();
    expect(r.values).toEqual({});
    expect(r.missing).toEqual(['AR-A', 'AR-B', 'AR-C', 'AR-D']);
    expect(r.excluded).toBe(4);
  });

  it('never replaces a missing province with a neighbour or with zero', () => {
    expect(result.values['AR-C']).toBeUndefined();
    expect(result.values['AR-D']).toBeUndefined();
  });
});

describe('provinceMapValues: change', () => {
  const run = (year: number) => provinceMapValues(output(base), geo, { ...q, year, metric: 'change' });

  it('plots the exact cagr of p50 since the first year of each series', () => {
    const r = run(2028);
    expect(r.values['AR-A']!.plotted).toBeCloseTo((Math.sqrt(3) - 1) * 100, 10); // 10 -> 30 in 2 years
    expect(r.values['AR-B']!.plotted).toBeCloseTo((Math.sqrt(20 / 30) - 1) * 100, 10);
    expect(r.values['AR-A']!.p50).toBe(30);
    expect(r.values['AR-A']!.rank).toBe(1);
    expect(run(2027).values['AR-A']!.plotted).toBeCloseTo(100, 10);
  });

  it('is missing, not zero, when the year is not after the first year', () => {
    const r = run(2026);
    expect(r.values).toEqual({});
    expect(r.missing).toEqual(['AR-A', 'AR-B', 'AR-C', 'AR-D']);
    expect(r.domain).not.toBeNull(); // the domain still covers the later years
  });

  it('has a domain symmetric around 0 that covers all years', () => {
    const r = run(2027);
    expect(r.domain![0]).toBeCloseTo(-100, 10);
    expect(r.domain![1]).toBeCloseTo(100, 10);
    expect(run(2028).domain).toEqual(r.domain);
  });

  it('uses the largest absolute value for the symmetric domain, whichever side it is on', () => {
    const falling = [series('AR-A', [100, 50, 25]), series('AR-B', [10, 11, 12])];
    const r = provinceMapValues(output(falling), geo, { ...q, year: 2027, metric: 'change' });
    expect(r.domain![0]).toBeCloseTo(-50, 10); // 100 -> 50 in one year is -50%
    expect(r.domain![1]).toBeCloseTo(50, 10);
  });

  it('returns a null domain when no series has a change to plot', () => {
    const single = [series('AR-A', [5], { years: [2026] })];
    const r = provinceMapValues(output(single), geo, { ...q, year: 2027, metric: 'change' });
    expect(r.domain).toBeNull();
  });
});

describe('smallestProvinces', () => {
  it('orders by area ascending with ties by id', () => {
    expect(smallestProvinces(geo, 3)).toEqual(['AR-B', 'AR-C', 'AR-A']);
  });
  it('defaults to 3 and copes with n larger than the count', () => {
    expect(smallestProvinces(geo)).toEqual(['AR-B', 'AR-C', 'AR-A']);
    expect(smallestProvinces(geo, 10)).toEqual(['AR-B', 'AR-C', 'AR-A', 'AR-D']);
    expect(smallestProvinces(geo, 0)).toEqual([]);
  });
});

describe('mapSummary', () => {
  const values = provinceMapValues(output(base), geo, { ...q, year: 2027, metric: 'level' });

  it('names the highest and lowest province and counts the provinces with no data (level)', () => {
    expect(mapSummary(values, 'level', 'producción de oro', 2027, 't')).toBe(
      'Mapa de producción de oro por provincia en 2027: mayor Buenos Aires con 25 t, menor Salta con 20 t; 2 provincias sin datos'
    );
  });

  it('formats a change as percent per year', () => {
    const change = provinceMapValues(output(base), geo, { ...q, year: 2028, metric: 'change' });
    expect(mapSummary(change, 'change', 'producción de oro', 2028, 't')).toBe(
      'Mapa del cambio de producción de oro por provincia hasta 2028: mayor Salta con 73,2% por año, menor Buenos Aires con -18,4% por año; 2 provincias sin datos'
    );
  });

  it('omits the no-data clause when nothing is missing and uses the singular for one', () => {
    const full = provinceMapValues(output([series('AR-A', [1, 2, 3]), series('AR-B', [3, 2, 1]), series('AR-C', [2, 2, 2]), series('AR-D', [4, 4, 4])]), geo, { ...q, year: 2027, metric: 'level' });
    expect(mapSummary(full, 'level', 'producción de oro', 2027, 't')).toBe(
      'Mapa de producción de oro por provincia en 2027: mayor San Luis con 4 t, menor Salta con 2 t'
    );
    const one = provinceMapValues(output([series('AR-A', [1, 2, 3]), series('AR-B', [3, 2, 1]), series('AR-C', [2, 2, 2])]), geo, { ...q, year: 2027, metric: 'level' });
    expect(mapSummary(one, 'level', 'producción de oro', 2027, 't')).toContain('1 provincia sin datos');
  });

  it('says there is no data when no province has a value', () => {
    const none = provinceMapValues(output([]), geo, { ...q, year: 2027, metric: 'level' });
    expect(mapSummary(none, 'level', 'producción de oro', 2027, 't')).toBe('Sin datos provinciales de producción de oro en 2027.');
  });
});
