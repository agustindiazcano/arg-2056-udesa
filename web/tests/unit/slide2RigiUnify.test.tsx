// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ResourcesStep } from '../../src/tour/ResourcesStep.js';
import {
  ALL_RIGI_PROJECTS,
  getRigiProvinceTotals,
  getRigiProjectsByProvince
} from '../../src/tour/rigiProjects.js';

afterEach(() => {
  cleanup();
});

// Mock ECharts to test interaction cleanly
vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': ariaLabel, onClick }: { option?: object; 'aria-label'?: string; onClick?: (params: { name?: string }) => void }) => (
    <div data-testid="echart-mock" aria-label={ariaLabel}>
      <button
        type="button"
        data-testid="echart-click-dept-los-andes"
        onClick={() => onClick?.({ name: 'Los Andes' })}
      >
        Click Los Andes
      </button>
      <button
        type="button"
        data-testid="echart-click-prov-salta"
        onClick={() => onClick?.({ name: 'Salta' })}
      >
        Click Salta
      </button>
      <button
        type="button"
        data-testid="echart-click-prov-sanjuan"
        onClick={() => onClick?.({ name: 'San Juan' })}
      >
        Click San Juan
      </button>
      <span data-testid="echart-option">{JSON.stringify(option)}</span>
    </div>
  )
}));

vi.mock('../../src/scenes/forecast/ProvinceMap.js', () => ({
  useProvinces: () => ({ status: 'success', geo: { features: [] }, meta: {} }),
  ProvinceMap: ({
    selectedId,
    selectedDepartment,
    onSelect,
    onSelectDepartment,
    projectMarkers,
    indicatorLabel
  }: {
    selectedId: string | null;
    selectedDepartment?: string | null;
    onSelect: (id: string | null) => void;
    onSelectDepartment?: (dept: string | null) => void;
    projectMarkers?: Array<{ name: string; isRigi?: boolean; provinceId: string; department?: string }>;
    indicatorLabel?: string;
  }) => (
    <div
      data-testid="province-map-mock"
      data-selected-id={selectedId}
      data-selected-dept={selectedDepartment}
      data-indicator={indicatorLabel}
    >
      <button data-testid="select-salta" onClick={() => onSelect('AR-A')}>
        Select Salta
      </button>
      <button data-testid="select-sanjuan" onClick={() => onSelect('AR-J')}>
        Select San Juan
      </button>
      <button data-testid="select-dept-los-andes" onClick={() => onSelectDepartment?.('Los Andes')}>
        Select Los Andes
      </button>
      <div data-testid="markers-count">{projectMarkers ? projectMarkers.length : 0}</div>
      {projectMarkers?.map((m) => (
        <span key={m.name} data-testid={`marker-${m.name}`}>
          {m.name} ({m.isRigi ? 'RIGI' : 'Standard'})
        </span>
      ))}
    </div>
  )
}));

describe('Fase 1: slide2-unify-and-rigi', () => {
  it('unifies Slide 2: top selector has only Recursos y RIGI and Perfil provincial', () => {
    const { unmount } = render(<ResourcesStep />);

    // Check segmented options for "Mostrar"
    expect(screen.getByRole('radio', { name: /Recursos y RIGI/i })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Perfil provincial/i })).toBeDefined();

    // Redundant "Producción por provincia" must be removed
    expect(screen.queryByRole('radio', { name: /Producción por provincia/i })).toBeNull();

    unmount();
  });

  it('renders RIGI toggle button in the controls bar of Recursos y RIGI', () => {
    const { unmount } = render(<ResourcesStep />);

    const rigiBtn = screen.getByRole('button', { name: /RIGI/i });
    expect(rigiBtn).toBeDefined();
    expect(rigiBtn.getAttribute('aria-pressed')).toBe('false');

    unmount();
  });

  it('toggling RIGI switches to RIGI mode with dedicated investment totals and ranking', () => {
    const { unmount } = render(<ResourcesStep />);

    const rigiBtn = screen.getByRole('button', { name: /RIGI/i });
    fireEvent.click(rigiBtn);

    expect(rigiBtn.getAttribute('aria-pressed')).toBe('true');

    // Totals should now reflect RIGI figures
    expect(screen.getByText(/Inversión RIGI/i)).toBeDefined();
    expect(screen.getByText(/Proyectos RIGI/i)).toBeDefined();

    // Province ranking chart should display RIGI investments
    expect(screen.getByText(/RIGI: inversión por provincia/i)).toBeDefined();

    // Map should receive RIGI indicator and scatter markers
    const mapMock = screen.getByTestId('province-map-mock');
    expect(mapMock.getAttribute('data-indicator')).toMatch(/inversión RIGI/i);
    const markersCount = Number(screen.getByTestId('markers-count').textContent);
    expect(markersCount).toBeGreaterThan(15);

    unmount();
  });

  it('selecting a province displays technical project cards with badges', () => {
    const { unmount } = render(<ResourcesStep />);

    // Select San Juan
    fireEvent.click(screen.getByTestId('select-sanjuan'));

    // Should display technical project cards for San Juan
    expect(screen.getByText(/Proyectos mineros y estratégicos en San Juan/i)).toBeDefined();
    expect(screen.getByText(/Vicuña/i)).toBeDefined();
    expect(screen.getByText(/Los Azules/i)).toBeDefined();

    // Should render RIGI badge and mineral badge
    const rigiBadges = screen.getAllByText(/★ RIGI/i);
    expect(rigiBadges.length).toBeGreaterThan(0);

    // Should display investment amount
    expect(screen.getByText(/9\.737 millones de USD/i)).toBeDefined();

    unmount();
  });

  it('selecting a department filters the technical project cards to that department', () => {
    const { unmount } = render(<ResourcesStep />);

    // Select Salta
    fireEvent.click(screen.getByTestId('select-salta'));

    // Select Los Andes
    fireEvent.click(screen.getByTestId('select-dept-los-andes'));

    // Should display projects in Los Andes
    expect(screen.getByText(/Proyectos mineros en Los Andes/i)).toBeDefined();
    expect(screen.getByText(/Taca Taca/i)).toBeDefined();
    expect(screen.getByText(/Centenario-Ratones/i)).toBeDefined();

    unmount();
  });

  it('rigiProjects dataset provides full geographic and departmental metadata', () => {
    expect(ALL_RIGI_PROJECTS.length).toBeGreaterThanOrEqual(28);

    for (const proj of ALL_RIGI_PROJECTS) {
      expect(proj.name).toBeDefined();
      expect(proj.company).toBeDefined();
      expect(proj.provinceIds.length).toBeGreaterThan(0);
      expect(proj.coordinates).toBeDefined();
      expect(proj.coordinates[0]).toBeLessThan(0); // Longitude in western hemisphere
      expect(proj.coordinates[1]).toBeLessThan(0); // Latitude in southern hemisphere
      expect(proj.refs.length).toBeGreaterThan(0);
    }

    const sjProjects = getRigiProjectsByProvince('AR-J');
    expect(sjProjects.some((p) => p.name === 'Vicuña')).toBe(true);
    expect(sjProjects.some((p) => p.name === 'Los Azules')).toBe(true);

    const totals = getRigiProvinceTotals();
    expect(totals['AR-J']).toBeGreaterThan(20000); // > 20.000 M USD in San Juan
    expect(totals['AR-Q']).toBeGreaterThan(40000); // > 40.000 M USD in Neuquén
  });
});
