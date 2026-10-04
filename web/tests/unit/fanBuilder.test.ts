import { describe, it, expect } from 'vitest';
import { buildFan } from '../../src/charts/builders/fan.js';
import { forecastView } from '../../src/scenes/forecast/selectors.js';
import { tokens, BAND_ALPHA } from '../../src/styles/tokens.js';
import type { ForecastOutput, ForecastSeries, Scenario } from '../../src/types/index.js';

interface Line {
  name: string;
  type: string;
  data: (number | null)[];
  connectNulls?: boolean;
  stack?: string;
  lineStyle?: { color?: string; width?: number; type?: string; opacity?: number };
  areaStyle?: { color?: string; opacity?: number };
  endLabel?: { show: boolean; formatter: string };
  markLine?: { data: Array<{ xAxis: string; name?: string; lineStyle?: { type?: string }; label?: { formatter?: string } }> };
}
interface FanOption {
  legend?: unknown;
  xAxis: { data: string[] };
  yAxis: { name: string };
  tooltip: { formatter: (p: Array<{ dataIndex: number }>) => string };
  series: Line[];
}

const START: Record<Scenario, number> = { pessimistic: 100, expected: 200, optimistic: 300 };

function mk(scenario: Scenario, overlay: 'on' | 'off', years: number[], scale = 1): ForecastSeries {
  return {
    indicator: 'gdp_constant_usd',
    geo: 'AR',
    scenario,
    ai_overlay: overlay,
    unit: 'bn USD',
    points: years.map((year, i) => {
      const p50 = (START[scenario] + i * 10) * scale;
      return { year, p10: p50 - 5, p50, p90: p50 + 5 };
    })
  };
}

function out(series: ForecastSeries[]): ForecastOutput {
  return {
    model_version: 't',
    generated_at: '2026-01-01',
    source: 'MOCK',
    horizon: { start_year: 2026, end_year: 2028 },
    series
  };
}

const YEARS = [2026, 2027, 2028];
const offSeries = (['pessimistic', 'expected', 'optimistic'] as Scenario[]).map((s) => mk(s, 'off', YEARS));
const onSeries = (['pessimistic', 'expected', 'optimistic'] as Scenario[]).map((s) => mk(s, 'on', YEARS, 1.1));

function build(overlay: boolean, scenario: Scenario, year = 2027, series = [...offSeries, ...onSeries]) {
  const view = forecastView(out(series), { indicator: 'gdp_constant_usd', aiOverlay: overlay });
  const result = buildFan(view, { scenario, year });
  return { ...result, option: result.option as unknown as FanOption };
}

const byName = (o: FanOption, name: string) => o.series.find((s) => s.name === name);

