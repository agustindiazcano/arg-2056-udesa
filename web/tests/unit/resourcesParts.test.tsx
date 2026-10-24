// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({ EChart: () => <div data-testid="echart-mock" /> }));
vi.mock('../../src/scenes/forecast/ProvinceMap.js', () => ({
  useProvinces: () => ({ status: 'success', geo: { type: 'FeatureCollection', features: [] } }),
  ProvinceMap: () => <div data-testid="province-map-mock" />
}));
vi.mock('../../src/tour/TourChart.js', () => ({ TourChart: ({ children }: { children?: React.ReactNode }) => <>{children}</> }));

import { ResourcesStep } from '../../src/tour/ResourcesStep';

afterEach(cleanup);

describe('Recursos: one look, only the title changes', () => {
  it('offers Recursos and Perfil por provincia, with no separate «Producción por provincia» (Recursos already shows production by province)', () => {
    render(<ResourcesStep />);
    expect(screen.getByRole('button', { name: 'Recursos' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Perfil por provincia' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Producción por provincia' })).toBeNull();
  });

  it('changes the heading to the province profile and keeps the same layout and the traffic light legend', () => {
    const { container } = render(<ResourcesStep />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Recursos naturales');
    fireEvent.click(screen.getByRole('button', { name: 'Perfil por provincia' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Perfil por provincia');
    expect(container.querySelector('section.res-step')).not.toBeNull();
    expect(screen.getByLabelText('Colores del semáforo')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Recursos' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Recursos naturales');
  });
});
