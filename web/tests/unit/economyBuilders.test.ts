import { describe, it, expect } from 'vitest';
import { buildLongRun } from '../../src/charts/builders/longRun.js';
import { buildRankBars } from '../../src/charts/builders/rankBars.js';
import { buildRankHistory } from '../../src/charts/builders/rankHistory.js';
import { ordinal } from '../../src/charts/format.js';
import type { Era } from '../../src/content/eras.js';
import type { LongRunView, RankPoint, RankRow } from '../../src/scenes/economy/selectors.js';
import { tokens } from '../../src/styles/tokens.js';

interface Line {
  name: string;
  type: string;
  data: Array<number | null>;
  connectNulls?: boolean;
  lineStyle?: { color: string; width: number };
  endLabel?: { show: boolean; formatter: string };
  step?: string;
  markLine?: { data: Array<{ xAxis: string; name?: string }> };
  markArea?: {
    itemStyle: { color: string; opacity: number };
    data: Array<[{ name: string; xAxis: string }, { xAxis: string }]>;
  };
}
interface LineOption {
  legend?: unknown;
  xAxis: { data: string[] };
  yAxis: { name?: string; inverse?: boolean; min?: number; max?: number; minInterval?: number };
  tooltip: { formatter: (p: Array<{ dataIndex: number }>) => string };
  series: Line[];
}
interface BarOption {
  yAxis: { inverse: boolean; data: string[] };
  xAxis: { name: string };
  series: Array<{ type: string; data: Array<{ value: number; itemStyle: { color: string } }> }>;
}

const point = (year: number, value: number | null) => ({ year, value });

const level: LongRunView = {
  years: [1900, 1901, 1902],
  unit: 'USD',
  mode: 'level',
  baseYear: null,
  indexUnavailable: false,
  series: [
    { country: 'ARG', points: [point(1900, 100), point(1901, null), point(1902, 150)] },
    { country: 'BRA', points: [point(1900, 50), point(1901, 60), point(1902, 70)] },
    { country: 'CHL', points: [point(1900, null), point(1901, 200), point(1902, 210)] }
  ]
};

const eras = (list: Array<[number, number]>): Era[] =>
  list.map(([startYear, endYear], i) => ({
    id: `e${i}`,
    startYear,
    endYear,
    label: `Era ${i}`,
    source_id: null,
    placeholder: true
  }));

function longRun(over: { view?: LongRunView; hovered?: string | null; year?: number; eras?: Era[] } = {}) {
  const r = buildLongRun(over.view ?? level, {
    highlight: 'ARG',
    year: over.year ?? 1901,
    eras: over.eras ?? [],
    hovered: over.hovered ?? null,
    indicatorLabel: 'GDP per capita'
  });
  return { ...r, option: r.option as unknown as LineOption };
}
const line = (o: LineOption, name: string) => o.series.find((s) => s.name === name)!;

describe('ordinal', () => {
  it('formats 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st, 22nd, 101st, 111th', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st', '111th'
    ]);
  });
});

