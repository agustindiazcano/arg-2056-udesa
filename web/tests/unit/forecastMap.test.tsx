// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within, act, configure } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Scene from '../../src/scenes/forecast/index.js';
import { ProvinceFilter } from '../../src/app/ProvinceFilter.js';
import { useStore } from '../../src/state/store.js';
import { MAP_NAME } from '../../src/charts/builders/provinceMap.js';
import { DIVERGING, SEQUENTIAL_BLUE } from '../../src/styles/tokens.js';
import { validFeature, validGeo, validGeoMeta } from './geo/geoWebFixtures.js';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

interface FakeChart {
  setOption: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  handlers: Record<string, (params: unknown) => void>;
}

const { instances, mockRegisterMap } = vi.hoisted(() => ({
  instances: [] as FakeChart[],
  mockRegisterMap: vi.fn()
}));

vi.mock('../../src/charts/echarts.js', () => ({
  init: vi.fn(() => {
    const chart: FakeChart = { setOption: vi.fn(), dispose: vi.fn(), handlers: {} };
    instances.push(chart);
    return {
      setOption: chart.setOption,
      resize: vi.fn(),
      dispose: chart.dispose,
      on: (event: string, fn: (params: unknown) => void) => {
        chart.handlers[event] = fn;
      }
    };
  }),
  registerMap: mockRegisterMap
}));

interface MapOption {
  visualMap?: { min: number; max: number; inRange: { color: string[] } };
  series: Array<{ type: string; data: Array<{ name: string; value: number; provinceId?: string }> }>;
}

const lastOption = (chart: FakeChart) => chart.setOption.mock.calls.at(-1)?.[0] as MapOption | undefined;
const mapChart = () => instances.find((c) => !c.dispose.mock.calls.length && lastOption(c)?.series.some((s) => s.type === 'map'));
const mapOption = () => lastOption(mapChart()!)!;
const mapData = () => mapOption().series.find((s) => s.type === 'map')!.data.map((d) => [d.name, d.value]);

type Sc = 'pessimistic' | 'expected' | 'optimistic';
const BASE: Record<string, number[]> = { 'AR-A': [20, 21, 22], 'AR-B': [30, 25, 20], 'AR-C': [8, 9, 10], AR: [1000, 1000, 1000] };
const SHIFT: Record<Sc, number> = { pessimistic: -5, expected: 0, optimistic: 5 };

function forecast() {
  const series = [];
  for (const overlay of ['off', 'on'] as const) {
    for (const scenario of ['pessimistic', 'expected', 'optimistic'] as Sc[]) {
      for (const [geo, values] of Object.entries(BASE)) {
        const k = overlay === 'on' ? 1.1 : 1;
        series.push({
          indicator: 'resource_production',
          resource: 'gold',
          geo,
          scenario,
          ai_overlay: overlay,
          unit: 't',
          points: values.map((v, i) => {
            const p50 = (v + SHIFT[scenario]) * k;
            return { year: 2026 + i, p10: p50 - 1, p50, p90: p50 + 1 };
          })
        });
      }
    }
  }
  return { model_version: 'mock-1', generated_at: '2026-01-01', source: 'MOCK', horizon: { start_year: 2026, end_year: 2028 }, series };
}

type GeoMode = 'ok' | '404' | 'bad-ids';

function stubFetch(mode: GeoMode = 'ok') {
  const respond = (ok: boolean, status: number, body: unknown) => ({ ok, status, json: async () => body });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/data/forecast_output.json') return respond(true, 200, forecast());
      if (url === '/geo/provinces.geojson?v=aaaaaaaaaaaa') {
        if (mode === '404') return respond(false, 404, {});
        const geo = validGeo();
        if (mode === 'bad-ids') geo.features[1] = validFeature(0); // AR-A twice, AR-B missing
        return respond(true, 200, geo);
      }
      if (url === '/geo/provinces.meta.json') return respond(mode !== '404', mode === '404' ? 404 : 200, validGeoMeta());
      throw new Error(`unexpected url ${url}`);
    })
  );
}

function Harness() {
  return (
    <>
      <Scene />
      <ProvinceFilter />
    </>
  );
}

async function loadedWithMap() {
  render(<Harness />);
  await waitFor(() => expect(mapChart()).toBeDefined());
}

