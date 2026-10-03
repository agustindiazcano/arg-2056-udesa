import { describe, it, expect } from 'vitest';
import { selectProjectsForTable, getAvailableYears, clampYear } from '../../src/scenes/resources/selectors.js';
import type { ProjectRecord } from '../../src/types/index.js';

describe('Resources Selectors', () => {
  it('selectProjectsForTable filters and sorts with null capex last', () => {
    const records: ProjectRecord[] = [
      { id: '1', name: 'A', resource: 'lithium', geo: 'AR-A', status: 'operating', capex_usd: null, start_year: 2025, capacity_per_year: 10, capacity_unit: 't', source: 'S', retrieved_at: '2026', owners: [] },
      { id: '2', name: 'B', resource: 'copper', geo: 'AR-B', status: 'operating', capex_usd: 100, start_year: 2025, capacity_per_year: 10, capacity_unit: 't', source: 'S', retrieved_at: '2026', owners: [] },
      { id: '3', name: 'C', resource: 'lithium', geo: 'AR-C', status: 'operating', capex_usd: 50, start_year: 2025, capacity_per_year: 10, capacity_unit: 't', source: 'S', retrieved_at: '2026', owners: [] },
      { id: '4', name: 'D', resource: 'lithium', geo: 'AR-D', status: 'operating', capex_usd: 200, start_year: 2025, capacity_per_year: 10, capacity_unit: 't', source: 'S', retrieved_at: '2026', owners: [] },
    ];

    const result = selectProjectsForTable(records, 'lithium');
    expect(result).toHaveLength(3);
    
    // Sort order: 200, 50, null
    expect(result[0]!.name).toBe('D');
    expect(result[1]!.name).toBe('C');
    expect(result[2]!.name).toBe('A');

    // Province name mapped
    expect(result[2]!.province).toBe('Salta'); // AR-A -> Salta
  });

  it('getAvailableYears and clampYear', () => {
    const records = [{ year: 2020 }, { year: 2025 }, { year: 2022 }];
    const available = getAvailableYears(records);
    expect(available).toEqual([2020, 2022, 2025]);

    expect(clampYear(2019, available)).toBe(2020);
    expect(clampYear(2026, available)).toBe(2025);
    expect(clampYear(2021, available)).toBe(2022); // closest
    expect(clampYear(2022, available)).toBe(2022);
  });
});
