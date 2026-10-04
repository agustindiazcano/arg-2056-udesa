import { describe, it, expect } from 'vitest';
import { buildRanking } from '../../src/charts/builders/ranking.js';
import { tokens } from '../../src/styles/tokens.js';
import type { RankRow } from '../../src/scenes/forecast/selectors.js';

interface RankOption {
  yAxis: { type: string; inverse: boolean; data: string[] };
  xAxis: { name: string };
  series: Array<{
    name: string;
    type: string;
    data: Array<{ value: number; itemStyle: { color: string; borderRadius: number[] }; label: { formatter: string } } | number[]>;
    label?: { show: boolean; position: string };
  }>;
}

const rows: RankRow[] = [
  { geo: 'AR-B', name: 'Buenos Aires', p10: 27, p50: 30, p90: 33, rank: 1, baseRank: 4, rankChange: 3 },
  { geo: 'AR-C', name: 'CABA', p10: 18, p50: 20, p90: 22, rank: 2, baseRank: 1, rankChange: -1 },
  { geo: 'AR-A', name: 'Salta', p10: 9, p50: 10, p90: 11, rank: 3, baseRank: 3, rankChange: 0 },
  { geo: 'AR-D', name: 'San Luis', p10: 4, p50: 5, p90: 6, rank: 4, baseRank: null, rankChange: null }
];

function build(opts: { scenario: 'expected' | 'pessimistic'; highlight?: RankRow['geo'] | null } = { scenario: 'expected' }) {
  const r = buildRanking(rows, { unit: 't', ...opts });
  return { ...r, option: r.option as unknown as RankOption };
}

describe('buildRanking', () => {
  it('lists provinces in rank order, rank 1 on top', () => {
    const { option } = build();
    expect(option.yAxis.type).toBe('category');
    expect(option.yAxis.inverse).toBe(true);
    expect(option.yAxis.data[0]).toContain('Buenos Aires');
    expect(option.yAxis.data[3]).toBe('San Luis');
    const bars = option.series.find((s) => s.name === 'p50')!;
    expect(bars.type).toBe('bar');
    expect(bars.data.map((d) => (d as { value: number }).value)).toEqual([30, 20, 10, 5]);
  });

  it('colors every bar with the scenario token and rounds the data end by 4px', () => {
    const { option } = build({ scenario: 'pessimistic' });
    const bars = option.series.find((s) => s.name === 'p50')!;
    for (const d of bars.data as Array<{ itemStyle: { color: string; borderRadius: number[] } }>) {
      expect(d.itemStyle.color).toBe(tokens.scenario.pessimistic);
      expect(d.itemStyle.borderRadius).toEqual([0, 4, 4, 0]);
    }
  });

  it('puts the value label at the bar end, formatted with the unit', () => {
    const { option } = build();
    const bars = option.series.find((s) => s.name === 'p50')!;
    expect(bars.label).toMatchObject({ show: true, position: 'right' });
    expect((bars.data[0] as { label: { formatter: string } }).label.formatter).toBe('30 t');
  });

  it('carries p10 and p90 in a whisker series aligned with the bars', () => {
    const { option } = build();
    const whisker = option.series.find((s) => s.name === 'p10-p90')!;
    expect(whisker.type).toBe('custom');
    expect(whisker.data).toEqual([
      [27, 33, 0],
      [18, 22, 1],
      [9, 11, 2],
      [4, 6, 3]
    ]);
  });

  it('marks rank changes in the category label with text, never color alone', () => {
    const { option } = build();
    expect(option.yAxis.data).toEqual(['Buenos Aires (sube 3)', 'CABA (baja 1)', 'Salta', 'San Luis']);
  });

  it('highlights one province and mutes the others', () => {
    const { option } = build({ scenario: 'expected', highlight: 'AR-C' });
    const bars = option.series.find((s) => s.name === 'p50')!;
    const colors = (bars.data as Array<{ itemStyle: { color: string } }>).map((d) => d.itemStyle.color);
    expect(colors).toEqual([tokens.muted, tokens.scenario.expected, tokens.muted, tokens.muted]);
  });

  it('puts the unit on the value axis', () => {
    expect(build().option.xAxis.name).toBe('t');
  });

  it('summary names the leader with its numbers', () => {
    expect(build().summary).toBe('Escenario esperado: Buenos Aires lidera con mediana 30 t (p10-p90 de 27 t a 33 t)');
  });

  it('returns an empty chart, excluded passthrough and an honest summary with no rows', () => {
    const r = buildRanking([], { scenario: 'expected', unit: 't', excluded: 5 });
    expect((r.option as unknown as RankOption).series.find((s) => s.name === 'p50')!.data).toEqual([]);
    expect(r.excluded).toBe(5);
    expect(r.summary).toBe('No hay series provinciales para esta selección.');
  });
});