describe('buildLongRun', () => {
  it('draws the home country in ink and thick, peers in muted and thin, with no legend', () => {
    const { option } = longRun();
    expect(option.legend).toBeUndefined();
    expect(line(option, 'ARG').lineStyle).toEqual({ color: tokens.ink, width: 3 });
    expect(line(option, 'BRA').lineStyle).toEqual({ color: tokens.muted, width: 1 });
    expect(line(option, 'CHL').lineStyle).toEqual({ color: tokens.muted, width: 1 });
  });

  it('draws a hovered peer in ink-2', () => {
    const { option } = longRun({ hovered: 'BRA' });
    expect(line(option, 'BRA').lineStyle!.color).toBe(tokens.ink2);
    expect(line(option, 'CHL').lineStyle!.color).toBe(tokens.muted);
    expect(line(option, 'ARG').lineStyle!.color).toBe(tokens.ink);
  });

  it('draws the home country last, on top of the peers', () => {
    expect(longRun().option.series.filter((s) => s.name !== 'markers').map((s) => s.name)).toEqual(['BRA', 'CHL', 'ARG']);
  });

  it('keeps null as null with connectNulls false and counts the gaps as excluded', () => {
    const { option, excluded } = longRun();
    expect(line(option, 'ARG').data).toEqual([100, null, 150]);
    expect(line(option, 'ARG').connectNulls).toBe(false);
    expect(line(option, 'CHL').data).toEqual([null, 200, 210]);
    expect(excluded).toBe(2);
  });

  it('labels the end of each line with the country and puts the years on the x axis', () => {
    const { option } = longRun();
    expect(line(option, 'BRA').endLabel).toMatchObject({ show: true, formatter: 'BRA' });
    expect(option.xAxis.data).toEqual(['1900', '1901', '1902']);
  });

  it('marks the playhead year, and omits the marker when the year is not in the data', () => {
    const marker = (o: LineOption) => line(o, 'markers').markLine?.data ?? [];
    expect(marker(longRun({ year: 1902 }).option)).toEqual([expect.objectContaining({ xAxis: '1902', name: 'Year 1902' })]);
    expect(marker(longRun({ year: 1800 }).option)).toEqual([]);
  });

  it('draws one era band per era inside the data, clamped to it, in the grid token at low opacity', () => {
    const { option } = longRun({ eras: eras([[1850, 1901], [1902, 2000], [1700, 1800]]) });
    const area = line(option, 'markers').markArea!;
    expect(area.data).toHaveLength(2); // the third era is outside the data
    expect(area.data[0]).toEqual([{ name: 'Era 0', xAxis: '1900' }, { xAxis: '1901' }]);
    expect(area.data[1]).toEqual([{ name: 'Era 1', xAxis: '1902' }, { xAxis: '1902' }]);
    expect(area.itemStyle.color).toBe(tokens.grid);
    expect(area.itemStyle.opacity).toBeLessThan(0.6);
    expect(area.itemStyle.opacity).toBeGreaterThan(0);
  });

  it('draws no era area when there are no eras', () => {
    expect(line(longRun().option, 'markers').markArea).toBeUndefined();
  });

  it('puts the unit in the y axis title in level mode and the base year in index mode', () => {
    expect(longRun().option.yAxis.name).toBe('USD');
    const index: LongRunView = {
      ...level,
      mode: 'index',
      baseYear: 1901,
      unit: 'index',
      series: level.series.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p, value: p.value === null ? null : p.value / 2 })) }))
    };
    expect(longRun({ view: index }).option.yAxis.name).toBe('Index (base year = 1901)');
  });

  it('formats the tooltip for all series at the hovered year, "No data" for null', () => {
    const text = longRun().option.tooltip.formatter([{ dataIndex: 1 }]);
    expect(text).toBe('1901<br/>ARG: No data<br/>BRA: 60 USD<br/>CHL: 200 USD');
  });

  it('summarises the home country from the numbers in the view', () => {
    expect(longRun().summary).toBe('ARG GDP per capita: 100 USD in 1900 to 150 USD in 1902, compared with 2 peers');
  });

  it('summarises an index view with its base year', () => {
    const index: LongRunView = { ...level, mode: 'index', baseYear: 1901, unit: 'index' };
    expect(longRun({ view: index }).summary).toBe(
      'ARG GDP per capita (index, base year 1901 = 100): 100 index in 1900 to 150 index in 1902, compared with 2 peers'
    );
  });

  it('says there is no data when the home country has none', () => {
    const empty: LongRunView = { ...level, series: [{ country: 'ARG', points: [point(1900, null)] }] };
    expect(longRun({ view: empty }).summary).toBe('No GDP per capita data for ARG.');
  });
});

