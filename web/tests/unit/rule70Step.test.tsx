// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

// the chart is replaced by a div that shows what it was asked to draw
vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': label }: { option: { yAxis?: { type?: string }; series?: Array<{ data?: unknown[] }> }; 'aria-label'?: string }) => (
    <div role="img" aria-label={label} data-testid="echart" data-yaxis={option?.yAxis?.type} data-points={option?.series?.[0]?.data?.length} />
  )
}));

import { Rule70Step } from '../../src/tour/Rule70Step';
import { TourStep } from '../../src/tour/TourStep';
import { buildSlides } from '../../src/datasets/slides';
import { ARG_GDP_2026 } from '../../src/tour/gdpFacts';
import { formatNumber } from '../../src/charts/format';
import { useStore } from '../../src/state/store';
import { useTourLayout } from '../../src/tour/useTourLayout';

const FORBIDDEN = /datos de prueba|datos en parte reales|datos reales|inventad|mock|sin verificar|no verificad|a verificar|\bleída\b/i;
const rate = () => screen.getByRole('spinbutton', { name: /tasa de crecimiento/i }) as HTMLInputElement;
const cell = (row: string, col: number) =>
  within(within(screen.getByRole('table', { name: 'Tiempo para duplicarse' })).getByRole('row', { name: new RegExp(`^${row}`) })).getAllByRole('cell')[col]!.textContent;

beforeEach(() => {
  useStore.setState({ mode: '2d' });
  useTourLayout.setState({ sideOpen: true, count: 1, focus: false });
});
afterEach(cleanup);

describe('the rule of 70 calculator (slide 6)', () => {
  it('opens at 3 % a year with the exact time and the two rules', () => {
    render(<Rule70Step />);
    expect(screen.getByRole('heading', { name: 'La regla del 70' })).toBeTruthy();
    expect(rate().value).toBe('3');
    expect(cell('Exacta', 1)).toBe('23,4 años');
    expect(cell('Regla del 70', 1)).toBe('23,3 años');
    expect(cell('Regla del 72', 1)).toBe('24,0 años');
  });

  it('shows the error of each rule, in years and in percent, and which one is closer', () => {
    render(<Rule70Step />);
    expect(cell('Regla del 70', 2)).toMatch(/−0,1 años|-0,1 años/);
    expect(cell('Regla del 72', 2)).toMatch(/\+?0,6 años/);
    fireEvent.change(rate(), { target: { value: '8' } });
    expect(cell('Exacta', 1)).toBe('9,0 años');
    expect(cell('Regla del 72', 1)).toBe('9,0 años');
  });

  it('recomputes when the rate is typed: 10 % gives 7,3 years exactly, 7,0 by the rule of 70 and 7,2 by the rule of 72', () => {
    render(<Rule70Step />);
    fireEvent.change(rate(), { target: { value: '10' } });
    expect(cell('Exacta', 1)).toBe('7,3 años');
    expect(cell('Regla del 70', 1)).toBe('7,0 años');
    expect(cell('Regla del 72', 1)).toBe('7,2 años');
  });

  it('keeps the slider and the number together', () => {
    render(<Rule70Step />);
    const slider = screen.getByRole('slider', { name: /tasa de crecimiento/i }) as HTMLInputElement;
    expect(slider.value).toBe('3');
    fireEvent.change(slider, { target: { value: '6.5' } });
    expect(rate().value).toBe('6.5');
    fireEvent.change(rate(), { target: { value: '12' } });
    expect(slider.value).toBe('12');
  });

  it('computes with the rate held between 0.1 and 20 (the slider shows the one in use) and puts it in the field when the field is left', () => {
    render(<Rule70Step />);
    const slider = screen.getByRole('slider', { name: /tasa de crecimiento/i }) as HTMLInputElement;
    fireEvent.change(rate(), { target: { value: '500' } });
    expect(slider.value).toBe('20');
    expect(cell('Exacta', 1)).toBe('3,8 años');
    fireEvent.blur(rate());
    expect(rate().value).toBe('20');
    fireEvent.change(rate(), { target: { value: '0' } });
    expect(slider.value).toBe('0.1');
    fireEvent.blur(rate());
    expect(rate().value).toBe('0.1');
  });

  it('lets a decimal below 1 be typed: 0.5 is not cut to 0.1 on the way', () => {
    render(<Rule70Step />);
    fireEvent.change(rate(), { target: { value: '0' } });
    fireEvent.change(rate(), { target: { value: '0.5' } });
    expect(rate().value).toBe('0.5');
    expect(cell('Exacta', 1)).toBe('139,0 años');
  });

  it('keeps the last good rate while the field is empty, and goes back to 3 only if it was never a number', () => {
    render(<Rule70Step />);
    fireEvent.change(rate(), { target: { value: '' } });
    expect(cell('Exacta', 1)).toBe('23,4 años');
  });

  it('says when the GDP of Argentina doubles: the year, from the GDP of 2026, at the rate chosen', () => {
    render(<Rule70Step />);
    const box = screen.getByRole('region', { name: /argentina/i });
    expect(box.textContent).toContain(formatNumber(ARG_GDP_2026, 1)); // 621,8
    expect(box.textContent).toContain('2050');
    expect(box.textContent).toContain('23,4');
    fireEvent.change(rate(), { target: { value: '5' } });
    expect(screen.getByRole('region', { name: /argentina/i }).textContent).toContain('2041');
  });

  it('draws the growth on a linear scale and switches to a logarithmic one, where constant growth is a straight line', () => {
    render(<Rule70Step />);
    const growth = () => screen.getAllByTestId('echart')[0]!;
    expect(growth().getAttribute('data-yaxis')).toBe('value');
    fireEvent.click(screen.getByRole('button', { name: 'Logarítmica' }));
    expect(growth().getAttribute('data-yaxis')).toBe('log');
    expect(screen.getByRole('button', { name: 'Logarítmica' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Lineal' }));
    expect(growth().getAttribute('data-yaxis')).toBe('value');
  });

  it('draws the error of the rules against the rate (200 points, 0.1 % to 20 %) as a second chart', () => {
    render(<Rule70Step />);
    const charts = screen.getAllByTestId('echart');
    expect(charts).toHaveLength(2);
    expect(charts[1]!.getAttribute('data-points')).toBe('200');
  });

  it('has a text alternative for each chart and the data of both as tables', () => {
    render(<Rule70Step />);
    for (const chart of screen.getAllByTestId('echart')) expect(chart.getAttribute('aria-label')!.length).toBeGreaterThan(30);
    expect(screen.getAllByText(/ver los datos/i).length).toBeGreaterThanOrEqual(2);
  });

  it('carries no label about how real the data is', () => {
    const { container } = render(<Rule70Step />);
    expect(container.textContent).not.toMatch(FORBIDDEN);
  });
});

describe('the slide inside the Recorrido and the Data page', () => {
  it('is what step 5 of the Recorrido shows, with its side panel', () => {
    render(<TourStep step={5} />);
    expect(screen.getByRole('heading', { name: 'La regla del 70', level: 2 })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: /texto y referencias/i })).toBeTruthy();
  });

  it('keeps the old table of the slide and adds the tables of the errors and of Argentina to Data', () => {
    const slide = buildSlides().find((s) => s.id === '5')!;
    expect(slide.tables.map((t) => t.id)).toEqual(['chart-5', 'rule70-errors', 'rule70-argentina', 'rule70-countries', 'rule70-scenarios', 'rule70-imf']);
    expect(slide.tables.every((t) => t.rows.length > 0)).toBe(true);
  });
});