describe('buildFan', () => {
  it('draws one p50 line per scenario with the scenario token color and has no legend', () => {
    const { option } = build(false, 'expected');
    expect(option.legend).toBeUndefined();
    expect(option.xAxis.data).toEqual(['2026', '2027', '2028']);
    expect(option.yAxis.name).toBe('bn USD');
    for (const s of ['pessimistic', 'expected', 'optimistic'] as Scenario[]) {
      const line = byName(option, s)!;
      expect(line.type).toBe('line');
      expect(line.lineStyle?.color).toBe(tokens.scenario[s]);
      expect(line.data).toEqual([START[s], START[s] + 10, START[s] + 20]);
      expect(line.connectNulls).toBe(false);
    }
  });

  it('makes the selected scenario thicker and keeps the other widths equal', () => {
    const { option } = build(false, 'optimistic');
    expect(byName(option, 'optimistic')!.lineStyle?.width).toBe(3);
    expect(byName(option, 'pessimistic')!.lineStyle?.width).toBe(2);
    expect(byName(option, 'expected')!.lineStyle?.width).toBe(2);
  });

  it('labels the last point directly with name and value', () => {
    const { option } = build(false, 'expected');
    const label = byName(option, 'expected')!.endLabel!;
    expect(label.show).toBe(true);
    expect(label.formatter).toBe('Esperado 220 bn USD');
  });

  it('draws the p10-p90 band only for the selected scenario, as a transparent base plus a stacked span', () => {
    const { option } = build(false, 'expected');
    const base = option.series.filter((s) => s.stack === 'band');
    expect(base).toHaveLength(2);
    const lower = base[0]!;
    const upper = base[1]!;
    expect(lower.data).toEqual([195, 205, 215]); // p10 of expected
    expect(lower.lineStyle?.opacity).toBe(0);
    expect(lower.areaStyle).toBeUndefined();
    expect(upper.data).toEqual([10, 10, 10]); // p90 - p10
    expect(upper.areaStyle?.color).toBe(tokens.scenario.expected);
    expect(upper.areaStyle?.opacity).toBe(BAND_ALPHA);
    expect(upper.lineStyle?.opacity).toBe(0);

    const other = build(false, 'pessimistic').option.series.filter((s) => s.stack === 'band');
    expect(other[1]!.areaStyle?.color).toBe(tokens.scenario.pessimistic);
  });

  it('draws the playhead and the forecast-start markers at the right years', () => {
    const { option } = build(false, 'expected', 2028);
    const markers = byName(option, 'markers')!;
    expect(markers.data).toEqual([]);
    const data = markers.markLine!.data;
    expect(data[0]).toMatchObject({ xAxis: '2028', name: 'Año 2028' });
    expect(data[1]).toMatchObject({ xAxis: '2026', lineStyle: { type: 'dashed' }, label: { formatter: 'inicio del pronóstico' } });
  });

  it('omits the playhead marker when the year is not in the data instead of inventing one', () => {
    const { option } = build(false, 'expected', 2099);
    const data = byName(option, 'markers')!.markLine!.data;
    expect(data).toHaveLength(1);
    expect(data[0]?.xAxis).toBe('2026');
  });

  it('draws no reference without the overlay', () => {
    const { option } = build(false, 'expected');
    expect(byName(option, 'sin IA')).toBeUndefined();
  });

  it('with the overlay draws the off p50 of the selected scenario dashed in muted, labeled "without AI"', () => {
    const { option } = build(true, 'expected');
    const ref = byName(option, 'sin IA')!;
    expect(ref.data).toEqual([200, 210, 220]);
    expect(ref.lineStyle).toMatchObject({ type: 'dashed', color: tokens.muted, width: 1 });
    expect(ref.endLabel?.formatter).toBe('Sin IA');
    // main lines carry the on data (x1.1)
    expect(byName(option, 'expected')!.data[0]).toBeCloseTo(220, 10);
  });

  it('keeps gaps as null with connectNulls false and counts them as excluded', () => {
    const gappy = mk('expected', 'off', [2026, 2028]); // 2027 missing
    const rest = [mk('pessimistic', 'off', YEARS), mk('optimistic', 'off', YEARS)];
    const { option, excluded } = build(false, 'expected', 2027, [gappy, ...rest]);
    const line = byName(option, 'expected')!;
    expect(line.data).toEqual([200, null, 210]);
    expect(line.connectNulls).toBe(false);
    expect(excluded).toBe(1);
    // the band base and span also keep the gap
    expect(option.series.filter((s) => s.stack === 'band').map((s) => s.data[1])).toEqual([null, null]);
  });

  it('does not draw a scenario that is missing and does not fabricate it', () => {
    const { option } = build(false, 'expected', 2027, offSeries.filter((s) => s.scenario !== 'optimistic'));
    expect(byName(option, 'optimistic')).toBeUndefined();
    expect(byName(option, 'expected')).toBeDefined();
  });

  it('tooltip shows p10, p50 and p90 of the selected scenario with the 80% wording', () => {
    const { option } = build(false, 'expected');
    const text = option.tooltip.formatter([{ dataIndex: 1 }]);
    expect(text).toContain('2027');
    expect(text).toContain('p10-p90: 80% de los resultados simulados');
    expect(text).toContain('p10 205 bn USD');
    expect(text).toContain('p50 210 bn USD');
    expect(text).toContain('p90 215 bn USD');
  });

  it('tooltip says "Sin datos" for a gap, never 0', () => {
    const gappy = mk('expected', 'off', [2026, 2028]);
    const rest = [mk('pessimistic', 'off', YEARS), mk('optimistic', 'off', YEARS)];
    const { option } = build(false, 'expected', 2027, [gappy, ...rest]);
    const text = option.tooltip.formatter([{ dataIndex: 1 }]);
    expect(text).toContain('Sin datos');
    expect(text).not.toContain('p50 0');
  });

  it('summary contains the numbers of the selected scenario at the last year', () => {
    const { summary } = build(false, 'expected');
    expect(summary).toBe('Escenario esperado, 2028: PIB, mediana 220 bn USD, p10-p90 de 215 bn USD a 225 bn USD');
  });

  it('summary mentions the AI effect at the median when the overlay is on', () => {
    const { summary } = build(true, 'expected');
    expect(summary).toContain('el efecto de la IA suma 10,0% en la mediana');
  });

  it('summary says there is no data when the selected scenario is missing', () => {
    const { summary } = build(false, 'optimistic', 2027, offSeries.filter((s) => s.scenario !== 'optimistic'));
    expect(summary).toBe('Sin datos de pronóstico para el escenario seleccionado.');
  });
});
