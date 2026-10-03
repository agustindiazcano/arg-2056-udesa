import { describe, it, expect } from 'vitest';
import { buildDoublingCurve } from '../../src/charts/builders/doublingCurve.js';
import { buildSandboxPath } from '../../src/charts/builders/sandboxPath.js';
import type { PathView } from '../../src/scenes/sandbox/selectors.js';
import { BAND_ALPHA, tokens } from '../../src/styles/tokens.js';

interface Line {
  name: string;
  type: string;
  data: Array<number | null | [number, number]>;
  stack?: string;
  connectNulls?: boolean;
  lineStyle?: { color?: string; width?: number; type?: string; opacity?: number };
  areaStyle?: { color: string; opacity: number };
  endLabel?: { show: boolean; formatter: string };
  markLine?: { data: Array<{ xAxis: string | number; name?: string }> };
}
interface Option {
  legend?: unknown;
  xAxis: { name?: string; type?: string; min?: number; max?: number };
  yAxis: { name?: string };
  tooltip: { formatter: (p: Array<{ dataIndex?: number; value?: [number, number] }>) => string };
  series: Line[];
}

const view: PathView = {
  years: [2026, 2027, 2028, 2029],
  visitor: [100, 105, 110, 116],
  lower: [80, 85, 70, null],
  upper: [120, 140, 135, null],
  expected: [100, 110, 121, null],
  unit: 'USD'
};

function path(over: { view?: PathView; year?: number } = {}) {
  const r = buildSandboxPath(over.view ?? view, { year: over.year ?? 2027, effectivePct: 2.5 });
  return { ...r, option: r.option as unknown as Option };
}
const line = (o: Option, name: string) => o.series.find((s) => s.name === name)!;

describe('buildSandboxPath', () => {
  it('draws the visitor path as a thick ink line labeled "your assumptions", with no legend', () => {
    const { option } = path();
    expect(option.legend).toBeUndefined();
    const visitor = line(option, 'your assumptions');
    expect(visitor.lineStyle).toMatchObject({ color: tokens.ink, width: 3 });
    expect(visitor.data).toEqual([100, 105, 110, 116]);
    expect(visitor.endLabel).toMatchObject({ show: true, formatter: 'your assumptions' });
  });

  it('draws the model range as a transparent base plus a stacked span with BAND_ALPHA, labeled directly', () => {
    const { option } = path();
    const stacked = option.series.filter((s) => s.stack === 'band');
    expect(stacked).toHaveLength(2);
    expect(stacked[0]!.data).toEqual([80, 85, 70, null]);
    expect(stacked[0]!.lineStyle!.opacity).toBe(0);
    expect(stacked[0]!.areaStyle).toBeUndefined();
    expect(stacked[1]!.name).toBe('model range (all scenarios, p10 to p90)');
    expect(stacked[1]!.data).toEqual([40, 55, 65, null]); // upper - lower
    expect(stacked[1]!.areaStyle).toEqual({ color: tokens.blue, opacity: BAND_ALPHA });
    expect(stacked[1]!.endLabel!.formatter).toBe('model range (all scenarios, p10 to p90)');
  });

  it('draws the model central path as a dashed muted line labeled "model, expected"', () => {
    const expected = line(path().option, 'model, expected');
    expect(expected.lineStyle).toMatchObject({ color: tokens.muted, type: 'dashed' });
    expect(expected.data).toEqual([100, 110, 121, null]);
    expect(expected.endLabel!.formatter).toBe('model, expected');
  });

  it('keeps null bounds as gaps with connectNulls false and counts them as excluded', () => {
    const { option, excluded } = path();
    for (const s of option.series.filter((x) => x.name !== 'markers')) expect(s.connectNulls).toBe(false);
    expect(excluded).toBe(1);
  });

  it('marks the playhead year and omits the marker when the year is not in the data', () => {
    const marker = (o: Option) => line(o, 'markers').markLine?.data ?? [];
    expect(marker(path({ year: 2028 }).option)).toEqual([expect.objectContaining({ xAxis: '2028', name: 'Year 2028' })]);
    expect(marker(path({ year: 1900 }).option)).toEqual([]);
  });

  it('puts the unit in the y axis title', () => {
    expect(path().option.yAxis.name).toBe('USD');
  });

  it('shows the visitor value, the range and the position in the tooltip', () => {
    const { option } = path();
    expect(option.tooltip.formatter([{ dataIndex: 0 }])).toBe(
      '2026<br/>Your assumptions: 100 USD<br/>Model range: 80 USD to 120 USD<br/>Position: inside'
    );
    expect(option.tooltip.formatter([{ dataIndex: 3 }])).toBe(
      '2029<br/>Your assumptions: 116 USD<br/>Model range: no data<br/>Position: no data'
    );
    const above: PathView = { ...view, visitor: [100, 150, 110, 116] };
    expect(path({ view: above }).option.tooltip.formatter([{ dataIndex: 1 }])).toContain('Position: above');
    const below: PathView = { ...view, visitor: [100, 105, 60, 116] };
    expect(path({ view: below }).option.tooltip.formatter([{ dataIndex: 2 }])).toContain('Position: below');
  });

  it('summarises the multiple and the position at the last year', () => {
    expect(path().summary).toBe(
      'At 2.5% per-capita growth, GDP per capita in 2029 is 1.2 times its 2026 level; the model range is not available for that year'
    );
    const withRange: PathView = { ...view, lower: [80, 85, 70, 90], upper: [120, 140, 135, 130] };
    expect(path({ view: withRange }).summary).toBe(
      'At 2.5% per-capita growth, GDP per capita in 2029 is 1.2 times its 2026 level and sits inside the model range'
    );
  });

  it('does not call the visitor path a forecast anywhere', () => {
    const text = JSON.stringify(path().option) + path().summary;
    expect(text.toLowerCase()).not.toContain('forecast');
  });

  it('copes with an empty view', () => {
    const empty: PathView = { years: [], visitor: [], lower: [], upper: [], expected: [], unit: '' };
    expect(path({ view: empty }).summary).toBe('No path to show.');
  });
});

