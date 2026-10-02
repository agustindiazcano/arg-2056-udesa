import { describe, it, expect } from 'vitest';
import {
  parseProductionProjections,
  selectProjections,
  groupBySource,
  ProductionProjection
} from '../../src/types/projections.js';

describe('projections', () => {
  const validRecord: ProductionProjection = {
    entity_type: 'project',
    project_id: 'p1',
    geo: 'AR-J',
    resource: 'lithium',
    metric: 'forecast',
    year: 2030,
    value: 100,
    unit: 't',
    unit_basis: 'lce',
    scenario: 'base',
    source: 'S1',
    retrieved_at: '2026-10-02'
  };

  it('parses valid projections', () => {
    const data = [validRecord];
    const parsed = parseProductionProjections(data);
    expect(parsed).toEqual(data);
  });

  it('rejects invalid projections', () => {
    const invalidData = [{ ...validRecord, year: '2030' }]; // year is string
    expect(() => parseProductionProjections(invalidData)).toThrow('Invalid production projections data');
  });

  it('selectProjections filters and sorts correctly', () => {
    const r1: ProductionProjection = { ...validRecord, year: 2030, source: 'B' };
    const r2: ProductionProjection = { ...validRecord, year: 2025, source: 'A' };
    const r3: ProductionProjection = { ...validRecord, year: 2030, source: 'A' };
    const r4: ProductionProjection = { ...validRecord, resource: 'copper', year: 2020 };

    const records = [r1, r2, r3, r4];
    
    // Test filter
    const filtered = selectProjections(records, { resource: 'lithium' });
    expect(filtered).toHaveLength(3);

    // Test sort (year ascending, then source localeCompare)
    expect(filtered[0]).toBe(r2); // 2025 A
    expect(filtered[1]).toBe(r3); // 2030 A
    expect(filtered[2]).toBe(r1); // 2030 B
  });

  it('groupBySource groups correctly', () => {
    const r1: ProductionProjection = { ...validRecord, source: 'S1' };
    const r2: ProductionProjection = { ...validRecord, source: 'S2' };
    const r3: ProductionProjection = { ...validRecord, source: 'S1' };

    const grouped = groupBySource([r1, r2, r3]);
    expect(grouped['S1']!).toHaveLength(2);
    expect(grouped['S2']!).toHaveLength(1);
    expect(grouped['S1']![0]).toBe(r1);
    expect(grouped['S1']![1]).toBe(r3);
  });
});
