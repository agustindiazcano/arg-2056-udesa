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

  it('has a bar next to Repetir to move along the timeline from 1900 to 2026', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    expect(slider.min).toBe('1900');
    expect(slider.max).toBe('2026');
    const replay = screen.getByRole('button', { name: 'Repetir' });
    expect(replay.parentElement).toBe(slider.closest('.tour-controls'));
  });

  it('moves the table of the ranking and the bars of the region to the year of the bar', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    act(() => {
      fireEvent.change(slider, { target: { value: '1950' } });
    });
    expect(slider.getAttribute('aria-valuetext')).toBe('Año 1950');
    expect(screen.getByText('Ranking mundial en 1950')).toBeTruthy();
    expect(screen.getByText('Mayores economías de la región en 1950')).toBeTruthy();
    for (const name of ['PBI', 'PBI per cápita']) {
      expect(screen.getByRole('table', { name }).querySelectorAll('tbody tr')).toHaveLength(20);
    }
    act(() => {
      fireEvent.change(slider, { target: { value: '2026' } });
    });
    expect(screen.getByText('Ranking mundial en 2026')).toBeTruthy();
  });

  it('Repetir starts again from 1900', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    act(() => {
      fireEvent.change(slider, { target: { value: '1990' } });
    });
    expect(screen.getByText('Ranking mundial en 1990')).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Repetir' }));
    });
    expect(screen.getByText('Ranking mundial en 1900')).toBeTruthy();
  });

  it('shows two tables side by side, with Argentina in its own light-blue cell that does not move: its place and its value', () => {
    render(<WorldStep />);
    const slider = screen.getByRole('slider', { name: 'Línea de tiempo' }) as HTMLInputElement;
    const places: Record<string, string[]> = { PBI: [], 'PBI per cápita': [] };
    for (const year of ['1900', '1960', '2026']) {
      act(() => {
        fireEvent.change(slider, { target: { value: year } });
      });
      for (const name of ['PBI', 'PBI per cápita']) {
        const home = screen.getByTestId(`home-${name === 'PBI' ? 'gdp' : 'percapita'}`);
        expect(home.textContent).toContain('Argentina');
        expect(home.textContent).toMatch(/\d/);
        expect(home.getAttribute('data-home')).toBe('true');
        // Argentina is not in the list that moves
        expect(screen.getByRole('table', { name }).textContent).not.toContain('Argentina');
        places[name]!.push(home.textContent!);
      }
    }
    // its place and its value change with the year, the cell stays
    expect(new Set(places.PBI).size).toBeGreaterThan(1);
    expect(new Set(places['PBI per cápita']).size).toBeGreaterThan(1);
  });
});
