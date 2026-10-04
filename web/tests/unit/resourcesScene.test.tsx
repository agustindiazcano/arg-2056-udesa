// @vitest-environment jsdom
import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
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

const { mapProps, provincesState } = vi.hoisted(() => ({
  mapProps: [] as Array<Record<string, unknown>>,
  provincesState: { current: { status: 'loading' } as Record<string, unknown> }
}));

vi.mock('../../src/scenes/forecast/ProvinceMap.js', () => ({
  useProvinces: () => provincesState.current,
  ProvinceMap: (props: Record<string, unknown>) => {
    mapProps.push(props);
    return <div data-testid="province-map" />;
  }
}));

/** Chooses a view in the carousel, paging with the arrows when it is not on the visible page. */
const pick = (name: string) => {
  for (const arrow of ['Vistas siguientes', 'Vistas anteriores']) {
    if (screen.queryByRole('button', { name })) break;
    fireEvent.click(screen.getByRole('button', { name: arrow }));
  }
  fireEvent.click(screen.getByRole('button', { name }));
};

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

    // the composition view is shown first; the carousel lists four views at a time and pages for the fifth
    for (const name of ['Composición', 'Por provincia', 'Tendencia', 'Mapa']) {
      expect(screen.getByRole('button', { name })).toBeDefined();
    }
    expect(screen.queryByRole('button', { name: 'Proyectos' })).toBeNull();

    // the projects table is its own view
    pick('Proyectos');
    expect(screen.getAllByText(/Proyectos de inversión/).length).toBeGreaterThan(0);

    // toggle the table view of the composition
    pick('Composición');
    fireEvent.click(screen.getByRole('button', { name: 'Ver tabla' }));
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
    pick('Tendencia');
    expect(screen.getByText('Tendencia nacional')).toBeDefined();
    expect(trend()!.series![0]!.data).toEqual([80, 100]);
    expect(screen.queryByText(/el filtro de provincia no aplica/)).toBeNull();
    unmount();
  });

  it('shows the series of the selected province and says the composition stays national', () => {
    useStore.setState({ province: 'AR-A' });
    const { unmount } = render(<Scene />);
    pick('Tendencia');
    expect(screen.getByText('Tendencia de Salta')).toBeDefined();
    expect(trend()!.series![0]!.data).toEqual([50, 60]);
    expect(screen.getByText('La composición es nacional: el filtro de provincia no aplica.')).toBeDefined();
    unmount();
  });

  it('falls back to the national trend, saying so, when the province has no series for the resource', () => {
    useStore.setState({ province: 'AR-C' });
    const { unmount } = render(<Scene />);
    pick('Tendencia');
    expect(screen.getByText('Tendencia nacional')).toBeDefined();
    expect(
      screen.getByText('No hay serie provincial de Litio para Ciudad Autónoma de Buenos Aires: se muestra el total nacional.')
    ).toBeDefined();
    expect(trend()!.series![0]!.data).toEqual([80, 100]);
    unmount();
  });
});

describe('Resources Scene province map', () => {
  const src = { source: 'MOCK', retrieved_at: '2026-10-02' };
  const production = [
    { resource: 'lithium', geo: 'AR', year: 2026, value: 100, unit: 't', ...src },
    { resource: 'lithium', geo: 'AR-A', year: 2026, value: 60, unit: 't', ...src },
    { resource: 'lithium', geo: 'AR-B', year: 2026, value: 40, unit: 't', ...src }
  ];
  const geo = { type: 'FeatureCollection', features: [{ properties: { id: 'AR-A' } }, { properties: { id: 'AR-B' } }] };

  beforeEach(() => {
    vi.restoreAllMocks();
    mapProps.length = 0;
    useStore.setState({ yearFloat: 2026, province: null });
    vi.spyOn(useDatasetModule, 'useDataset').mockImplementation((name) => ({
      status: 'success',
      data: name === 'resource_production' ? production : [],
      error: null
    }) as ReturnType<typeof useDatasetModule.useDataset>);
  });

  it('says the geometry is loading, then shows the map of the selected resource and year', () => {
    provincesState.current = { status: 'loading' };
    const first = render(<Scene />);
    pick('Mapa');
    expect(screen.getByText('Cargando la geometría de las provincias...')).toBeDefined();
    first.unmount();

    provincesState.current = { status: 'success', geo, meta: { source: 'Fuente geo', attribution: 'Atribución geo' } };
    const { unmount } = render(<Scene />);
    pick('Mapa');
    expect(screen.getByRole('heading', { name: 'Mapa de producción por provincia (2026)' })).toBeDefined();
    expect(screen.getByTestId('province-map')).toBeDefined();
    const props = mapProps.at(-1)!;
    expect(props.observed).toBe(true);
    expect(props.metric).toBe('level');
    expect(props.unit).toBe('t');
    expect(props.year).toBe(2026);
    expect((props.values as { values: Record<string, { rank: number }> }).values['AR-A']!.rank).toBe(1);
    expect(screen.getByText('Geometría de las provincias: Fuente geo. Atribución geo')).toBeDefined();
    unmount();
  });

  it('selects the province clicked on the map in the store, and clears it when clicked again', () => {
    provincesState.current = { status: 'success', geo, meta: { source: 's', attribution: 'a' } };
    const { unmount } = render(<Scene />);
    pick('Mapa');
    act(() => (mapProps.at(-1)!.onSelect as (id: string | null) => void)('AR-B'));
    expect(useStore.getState().province).toBe('AR-B');
    act(() => (mapProps.at(-1)!.onSelect as (id: string | null) => void)(null));
    expect(useStore.getState().province).toBeNull();
    unmount();
  });

  it('says so when the geometry cannot be loaded', () => {
    provincesState.current = { status: 'error', message: 'HTTP 404' };
    const { unmount } = render(<Scene />);
    pick('Mapa');
    expect(screen.getByText('La geometría de las provincias no está disponible: HTTP 404')).toBeDefined();
    unmount();
  });
});

describe('Resources Scene indicators', () => {
  const src = { source: 'MOCK', retrieved_at: '2026-10-02' };
  const production = [
    { resource: 'lithium', geo: 'AR', year: 2026, value: 100, unit: 't', ...src },
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

  it('shows the national production, the leading province, how many provinces have data and the projects listed', () => {
    const { unmount } = render(<Scene />);
    expect(screen.getByTestId('tile-national').textContent).toContain('100 t');
    expect(screen.getByTestId('tile-leader').textContent).toContain('Salta');
    expect(screen.getByTestId('tile-leader').textContent).toContain('60 t');
    expect(screen.getByTestId('tile-provinces').textContent).toContain('2 de 24');
    expect(screen.getByTestId('tile-projects').textContent).toContain('0');
    unmount();
  });

  it('says "sin datos" for a resource with no production, never zero', () => {
    const { unmount } = render(<Scene />);
    pick('Cobre');
    expect(screen.getByTestId('tile-national').textContent).toContain('sin datos');
    expect(screen.getByTestId('tile-leader').textContent).toContain('sin datos');
    unmount();
  });
});
