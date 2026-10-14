import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/dataTables.main.json';
import { pointsToTable, tableToPoints, validatePoint, QUALITY_LABEL, qualityOfStepData } from '../../src/data/series';
import type { SeriesPoint } from '../../src/data/series';

const ok: SeriesPoint = { series_id: 'gdp-real', value: 609.2, unit: 'miles de millones de USD de 2015', year: 2025, quality: 'real', source: 'Banco Mundial (WDI)', retrieved_at: '2026-10-12' };

describe('the series record', () => {
  it('accepts a complete record', () => {
    expect(validatePoint(ok)).toEqual([]);
  });

  it('reports every missing field by name', () => {
    expect(validatePoint({ ...ok, source: '' })).toContain('source');
    expect(validatePoint({ ...ok, series_id: '' })).toContain('series_id');
    expect(validatePoint({ ...ok, unit: '' })).toContain('unit');
    expect(validatePoint({ ...ok, year: 2025.5 })).toContain('year');
    expect(validatePoint({ ...ok, quality: 'maybe' as never })).toContain('quality');
    expect(validatePoint({ ...ok, retrieved_at: '13/10/2026' })).toContain('retrieved_at');
  });

  it('asks for a retrieval date unless the data is a placeholder', () => {
    expect(validatePoint({ ...ok, retrieved_at: null })).toContain('retrieved_at');
    expect(validatePoint({ ...ok, quality: 'partial', retrieved_at: null })).toContain('retrieved_at');
    expect(validatePoint({ ...ok, quality: 'placeholder', retrieved_at: null })).toEqual([]);
  });

  it('maps the old state of a slide to a quality', () => {
    expect(qualityOfStepData('real')).toBe('real');
    expect(qualityOfStepData('parcial')).toBe('partial');
    expect(qualityOfStepData('prueba')).toBe('placeholder');
    expect(QUALITY_LABEL.placeholder).toBe('Datos de prueba');
  });
});

describe('the adapter between tables and series', () => {
  const meta = { unit: 'u', quality: 'real' as const, source: 's', retrieved_at: '2026-10-13' };

  it('makes one record per year and numeric column, and puts the table back as it was', () => {
    const table = { id: 't', title: 'T', columns: ['Año', 'A', 'B'], rows: [[2024, 1, null], [2025, 2.5, 3]] };
    const points = tableToPoints(table, meta);
    expect(points).toHaveLength(4);
    expect(points[0]).toMatchObject({ series_id: 't:A', year: 2024, value: 1, ...meta });
    expect(points[1]).toMatchObject({ series_id: 't:B', year: 2024, value: null });
    expect(pointsToTable(points, { id: 't', title: 'T', columns: ['Año', 'A', 'B'] })).toEqual(table);
  });

  it('refuses a table that does not start with the year', () => {
    expect(() => tableToPoints({ id: 't', title: 'T', columns: ['País', 'x'], rows: [['AR', 1]] }, meta)).toThrow(/Año/);
  });

  it('round-trips every year-by-number table of the Data page without changing a cell', () => {
    let checked = 0;
    for (const slide of fixture) {
      for (const t of slide.tables) {
        const yearFirst = t.columns[0] === 'Año' && t.rows.every((r) => Number.isInteger(r[0]) && r.slice(1).every((c) => c === null || typeof c === 'number'));
        if (!yearFirst) continue;
        const back = pointsToTable(tableToPoints(t as never, meta), { id: t.id, title: t.title, columns: t.columns });
        expect(back.rows, `${slide.id}/${t.id}`).toEqual(t.rows);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(8);
  });
});
