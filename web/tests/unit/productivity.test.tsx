// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { COUNTRIES, PRODUCTIVITY_STEPS, annualSd, levelIn, peakYear, periodFrom, seriesOf } from '../../src/tour/productivity';
import { ProductivityStep } from '../../src/tour/ProductivityStep';
import { hasTourChart } from '../../src/tour/chartSteps';
import { useStore } from '../../src/state/store';

describe('the productivity data (Penn World Table 11.0 via FRED, 1955-2023)', () => {
  it('has the four countries in a fixed order: Argentina, Estados Unidos, Chile, Brasil', () => {
    expect(COUNTRIES.map((c) => c.code)).toEqual(['AR', 'US', 'CL', 'BR']);
    expect(COUNTRIES[0]!.name).toBe('Argentina');
  });

  it('gives the figures of the specification: TFP and output per hour in 2023 (1955 = 100)', () => {
    expect(levelIn('tfp', 'AR', 2023)).toBe(72.6);
    expect(levelIn('tfp', 'US', 2023)).toBe(151.0);
    expect(levelIn('tfp', 'CL', 2023)).toBe(98.8);
    expect(levelIn('tfp', 'BR', 2023)).toBe(100.9);
    expect(levelIn('oph', 'AR', 2023)).toBe(175.9);
    expect(levelIn('oph', 'CL', 2023)).toBe(433.6);
    expect(peakYear('oph', 'AR')).toEqual({ year: 2017, value: 198.9 });
  });

  it('computes the spread of the yearly TFP change (Argentina 4.1 points, United States 1.1)', () => {
    expect(annualSd('AR')).toBeCloseTo(4.1, 1);
    expect(annualSd('US')).toBeCloseTo(1.1, 1);
  });

  it('cuts a series from a first year', () => {
    const all = seriesOf('tfp', 'level', 'AR');
    const from1990 = periodFrom(all.years, all.values, 1990);
    expect(from1990.years[0]).toBe(1990);
    expect(from1990.values).toHaveLength(from1990.years.length);
    expect(periodFrom(all.years, all.values, 1955).years).toEqual(all.years);
  });

  it('has five steps: TFP level, TFP change, output per hour level, output per hour change, implications', () => {
    expect(PRODUCTIVITY_STEPS.map((s) => s.kind)).toEqual(['level', 'change', 'level', 'change', 'bars']);
    expect(PRODUCTIVITY_STEPS.map((s) => s.metric)).toEqual(['tfp', 'tfp', 'oph', 'oph', 'both']);
  });
});

describe('the productivity step of the Recorrido', () => {
  beforeEach(() => useStore.setState({ mode: '2d' }));
  afterEach(cleanup);

  it('is step 14 of the Recorrido', () => {
    expect(hasTourChart(14)).toBe(true);
  });

  it('opens on the first of five steps, with its heading, its text and the caveats', () => {
    render(<ProductivityStep />);
    expect(screen.getByRole('heading', { level: 2, name: 'Productividad' })).toBeTruthy();
    expect(screen.getByText('Paso 1 de 5')).toBeTruthy();
    expect(screen.getAllByTestId('echart').length).toBeGreaterThan(0);
    expect(screen.getByText(/72,6/)).toBeTruthy();
    expect(screen.getByText(/La PWT 11\.0 termina en 2023/)).toBeTruthy();
  });

  it('walks the five steps with Anterior and Siguiente and with the step tabs', () => {
    render(<ProductivityStep />);
    const prev = screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Siguiente' }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    for (let n = 2; n <= 5; n++) {
      act(() => {
        fireEvent.click(next);
      });
      expect(screen.getByText(`Paso ${n} de 5`)).toBeTruthy();
    }
    expect(next.disabled).toBe(true);
    act(() => {
      fireEvent.click(screen.getByRole('tab', { name: /^3\b/ }));
    });
    expect(screen.getByText('Paso 3 de 5')).toBeTruthy();
    act(() => {
      fireEvent.click(prev);
    });
    expect(screen.getByText('Paso 2 de 5')).toBeTruthy();
  });

  it('the last step shows the cumulative change 2011-2023 in two panels, and says the AI numbers are estimates', () => {
    render(<ProductivityStep />);
    act(() => {
      fireEvent.click(screen.getByRole('tab', { name: /^5\b/ }));
    });
    expect(screen.getAllByTestId('echart')).toHaveLength(2);
    expect(screen.getByText(/−20,6/)).toBeTruthy();
    expect(screen.getByText(/estimaciones de modelos/i)).toBeTruthy();
  });

  it('has a period selector (desde 1955, 1990, 2000) on the line charts', () => {
    render(<ProductivityStep />);
    const group = screen.getByRole('group', { name: 'Período' });
    expect(group.querySelectorAll('button')).toHaveLength(3);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Desde 1990' }));
    });
    expect(screen.getByRole('button', { name: 'Desde 1990' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('links its sources: Penn World Table and FRED always, and INDEC, Acemoglu and Anthropic in the last step', () => {
    render(<ProductivityStep />);
    const link = (name: RegExp) => screen.getAllByRole('link', { name })[0] as HTMLAnchorElement;
    expect(link(/Penn World Table/).href).toBe('https://www.rug.nl/ggdc/productivity/pwt/');
    expect(link(/FRED/).href).toBe('https://fred.stlouisfed.org/');
    expect(link(/FRED/).target).toBe('_blank');
    expect(link(/FRED/).rel).toContain('noopener');
    expect(screen.queryByRole('link', { name: /INDEC/ })).toBeNull();
    act(() => {
      fireEvent.click(screen.getByRole('tab', { name: /^5\b/ }));
    });
    expect(link(/INDEC/).href).toContain('indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf');
    expect(link(/Acemoglu/).href).toBe('https://www.nber.org/papers/w32487');
    expect(link(/Anthropic/).href).toContain('anthropic.com');
  });

  it('says the numbers are Penn World Table data and the source is in the notes', () => {
    render(<ProductivityStep />);
    expect(screen.getAllByText(/Penn World Table 11\.0/).length).toBeGreaterThan(1);
  });
});