describe('Forecast scene: province map', () => {
  beforeEach(() => {
    instances.length = 0;
    mockRegisterMap.mockClear();
    useStore.setState({ scenario: 'expected', yearFloat: 2026, province: null, provinceFilterOpen: false, aiOverlay: 'off' });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the map tab by default once the geometry is loaded and registers the geometry once', async () => {
    stubFetch();
    await loadedWithMap();
    expect(screen.getByRole('button', { name: 'Mapa' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Ranking' }).getAttribute('aria-pressed')).toBe('false');

    expect(mockRegisterMap).toHaveBeenCalledTimes(1);
    const [name, geometry] = mockRegisterMap.mock.calls[0]!;
    expect(name).toBe(MAP_NAME);
    expect(geometry.features).toHaveLength(25); // 24 provinces plus the illustrative Malvinas outline
    expect(geometry.features.at(-1).properties.id).toBe('MALVINAS');

    // the option follows the selectors: expected scenario, year 2026, level
    expect(mapData()).toEqual([['AR-A', 20], ['AR-B', 30], ['AR-C', 8]]);
    expect(mapOption().visualMap).toMatchObject({ min: 8, max: 30 });
    expect(mapOption().visualMap!.inRange.color).toEqual(SEQUENTIAL_BLUE);

    act(() => useStore.setState({ scenario: 'optimistic' }));
    await waitFor(() => expect(mapData()).toEqual([['AR-A', 25], ['AR-B', 35], ['AR-C', 13]]));
    expect(mockRegisterMap).toHaveBeenCalledTimes(1); // not registered again after re-renders
  });

  it('shows the geometry source and attribution next to the forecast source line', async () => {
    stubFetch();
    await loadedWithMap();
    expect(screen.getByText('Fuente: MOCK, modelo mock-1, horizonte 2026-2028, generado el 1 de enero de 2026')).toBeDefined();
    expect(screen.getByText('Geometría de las provincias: Example source. Example attribution')).toBeDefined();
  });

  it('changes the plotted values with scenario, overlay and year but keeps the domain stable across years', async () => {
    stubFetch();
    await loadedWithMap();
    expect(mapOption().visualMap).toMatchObject({ min: 8, max: 30 });

    act(() => useStore.setState({ yearFloat: 2028 }));
    await waitFor(() => expect(mapData()).toEqual([['AR-A', 22], ['AR-B', 20], ['AR-C', 10]]));
    expect(mapOption().visualMap).toMatchObject({ min: 8, max: 30 }); // same domain at another year

    act(() => useStore.setState({ yearFloat: 2027 }));
    await waitFor(() => expect(mapData()).toEqual([['AR-A', 21], ['AR-B', 25], ['AR-C', 9]]));
    expect(mapOption().visualMap).toMatchObject({ min: 8, max: 30 });

    act(() => useStore.setState({ aiOverlay: 'on' }));
    await waitFor(() => expect(mapData()[0]![1]).toBeCloseTo(23.1, 10)); // 21 * 1.1
    expect(mapOption().visualMap!.min).toBeCloseTo(8.8, 10);
    expect(mapOption().visualMap!.max).toBeCloseTo(33, 10);
  });

  it('selects a province by clicking it, clears it on a second click and ignores the Malvinas', async () => {
    stubFetch();
    await loadedWithMap();
    const click = () => mapChart()!.handlers.click!;

    act(() => click()({ componentType: 'series', seriesType: 'map', name: 'AR-B' }));
    expect(useStore.getState().province).toBe('AR-B');
    act(() => click()({ componentType: 'series', seriesType: 'map', name: 'AR-B' }));
    expect(useStore.getState().province).toBeNull();

    act(() => click()({ componentType: 'series', seriesType: 'scatter', name: 'Salta', data: { provinceId: 'AR-A' } }));
    expect(useStore.getState().province).toBe('AR-A');

    act(() => click()({ componentType: 'geo', name: 'AR-C' })); // a province without a data item
    expect(useStore.getState().province).toBe('AR-C');

    act(() => click()({ componentType: 'geo', name: 'MALVINAS' }));
    expect(useStore.getState().province).toBe('AR-C'); // unchanged
  });

  it('gives the same store state as the province filter', async () => {
    stubFetch();
    await loadedWithMap();
    const pick = () => {
      const { province, provinceFilterOpen } = useStore.getState();
      return { province, provinceFilterOpen };
    };

    act(() => mapChart()!.handlers.click!({ componentType: 'series', seriesType: 'map', name: 'AR-A' }));
    const fromMap = pick();

    act(() => useStore.setState({ province: null, provinceFilterOpen: true }));
    fireEvent.click(await screen.findByRole('button', { name: 'Salta' }));
    expect(pick()).toEqual(fromMap);
  });

  it('highlights the selected province with a border in the map option, whoever selected it', async () => {
    stubFetch();
    await loadedWithMap();
    act(() => useStore.setState({ province: 'AR-B' }));
    await waitFor(() => {
      const option = mapOption() as unknown as { geo: { regions: Array<{ name: string }> } };
      expect(option.geo.regions.some((r) => r.name === 'AR-B')).toBe(true);
    });
  });

  it('switches between level and change since the first year', async () => {
    stubFetch();
    await loadedWithMap();
    act(() => useStore.setState({ yearFloat: 2028 }));
    fireEvent.click(screen.getByRole('button', { name: 'Cambio desde 2026' }));
    expect(screen.getByRole('button', { name: 'Cambio desde 2026' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(mapOption().visualMap!.inRange.color).toEqual(DIVERGING));
    const { min, max } = mapOption().visualMap!;
    expect(min).toBe(-max); // symmetric around 0
    const byName = Object.fromEntries(mapData());
    expect(byName['AR-A']).toBeCloseTo((Math.sqrt(22 / 20) - 1) * 100, 10);
    expect(byName['AR-B']).toBeCloseTo((Math.sqrt(20 / 30) - 1) * 100, 10);

    fireEvent.click(screen.getByRole('button', { name: 'Nivel' }));
    await waitFor(() => expect(mapOption().visualMap!.inRange.color).toEqual(SEQUENTIAL_BLUE));
  });

  it('hides the metric toggle outside the map tab', async () => {
    stubFetch();
    await loadedWithMap();
    expect(screen.getByRole('button', { name: 'Nivel' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }));
    expect(screen.queryByRole('button', { name: 'Nivel' })).toBeNull();
    expect(screen.getByText('Provincias en 2026')).toBeDefined();
  });

  it('swaps the chart for a table whose missing cells read "sin datos"', async () => {
    stubFetch();
    await loadedWithMap();
    expect(screen.getByRole('img', { name: /^Mapa de/ })).toBeDefined();
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver tabla' })[1]!);
    expect(screen.queryByRole('img', { name: /^Mapa de/ })).toBeNull();

    const table = screen.getByRole('table', { name: 'Mapa de provincias' });
    const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td')).map((td) => td.textContent)
    );
    expect(rows[0]).toEqual(['1', 'Buenos Aires', '29 t', '30 t', '31 t', '30 t']);
    expect(rows[1]).toEqual(['2', 'Salta', '19 t', '20 t', '21 t', '20 t']);
    expect(rows[2]).toEqual(['3', 'Ciudad Autónoma de Buenos Aires', '7 t', '8 t', '9 t', '8 t']);
    expect(rows).toHaveLength(24);
    const catamarca = rows.find((r) => r[1] === 'Catamarca')!;
    expect(catamarca).toEqual(['sin datos', 'Catamarca', 'sin datos', 'sin datos', 'sin datos', 'sin datos']);
    expect(within(table).queryByText(/(^|\s)0 t$/)).toBeNull();
  });

  it('shows a message and makes the ranking the default when the geometry is not available', async () => {
    stubFetch('404');
    render(<Harness />);
    await screen.findByText(/Los escenarios son proyecciones condicionales, no predicciones\./);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ranking' }).getAttribute('aria-pressed')).toBe('true'));
    expect(screen.getByText('Provincias en 2026')).toBeDefined();
    expect(mapChart()).toBeUndefined();
    expect(mockRegisterMap).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Mapa' }));
    expect(screen.getByText(/Province geometry is not available/)).toBeDefined();
    expect(screen.getByText(/Failed to fetch \/geo\/provinces\.meta\.json: HTTP 404/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Ranking' })); // the ranking still works
    expect(screen.getByText('Provincias en 2026')).toBeDefined();
    expect(screen.queryByText(/^Province geometry:/)).toBeNull();
  });

  it('shows the message with the first problem when the province ids are inconsistent', async () => {
    stubFetch('bad-ids');
    render(<Harness />);
    await screen.findByText(/Los escenarios son proyecciones condicionales, no predicciones\./);
    fireEvent.click(screen.getByRole('button', { name: 'Mapa' }));
    await screen.findByText(/Province geometry is not available/);
    expect(screen.getByText(/Province ids are inconsistent: missing province id AR-B/)).toBeDefined();
    expect(mockRegisterMap).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Ranking' })).toBeDefined();
  });

  it('disposes every chart instance on unmount', async () => {
    stubFetch();
    const { unmount } = render(<Harness />);
    await waitFor(() => expect(mapChart()).toBeDefined());
    expect(instances.length).toBeGreaterThanOrEqual(2); // the fan and the map
    unmount();
    for (const chart of instances) expect(chart.dispose).toHaveBeenCalledTimes(1);
  });
});
