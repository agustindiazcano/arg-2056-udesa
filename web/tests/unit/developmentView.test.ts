import { describe, expect, it } from 'vitest';
import { chartSeries, rankingRows } from '../../src/tour/developmentView';
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
