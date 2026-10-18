// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { WorldStep } from '../../src/tour/WorldStep';

afterEach(cleanup);

describe('step 0 of the Recorrido', () => {
  it('styles the Repetir button like the other buttons of the app', () => {
    render(<WorldStep />);
    const button = screen.getByRole('button', { name: 'Repetir' });
    expect(button.classList.contains('btn')).toBe(true);
  });

  it('has a bar next to Repetir to move along the timeline from 1960 to 2025', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    expect(slider.min).toBe('1960');
    expect(slider.max).toBe('2025');
    const replay = screen.getByRole('button', { name: 'Repetir' });
    expect(replay.parentElement).toBe(slider.closest('.tour-controls'));
  });

  it('moves the table of the ranking and the bars of the region to the year of the bar', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    act(() => {
      fireEvent.change(slider, { target: { value: '1990' } });
    });
    expect(slider.getAttribute('aria-valuetext')).toBe('Año 1990');
    expect(screen.getByText('Ranking mundial en 1990')).toBeTruthy();
    expect(screen.getByText('Mayores economías de la región')).toBeTruthy();
    for (const name of ['PBI real', 'PBI per cápita real']) {
      expect(screen.getByRole('table', { name }).querySelectorAll('tbody tr')).toHaveLength(20);
    }
    act(() => {
      fireEvent.change(slider, { target: { value: '2025' } });
    });
    expect(screen.getByText('Ranking mundial en 2025')).toBeTruthy();
  });

  it('Repetir starts again from 1960', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    act(() => {
      fireEvent.change(slider, { target: { value: '1990' } });
    });
    expect(screen.getByText('Ranking mundial en 1990')).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Repetir' }));
    });
    expect(screen.getByText('Ranking mundial en 1960')).toBeTruthy();
  });

  it('shows two tables side by side, with Argentina in its own light-blue cell that does not move: its place and its value', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    const places: Record<string, string[]> = { 'PBI real': [], 'PBI per cápita real': [] };
    for (const year of ['1960', '1990', '2025']) {
      act(() => {
        fireEvent.change(slider, { target: { value: year } });
      });
      for (const name of ['PBI real', 'PBI per cápita real']) {
        const home = screen.getByTestId(`home-${name === 'PBI real' ? 'gdp' : 'percapita'}`);
        expect(home.textContent).toContain('Argentina');
        expect(home.textContent).toMatch(/\d/);
        expect(home.getAttribute('data-home')).toBe('true');
        // Argentina is not in the list that moves
        expect(screen.getByRole('table', { name }).textContent).not.toContain('Argentina');
        places[name]!.push(home.textContent!);
      }
    }
    // its place and its value change with the year, the cell stays
    expect(new Set(places['PBI real']).size).toBeGreaterThan(1);
    expect(new Set(places['PBI per cápita real']).size).toBeGreaterThan(1);
  });

  it('has a play / pause button in the controls: it starts playing, pauses, plays again, and stops when the timeline is dragged', () => {
    render(<WorldStep />);
    const controls = screen.getByRole('slider', { name: 'Línea de tiempo' }).closest('.tour-controls');
    const pause = screen.getByRole('button', { name: 'Pausar' });
    expect(pause.parentElement).toBe(controls);
    act(() => {
      fireEvent.click(pause);
    });
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Reproducir' }));
    });
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeTruthy();
    act(() => {
      fireEvent.change(screen.getByRole('slider', { name: 'Línea de tiempo' }), { target: { value: '1990' } });
    });
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeTruthy();
  });

  it('has icons (no text) for play and pause, and a speed control next to them that steps through 0,25× to 8×', () => {
    render(<WorldStep />);
    const pause = screen.getByRole('button', { name: 'Pausar' });
    expect(pause.textContent).toBe('');
    expect(pause.querySelector('svg')).toBeTruthy();
    const group = screen.getByRole('group', { name: 'Velocidad' });
    expect(group.parentElement).toBe(pause.parentElement);
    expect(group.textContent).toContain('1×');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Más rápido' }));
    });
    expect(group.textContent).toContain('2×');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Más lento' }));
      fireEvent.click(screen.getByRole('button', { name: 'Más lento' }));
    });
    expect(group.textContent).toContain('0,5×');
    for (let n = 0; n < 5; n++) {
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Más lento' }));
      });
    }
    expect(group.textContent).toContain('0,25×');
  });

  it('defaults the regional comparison to PBI per cápita and renders the regional bar chart in 2D', () => {
    render(<WorldStep />);
    const perCapitaBtn = screen.getByRole('button', { name: 'PBI per cápita' });
    expect(perCapitaBtn.getAttribute('aria-pressed')).toBe('true');
    const regionSection = screen.getByRole('region', { name: 'Mayores economías de la región' });
    expect(regionSection.querySelector('[data-testid="echart"]')).toBeTruthy();
  });

  it('moves the clarifying units inside the question marks, as the first (sky blue) line, and keeps the title of the region without a year', () => {
    render(<WorldStep />);
    const sub = document.querySelector('.gdp-sub');
    expect(sub?.textContent).not.toContain('miles de millones');
    const help = (name: RegExp) => screen.getByRole('button', { name });
    fireEvent.mouseEnter(help(/Explicación: Dónde estuvo/));
    expect(screen.getByRole('tooltip').querySelector('.chart-help-lead')?.textContent).toContain('miles de millones de USD de 2015');
    fireEvent.mouseLeave(help(/Explicación: Dónde estuvo/));
    fireEvent.mouseEnter(help(/Explicación: PBI per cápita real/));
    expect(screen.getByRole('tooltip').querySelector('.chart-help-lead')?.textContent).toBe('USD de 2015 por persona');
    fireEvent.mouseLeave(help(/Explicación: PBI per cápita real/));
    // the unit text no longer sits in the table head
    expect(document.querySelector('.world-rank-head .gdp-sub')).toBeNull();
    expect(screen.queryByText(/Mayores economías de la región en \d{4}/)).toBeNull();
  });

  it('puts the question mark on the same line as the title of the region and the Gráfico | Tabla switch in the head of its card', () => {
    render(<WorldStep />);
    const title = screen.getByText('Mayores economías de la región');
    const head = title.closest('.tour-caption')!;
    expect(head.querySelector('.chart-help-wrap')).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Mayores economías de la región' });
    expect(card.querySelector('.tour-caption .tour-view-switch, .tour-caption-head .tour-view-switch')).toBeNull();
    expect(card.querySelector('.tour-chart > .tour-view-switch')).toBeTruthy();
  });

  it('makes the two ranking tables buttons that choose what the big chart shows: PBI by default, PBI per cápita on click, and back', () => {
    render(<WorldStep />);
    const gdp = screen.getByRole('button', { name: 'Ver PBI real en el gráfico grande' });
    const perCapita = screen.getByRole('button', { name: 'Ver PBI per cápita real en el gráfico grande' });
    expect(gdp.getAttribute('aria-pressed')).toBe('true');
    expect(perCapita.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('.world-year span')?.textContent).toContain('miles de millones');
    fireEvent.click(perCapita);
    expect(perCapita.getAttribute('aria-pressed')).toBe('true');
    expect(gdp.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('.world-year span')?.textContent).toContain('por persona');
    expect(screen.getByRole('img', { name: /PBI per cápita real de Argentina/ })).toBeTruthy();
    fireEvent.click(gdp);
    expect(document.querySelector('.world-year span')?.textContent).toContain('miles de millones');
  });

  it('puts the unit of the metric chosen first in the help of the title', () => {
    render(<WorldStep />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver PBI per cápita real en el gráfico grande' }));
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Explicación: Dónde estuvo/ }));
    expect(screen.getByRole('tooltip').querySelector('.chart-help-lead')?.textContent).toBe('USD de 2015 por persona');
  });
});
