import { describe, it, expect } from 'vitest';
import { parseProjects, selectProjects } from '../../src/types/projects';
import type { ProjectRecord } from '../../src/types/projects';

describe('projects types', () => {
  it('parses valid projects json', () => {
    const valid = [
      {
        id: 'p1',
        name: 'Project One',
        resource: 'lithium',
        geo: 'AR-J',
        status: 'operating',
        capex_usd: 1000,
        start_year: 2025,
        capacity_per_year: 100,
        capacity_unit: 't',
        source: 'MOCK',
        retrieved_at: '2026-10-02'
      }
    ];
    const parsed = parseProjects(valid);
    expect(parsed.length).toBe(1);
    expect(parsed[0]?.id).toBe('p1');
  });

  it('rejects invalid projects json', () => {
    const invalid = [{ id: 'p1', status: 'invalid' }];
    expect(() => parseProjects(invalid)).toThrow();
  });

  it('selects and filters projects, ordering by capex descending with null last', () => {
    const records: ProjectRecord[] = [
      { id: 'p1', name: 'N', resource: 'lithium', geo: 'AR-J', status: 'operating', capex_usd: 50, start_year: null, capacity_per_year: null, capacity_unit: null, source: 'S', retrieved_at: 'R' },
      { id: 'p2', name: 'N', resource: 'lithium', geo: 'AR-S', status: 'proposed', capex_usd: null, start_year: null, capacity_per_year: null, capacity_unit: null, source: 'S', retrieved_at: 'R', note: 'null capex' },
      { id: 'p3', name: 'N', resource: 'copper', geo: 'AR-J', status: 'operating', capex_usd: 200, start_year: null, capacity_per_year: null, capacity_unit: null, source: 'S', retrieved_at: 'R' },
      { id: 'p4', name: 'N', resource: 'lithium', geo: 'AR-J', status: 'operating', capex_usd: 100, start_year: null, capacity_per_year: null, capacity_unit: null, source: 'S', retrieved_at: 'R' },
    ];
    
    // filter by resource 'lithium'
    const selLithium = selectProjects(records, { resource: 'lithium' });
    expect(selLithium.length).toBe(3);
    // order: 100, 50, null (p4, p1, p2)
    expect(selLithium.map(p => p.id)).toEqual(['p4', 'p1', 'p2']);
    
    // filter by status
    const selOp = selectProjects(records, { status: 'operating' });
    expect(selOp.length).toBe(3);
    // order: 200, 100, 50 (p3, p4, p1)
    expect(selOp.map(p => p.id)).toEqual(['p3', 'p4', 'p1']);
  });
});
