// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within, configure } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Scene from '../../src/scenes/sandbox/index.js';
import { useKeyboard } from '../../src/state/useKeyboard.js';
import { useStore } from '../../src/state/store.js';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': ariaLabel, role = 'img' }: { option: unknown; 'aria-label'?: string; role?: string }) => (
    <div data-testid="echart" role={role} aria-label={ariaLabel} data-option={JSON.stringify(option)} />
  )
}));

type Sc = 'pessimistic' | 'expected' | 'optimistic';
const YEARS = [2026, 2027, 2028, 2029, 2030];
const GROWTH: Record<Sc, number> = { pessimistic: 1, expected: 3, optimistic: 5 };

interface Ser {
  indicator: string;
  geo: string;
  scenario: Sc;
  ai_overlay: 'on' | 'off';
  unit: string;
  points: Array<{ year: number; p10: number; p50: number; p90: number }>;
}

function forecast(opts: { noPopulation?: boolean; dropPoint?: { scenario: Sc; year: number } } = {}) {
  const series: Ser[] = [];
  for (const overlay of ['off', 'on'] as const) {
    for (const scenario of ['pessimistic', 'expected', 'optimistic'] as Sc[]) {
      const k = overlay === 'on' ? 1.1 : 1;
      const make = (indicator: string, base: number, rate: number, unit: string): Ser => ({
        indicator,
        geo: 'AR',
        scenario,
        ai_overlay: overlay,
        unit,
        points: YEARS.filter((y) => !(opts.dropPoint && indicator === 'gdp_per_capita_usd' && overlay === 'off' && scenario === opts.dropPoint.scenario && y === opts.dropPoint.year)).map((year, _i) => {
          const p50 = base * (1 + rate / 100) ** (year - 2026) * k;
          return { year, p10: p50 * 0.9, p50, p90: p50 * 1.1 };
        })
      });
      series.push(make('gdp_per_capita_usd', 100, GROWTH[scenario], 'USD'));
      if (!opts.noPopulation) series.push(make('population', 1000, 1, 'people'));
    }
  }
  return {
    model_version: 'mock-1',
    generated_at: '2026-01-01',
    source: 'MOCK',
    horizon: { start_year: 2026, end_year: 2030 },
    series
  };
}

function stubFetch(body: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body })));
}

interface Opt {
  yAxis?: { name?: string };
  series?: Array<{ name: string; data: Array<number | null>; stack?: string; markLine?: { data: Array<{ xAxis: string | number }> } }>;
}
const options = () =>
  screen.queryAllByTestId('echart').map((el) => JSON.parse(el.getAttribute('data-option') ?? '{}') as Opt);
const pathOption = () => options().find((o) => o.series?.some((s) => s.name === 'your assumptions'))!;
const visitor = () => pathOption().series!.find((s) => s.name === 'your assumptions')!.data;

const slider = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const numberInput = (label: string) => screen.getByLabelText(`${label} (number)`) as HTMLInputElement;
const GPC = 'GDP per capita growth';
const POP = 'Population growth';
const AI = 'AI uplift';

async function loaded() {
  render(<Scene />);
  await screen.findByText('Illustrative arithmetic on your assumptions. It is not the forecasting model.');
}

