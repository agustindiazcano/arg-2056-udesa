// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within, configure } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Scene from '../../src/scenes/economy/index.js';
import { useStore } from '../../src/state/store.js';
import './reducedMotionStub';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': ariaLabel, role = 'img' }: { option: unknown; 'aria-label'?: string; role?: string }) => (
    <div data-testid="echart" role={role} aria-label={ariaLabel} data-option={JSON.stringify(option)} />
  )
}));

interface Rec {
  country: string;
  year: number;
  indicator: string;
  value: number | null;
  unit: string;
  source: string;
  retrieved_at: string;
  note?: string;
}

const YEARS = [1900, 1901, 1902, 1903];
const GDP: Record<string, Array<number | null>> = {
  ARG: [100, 110, null, 150],
  BRA: [null, 50, 60, 75],
  CHL: [200, 210, 220, null],
  COL: [30, 35, 40, 45],
  MEX: [70, 75, 80, 85],
  PER: [20, 25, 30, 35],
  URY: [90, 95, 100, 105],
  VEN: [60, 65, 70, 75],
  ECU: [40, 45, 50, 55],
  BOL: [10, 12, 14, 16]
};

function records(table: Record<string, Array<number | null>> = GDP, indicator = 'gdp_per_capita_usd'): Rec[] {
  const out: Rec[] = [];
  for (const [country, values] of Object.entries(table)) {
    values.forEach((value, i) =>
      out.push({
        country,
        year: YEARS[i]!,
        indicator,
        value,
        unit: 'u',
        source: 'MOCK',
        retrieved_at: '2026-10-02',
        ...(value === null ? { note: 'Mock missing data' } : {})
      })
    );
  }
  return out;
}

function stubFetch(body: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body })));
}

interface Opt {
  series?: Array<{ name: string; type?: string; data: Array<number | null | { value: number }>; markLine?: { data: Array<{ xAxis: string }> }; lineStyle?: { color: string } }>;
  yAxis?: { name?: string; data?: string[] };
}
const options = () =>
  screen.queryAllByTestId('echart').map((el) => JSON.parse(el.getAttribute('data-option') ?? '{}') as Opt);
const longRun = () => options().find((o) => o.series?.some((s) => s.name === 'ARG'))!;
const rankBars = () => options().find((o) => o.series?.[0]?.type === 'bar')!;
const history = () => options().find((o) => o.series?.some((s) => s.name === 'rank'))!;
const names = (o: Opt) => (o.series ?? []).filter((s) => s.name !== 'markers').map((s) => s.name);

const pick = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

async function loaded() {
  render(<Scene />);
  await screen.findByRole('heading', { level: 1 });
}