function curve(ratePct: number) {
  const r = buildDoublingCurve({ ratePct });
  return { ...r, option: r.option as unknown as Option };
}

describe('buildDoublingCurve', () => {
  const exact = (o: Option) => line(o, 'exact').data as Array<[number, number]>;
  const approx = (o: Option) => line(o, 'rule of 70').data as Array<[number, number]>;
  const at = (data: Array<[number, number]>, rate: number) => data.find((p) => p[0] === rate)![1];

  it('plots rates from 0.5 to 12 in steps of 0.5 for both lines', () => {
    const { option } = curve(7);
    expect(exact(option)).toHaveLength(24);
    expect(exact(option)[0]![0]).toBe(0.5);
    expect(exact(option)[23]![0]).toBe(12);
    expect(approx(option).map((p) => p[0])).toEqual(exact(option).map((p) => p[0]));
  });

  it('has the exact doubling time and the rule of 70 at hand-computed points', () => {
    const { option } = curve(7);
    expect(at(exact(option), 7)).toBeCloseTo(10.244768, 6);
    expect(at(exact(option), 10)).toBeCloseTo(7.272541, 6);
    expect(at(approx(option), 7)).toBe(10);
    expect(at(approx(option), 10)).toBe(7);
  });

  it('draws the exact line in ink and the rule of 70 dashed in muted, with direct labels and no legend', () => {
    const { option } = curve(7);
    expect(option.legend).toBeUndefined();
    expect(line(option, 'exact').lineStyle).toMatchObject({ color: tokens.ink });
    expect(line(option, 'rule of 70').lineStyle).toMatchObject({ color: tokens.muted, type: 'dashed' });
    expect(line(option, 'exact').endLabel!.formatter).toBe('exact');
    expect(line(option, 'rule of 70').endLabel!.formatter).toBe('rule of 70');
    expect(option.xAxis.type).toBe('value');
    expect(option.xAxis.name).toBe('Growth rate (% per year)');
    expect(option.yAxis.name).toBe('Years to double');
  });

  it('marks the rate only when it is inside the plotted range', () => {
    const marker = (rate: number) => line(curve(rate).option, 'markers').markLine?.data ?? [];
    expect(marker(7)).toEqual([expect.objectContaining({ xAxis: 7 })]);
    expect(marker(0.5)).toHaveLength(1);
    expect(marker(12)).toHaveLength(1);
    for (const outside of [0.4, 12.5, 0, -1, Number.NaN]) expect(marker(outside)).toEqual([]);
  });

  it('shows both values in the tooltip', () => {
    const text = curve(7).option.tooltip.formatter([{ value: [7, 10.244768] }]);
    expect(text).toBe('7% per year<br/>exact: 10.2 years<br/>rule of 70: 10.0 years');
  });

  it('summarises the exact time, the rule of 70 and their difference', () => {
    expect(curve(7).summary).toBe(
      'At 7.0% growth the exact doubling time is 10.2 years and the rule of 70 gives 10.0 years (error -2.4%)'
    );
    expect(curve(1).summary).toContain('(error +0.5%)');
  });

  it('says the level never doubles when the rate is not positive', () => {
    expect(curve(0).summary).toBe('With a growth rate of 0.0% the level never doubles');
    expect(curve(-2).summary).toBe('With a growth rate of -2.0% the level never doubles');
  });
});
