import { describe, expect, it } from 'vitest';
import { buildFollowedLines } from '../../src/charts/builders/tourCharts';

const years = [2000, 2001, 2002, 2003];
const lines = [
  { name: 'Argentina', values: [5, 6, 7, 8], color: 'white', main: true },
  { name: 'Brasil', values: [50, 60, 70, 80], color: 'green' }
];
const frame = { year: 2001.5, xMin: 2000, xMax: 2003, yMax: 100, visibleCount: 2 };

describe('buildFollowedLines', () => {
  it('draws each line up to the year reached, with a head partway between two years, and a dot at each head', () => {
    const { option } = buildFollowedLines(years, lines, frame, { unit: 'u', summary: 's' });
    const s = option.series as Array<{ name: string; data: Array<[number, number]> }>;
    expect(s).toHaveLength(4);
    expect(s[0]!.data).toEqual([[2000, 5], [2001, 6], [2001.5, 6.5]]);
    expect(s[1]!.data).toEqual([[2001.5, 6.5]]);
    expect(s[2]!.name).toBe('Brasil');
    expect(s[2]!.data.at(-1)).toEqual([2001.5, 65]);
  });

  it('uses a linear axis from 0 by default and a logarithmic one, floored at the power of ten under the smallest value, with log', () => {
    const lin = buildFollowedLines(years, lines, frame, { unit: 'u', summary: 's' }).option.yAxis;
    expect(lin).toMatchObject({ type: 'value', min: 0, max: 100 });
    const log = buildFollowedLines(years, lines, frame, { unit: 'u', summary: 's', log: true }).option.yAxis;
    expect(log).toMatchObject({ type: 'log', min: 1, max: 100 });
  });

  it('makes the line of the home country thicker', () => {
    const s = buildFollowedLines(years, lines, frame, { unit: 'u', summary: 's' }).option.series as Array<{ lineStyle: { width: number } }>;
    expect(s[0]!.lineStyle.width).toBeGreaterThan(s[2]!.lineStyle.width);
  });

  it('puts the flag and the place at the tip of a line, and not its name', () => {
    const tipped = [
      { ...lines[0]!, tip: { flag: '/flags/ar.svg', rank: 22 } },
      { ...lines[1]!, tip: { flag: '/flags/br.svg', rank: null } }
    ];
    const s = buildFollowedLines(years, tipped, frame, { unit: 'u', summary: 's' }).option.series as Array<{
      label?: { show: boolean; formatter: string; rich: Record<string, { backgroundColor?: { image: string } }> };
    }>;
    const head = s[1]!.label!;
    expect(head.show).toBe(true);
    expect(head.formatter).toContain('22');
    expect(head.formatter).not.toContain('Argentina');
    expect(head.rich.f!.backgroundColor!.image).toBe('/flags/ar.svg');
    // without a place only the flag
    expect(s[3]!.label!.formatter).not.toMatch(/\d/);
    // the line itself carries no label
    expect(s[0]!.label).toBeUndefined();
  });

  it('adds a dashed growth line on a second axis at the right, in %, drawn up to the year reached, with a gap kept as a gap', () => {
    const growth = { name: 'Región', values: [null, 2, -1, 3] as Array<number | null>, color: 'gold' };
    const o = buildFollowedLines(years, lines, frame, { unit: 'u', summary: 's', growth }).option;
    const axes = o.yAxis as unknown as Array<{ position?: string; min: number; max: number; splitLine?: { show: boolean } }>;
    expect(Array.isArray(axes)).toBe(true);
    expect(axes).toHaveLength(2);
    expect(axes[1]!.position).toBe('right');
    expect(axes[1]!.min).toBeLessThanOrEqual(-1);
    expect(axes[1]!.max).toBeGreaterThanOrEqual(3);
    expect(axes[1]!.splitLine?.show).toBe(false);
    const g = (o.series as Array<{ name: string; yAxisIndex?: number; lineStyle: { type?: string }; data: Array<[number, number | null]> }>).find((x) => x.name === 'Región')!;
    expect(g.yAxisIndex).toBe(1);
    expect(g.lineStyle.type).toBe('dashed');
    expect(g.data.map((d) => d[0])).toEqual([2000, 2001, 2001.5]);
    expect(g.data[0]![1]).toBeNull();
  });

  it('keeps the single left axis when there is no growth line', () => {
    expect(Array.isArray(buildFollowedLines(years, lines, frame, { unit: 'u', summary: 's' }).option.yAxis)).toBe(false);
  });
});