describe('Economy scene', () => {
  beforeEach(() => {
    useStore.setState({ yearFloat: 1901, province: null });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows loading, then the long-run chart, the tiles and the source line; the other two views come from the carousel', async () => {
    stubFetch(records());
    render(<Scene />);
    expect(screen.getByText('Cargando...')).toBeDefined();
    await screen.findByRole('heading', { level: 1 });
    expect(names(longRun()).sort()).toEqual(['ARG', 'BOL', 'BRA', 'CHL', 'COL', 'ECU', 'MEX', 'PER']);
    expect(screen.getAllByTestId('echart')).toHaveLength(1); // one view at a time
    pick('Ranking');
    expect(rankBars().yAxis!.data).toEqual(['1. CHL', '2. ARG', '3. MEX', '4. BRA', '5. ECU', '6. COL', '7. PER', '8. BOL']);
    pick('Puesto de ARG');
    expect(history().series!.find((s) => s.name === 'rank')!.data).toEqual([2, 2, null, 1]); // ARG rank per year
    expect(screen.getByText('Fuente: MOCK, consultado el 2 de octubre de 2026')).toBeDefined();
    expect(screen.getByText('Año 1901')).toBeDefined();
  });

  it('shows an error state when the fetch fails', async () => {
    stubFetch({}, false);
    render(<Scene />);
    await screen.findByText('No se pudieron cargar los datos.');
    expect(screen.queryAllByTestId('echart')).toHaveLength(0);
  });

  it('shows a message instead of empty charts when no country has data for the indicator', async () => {
    stubFetch(records({ ARG: [null, null, null, null], BRA: [null, null, null, null] }, 'gdp_constant_usd'));
    render(<Scene />);
    await screen.findByText('Ningún país tiene datos para este indicador.');
    expect(screen.queryAllByTestId('echart')).toHaveLength(0);
  });

  it('shows the tiles with value, rank and the gap to the peer median', async () => {
    stubFetch(records());
    await loaded();
    expect(screen.getByTestId('tile-value').textContent).toContain('110 u');
    expect(screen.getByTestId('tile-rank').textContent).toContain('2 de 8');
    // peers: BOL 12, BRA 50, CHL 210, COL 35, ECU 45, MEX 75, PER 25 -> median 45 -> (110 - 45) / 45 = +144.4%
    expect(screen.getByTestId('tile-gap').textContent).toContain('+144,4%');
  });

  it('moving yearFloat changes the playhead, the rank bars and the tiles, and clamps out-of-range values', async () => {
    stubFetch(records());
    await loaded();
    useStore.setState({ yearFloat: 1903.9 });
    await screen.findByText('Año 1903');
    expect(screen.getByTestId('tile-value').textContent).toContain('150 u');
    expect(longRun().series!.find((s) => s.name === 'markers')!.markLine!.data[0]!.xAxis).toBe('1903');
    pick('Ranking');
    await waitFor(() => expect(rankBars().yAxis!.data![0]).toBe('1. ARG'));

    useStore.setState({ yearFloat: 3000 });
    await screen.findByText('Año 1903');
    useStore.setState({ yearFloat: 1700 });
    await screen.findByText('Año 1900');
  });

  it('a year without a value for Argentina reads "sin datos" in the tiles, never 0', async () => {
    stubFetch(records());
    await loaded();
    useStore.setState({ yearFloat: 1902 });
    await screen.findByText('Año 1902');
    for (const id of ['tile-value', 'tile-rank', 'tile-gap']) {
      expect(screen.getByTestId(id).textContent).toContain('sin datos');
    }
    expect(screen.getByTestId('tile-value').textContent).not.toMatch(/(^|\s)0 u/);
    // and the country is listed as missing in the rank bars summary, not ranked
    pick('Ranking');
    expect(screen.getByRole('img', { name: /sin datos de ARG/ })).toBeDefined();
  });

  it('peer chips add and remove series; Argentina cannot be removed', async () => {
    stubFetch(records());
    await loaded();
    const arg = screen.getByRole('button', { name: 'ARG' });
    expect(arg.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(arg);
    expect(arg.getAttribute('aria-pressed')).toBe('true');
    expect(names(longRun())).toContain('ARG');

    fireEvent.click(screen.getByRole('button', { name: 'BRA' }));
    await waitFor(() => expect(names(longRun())).not.toContain('BRA'));
    expect(screen.getByRole('button', { name: 'BRA' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'BRA' }));
    await waitFor(() => expect(names(longRun())).toContain('BRA'));
  });

  it('ignores the ninth country with a visible message', async () => {
    stubFetch(records());
    await loaded();
    expect(screen.getByRole('button', { name: 'URY' }).getAttribute('aria-pressed')).toBe('false'); // 9th by id
    expect(screen.queryByText(/Máximo 8 países/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'URY' }));
    expect(screen.getByText('Máximo 8 países a la vez.')).toBeDefined();
    expect(names(longRun())).not.toContain('URY');
    expect(screen.getByRole('button', { name: 'URY' }).getAttribute('aria-pressed')).toBe('false');

    // after removing one, the same country can be added
    fireEvent.click(screen.getByRole('button', { name: 'BOL' }));
    fireEvent.click(screen.getByRole('button', { name: 'URY' }));
    await waitFor(() => expect(names(longRun())).toContain('URY'));
  });

  it('switches between level and index', async () => {
    stubFetch(records());
    await loaded();
    expect(longRun().yAxis!.name).toBe('u');
    fireEvent.click(screen.getByRole('button', { name: 'Índice' }));
    expect(screen.getByRole('button', { name: 'Índice' }).getAttribute('aria-pressed')).toBe('true');
    // BRA is null in 1900, so the first year with a positive value for all eight countries is 1901
    await waitFor(() => expect(longRun().yAxis!.name).toBe('Índice (año base = 1901)'));
    const arg = longRun().series!.find((s) => s.name === 'ARG')!;
    expect(arg.data[1]).toBe(100);
    fireEvent.click(screen.getByRole('button', { name: 'Nivel' }));
    await waitFor(() => expect(longRun().yAxis!.name).toBe('u'));
  });

  it('says the index is unavailable and shows levels when no year has a value for every country', async () => {
    stubFetch(records({ ARG: [10, null, null, null], BRA: [null, 20, null, null] }));
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Índice' }));
    await screen.findByText(
      'La vista de índice no está disponible: ningún año tiene un valor positivo para todos los países seleccionados. Se muestran los niveles.'
    );
    expect(longRun().yAxis!.name).toBe('u');
  });

  it('swaps each chart for a table whose missing cells read "sin datos"', async () => {
    stubFetch(records());
    await loaded();
    const toggle = () => screen.getByRole('button', { name: 'Ver tabla' });

    fireEvent.click(toggle());
    const longTable = screen.getByRole('table', { name: 'Largo plazo' });
    const row1902 = within(longTable).getByText('1902').closest('tr')!;
    const cells = Array.from(row1902.querySelectorAll('td')).map((td) => td.textContent);
    expect(cells[0]).toBe('1902');
    expect(cells).toContain('sin datos'); // ARG has no value in 1902
    expect(cells).not.toContain('0 u');

    pick('Ranking');
    fireEvent.click(toggle());
    const rankTable = screen.getByRole('table', { name: 'Ranking' });
    expect(Array.from(rankTable.querySelectorAll('tbody tr'))[0]!.textContent).toBe('1CHL210 u');

    pick('Puesto de ARG');
    fireEvent.click(toggle());
    const historyTable = screen.getByRole('table', { name: 'Historia del puesto' });
    const rows = Array.from(historyTable.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td')).map((td) => td.textContent)
    );
    expect(rows[2]).toEqual(['1902', 'sin datos', 'sin datos']);
    expect(rows[1]).toEqual(['1901', '2', '8']);
  });

  it('keeps working when a province is selected in the store (the filter does not apply here)', async () => {
    stubFetch(records());
    useStore.setState({ province: 'AR-A' });
    await loaded();
    expect(names(longRun())).toContain('ARG');
    expect(screen.getByText('Los datos de esta escena son nacionales: el filtro de provincia no aplica.')).toBeDefined();
  });

  it('shows no province note when no province is selected', async () => {
    stubFetch(records());
    await loaded();
    expect(screen.queryByText(/el filtro de provincia no aplica/)).toBeNull();
  });

  it('lists the indicators of the dataset and switches the data', async () => {
    stubFetch([...records(), ...records({ ARG: [1, 2, 3, 4], BRA: [4, 3, 2, 1] }, 'population')]);
    await loaded();
    expect(screen.getByRole('button', { name: 'PIB per cápita' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Población' }));
    await waitFor(() => expect(names(longRun()).sort()).toEqual(['ARG', 'BRA']));
    expect(screen.queryByRole('button', { name: 'IDH' })).toBeNull();
  });
});