describe('buildRankBars', () => {
  const rows: RankRow[] = [
    { geo: 'CHL', value: 210, rank: 1, of: 3 },
    { geo: 'ARG', value: 150, rank: 2, of: 3 },
    { geo: 'BRA', value: 70, rank: 3, of: 3 }
  ];
  const bars = (missing: string[] = [], rowsIn = rows) => {
    const r = buildRankBars(rowsIn, { highlight: 'ARG', missing, unit: 'USD', year: 1902, indicatorLabel: 'GDP per capita' });
    return { ...r, option: r.option as unknown as BarOption };
  };

  it('lists countries in rank order with rank and name, rank 1 on top', () => {
    const { option } = bars();
    expect(option.yAxis.inverse).toBe(true);
    expect(option.yAxis.data).toEqual(['1. CHL', '2. ARG', '3. BRA']);
    expect(option.series[0]!.data.map((d) => d.value)).toEqual([210, 150, 70]);
    expect(option.xAxis.name).toBe('USD');
  });

  it('colors the home country with the blue token and the others with muted', () => {
    const colors = bars().option.series[0]!.data.map((d) => d.itemStyle.color);
    expect(colors).toEqual([tokens.muted, tokens.blue, tokens.muted]);
  });

  it('does not draw missing countries and mentions them in the summary', () => {
    const { option, summary, excluded } = bars(['COL', 'PER']);
    expect(option.yAxis.data).toHaveLength(3);
    expect(excluded).toBe(2);
    expect(summary).toBe('GDP per capita in 1902: CHL leads with 210 USD; ARG ranks 2nd of 3; no data for COL, PER');
  });

  it('summarises without the missing clause when none is missing', () => {
    expect(bars().summary).toBe('GDP per capita in 1902: CHL leads with 210 USD; ARG ranks 2nd of 3');
  });

  it('says so when no country has a value', () => {
    expect(bars(['ARG'], []).summary).toBe('No GDP per capita data in 1902; no data for ARG');
  });

  it('copes with the home country being missing', () => {
    const noHome = rows.filter((r) => r.geo !== 'ARG').map((r, i) => ({ ...r, rank: i + 1, of: 2 }));
    expect(bars(['ARG'], noHome).summary).toBe('GDP per capita in 1902: CHL leads with 210 USD; no data for ARG');
  });
});

describe('buildRankHistory', () => {
  const history: RankPoint[] = [
    { year: 1900, rank: 3, of: 10 },
    { year: 1901, rank: null, of: null },
    { year: 1902, rank: 8, of: 10 }
  ];
  const hist = (h = history, year = 1901) => {
    const r = buildRankHistory(h, { year, highlight: 'ARG', indicatorLabel: 'GDP per capita' });
    return { ...r, option: r.option as unknown as LineOption };
  };

  it('inverts the y axis so rank 1 is on top, with integer ticks from 1 to the number of countries', () => {
    const { option } = hist();
    expect(option.yAxis.inverse).toBe(true);
    expect(option.yAxis.min).toBe(1);
    expect(option.yAxis.max).toBe(10);
    expect(option.yAxis.minInterval).toBe(1);
  });

  it('draws a step line with a gap for a null rank', () => {
    const { option, excluded } = hist();
    const rank = line(option, 'rank');
    expect(rank.step).toBe('end');
    expect(rank.data).toEqual([3, null, 8]);
    expect(rank.connectNulls).toBe(false);
    expect(rank.lineStyle).toMatchObject({ color: tokens.ink });
    expect(excluded).toBe(1);
  });

  it('marks the playhead year', () => {
    expect(line(hist().option, 'markers').markLine!.data[0]).toMatchObject({ xAxis: '1901', name: 'Year 1901' });
    expect(line(hist(history, 1800).option, 'markers').markLine?.data ?? []).toEqual([]);
  });

  it('shows "rank n of N" in the tooltip and "No data" for a gap', () => {
    const { option } = hist();
    expect(option.tooltip.formatter([{ dataIndex: 0 }])).toBe('1900<br/>rank 3 of 10');
    expect(option.tooltip.formatter([{ dataIndex: 1 }])).toBe('1901<br/>No data');
  });

  it('summarises the first and last known ranks', () => {
    expect(hist().summary).toBe('ARG ranks 3rd of 10 in 1900 and 8th of 10 in 1902 in GDP per capita');
  });

  it('summarises a single known rank and the case with none', () => {
    expect(hist([{ year: 1900, rank: 1, of: 4 }]).summary).toBe('ARG ranks 1st of 4 in 1900 in GDP per capita');
    expect(hist([{ year: 1900, rank: null, of: null }]).summary).toBe('No rank data for ARG.');
  });
});
