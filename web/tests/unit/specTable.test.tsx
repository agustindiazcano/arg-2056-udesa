// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { barsSpec, linesSpec } from '../../src/charts3d/specs';
import type { Map3DSpec } from '../../src/charts3d/types';
import { specTable } from '../../src/tour/specTable';
import { TourChart } from '../../src/tour/TourChart';

afterEach(cleanup);

const bars = barsSpec([{ label: 'Soja', value: 10 }, { label: 'Maíz', value: 5 }], { title: 'Exportaciones', unit: 'miles de millones de USD', summary: 's' });
const lines = linesSpec({
  title: 'PBI',
  unit: 'miles de millones de USD',
  xLabels: ['2024', '2025'],
  series: [
    { name: 'Observado', values: [1, null], tone: 'highlight' },
    { name: 'Esperado', values: [null, 2], tone: 'accent' }
  ],
  band: { lower: [1, 1.5], upper: [1, 2.5] },
  summary: 's'
});

describe('the table of a chart', () => {
  it('makes a table from bars: the label and the value, one row per bar', () => {
    const t = specTable(bars);
    expect(t.columns).toEqual(['Exportaciones', 'Valor']);
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0]![0]).toBe('Soja');
    expect(t.rows[0]![1]).toMatch(/10/);
  });

  it('makes a table from lines: one row per x label, one column per series, a dash for a gap, and the range', () => {
    const t = specTable(lines);
    expect(t.columns).toEqual(['Año', 'Observado', 'Esperado', 'Rango']);
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0]![0]).toBe('2024');
    expect(t.rows[0]![2]).toBe('—');
    expect(t.rows[1]![1]).toBe('—');
    expect(t.rows[1]![3]).toMatch(/1,5.*a.*2,5/);
  });

  it('makes a table from a map: province and value, the largest first', () => {
    const map = {
      kind: 'map',
      title: 'Mapa',
      geo: { features: [] },
      values: { values: { 'AR-A': { plotted: 1, p10: 1, p50: 1, p90: 1, rank: 2 }, 'AR-B': { plotted: 9, p10: 9, p50: 9, p90: 9, rank: 1 } }, missing: [], domain: null, excluded: 0 },
      metric: 'level',
      selectedId: null,
      formatValue: (v: number) => `${v} u`,
      onSelect: () => undefined,
      summary: 's'
    } as unknown as Map3DSpec;
    const t = specTable(map);
    expect(t.columns).toEqual(['Provincia', 'Valor']);
    expect(t.rows.map((r) => r[0])).toEqual(['Buenos Aires', 'Salta']);
    expect(t.rows[0]![1]).toBe('9 u');
  });
});

describe('the Gráfico | Tabla switch of a chart', () => {
  it('shows the chart first, swaps it for the table and back', () => {
    render(
      <TourChart spec={bars}>
        <div data-testid="the-chart" />
      </TourChart>
    );
    const group = screen.getByRole('group', { name: 'Contenido' });
    expect(within(group).getByRole('button', { name: 'Gráfico' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('the-chart')).toBeTruthy();
    fireEvent.click(within(group).getByRole('button', { name: 'Tabla' }));
    expect(screen.queryByTestId('the-chart')).toBeNull();
    expect(screen.getByRole('table', { name: 'Exportaciones' }).querySelectorAll('tbody tr')).toHaveLength(2);
    fireEvent.click(within(group).getByRole('button', { name: 'Gráfico' }));
    expect(screen.getByTestId('the-chart')).toBeTruthy();
  });

  it('can start as a table', () => {
    render(
      <TourChart spec={bars} defaultView="table">
        <div data-testid="the-chart" />
      </TourChart>
    );
    expect(screen.queryByTestId('the-chart')).toBeNull();
    expect(screen.getByRole('table', { name: 'Exportaciones' })).toBeTruthy();
  });

  it('has no switch without a spec (nothing to tabulate)', () => {
    render(
      <TourChart>
        <div data-testid="the-chart" />
      </TourChart>
    );
    expect(screen.queryByRole('group', { name: 'Contenido' })).toBeNull();
  });
});