describe('Sandbox scene', () => {
  beforeEach(() => {
    useStore.setState({ aiOverlay: 'off', scenario: 'expected', scene: 'sandbox', yearFloat: 2026 });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows loading, then the caveat, the charts, the tiles and the source line', async () => {
    stubFetch(forecast());
    render(<Scene />);
    expect(screen.getByText('Loading...')).toBeDefined();
    await screen.findByText('Illustrative arithmetic on your assumptions. It is not the forecasting model.');
    expect(options()).toHaveLength(2); // the path chart and the doubling curve
    expect(screen.getByText('Reference range: MOCK, model mock-1, generated 2026-01-01')).toBeDefined();
    expect(screen.getByTestId('tile-gpc')).toBeDefined();
  });

  it('shows an error state when the fetch fails', async () => {
    stubFetch({}, false);
    render(<Scene />);
    await screen.findByText('Error loading data.');
  });

  it('shows why the starting point cannot be built', async () => {
    stubFetch(forecast({ noPopulation: true }));
    render(<Scene />);
    await screen.findByText('No population series for AR in the expected scenario');
    expect(screen.queryAllByTestId('echart')).toHaveLength(0);
  });

  it('starts at the expected preset: 3% per-capita growth and 1% population growth', async () => {
    stubFetch(forecast());
    await loaded();
    await waitFor(() => expect(slider(GPC).value).toBe('3'));
    expect(slider(POP).value).toBe('1');
    expect(slider(AI).value).toBe('0');
    expect(visitor()[0]).toBe(100);
    expect(visitor()[4]).toBeCloseTo(100 * 1.03 ** 4, 6);
  });

  it('moving a slider updates the path and the tiles with exact numbers, and keeps the number input in sync', async () => {
    stubFetch(forecast());
    await loaded();
    fireEvent.change(slider(GPC), { target: { value: '5' } });
    expect(numberInput(GPC).value).toBe('5');
    await waitFor(() => expect(visitor()[4]).toBeCloseTo(121.550625, 6));
    expect(screen.getByTestId('tile-gpc').textContent).toContain('1.22 times');
    expect(screen.getByTestId('tile-gdp').textContent).toContain('1.26 times'); // 1.05^4 * 1.01^4
    expect(screen.getByTestId('tile-doubling').textContent).toContain('14.2 years');
    expect(screen.getByTestId('tile-doubling').textContent).toContain('rule of 70: 14.0 years');
    expect(screen.getByTestId('tile-doubling').textContent).toContain('-1.5%');

    fireEvent.change(numberInput(POP), { target: { value: '2' } });
    expect(slider(POP).value).toBe('2');
    await waitFor(() => expect(screen.getByTestId('tile-pop').textContent).toContain('1,082.4 people'));
  });

  it('clamps typed values to the slider bounds', async () => {
    stubFetch(forecast());
    await loaded();
    fireEvent.change(numberInput(GPC), { target: { value: '100' } });
    expect(numberInput(GPC).value).toBe('8');
    expect(slider(GPC).value).toBe('8');
    fireEvent.change(numberInput(GPC), { target: { value: '-50' } });
    expect(numberInput(GPC).value).toBe('-2');
    fireEvent.change(numberInput(POP), { target: { value: '9' } });
    expect(numberInput(POP).value).toBe('3');
  });

  it('ignores an empty or non-numeric number input instead of treating it as zero', async () => {
    stubFetch(forecast());
    await loaded();
    fireEvent.change(numberInput(GPC), { target: { value: '' } });
    expect(slider(GPC).value).toBe('3');
  });

  it('preset buttons set the three fields to the model central paths', async () => {
    stubFetch(forecast());
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: 'Match optimistic' }));
    expect([slider(GPC).value, slider(POP).value, slider(AI).value]).toEqual(['5', '1', '0']);
    fireEvent.click(screen.getByRole('button', { name: 'Match pessimistic' }));
    expect([slider(GPC).value, slider(POP).value]).toEqual(['1', '1']);
    fireEvent.click(screen.getByRole('button', { name: 'Match expected' }));
    expect([slider(GPC).value, slider(POP).value]).toEqual(['3', '1']);
  });

  it('Reset restores the initial state', async () => {
    stubFetch(forecast());
    await loaded();
    fireEvent.change(slider(GPC), { target: { value: '6.5' } });
    fireEvent.change(slider(POP), { target: { value: '-0.5' } });
    expect(slider(GPC).value).toBe('6.5');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect([slider(GPC).value, slider(POP).value, slider(AI).value]).toEqual(['3', '1', '0']);
  });

  it('disables the AI row while the overlay is off and enables it, with the model range switching, when it is on', async () => {
    stubFetch(forecast());
    await loaded();
    expect(slider(AI).disabled).toBe(true);
    expect(numberInput(AI).disabled).toBe(true);
    expect(screen.getByText(/Turn on the AI overlay to use the AI uplift/)).toBeDefined();
    const toggle = screen.getByRole('button', { name: 'AI overlay' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(toggle);
    expect(useStore.getState().aiOverlay).toBe('on');
    expect(screen.getByRole('button', { name: 'AI overlay' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(slider(AI).disabled).toBe(false));

    fireEvent.change(slider(AI), { target: { value: '1.5' } });
    // 3% + 1.5 points = 4.5% per year
    await waitFor(() => expect(visitor()[4]).toBeCloseTo(100 * 1.045 ** 4, 6));
    // the model range now comes from the overlay series (x 1.1)
    const lower = pathOption().series!.find((s) => s.stack === 'band')!.data;
    expect(lower[0]).toBeCloseTo(1.1 * 0.9 * 100, 6);
  });

  it('ignores the AI uplift value while the overlay is off', async () => {
    stubFetch(forecast());
    await loaded();
    useStore.setState({ aiOverlay: 'on' });
    await waitFor(() => expect(slider(AI).disabled).toBe(false));
    fireEvent.change(slider(AI), { target: { value: '2' } });
    await waitFor(() => expect(visitor()[4]).toBeCloseTo(100 * 1.05 ** 4, 6));
    useStore.setState({ aiOverlay: 'off' });
    await waitFor(() => expect(visitor()[4]).toBeCloseTo(100 * 1.03 ** 4, 6));
  });

  it('shows the position against the model range at the last year', async () => {
    stubFetch(forecast());
    await loaded();
    // model range at 2030 (off): p10 of pessimistic 100*1.01^4*0.9 = 93.65, p90 of optimistic 100*1.05^4*1.1 = 133.7
    expect(screen.getByTestId('tile-position').textContent).toContain('inside');
    fireEvent.change(slider(GPC), { target: { value: '8' } });
    await waitFor(() => expect(screen.getByTestId('tile-position').textContent).toContain('above'));
    fireEvent.change(slider(GPC), { target: { value: '-2' } });
    await waitFor(() => expect(screen.getByTestId('tile-position').textContent).toContain('below'));
  });

  it('shows "never" for the doubling time when the rate is not positive, never a number', async () => {
    stubFetch(forecast());
    await loaded();
    fireEvent.change(slider(GPC), { target: { value: '0' } });
    await waitFor(() => expect(screen.getByTestId('tile-doubling').textContent).toContain('never'));
    expect(screen.getByTestId('tile-doubling').textContent).not.toMatch(/\d+(\.\d)? years/);
  });

  it('computes the required per-capita rate for a chosen multiple, "no data" for an invalid target', async () => {
    stubFetch(forecast());
    await loaded();
    const target = screen.getByLabelText("Target multiple of today's GDP per capita by 2030") as HTMLInputElement;
    expect(target.value).toBe('2');
    expect(screen.getByTestId('tile-required').textContent).toContain('18.9% per year'); // 2^(1/4) - 1
    fireEvent.change(target, { target: { value: '4' } });
    await waitFor(() => expect(screen.getByTestId('tile-required').textContent).toContain('41.4% per year'));
    fireEvent.change(target, { target: { value: '0' } });
    await waitFor(() => expect(screen.getByTestId('tile-required').textContent).toContain('no data'));
  });

  it('shows the worked example of the rule of 70 computed with the same functions', async () => {
    stubFetch(forecast());
    await loaded();
    expect(screen.getByText('7% for 10 years multiplies by 1.97 (exact)')).toBeDefined();
    expect(screen.getByText('Rule of 70 says 10.0 years, exact is 10.2 years')).toBeDefined();
  });

  it('does not react to the global keys while a slider or a number input has the focus', async () => {
    stubFetch(forecast());
    function Harness() {
      useKeyboard();
      return <Scene />;
    }
    render(<Harness />);
    await screen.findByText('Illustrative arithmetic on your assumptions. It is not the forecasting model.');
    const snapshot = () => {
      const { scene, scenario, provinceFilterOpen, mode, playing, speed } = useStore.getState();
      return { scene, scenario, provinceFilterOpen, mode, playing, speed };
    };
    const before = snapshot();

    for (const target of [slider(GPC), numberInput(GPC), slider(POP), numberInput(AI)]) {
      target.focus();
      for (const key of ['ArrowLeft', 'ArrowRight', '1', '2', '3', 'p', 'd', '+', '-', ' ', 'Escape']) {
        fireEvent.keyDown(target, { key });
      }
    }
    expect(snapshot()).toEqual(before);

    // control: the same key on the page does reach the handler
    fireEvent.keyDown(document.body, { key: '3' });
    expect(useStore.getState().scenario).toBe('optimistic');
  });

  it('swaps each chart for a table whose missing cells read "no data"', async () => {
    stubFetch(forecast({ dropPoint: { scenario: 'optimistic', year: 2028 } }));
    await loaded();
    const toggles = screen.getAllByRole('button', { name: 'Table view' });
    expect(toggles).toHaveLength(2);

    fireEvent.click(toggles[0]!);
    const table = screen.getByRole('table', { name: 'Your path and the model range' });
    const row2028 = within(table).getByText('2028').closest('tr')!;
    const cells = Array.from(row2028.querySelectorAll('td')).map((td) => td.textContent);
    expect(cells[0]).toBe('2028');
    expect(cells[2]).toBe('no data'); // model low needs all three scenarios
    expect(cells[3]).toBe('no data'); // model high too
    expect(cells[4]).not.toBe('no data'); // the expected scenario has its point
    expect(cells[5]).toBe('no data'); // no range, no position
    expect(row2028.textContent).not.toMatch(/(^|\s)0 USD/);

    fireEvent.click(toggles[1]!);
    const doubling = screen.getByRole('table', { name: 'Doubling time by growth rate' });
    expect(doubling.querySelectorAll('tbody tr')).toHaveLength(24);
  });

  it('keeps working when a province is selected in the store', async () => {
    stubFetch(forecast());
    useStore.setState({ province: 'AR-A' });
    await loaded();
    expect(options()).toHaveLength(2);
  });
});
