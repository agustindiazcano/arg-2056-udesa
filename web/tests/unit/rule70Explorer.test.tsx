// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': label }: { option: { yAxis?: { type?: string }; series?: Array<{ data?: unknown[] }> }; 'aria-label'?: string }) => (
    <div role="img" aria-label={label} data-testid="echart" data-yaxis={option?.yAxis?.type} data-series={option?.series?.length} data-points={option?.series?.[0]?.data?.length} />
  )
}));

import { Rule70Step } from '../../src/tour/Rule70Step';
import { analyse, countryList, decompose, seriesOf } from '../../src/tour/rule70Countries';
import { buildSlides } from '../../src/datasets/slides';
import { formatNumber } from '../../src/charts/format';
import { useStore } from '../../src/state/store';
import { useTourLayout } from '../../src/tour/useTourLayout';

const FORBIDDEN = /datos de prueba|datos en parte reales|datos reales|inventad|mock|sin verificar|no verificad|a verificar|\bleída\b/i;
const es = (v: number, d = 1) => formatNumber(v, d);

const country = () => screen.getByRole('combobox', { name: 'País' }) as HTMLSelectElement;
const from = () => screen.getByRole('combobox', { name: 'Desde' }) as HTMLSelectElement;
const to = () => screen.getByRole('combobox', { name: 'Hasta' }) as HTMLSelectElement;
const row = (name: string) => within(within(screen.getByRole('table', { name: 'Resultados del período' })).getByRole('row', { name: new RegExp(`^${name}`) })).getAllByRole('cell');

function openExplorer() {
  render(<Rule70Step />);
  fireEvent.click(screen.getByRole('tab', { name: 'Países reales' }));
}

beforeEach(() => {
  useStore.setState({ mode: '2d' });
  useTourLayout.setState({ sideOpen: true, count: 1, focus: false });
});
afterEach(cleanup);

describe('the tabs of the slide', () => {
  it('opens on the calculator and has a second tab with the real countries', () => {
    render(<Rule70Step />);
    expect(screen.getByRole('tablist', { name: '¿Cuánto hay que crecer por año para duplicar el PBI? La regla del 70' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Calculadora' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('spinbutton', { name: /tasa de crecimiento/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Países reales' }));
    expect(screen.queryByRole('spinbutton', { name: /tasa de crecimiento/i })).toBeNull();
    expect(country()).toBeTruthy();
  });
});

describe('the country explorer', () => {
  it('opens on Argentina, real GDP, 1960 to 2025, with the rate between the endpoints computed from the data', () => {
    openExplorer();
    expect(country().value).toBe('ARG');
    expect(from().value).toBe('1960');
    expect(to().value).toBe('2025');
    const a = analyse('ARG', 'gdp', 1960, 2025);
    if (!a.ok) throw new Error(a.reason);
    expect(row('Tasa entre extremos')[1]!.textContent).toBe(`${es(a.cagrPct, 2)} % por año`);
    expect(row('Duplicación exacta')[1]!.textContent).toBe(`${es(a.doublingExact)} años`);
    expect(row('Veces que se duplicó')[1]!.textContent).toBe(es(a.doublings, 2));
  });

  it('the preset of South Korea sets the country, the indicator and the years of the brief, and gives 7,72 % a year', () => {
    openExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Corea del Sur 1960-1990' }));
    expect(country().value).toBe('KOR');
    expect(from().value).toBe('1960');
    expect(to().value).toBe('1990');
    expect(screen.getByRole('button', { name: 'PBI per cápita real' }).getAttribute('aria-pressed')).toBe('true');
    expect(row('Tasa entre extremos')[1]!.textContent).toBe('7,72 % por año');
  });

  it('the preset of China is 1979 to 2010 of the real GDP', () => {
    openExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'China 1979-2010' }));
    expect(country().value).toBe('CHN');
    expect(screen.getByRole('button', { name: 'PBI real' }).getAttribute('aria-pressed')).toBe('true');
    expect(row('Tasa entre extremos')[1]!.textContent).toMatch(/^10,0\d % por año$/);
  });

  it('lets the visitor pick any country, indicator and years, and recomputes', () => {
    openExplorer();
    fireEvent.change(country(), { target: { value: 'IND' } });
    fireEvent.change(from(), { target: { value: '1990' } });
    fireEvent.change(to(), { target: { value: '2020' } });
    fireEvent.click(screen.getByRole('button', { name: 'PBI per cápita real' }));
    const a = analyse('IND', 'percapita', 1990, 2020);
    if (!a.ok) throw new Error(a.reason);
    expect(row('Tasa entre extremos')[1]!.textContent).toBe(`${es(a.cagrPct, 2)} % por año`);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('India');
  });

  it('gives the fitted rate and its R2 apart from the rate between the endpoints', () => {
    openExplorer();
    const cells = row('Tasa ajustada');
    expect(cells[1]!.textContent).toMatch(/% por año/);
    expect(cells[2]!.textContent).toMatch(/R² 0,\d+/);
  });

  it('says so when an endpoint has no value, and does not draw a made-up one', () => {
    const missing = countryList()
      .flatMap((c) => seriesOf(c.code, 'gdp').filter((p) => p.value === null).map((p) => ({ code: c.code, year: p.year })))
      .find((m) => m.year < 2000)!;
    openExplorer();
    fireEvent.change(country(), { target: { value: missing.code } });
    fireEvent.change(from(), { target: { value: String(missing.year) } });
    expect(screen.getByRole('status').textContent).toMatch(/sin dato/i);
    expect(screen.queryByTestId('echart')).toBeNull();
  });

  it('refuses a period of less than two years', () => {
    openExplorer();
    fireEvent.change(from(), { target: { value: '2024' } });
    fireEvent.change(to(), { target: { value: '2025' } });
    expect(screen.getByRole('status').textContent).toMatch(/al menos dos años/i);
  });

  it('draws the real series against the constant-rate path and the fitted one, with a linear or logarithmic scale', () => {
    openExplorer();
    const charts = () => screen.getAllByTestId('echart');
    expect(charts()).toHaveLength(2);
    expect(charts()[0]!.getAttribute('data-series')).toBe('3');
    expect(charts()[0]!.getAttribute('data-yaxis')).toBe('value');
    fireEvent.click(screen.getByRole('button', { name: 'Logarítmica' }));
    expect(charts()[0]!.getAttribute('data-yaxis')).toBe('log');
  });

  it('draws the rolling doubling time of 10-year windows as the second chart', () => {
    openExplorer();
    const rolling = screen.getAllByTestId('echart')[1]!;
    expect(rolling.getAttribute('aria-label')).toMatch(/10 años/);
    expect(Number(rolling.getAttribute('data-points'))).toBeGreaterThan(30);
  });

  it('has a text alternative for each chart, the data of both as tables, and the source in words', () => {
    openExplorer();
    for (const chart of screen.getAllByTestId('echart')) expect(chart.getAttribute('aria-label')!.length).toBeGreaterThan(40);
    expect(screen.getAllByText(/ver los datos/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Banco Mundial/).length).toBeGreaterThan(0);
  });

  it('carries no label about how real the data is', () => {
    openExplorer();
    expect(document.body.textContent).not.toMatch(FORBIDDEN);
  });
});

