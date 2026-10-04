// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within, configure } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Scene from '../../src/scenes/forecast/index.js';
import { useStore } from '../../src/state/store.js';
import { useKeyboard } from '../../src/state/useKeyboard.js';
import { tokens } from '../../src/styles/tokens.js';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': ariaLabel, role }: { option: unknown; 'aria-label'?: string; role?: string }) => (
    <div data-testid="echart" role={role} aria-label={ariaLabel} data-option={JSON.stringify(option)} />
  )
}));

type Sc = 'pessimistic' | 'expected' | 'optimistic';
const SCENARIOS: Sc[] = ['pessimistic', 'expected', 'optimistic'];
const BASE: Record<Sc, number> = { pessimistic: 100, expected: 200, optimistic: 300 };
const YEARS = [2026, 2027, 2028];

interface Pt { year: number; p10: number; p50: number; p90: number }
interface Ser {
  indicator: string;
  resource?: string;
  geo: string;
  scenario: Sc;
  ai_overlay: 'on' | 'off';
  unit: string;
  points: Pt[];
}

function pts(values: number[], years = YEARS): Pt[] {
  return values.map((v, i) => ({ year: years[i]!, p10: v - 1, p50: v, p90: v + 1 }));
}

function fixture(opts: { dropOptimisticGdp?: boolean; gdpGap?: boolean } = {}) {
  const series: Ser[] = [];
  for (const overlay of ['off', 'on'] as const) {
    const k = overlay === 'on' ? 1.1 : 1;
    for (const scenario of SCENARIOS) {
      if (opts.dropOptimisticGdp && scenario === 'optimistic') continue;
      const v = [BASE[scenario] * k, (BASE[scenario] + 10) * k, (BASE[scenario] + 20) * k];
      series.push({
        indicator: 'gdp_constant_usd',
        geo: 'AR',
        scenario,
        ai_overlay: overlay,
        unit: 'bn USD',
        points: opts.gdpGap && scenario === 'expected' ? pts([v[0]!, v[2]!], [2026, 2028]) : pts(v)
      });
    }
  }
  const idx: Record<Sc, number> = { pessimistic: 0, expected: 1, optimistic: 2 };
  for (const overlay of ['off', 'on'] as const) {
    for (const scenario of SCENARIOS) {
      const k = idx[scenario];
      const mk = (geo: string, values: number[]): Ser => ({
        indicator: 'resource_production',
        resource: 'gold',
        geo,
        scenario,
        ai_overlay: overlay,
        unit: 't',
        points: pts(values)
      });
      series.push(mk('AR', [1000 + k, 1000 + k, 1000 + k]));
      series.push(mk('AR-A', [20 + k, 21 + k, 22 + k])); // climbs
      series.push(mk('AR-B', [30 + k, 25 + k, 20 + k])); // falls
    }
  }
  return {
    model_version: 'mock-1',
    generated_at: '2026-01-01',
    source: 'MOCK',
    horizon: { start_year: 2026, end_year: 2028 },
    series
  };
}

function stubFetch(doc: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => doc }))
  );
}

function Harness() {
  useKeyboard();
  return <Scene />;
}

interface FanSeries { name: string; type?: string; lineStyle?: { width: number }; data: Array<number | null> }
interface FanOpt { series?: FanSeries[] }
interface RankOpt {
  yAxis?: { data: string[] };
  series?: Array<{ name: string; type?: string; data: Array<{ itemStyle: { color: string } }> }>;
}

function parsed<T>(): T[] {
  return screen.queryAllByTestId('echart').map((el) => JSON.parse(el.getAttribute('data-option') ?? '{}'));
}
const fanOptions = () => parsed<FanOpt>().filter((o) => o.series?.some((s) => s.name === 'markers'));
const fanOption = () => fanOptions()[0]!;
const rankOption = () => parsed<RankOpt>().filter((o) => o.series?.some((s) => s.type === 'custom'))[0]!;
const line = (o: FanOpt, name: string) => o.series?.find((s) => s.name === name);

async function loaded() {
  render(<Harness />);
  await screen.findByText(/Los escenarios son proyecciones condicionales, no predicciones\./);
}

