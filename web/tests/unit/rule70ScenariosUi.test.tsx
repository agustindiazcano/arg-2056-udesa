// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': label }: { option: { yAxis?: { type?: string }; series?: Array<{ data?: unknown[] }> }; 'aria-label'?: string }) => (
    <div role="img" aria-label={label} data-testid="echart" data-yaxis={option?.yAxis?.type} data-series={option?.series?.length} data-points={option?.series?.[0]?.data?.length} />
  )
}));

import { Rule70Step } from '../../src/tour/Rule70Step';
import { averageGrowth, imfCountries, imfImplied, IMF_VINTAGE_NOTE } from '../../src/tour/rule70Imf';
import { formatNumber } from '../../src/charts/format';
import { buildSlides } from '../../src/datasets/slides';
import { useStore } from '../../src/state/store';
import { useTourLayout } from '../../src/tour/useTourLayout';

const FORBIDDEN = /datos de prueba|datos en parte reales|datos reales|inventad|mock|sin verificar|no verificad|a verificar|\bleída\b/i;
const es = (v: number, d = 1) => formatNumber(v, d);

const field = (name: string) => screen.getByRole('spinbutton', { name }) as HTMLInputElement;
const row = (table: string, name: string) => within(within(screen.getByRole('table', { name: table })).getByRole('row', { name: new RegExp(`^${name}`) })).getAllByRole('cell');

function openTab(name: string) {
  render(<Rule70Step />);
  fireEvent.click(screen.getByRole('tab', { name }));
}

beforeEach(() => {
  useStore.setState({ mode: '2d' });
  useTourLayout.setState({ sideOpen: true, count: 1, focus: false });
});
afterEach(cleanup);

