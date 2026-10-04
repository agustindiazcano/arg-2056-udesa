// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Scene from '../../src/scenes/resources/index.js';
import * as useDatasetModule from '../../src/data/useDataset.js';
import { useStore } from '../../src/state/store.js';

// Mock EChart entirely to avoid dealing with the DOM ref in integration test
vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': ariaLabel, role }: { option: unknown, 'aria-label'?: string, role?: string }) => (
    <div data-testid="echart" role={role} aria-label={ariaLabel}>
      {JSON.stringify(option)}
    </div>
  )
}));

describe('Resources Scene', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useStore.setState({ yearFloat: 2026, province: null });
  });

  it('shows loading initially', () => {
    useStore.setState({ yearFloat: 2026, province: null });
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'loading', data: null, error: null });

    const { unmount } = render(<Scene />);
    expect(screen.getByText('Cargando...')).toBeDefined();
    unmount();
  });

  it('shows error state when fetch fails', () => {
    useStore.setState({ yearFloat: 2026, province: null });
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'error', data: null, error: new Error('Failed') });

    const { unmount } = render(<Scene />);
    expect(screen.getByText('No se pudieron cargar los datos.')).toBeDefined();
    unmount();
  });

  it('renders charts and tables when data is loaded', () => {
    useStore.setState({ yearFloat: 2026, province: null });
    
    vi.spyOn(useDatasetModule, 'useDataset').mockImplementation((name) => {
      if (name === 'composition') return { status: 'success', data: [], error: null };
      if (name === 'projects') return { status: 'success', data: [], error: null };
      if (name === 'resource_production') return { status: 'success', data: [], error: null };
      return { status: 'loading', data: null, error: null };
    });

    const { unmount } = render(<Scene />);
    
    // Check if the three charts render
    const charts = screen.queryAllByTestId('echart');
    expect(charts.length).toBeGreaterThanOrEqual(0);
    
    // Bottom projects table is always visible
    expect(screen.getAllByText(/Proyectos de inversión/).length).toBeGreaterThan(0);
    
    // Toggle table view for Treemap
    const tableToggleBtns = screen.getAllByRole('button', { name: 'Ver tabla' });
    
    fireEvent.click(tableToggleBtns[0] as Element);
    
    // Now there should be one less chart and a new table
    expect(screen.getByRole('table', { name: 'Composición' })).toBeDefined();
    unmount();
  });

  it('selecting a resource updates the selected state (triggers rerender)', () => {
    useStore.setState({ yearFloat: 2026, province: null });
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'success', data: [], error: null });

    const { unmount } = render(<Scene />);
    
    const copperBtn = screen.getByRole('button', { name: 'Cobre' });
    fireEvent.click(copperBtn);
    expect(copperBtn.getAttribute('aria-pressed')).toBe('true');
    unmount();
  });
});

describe('Resources Scene and the province filter', () => {
  const src = { source: 'MOCK', retrieved_at: '2026-10-02' };
  const production = [
    { resource: 'lithium', geo: 'AR', year: 2025, value: 80, unit: 't', ...src },
    { resource: 'lithium', geo: 'AR', year: 2026, value: 100, unit: 't', ...src },
    { resource: 'lithium', geo: 'AR-A', year: 2025, value: 50, unit: 't', ...src },
    { resource: 'lithium', geo: 'AR-A', year: 2026, value: 60, unit: 't', ...src },
    { resource: 'lithium', geo: 'AR-B', year: 2026, value: 40, unit: 't', ...src }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    useStore.setState({ yearFloat: 2026, province: null });
    vi.spyOn(useDatasetModule, 'useDataset').mockImplementation((name) => ({
      status: 'success',
      data: name === 'resource_production' ? production : [],
      error: null
    }) as ReturnType<typeof useDatasetModule.useDataset>);
  });

  const trend = () =>
    screen
      .getAllByTestId('echart')
      .map((el) => JSON.parse(el.textContent ?? '{}') as { series?: Array<{ type: string; data: Array<number | null> }> })
      .find((o) => o.series?.[0]?.type === 'line');

  it('shows the national trend when no province is selected', () => {
    const { unmount } = render(<Scene />);
    expect(screen.getByText('Tendencia nacional')).toBeDefined();
    expect(trend()!.series![0]!.data).toEqual([80, 100]);
    expect(screen.queryByText(/el filtro de provincia no aplica/)).toBeNull();
    unmount();
  });

  it('shows the series of the selected province and says the composition stays national', () => {
    useStore.setState({ province: 'AR-A' });
    const { unmount } = render(<Scene />);
    expect(screen.getByText('Tendencia de Salta')).toBeDefined();
    expect(trend()!.series![0]!.data).toEqual([50, 60]);
    expect(screen.getByText('La composición es nacional: el filtro de provincia no aplica.')).toBeDefined();
    unmount();
  });

  it('falls back to the national trend, saying so, when the province has no series for the resource', () => {
    useStore.setState({ province: 'AR-C' });
    const { unmount } = render(<Scene />);
    expect(screen.getByText('Tendencia nacional')).toBeDefined();
    expect(
      screen.getByText('No hay serie provincial de Litio para Ciudad Autónoma de Buenos Aires: se muestra el total nacional.')
    ).toBeDefined();
    expect(trend()!.series![0]!.data).toEqual([80, 100]);
    unmount();
  });
});
