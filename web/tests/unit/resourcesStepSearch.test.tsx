// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ResourcesStep } from '../../src/tour/ResourcesStep.js';

afterEach(() => {
  cleanup();
});

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: () => <div data-testid="echart-mock" />
}));

vi.mock('../../src/scenes/forecast/ProvinceMap.js', () => ({
  useProvinces: () => ({ status: 'success', geo: { features: [] }, meta: {} }),
  ProvinceMap: ({ selectedId, selectedDepartment }: { selectedId: string | null; selectedDepartment?: string | null }) => (
    <div data-testid="province-map-mock" data-selected-id={selectedId} data-selected-dept={selectedDepartment} />
  )
}));

describe('ResourcesStep with MapSearch (C5)', () => {
  it('renders search input on top of the map', () => {
    render(<ResourcesStep />);
    expect(screen.getByPlaceholderText(/buscar provincia/i)).toBeDefined();
  });

  it('searching and selecting a department drills down to the province and department', () => {
    render(<ResourcesStep />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Los Andes' } });

    // Option should appear in dropdown
    const opt = screen.getByRole('option', { name: /Los Andes/i });
    fireEvent.click(opt);

    // Should drilldown to Salta and Los Andes department
    expect(screen.getByText(/Salta: producción minera por departamento/i)).toBeDefined();
    expect(screen.getByText(/Proyectos mineros en Los Andes/i)).toBeDefined();
    expect(screen.getByText(/Taca Taca/i)).toBeDefined();
  });
});
