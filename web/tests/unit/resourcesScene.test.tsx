// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Scene from '../../src/scenes/resources/index.js';
import * as useDatasetModule from '../../src/data/useDataset.js';
import * as storeModule from '../../src/state/store.js';

// Mock EChart entirely to avoid dealing with the DOM ref in integration test
vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': ariaLabel, role }: any) => (
    <div data-testid="echart" role={role} aria-label={ariaLabel}>
      {JSON.stringify(option)}
    </div>
  )
}));

describe('Resources Scene', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading initially', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'loading', data: null, error: null });

    render(<Scene />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows error state when fetch fails', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'error', data: null, error: new Error('Failed') });

    render(<Scene />);
    expect(screen.getByText('Error loading data.')).toBeDefined();
  });

  it('renders charts and tables when data is loaded', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    
    vi.spyOn(useDatasetModule, 'useDataset').mockImplementation((name) => {
      if (name === 'composition') return { status: 'success', data: [], error: null };
      if (name === 'projects') return { status: 'success', data: [], error: null };
      if (name === 'resource_production') return { status: 'success', data: [], error: null };
      return { status: 'loading', data: null, error: null };
    });

    render(<Scene />);
    
    // Check if the three charts render
    const charts = screen.getAllByTestId('echart');
    expect(charts).toHaveLength(3);
    
    // Bottom projects table is always visible
    expect(screen.getByText(/Investment Projects/)).toBeDefined();
    
    // Toggle table view for Treemap
    const tableToggleBtns = screen.getAllByText('Table view');
    expect(tableToggleBtns).toHaveLength(3);
    
    fireEvent.click(tableToggleBtns[0]!);
    
    // Now there should be one less chart and a new table
    expect(screen.getAllByTestId('echart')).toHaveLength(2);
    expect(screen.getByText('Composition Data')).toBeDefined();
  });

  it('selecting a resource updates the selected state (triggers rerender)', () => {
    vi.spyOn(storeModule, 'useStore').mockReturnValue(2026);
    vi.spyOn(useDatasetModule, 'useDataset').mockReturnValue({ status: 'success', data: [], error: null });

    render(<Scene />);
    
    const copperBtn = screen.getByRole('button', { name: 'copper' });
    fireEvent.click(copperBtn);
    expect(copperBtn.getAttribute('aria-pressed')).toBe('true');
  });
});