describe('the tabs of the slide', () => {
  it('has five: the calculator, convergence, real countries, scenarios and IMF projections', () => {
    render(<Rule70Step />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Calculadora', 'Convergencia y desarrollo', 'Países reales', 'Escenarios', 'Proyecciones del FMI']);
  });
});

describe('the comparison of two rates', () => {
  it('opens on 3 % against 10 % for 28 years, from the same level', () => {
    openTab('Escenarios');
    expect(field('Tasa A (% anual)').value).toBe('3');
    expect(field('Tasa B (% anual)').value).toBe('10');
    expect(field('Años').value).toBe('28');
    expect(field('Nivel inicial de A').value).toBe('100');
    expect(field('Nivel inicial de B').value).toBe('100');
    expect(row('Resultado de la comparación', 'Multiplicador')[1]!.textContent).toBe('×2,29');
    expect(row('Resultado de la comparación', 'Multiplicador')[2]!.textContent).toBe('×14,42');
    expect(row('Resultado de la comparación', 'Nivel final')[1]!.textContent).toBe('228,8');
    expect(screen.getByText(/B termina 6,3 veces el nivel de A/)).toBeTruthy();
  });

  it('says there is no crossing when both start at the same level', () => {
    openTab('Escenarios');
    expect(screen.getByText(/empiezan en el mismo nivel/i)).toBeTruthy();
  });

  it('finds when the faster one overtakes the one that starts higher', () => {
    openTab('Escenarios');
    fireEvent.change(field('Nivel inicial de A'), { target: { value: '200' } });
    expect(screen.getByText(/se cruzan a los 10,5 años/i)).toBeTruthy();
    fireEvent.change(field('Años'), { target: { value: '5' } });
    expect(screen.getByText(/después del horizonte de 5 años/i)).toBeTruthy();
  });

  it('the preset of one point of gap sets 3 % and 4 % over 30 years: the second ends 34 % higher', () => {
    openTab('Escenarios');
    fireEvent.click(screen.getByRole('button', { name: '3 % contra 4 %: un punto de diferencia' }));
    expect(field('Tasa A (% anual)').value).toBe('3');
    expect(field('Tasa B (% anual)').value).toBe('4');
    expect(field('Años').value).toBe('30');
    expect(row('Resultado de la comparación', 'Cociente de B sobre A')[1]!.textContent).toBe('1,34');
  });

  it('holds the rates between 0.1 and 20 and the horizon between 1 and 100 years', () => {
    openTab('Escenarios');
    fireEvent.change(field('Tasa B (% anual)'), { target: { value: '500' } });
    expect(row('Resultado de la comparación', 'Multiplicador')[2]!.textContent).toBe(`×${es(1.2 ** 28, 2)}`);
    fireEvent.change(field('Años'), { target: { value: '1000' } });
    fireEvent.blur(field('Años'));
    expect(field('Años').value).toBe('100');
  });

  it('draws the two levels, on a linear scale or a logarithmic one', () => {
    openTab('Escenarios');
    const chart = () => screen.getByTestId('echart');
    expect(chart().getAttribute('data-series')).toBe('2');
    expect(chart().getAttribute('data-points')).toBe('29');
    expect(chart().getAttribute('data-yaxis')).toBe('value');
    fireEvent.click(screen.getByRole('button', { name: 'Logarítmica' }));
    expect(chart().getAttribute('data-yaxis')).toBe('log');
    expect(chart().getAttribute('aria-label')!.length).toBeGreaterThan(40);
    expect(screen.getByText(/ver los datos/i)).toBeTruthy();
  });
});

describe('the projections of the IMF', () => {
  it('opens on Argentina with the growth of 2026 to 2031 and the average, the doubling time and the year it implies', () => {
    openTab('Proyecciones del FMI');
    expect((screen.getByRole('combobox', { name: 'País' }) as HTMLSelectElement).value).toBe('AR');
    const table = screen.getByRole('table', { name: 'Crecimiento proyectado por año' });
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 6 + 1); // header, six years and the average
    const arg = imfCountries().find((c) => c.code === 'AR')!;
    expect(within(table).getByRole('row', { name: /^2026/ }).textContent).toContain(es(arg.growth['2026']!, 2));
    const i = imfImplied('AR');
    expect(within(table).getByRole('row', { name: /^Promedio/ }).textContent).toContain(es(averageGrowth('AR'), 2));
    expect(screen.getByText(new RegExp(`${es(i.years)} años`))).toBeTruthy();
    expect(screen.getByText(new RegExp(String(i.year)))).toBeTruthy();
  });

  it('lets the visitor pick any of the eleven countries and draws six bars', () => {
    openTab('Proyecciones del FMI');
    const select = screen.getByRole('combobox', { name: 'País' }) as HTMLSelectElement;
    expect(select.options).toHaveLength(11);
    fireEvent.change(select, { target: { value: 'IN' } });
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('India');
    expect(screen.getByTestId('echart').getAttribute('data-points')).toBe('6');
  });

  it('says whose projection it is, the vintage and that India reports by fiscal year', () => {
    openTab('Proyecciones del FMI');
    expect(screen.getByText(IMF_VINTAGE_NOTE)).toBeTruthy();
  });
});

describe('the Data page and the labels', () => {
  it('adds the tables of the scenarios and of the IMF to the ones of the slide', () => {
    const slide = buildSlides().find((s) => s.id === '5')!;
    expect(slide.tables.map((t) => t.id)).toEqual(['chart-5', 'rule70-errors', 'rule70-argentina', 'rule70-convergence', 'rule70-countries', 'rule70-scenarios', 'rule70-imf']);
  });

  it('carries no label about how real the data is', () => {
    openTab('Escenarios');
    expect(document.body.textContent).not.toMatch(FORBIDDEN);
    cleanup();
    openTab('Proyecciones del FMI');
    expect(document.body.textContent).not.toMatch(FORBIDDEN);
  });
});

describe('the layout of the right column of the new tabs', () => {
  it('stacks its cards at their natural height, so no field is cut', () => {
    const css = readFileSync('src/styles/ui.css', 'utf8');
    const at = css.indexOf('\n.rule70-col--stack {');
    expect(at).toBeGreaterThan(0);
    expect(css.slice(at, css.indexOf('}', at))).toMatch(/grid-template-rows:\s*auto auto/);
    openTab('Escenarios');
    expect(document.querySelector('.rule70-col--stack')).not.toBeNull();
    cleanup();
    openTab('Proyecciones del FMI');
    expect(document.querySelector('.rule70-col--stack')).not.toBeNull();
  });
});