describe('Forecast scene', () => {
  beforeEach(() => {
    useStore.setState({ scenario: 'expected', yearFloat: 2026, province: null, aiOverlay: 'off' });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows loading, then the fan, the caveat, the tiles and the source line', async () => {
    stubFetch(fixture());
    render(<Harness />);
    expect(screen.getByText('Cargando...')).toBeDefined();
    await screen.findByText(/Los escenarios son proyecciones condicionales, no predicciones\./);
    const fan = fanOption();
    expect(fan.series!.map((s) => s.name)).toEqual(
      expect.arrayContaining(['pessimistic', 'expected', 'optimistic', 'markers'])
    );
    expect(screen.getByText('Fuente: MOCK, modelo mock-1, horizonte 2026-2028, generado el 1 de enero de 2026')).toBeDefined();
    expect(screen.getByTestId('tile-value').textContent).toContain('220 bn USD');
  });

  it('shows an error state when fetch fails', async () => {
    stubFetch({}, false);
    render(<Harness />);
    await screen.findByText('No se pudieron cargar los datos.');
    expect(screen.queryAllByTestId('echart')).toHaveLength(0);
  });

  it('shows an error state when the file is not a valid forecast_output', async () => {
    stubFetch({ nope: true });
    render(<Harness />);
    await screen.findByText('No se pudieron cargar los datos.');
  });

  it('lists indicators from the file, with a resource selector only for resource_production', async () => {
    stubFetch(fixture());
    await loaded();
    expect(screen.getByRole('button', { name: 'PIB' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Producción de recursos' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Población' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Oro' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Producción de recursos' }));
    expect(screen.getByRole('button', { name: 'Oro' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Producción de recursos' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('reports a missing scenario series in text and does not fabricate it', async () => {
    stubFetch(fixture({ dropOptimisticGdp: true }));
    await loaded();
    expect(screen.getByText('Faltan series para la selección actual: Optimista')).toBeDefined();
    const names = fanOption().series!.map((s) => s.name);
    expect(names).not.toContain('optimistic');
    expect(names).toContain('expected');
  });

  it('shows a message instead of an empty chart when every series is missing', async () => {
    stubFetch(fixture());
    useStore.setState({ province: 'AR-C' });
    await loaded();
    expect(screen.getByText('Faltan series para la selección actual: Pesimista, Esperado, Optimista')).toBeDefined();
    expect(fanOptions()).toHaveLength(0);
  });

  it('pressing 2 and 3 on the document changes the highlighted scenario in the fan option', async () => {
    stubFetch(fixture());
    await loaded();
    expect(line(fanOption(), 'expected')!.lineStyle!.width).toBe(3);
    fireEvent.keyDown(document.body, { key: '3' });
    expect(useStore.getState().scenario).toBe('optimistic');
    await waitFor(() => expect(line(fanOption(), 'optimistic')!.lineStyle!.width).toBe(3));
    expect(line(fanOption(), 'expected')!.lineStyle!.width).toBe(2);
    fireEvent.keyDown(document.body, { key: '1' });
    await waitFor(() => expect(line(fanOption(), 'pessimistic')!.lineStyle!.width).toBe(3));
  });

  it('scenario buttons are bound to the store', async () => {
    stubFetch(fixture());
    await loaded();
    expect(screen.getByRole('button', { name: 'Esperado' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Optimista' }));
    expect(useStore.getState().scenario).toBe('optimistic');
    expect(screen.getByRole('button', { name: 'Optimista' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('the AI overlay toggle switches the series to the on data, adds the reference and the AI tile', async () => {
    stubFetch(fixture());
    await loaded();
    expect(screen.queryByTestId('tile-ai')).toBeNull();
    expect(line(fanOption(), 'expected')!.data).toEqual([200, 210, 220]);
    fireEvent.click(screen.getByRole('button', { name: 'Efecto de la IA' }));
    expect(useStore.getState().aiOverlay).toBe('on');
    expect(screen.getByRole('button', { name: 'Efecto de la IA' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(line(fanOption(), 'sin IA')).toBeDefined());
    expect(line(fanOption(), 'sin IA')!.data).toEqual([200, 210, 220]);
    expect(line(fanOption(), 'expected')!.data[0]).toBeCloseTo(220, 6);
    expect(screen.getByTestId('tile-ai').textContent).toContain('+10,0%');
    fireEvent.click(screen.getByRole('button', { name: 'Efecto de la IA' }));
    expect(useStore.getState().aiOverlay).toBe('off');
  });

  it('moving yearFloat changes the playhead and the ranking year, and out-of-range values clamp', async () => {
    stubFetch(fixture());
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Producción de recursos' }));
    expect(screen.getByText('Año 2026')).toBeDefined();
    // 2026: AR-B (30+1) above AR-A (20+1)
    expect(rankOption().yAxis!.data[0]).toContain('Buenos Aires');
    useStore.setState({ yearFloat: 2028.7 });
    await screen.findByText('Año 2028');
    // 2028: AR-A (22+1) above AR-B (20+1), AR-A climbed 1 place
    await waitFor(() => expect(rankOption().yAxis!.data[0]).toBe('Salta (sube 1)'));
    expect(rankOption().yAxis!.data[1]).toBe('Buenos Aires (baja 1)');
    useStore.setState({ yearFloat: 3000 });
    await screen.findByText('Año 2028');
    useStore.setState({ yearFloat: 1900 });
    await screen.findByText('Año 2026');
  });

  it('a selected province switches the fan to that geo and highlights its ranking row', async () => {
    stubFetch(fixture());
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Producción de recursos' }));
    expect(line(fanOption(), 'expected')!.data).toEqual([1001, 1001, 1001]); // AR
    useStore.setState({ province: 'AR-A' });
    await waitFor(() => expect(line(fanOption(), 'expected')!.data).toEqual([21, 22, 23]));
    const bars = rankOption().series!.find((s) => s.name === 'p50')!;
    const colors = bars.data.map((d) => d.itemStyle.color);
    // rank order at 2026: AR-B first, AR-A second; only AR-A keeps the scenario color
    expect(colors).toEqual([tokens.muted, tokens.scenario.expected]);
  });

  it('says there is no province ranking for an indicator without province series', async () => {
    stubFetch(fixture());
    await loaded();
    expect(screen.getByText('No hay series provinciales para este indicador en los datos.')).toBeDefined();
  });

  it('the table toggle swaps the fan for a table and null cells read "no data"', async () => {
    stubFetch(fixture({ gdpGap: true }));
    await loaded();
    const toggles = screen.getAllByRole('button', { name: 'Ver tabla' });
    expect(toggles[0]!.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggles[0]!);
    expect(screen.getAllByRole('button', { name: 'Ver tabla' })[0]!.getAttribute('aria-pressed')).toBe('true');
    const table = screen.getByRole('table');
    expect(within(table).getByText('Abanico del pronóstico')).toBeDefined();
    expect(within(table).getByText('2027')).toBeDefined();
    // expected has no point in 2027: its cells say "sin datos", never 0
    const row2027 = within(table).getByText('2027').closest('tr')!;
    const cells = Array.from(row2027.querySelectorAll('td')).map((td) => td.textContent);
    expect(cells).toEqual([
      '2027',
      '109 bn USD', '110 bn USD', '111 bn USD', // pessimistic p10 p50 p90
      'sin datos', 'sin datos', 'sin datos', // expected
      '309 bn USD', '310 bn USD', '311 bn USD' // optimistic
    ]);
    expect(row2027.textContent).not.toMatch(/(^|\s)0 bn USD/);
    // and the fan chart is gone while the table shows
    expect(fanOptions()).toHaveLength(0);
  });

  it('the ranking table lists rank, province, p10, p50, p90 and change', async () => {
    stubFetch(fixture());
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Producción de recursos' }));
    useStore.setState({ yearFloat: 2028 });
    await screen.findByText('Año 2028');
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver tabla' })[1]!);
    const table = screen.getByRole('table');
    const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td')).map((td) => td.textContent)
    );
    expect(rows).toEqual([
      ['1', 'Salta', '22 t', '23 t', '24 t', 'sube 1'],
      ['2', 'Buenos Aires', '20 t', '21 t', '22 t', 'baja 1']
    ]);
  });

  it('tiles show "no data" instead of a number when the growth cannot be computed', async () => {
    // a series with a single point has no growth between its first and last year
    const doc = fixture();
    const target = doc.series.find((s) => s.indicator === 'gdp_constant_usd' && s.scenario === 'expected' && s.ai_overlay === 'off')!;
    target.points = [target.points[2]!];
    stubFetch(doc);
    await loaded();
    expect(screen.getByTestId('tile-growth').textContent).toContain('sin datos');
    expect(screen.getByTestId('tile-growth').textContent).not.toMatch(/0(,0)?%/);
    expect(screen.getByTestId('tile-value').textContent).toContain('220 bn USD');
  });

  it('the growth tile shows the compound growth of the median between the first and last year', async () => {
    stubFetch(fixture());
    await loaded();
    // 200 -> 220 in 2 years: (220/200)^(1/2) - 1 = 4.8808...%
    expect(screen.getByTestId('tile-growth').textContent).toContain('4,9% por año');
  });
});
