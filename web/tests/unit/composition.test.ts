import { describe, it, expect } from 'vitest';
import { parseComposition, selectComposition, CompositionRecord } from '../../src/types/composition';

describe('composition types', () => {
  it('parses valid composition json', () => {
    const valid = [
      {
        kind: 'gdp_by_sector',
        year: 2020,
        group: 'Primary',
        category: 'agri-1',
        label: 'Agriculture',
        value_usd: 100,
        source: 'MOCK',
        retrieved_at: '2026-10-02'
      }
    ];
    const parsed = parseComposition(valid);
    expect(parsed.length).toBe(1);
    expect(parsed[0]?.group).toBe('Primary');
  });

  it('rejects invalid composition json', () => {
    const invalid = [{ kind: 'invalid', year: 2020 }];
    expect(() => parseComposition(invalid)).toThrow();
  });

  it('selects and filters composition', () => {
    const records = [
      { kind: 'gdp_by_sector', year: 2020, group: 'A', category: 'a1', label: 'L', value_usd: 10, source: 'S', retrieved_at: 'R' },
      { kind: 'exports_by_product', year: 2020, group: 'A', category: 'a2', label: 'L', value_usd: 10, source: 'S', retrieved_at: 'R' },
      { kind: 'gdp_by_sector', year: 2021, group: 'A', category: 'a3', label: 'L', value_usd: 10, source: 'S', retrieved_at: 'R' }
    ] as unknown as CompositionRecord[];
    
    const selected = selectComposition(records, { kind: 'gdp_by_sector', year: 2020 });
    expect(selected.length).toBe(1);
    expect(selected[0]?.category).toBe('a1');
  });
});