describe('the Data page', () => {
  it('has the table of the five cases next to the others of the slide', () => {
    const slide = buildSlides().find((s) => s.id === '5')!;
    expect(slide.tables.map((t) => t.id)).toEqual(['chart-5', 'rule70-errors', 'rule70-argentina', 'rule70-convergence', 'rule70-countries', 'rule70-scenarios', 'rule70-imf']);
  });
});

describe('the look of the tabs and of the title', () => {
  it('names the case with the indicator as it is written (PBI in capitals)', () => {
    openExplorer();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Argentina: PBI real, 1960 a 2025');
  });
});

describe('the diagnostics of the constant-rate assumption', () => {
  const view = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

  it('opens on the rolling windows and offers the residuals and the split of the growth as other views of the lower chart', () => {
    openExplorer();
    expect(screen.getByRole('button', { name: 'Ventanas de 10 años' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Residuos del ajuste' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: 'Total y población' })).toBeTruthy();
  });

  it('draws the residuals of the fit, one per year, and reports the largest next to R2, with no pass or fail', () => {
    openExplorer();
    view('Residuos del ajuste');
    const chart = screen.getAllByTestId('echart')[1]!;
    expect(Number(chart.getAttribute('data-points'))).toBe(66); // 1960 to 2025
    expect(chart.getAttribute('aria-label')).toMatch(/residuos/i);
    const a = analyse('ARG', 'gdp', 1960, 2025);
    if (!a.ok) throw new Error(a.reason);
    expect(row('Mayor residuo del ajuste')[1]!.textContent).toBe(`${es(a.maxResidualPct)} %`);
    expect(row('Tasa ajustada')[2]!.textContent).toBe(`R² ${es(a.fit.r2, 2)}`);
    expect(document.body.textContent).not.toMatch(/supera|cumple el supuesto|rechaza/i);
  });

  it('shows the residuals as a table too', () => {
    openExplorer();
    view('Residuos del ajuste');
    expect(screen.getByRole('table', { name: 'Residuos por año' })).toBeTruthy();
  });

  it('splits the growth into total, per person and population, and shows the identity that ties them', () => {
    openExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Corea del Sur 1960-1990' }));
    view('Total y población');
    const table = within(screen.getByRole('table', { name: 'Crecimiento total, por habitante y de la población' }));
    const d = decompose('KOR', 1960, 1990);
    if (!d.ok) throw new Error(d.reason);
    expect(within(table.getByRole('row', { name: /^PBI real/ })).getAllByRole('cell')[1]!.textContent).toBe(`${es(d.totalPct, 2)} % por año`);
    expect(within(table.getByRole('row', { name: /^PBI por habitante/ })).getAllByRole('cell')[1]!.textContent).toBe(`${es(d.perCapitaPct, 2)} % por año`);
    expect(within(table.getByRole('row', { name: /^Población/ })).getAllByRole('cell')[1]!.textContent).toBe(`${es(d.populationPct, 2)} % por año`);
    expect(screen.getByText(/\(1 \+ total\) = \(1 \+ por habitante\) × \(1 \+ población\)/)).toBeTruthy();
    expect(screen.getAllByTestId('echart')[1]!.getAttribute('data-points')).toBe('3');
  });
});
