import { describe, it, expect } from 'vitest';
import { resourceMapValues } from '../../src/scenes/resources/mapValues.js';
import type { ProvincesGeo } from '../../src/geo/provinces.js';
import type { ResourceProductionRecord } from '../../src/types/index.js';
import { validGeo } from './geo/geoWebFixtures.js';

const geo = validGeo() as unknown as ProvincesGeo;
const src = { source: 'S', retrieved_at: '2026' };
const rec = (resource: string, geoId: string, year: number, value: number | null): ResourceProductionRecord =>
  ({ resource, geo: geoId, year, value, unit: 't', ...src }) as ResourceProductionRecord;

const records = [
  rec('lithium', 'AR', 2026, 1000), // the national total is not a province
  rec('lithium', 'AR-A', 2025, 40),
  rec('lithium', 'AR-A', 2026, 60),
  rec('lithium', 'AR-B', 2026, 100),
  rec('lithium', 'AR-C', 2026, null),
  rec('copper', 'AR-D', 2026, 5000)
];

describe('resourceMapValues', () => {
  const result = resourceMapValues(records, geo, { resource: 'lithium', year: 2026 });

  it('plots the observed value of each province, ranked from the highest, with no range', () => {
    expect(result.values['AR-B']).toEqual({ plotted: 100, p10: 100, p50: 100, p90: 100, rank: 1 });
    expect(result.values['AR-A']).toEqual({ plotted: 60, p10: 60, p50: 60, p90: 60, rank: 2 });
  });

  it('never draws the national total, another resource or a null as a province value', () => {
    expect(result.values['AR']).toBeUndefined();
    expect(result.values['AR-C']).toBeUndefined();
    expect(result.values['AR-D']).toBeUndefined();
  });

  it('lists every other province as missing and counts them as excluded', () => {
    expect(result.missing).toContain('AR-C');
    expect(result.missing).toContain('AR-D');
    expect(result.missing).not.toContain('AR-A');
    expect(result.excluded).toBe(result.missing.length);
    expect(result.missing).toHaveLength(22);
  });

  it('keeps the color domain over all years of the resource so it does not jump while the year moves', () => {
    expect(result.domain).toEqual([40, 100]);
    expect(resourceMapValues(records, geo, { resource: 'lithium', year: 2025 }).domain).toEqual([40, 100]);
  });

  it('has no domain and nothing drawn for a resource without province data', () => {
    const none = resourceMapValues(records, geo, { resource: 'gold', year: 2026 });
    expect(none.values).toEqual({});
    expect(none.domain).toBeNull();
    expect(none.missing).toHaveLength(24);
  });
});
