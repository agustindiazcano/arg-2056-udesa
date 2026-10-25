import { describe, expect, it } from 'vitest';
import { chartSeries, lineOption, rankingRows } from '../../src/tour/developmentView';
import { tokens } from '../../src/styles/tokens';
import { DEVELOPMENT_INDICATORS_DATA } from '../../src/tour/developmentData';

describe('developmentView.rankingRows', () => {
  it('ranks the higher value first when higher is better (life expectancy) and marks Argentina', () => {
    const rows = rankingRows('Esperanza de vida al nacer');
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows[0]!.country).toBe('Chile');
    expect(rows.find((r) => r.country === 'Argentina')!.isArgentina).toBe(true);
    expect(rows.map((r) => r.value)).toEqual([...rows.map((r) => r.value)].sort((a, b) => b - a));
  });

  it('ranks the lower value first when lower is better (infant mortality, Gini)', () => {
    for (const key of ['Mortalidad infantil', 'Índice de Gini']) {
      const values = rankingRows(key).map((r) => r.value);
      expect(values, key).toEqual([...values].sort((a, b) => a - b));
    }
  });

  it('has a ranking for every indicator of the slide', () => {
    for (const key of Object.keys(DEVELOPMENT_INDICATORS_DATA)) expect(rankingRows(key).length, key).toBeGreaterThan(1);
  });
});

describe('developmentView.chartSeries', () => {
  it('draws Argentina and its peers year by year where the World Bank has the yearly series', () => {
    const c = chartSeries('Esperanza de vida al nacer');
    expect(c.years.at(-1)).toBe(2024);
    expect(c.years).toHaveLength(2024 - 2005 + 1);
    expect(c.series[0]!.name).toBe('Argentina');
    expect(c.series.length).toBeGreaterThan(5);
    c.series.forEach((s) => expect(s.values).toHaveLength(c.years.length));
  });

  it('falls back to the series of Argentina alone for an indicator with no yearly series of the peers', () => {
    const c = chartSeries('Resultados PISA');
    expect(c.series.map((s) => s.name)).toEqual(['Argentina']);
    expect(c.years.length).toBe(DEVELOPMENT_INDICATORS_DATA['Resultados PISA']!.timeSeries.length);
  });
});

describe('developmentView.chartSeries colors', () => {
  it('gives every peer its own color from the validated palette and Argentina the ink color', () => {
    const c = chartSeries('Esperanza de vida al nacer');
    const colors = c.series.map((s) => s.color);
    expect(new Set(colors).size).toBe(colors.length);
    expect(c.series[0]!.color).toBe(tokens.ink);
    c.series.slice(1).forEach((s) => expect(tokens.categorical.slice(0, 8)).toContain(s.color));
  });

  it('keeps the color of a country when the indicator changes', () => {
    const a = chartSeries('Esperanza de vida al nacer').series;
    const b = chartSeries('Mortalidad infantil').series;
    for (const s of a) {
      const same = b.find((o) => o.name === s.name);
      if (same) expect(same.color, s.name).toBe(s.color);
    }
  });
});

describe('developmentView.lineOption', () => {
  it('fits the value axis to the data instead of starting at zero, and draws Argentina on top and thicker', () => {
    const c = chartSeries('Esperanza de vida al nacer');
    const option = lineOption(c, { unit: 'años', summary: 'resumen' });
    expect((option.yAxis as { scale?: boolean }).scale).toBe(true);
    const widths = (option.series as Array<{ name: string; lineStyle: { width: number }; z: number }>).map((s) => [s.name, s.lineStyle.width, s.z] as const);
    const ar = widths.find((w) => w[0] === 'Argentina')!;
    for (const w of widths.filter((x) => x[0] !== 'Argentina')) {
      expect(ar[1]).toBeGreaterThan(w[1]);
      expect(ar[2]).toBeGreaterThan(w[2]);
    }
  });

  it('labels the end of the line of Argentina only', () => {
    const c = chartSeries('Esperanza de vida al nacer');
    const option = lineOption(c, { unit: 'años', summary: 'resumen' });
    const labelled = (option.series as Array<{ name: string; endLabel?: { show: boolean } }>).filter((s) => s.endLabel?.show).map((s) => s.name);
    expect(labelled).toEqual(['Argentina']);
  });
});
