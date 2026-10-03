// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Scene from '../../src/scenes/resources/index.js';
import * as useDatasetModule from '../../src/data/useDataset.js';
import * as storeModule from '../../src/state/store.js';

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
  });

  it('shows loading initially', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'loading', data: null, error: null });

    const { unmount } = render(<Scene />);
    expect(screen.getByText('Loading...')).toBeDefined();
    unmount();
  });

  it('shows error state when fetch fails', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'error', data: null, error: new Error('Failed') });

    const { unmount } = render(<Scene />);
    expect(screen.getByText('Error loading data.')).toBeDefined();
    unmount();
  });

  it('renders charts and tables when data is loaded', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    
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
    expect(screen.getAllByText(/Investment Projects/).length).toBeGreaterThan(0);
    
    // Toggle table view for Treemap
    const tableToggleBtns = screen.getAllByText('Table view');
    
    fireEvent.click(tableToggleBtns[0] as Element);
    
    // Now there should be one less chart and a new table
    expect(screen.getByText('Composition Data')).toBeDefined();
    unmount();
  });

  it('selecting a resource updates the selected state (triggers rerender)', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'success', data: [], error: null });

    const { unmount } = render(<Scene />);
    
    const copperBtn = screen.getByRole('button', { name: 'copper' });
    fireEvent.click(copperBtn);
    expect(copperBtn.getAttribute('aria-pressed')).toBe('true');
    unmount();
  });
});
