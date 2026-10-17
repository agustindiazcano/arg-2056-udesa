// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProvinceProfileStep } from '../../src/tour/ProvinceProfileStep.js';

afterEach(() => {
  cleanup();
});

// Mock EChart
vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': ariaLabel, role }: { 'aria-label'?: string, role?: string }) => (
    <div data-testid="echart-mock" role={role} aria-label={ariaLabel} />
  )
}));

// Mock ProvinceMap
vi.mock('../../src/scenes/forecast/ProvinceMap.js', () => ({
  useProvinces: () => ({ status: 'success', geo: { type: 'FeatureCollection', features: [] } }),
  ProvinceMap: ({ onSelect }: { onSelect?: (id: string | null) => void }) => (
    <div data-testid="province-map-mock">
      <button onClick={() => onSelect?.('AR-A')}>Seleccionar Salta</button>
      <button onClick={() => onSelect?.(null)}>Volver</button>
    </div>
  )
}));

describe('ProvinceProfileStep (C6: province-profile-slide)', () => {
  it('renders title, metrics selector, ranking chart, and map', () => {
    render(<ProvinceProfileStep />);
    expect(screen.getByText(/perfil por provincia/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /^PBI$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /PBI\/hab\./i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Copart\./i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Pobreza/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Desempleo/i })).toBeDefined();
    expect(screen.getByTestId('province-map-mock')).toBeDefined();
  });

  it('displays detailed province profile metrics when a province is selected', () => {
    render(<ProvinceProfileStep />);

    // Click Salta on the map mock
    fireEvent.click(screen.getByText('Seleccionar Salta'));

    // Should show Salta in the profile header
    expect(screen.getByText(/Salta: ficha provincial/i)).toBeDefined();
    // Should show Salta's specific data
    expect(screen.getByText(/11\.200 M USD/)).toBeDefined();
    expect(screen.getByText(/7\.780 USD/)).toBeDefined();
    expect(screen.getByText(/3,8 %/)).toBeDefined();
    expect(screen.getByText(/1\.440\.672 hab\./)).toBeDefined();
    expect(screen.getByText(/49,5 %/)).toBeDefined();
    expect(screen.getByText(/6,5 %/)).toBeDefined();
  });

  it('toggles between chart view and accessible table view', () => {
    render(<ProvinceProfileStep />);
    const toggle = screen.getByRole('button', { name: /ver tabla/i });
    fireEvent.click(toggle);

    // Table view
    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText('Buenos Aires')).toBeDefined();
    expect(screen.getByText('Córdoba')).toBeDefined();
    expect(screen.getByRole('button', { name: /ver gráfico/i })).toBeDefined();
  });
});
