import { describe, it, expect } from 'vitest';
import { parseEconomySeries } from '../../src/types/economy.js';

const valid = {
  country: 'ARG',
  year: 1913,
  indicator: 'gdp_per_capita_usd',
  value: 100.5,
  unit: 'mock_unit',
  source: 'MOCK',
  retrieved_at: '2026-10-02'
};

describe('parseEconomySeries', () => {
  it('accepts valid records, with a null value that has a note', () => {
    const records = parseEconomySeries([valid, { ...valid, year: 1914, value: null, note: 'Mock missing data' }]);
    expect(records).toHaveLength(2);
    expect(records[0]!.value).toBe(100.5);
    expect(records[1]!.value).toBeNull();
  });

  const bad: Array<[string, Record<string, unknown>]> = [
    ['a null value without a note', { ...valid, value: null }],
    ['an unknown indicator', { ...valid, indicator: 'inflation' }],
    ['a country that is not three capital letters', { ...valid, country: 'Arg' }],
    ['a year out of range', { ...valid, year: 1700 }],
    ['an extra field', { ...valid, extra: 1 }],
    ['a missing source', (() => { const r: Record<string, unknown> = { ...valid }; delete r.source; return r; })()],
    ['a bad date', { ...valid, retrieved_at: '2026-13-45' }]
  ];

  it.each(bad)('rejects %s', (_name, record) => {
    expect(() => parseEconomySeries([record])).toThrow('Invalid economy data');
  });

  it('rejects something that is not an array', () => {
    expect(() => parseEconomySeries({})).toThrow('Invalid economy data');
  });
});
