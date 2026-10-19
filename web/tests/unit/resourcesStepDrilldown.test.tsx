// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ResourcesStep } from '../../src/tour/ResourcesStep.js';

afterEach(() => {
  cleanup();
});

// Mock ECharts to test interaction cleanly
vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': ariaLabel, onClick }: { option?: object; 'aria-label'?: string; onClick?: (params: { name?: string }) => void }) => (
    <div>
      <button
        type="button"
        data-testid="echart-mock"
        aria-label={ariaLabel}
        onClick={() => {
          onClick?.({ name: 'Los Andes' });
        }}
      >
        {JSON.stringify(option)}
      </button>
      <button
        type="button"
        data-testid="echart-click-salta"
        onClick={() => {
          onClick?.({ name: 'Salta' });
        }}
      >
        Click Salta bar
      </button>
    </div>
  )
}));

vi.mock('../../src/scenes/forecast/ProvinceMap.js', () => ({
  useProvinces: () => ({ status: 'success', geo: { features: [] }, meta: {} }),
  ProvinceMap: ({ onSelect, onSelectDepartment }: { onSelect: (id: string | null) => void; onSelectDepartment?: (dept: string | null) => void }) => (
    <div data-testid="province-map-mock">
      <button data-testid="select-salta" onClick={() => onSelect('AR-A')}>
        Select Salta
      </button>
      <button data-testid="select-dept-los-andes" onClick={() => onSelectDepartment?.('Los Andes')}>
        Select Los Andes
      </button>
    </div>
  )
}));

describe('ResourcesStep drilldown (C3 & C4)', () => {
  it('switches bottom-left chart to department ranking when Salta is selected on the map', () => {
    const { unmount } = render(<ResourcesStep />);
    
    // Initially shows provinces ranking
    expect(screen.getByText(/provincias que producen/i)).toBeDefined();

    // Select Salta
    fireEvent.click(screen.getByTestId('select-salta'));

    // Now shows department ranking for Salta
    expect(screen.getByText(/Salta: producción minera por departamento/i)).toBeDefined();
    unmount();
  });

  it('selects a province when clicking its bar in the national provinces chart', () => {
    const { unmount } = render(<ResourcesStep />);
    expect(screen.getByText(/provincias que producen/i)).toBeDefined();

    const saltaButtons = screen.getAllByTestId('echart-click-salta');
    fireEvent.click(saltaButtons[saltaButtons.length - 1]!);

    expect(screen.getByText(/Salta: producción minera por departamento/i)).toBeDefined();
    unmount();
  });

  it('displays projects list when a department with projects is selected (Los Andes)', () => {
    const { unmount } = render(<ResourcesStep />);
    
    // Select Salta
    fireEvent.click(screen.getByTestId('select-salta'));

    // Select Los Andes department
    fireEvent.click(screen.getByTestId('select-dept-los-andes'));

    // Projects list should appear
    expect(screen.getByText(/Proyectos mineros en Los Andes/i)).toBeDefined();
    expect(screen.getByText(/Taca Taca/i)).toBeDefined();
    expect(screen.getByText(/Centenario-Ratones/i)).toBeDefined();
    unmount();
  });
});

