// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { CompositionStep } from '../../src/tour/CompositionStep';
import { ExportsStep } from '../../src/tour/ExportsStep';
import { TourStep } from '../../src/tour/TourStep';
import { useStore } from '../../src/state/store';

const chartText = () => screen.getByTestId('echart').getAttribute('aria-label')!;

describe('the Exports slide (step 4)', () => {
  beforeEach(() => useStore.setState({ mode: '2d' }));
  afterEach(cleanup);

  it('opens on 2025 in dollars, with the real-data badge and the INDEC source', () => {
    render(<ExportsStep />);
    expect(screen.getByRole('heading', { name: 'Exportaciones por complejo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dólares' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '2025' }).getAttribute('aria-pressed')).toBe('true');
    expect(chartText()).toContain('Complejo soja 21,4');
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.getByText(/INDEC/)).toBeTruthy();
  });

  it('switches to the share of the total', () => {
    render(<ExportsStep />);
    fireEvent.click(screen.getByRole('button', { name: '% del total' }));
    expect(screen.getByRole('button', { name: '% del total' }).getAttribute('aria-pressed')).toBe('true');
    expect(chartText()).toContain('Complejo soja 24,6');
    expect(chartText()).toContain('%');
  });

  it('shows 2015 to 2025, with the years that have no data disabled, and changes the year', () => {
    render(<ExportsStep />);
    const year = (y: number) => screen.getByRole('button', { name: String(y) }) as HTMLButtonElement;
    expect(year(2015).disabled).toBe(true);
    expect(year(2023).disabled).toBe(true);
    expect(year(2024).disabled).toBe(false);
    fireEvent.click(year(2024));
    expect(year(2024).getAttribute('aria-pressed')).toBe('true');
    expect(chartText()).toContain('Complejo soja 19,6');
  });

  it('filters by complex: that complex over the years that exist, and back to all', () => {
    render(<ExportsStep />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Complejo' }), { target: { value: 'Complejo soja' } });
    expect(chartText()).toContain('2024 19,6');
    expect(chartText()).toContain('2025 21,4');
    expect(chartText()).not.toContain('Maicero');
    fireEvent.change(screen.getByRole('combobox', { name: 'Complejo' }), { target: { value: '' } });
    expect(chartText()).toContain('Maicero');
  });

  it('has the side text and is what step 4 of the Recorrido shows', () => {
    render(<TourStep step={4} />);
    expect(screen.getByRole('complementary', { name: /texto y referencias/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dólares' })).toBeTruthy();
  });

  it('CompositionStep (Slide 4) supports switching between Treemap, Torta and Barras in 2D', () => {
    render(<CompositionStep />);
    expect(screen.getByRole('button', { name: 'Treemap' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Torta' }));
    expect(screen.getByRole('button', { name: 'Torta' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByTestId('echart')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Barras' }));
    expect(screen.getByRole('button', { name: 'Barras' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByTestId('echart')).toHaveLength(2);
  });
});
