import { describe, expect, it } from 'vitest';
import {
  COMPLEX_LABELS,
  EXPORT_YEARS,
  EXPORT_YEARS_WITH_DATA,
  exportRows,
  exportTotal,
  complexOverYears
} from '../../src/tour/exportsData';
import { EXPORTS_BY_SECTOR, EXPORT_COMPLEXES, EXPORT_COMPOSITION } from '../../src/tour/tourData';

describe('the exports by exporting complex (INDEC), by year', () => {
  it('covers 2015 to 2025 and has data for 2024 and 2025 only', () => {
    expect(EXPORT_YEARS).toEqual([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
    expect(EXPORT_YEARS_WITH_DATA).toEqual([2024, 2025]);
  });

  it('gives for 2025 exactly the figures of the old steps 4 and 11, in dollars and in percent', () => {
    expect(exportRows(2025, 'usd')).toEqual(EXPORTS_BY_SECTOR.rows);
    expect(exportRows(2025, 'share')).toEqual(EXPORT_COMPOSITION.rows);
  });

  it('computes 2024 from the same table of the report: dollars in billions, percent of the sum of the complexes', () => {
    const soy = exportRows(2024, 'usd').find((r) => r.label === 'Complejo soja')!;
    expect(soy.value).toBe(19.6);
    expect(exportTotal(2024)).toBe(EXPORT_COMPLEXES.reduce((n, c) => n + c.y2024, 0));
    expect(exportTotal(2025)).toBe(87111); // the total the report publishes
    const shares = exportRows(2024, 'share');
    expect(shares.find((r) => r.label === 'Complejo soja')!.value).toBe(24.6);
    expect(shares.reduce((n, r) => n + r.value, 0)).toBeGreaterThan(99.8);
    expect(shares.reduce((n, r) => n + r.value, 0)).toBeLessThan(100.2);
  });

  it('refuses a year with no data instead of inventing it', () => {
    expect(() => exportRows(2020, 'usd')).toThrow(/2020/);
    expect(() => complexOverYears('Complejo soja', 'usd')).not.toThrow();
  });

  it('follows one complex across the years that exist', () => {
    expect(complexOverYears('Complejo soja', 'usd')).toEqual([
      { label: '2024', value: 19.6 },
      { label: '2025', value: 21.4 }
    ]);
    expect(complexOverYears('Automotriz', 'share').map((r) => r.label)).toEqual(['2024', '2025']);
    expect(COMPLEX_LABELS).toContain('Oro y plata');
    expect(COMPLEX_LABELS).toHaveLength(EXPORT_COMPLEXES.length);
  });
});
