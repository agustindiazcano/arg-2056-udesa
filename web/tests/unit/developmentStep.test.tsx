// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': label }: { option?: object; 'aria-label'?: string }) => (
    <div role="img" aria-label={label} data-testid="echart" data-option={JSON.stringify(option)} />
  )
}));

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DevelopmentStep } from '../../src/tour/DevelopmentStep.js';

afterEach(cleanup);

describe('DevelopmentStep', () => {
  it('renders the title and default indicator data', () => {
    render(<DevelopmentStep />);

    // Check title and head
    expect(screen.getByRole('heading', { level: 2, name: /Indicadores de desarrollo/i })).toBeDefined();

    // Check default indicator (Esperanza de vida al nacer) appears in buttons and header
    expect(screen.getAllByText(/Esperanza de vida al nacer/i).length).toBeGreaterThanOrEqual(1);

    // Check tabs
    expect(screen.getByRole('button', { name: 'Salud' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Educación' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Igualdad' })).toBeDefined();
  });

  it('shows the regional ranking of the indicator with Argentina marked, and changes it with the indicator', () => {
    render(<DevelopmentStep />);
    const table = screen.getByRole('table', { name: /Ranking regional de Esperanza de vida al nacer/i });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(6);
    expect(rows[0]!.textContent).toContain('1.º');
    expect(rows.some((r) => r.className.includes('dev-rank-row--home') && r.textContent!.includes('Argentina'))).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Mortalidad infantil' }));
    expect(screen.getByRole('table', { name: /Ranking regional de Tasa de mortalidad infantil/i })).toBeDefined();
    expect(screen.getByText('más bajo es mejor')).toBeDefined();
  });

  it('draws a big chart with Argentina and its peers year by year', () => {
    render(<DevelopmentStep />);
    const chart = screen.getByTestId('echart');
    const option = JSON.parse(chart.getAttribute('data-option')!) as { series: Array<{ name: string; data: unknown[] }> };
    expect(option.series.map((s) => s.name)).toContain('Argentina');
    expect(option.series.length).toBeGreaterThan(5);
    expect(option.series[0]!.data).toHaveLength(2024 - 2005 + 1);
  });

  it('changes category and updates available indicators', () => {
    render(<DevelopmentStep />);

    const educacionBtn = screen.getByRole('button', { name: 'Educación' });
    fireEvent.click(educacionBtn);

    expect(educacionBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText(/Resultados PISA/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Años de escolaridad/i).length).toBeGreaterThanOrEqual(1);
  });
});
