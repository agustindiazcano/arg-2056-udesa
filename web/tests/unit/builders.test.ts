import { describe, it, expect } from 'vitest';
import { buildTreemap } from '../../src/charts/builders/treemap.js';
import { buildProvinceBars } from '../../src/charts/builders/provinceBars.js';
import { buildTrend } from '../../src/charts/builders/trend.js';
import { buildPie } from '../../src/charts/builders/pie.js';
import { buildColumns, buildShares } from '../../src/charts/builders/tourCharts.js';
import { tokens } from '../../src/styles/tokens.js';
import type { CompositionRecord, ResourceProductionRecord } from '../../src/types/index.js';

describe('Chart Builders', () => {
  describe('buildTreemap', () => {
    const records: CompositionRecord[] = [
      { kind: 'exports_by_product', year: 2020, group: 'A', category: 'a1', label: 'a1', value_usd: 100, source: 'S', retrieved_at: '2026' },
      { kind: 'exports_by_product', year: 2020, group: 'A', category: 'a2', label: 'a2', value_usd: 50, source: 'S', retrieved_at: '2026' },
      { kind: 'exports_by_product', year: 2020, group: 'B', category: 'b1', label: 'b1', value_usd: 200, source: 'S', retrieved_at: '2026' },
      { kind: 'exports_by_product', year: 2020, group: 'C', category: 'c1', label: 'c1', value_usd: null, source: 'S', retrieved_at: '2026' },
    ];

    it('preserves totals, excludes nulls, counts them, orders correctly', () => {
      const { option, excluded, summary } = buildTreemap(records);
      expect(excluded).toBe(1);
      
      const series = option.series as Array<{ data: Array<{ name: string; children: Array<{ name: string; itemStyle: { color: string } }> }> }>;
      const groups = series[0]?.data || [];
      expect(groups).toHaveLength(2);
      expect(groups[0]?.name).toBe('B'); // 200 is largest
      expect(groups[1]?.name).toBe('A'); // 150
      
      expect(groups[1]?.children[0]?.name).toBe('a1'); // 100 > 50
      expect(groups[1]?.children[0]?.itemStyle.color).toBe(tokens.blue);
      
      expect(summary).toBe('Mapa de árbol con 2 grupos. El mayor es B con 57,1% del total.');
    });

    it('labels tiles with the share in es-AR and says so when there is nothing to draw', () => {
      const { option } = buildTreemap(records);
      const series = option.series as Array<{ data: Array<{ children: Array<{ label: { formatter: string } }> }> }>;
      expect(series[0]?.data[0]?.children[0]?.label.formatter).toBe('{b}\n57,1%');
      expect(buildTreemap([]).summary).toBe('Sin datos disponibles.');
    });

    it('highlights group correctly', () => {
      const { option } = buildTreemap(records, { highlightGroup: 'A' });
      const series = option.series as Array<{ data: Array<{ name: string; children: Array<{ name: string; itemStyle: { color: string } }> }> }>;
      const groups = series[0]?.data || [];
      
      // B is not highlighted
      expect(groups[0]?.children[0]?.itemStyle.color).toBe(tokens.muted);
      // A is highlighted
      expect(groups[1]?.children[0]?.itemStyle.color).toBe(tokens.blue);
    });
  });

  describe('buildProvinceBars', () => {
    const records: ResourceProductionRecord[] = [
      { resource: 'lithium', geo: 'AR', year: 2020, value: 1000, unit: 't', source: 'S', retrieved_at: '2026' }, // AR excluded
      { resource: 'lithium', geo: 'AR-A', year: 2020, value: 500, unit: 't', source: 'S', retrieved_at: '2026' },
      { resource: 'lithium', geo: 'AR-B', year: 2020, value: 100, unit: 't', source: 'S', retrieved_at: '2026' },
      { resource: 'lithium', geo: 'AR-C', year: 2020, value: 50, unit: 't', source: 'S', retrieved_at: '2026' },
      { resource: 'lithium', geo: 'AR-D', year: 2020, value: 10, unit: 't', source: 'S', retrieved_at: '2026' },
      { resource: 'lithium', geo: 'AR-E', year: 2020, value: null, unit: 't', source: 'S', retrieved_at: '2026', note: 'null' },
    ];

    it('top-N plus Other preserves sum, AR excluded', () => {
      const { option, excluded } = buildProvinceBars(records, { resource: 'lithium', year: 2020, topN: 2 });
      expect(excluded).toBe(1);
      
      const series = option.series as Array<{ data: Array<{ value: number; itemStyle: { color: string } }> }>;
      const seriesData = series[0]?.data || [];
      // Reversed for yAxis category! So top-left is at the end.
      expect(seriesData).toHaveLength(3); // top 2 + Other
      
      // The array is reversed, so largest is at index 2; each top province gets its own categorical color when none is highlighted
      expect(seriesData[2]?.value).toBe(500); // AR-A
      expect(seriesData[2]?.itemStyle.color).toBe(tokens.categorical[0]);
      expect(seriesData[1]?.value).toBe(100); // AR-B
      expect(seriesData[1]?.itemStyle.color).toBe(tokens.categorical[1]);
      expect(seriesData[0]?.value).toBe(60); // Other (50 + 10)
      expect(seriesData[0]?.itemStyle.color).toBe(tokens.muted);
    });

    it('names the remainder "Otras" and summarises in Spanish', () => {
      const { option, summary } = buildProvinceBars(records, { resource: 'lithium', year: 2020, topN: 2 });
      expect((option.yAxis as { data: string[] }).data[0]).toBe('Otras');
      expect(summary).toMatch(/^Gráfico de barras de producción por provincia\. La mayor es .+ con 500 t\.$/);
    });

    it('highlights the selected province, keeping it on the chart even when it is outside the top N', () => {
      const { option } = buildProvinceBars(records, { resource: 'lithium', year: 2020, topN: 2, highlight: 'AR-D' });
      const series = option.series as Array<{ data: Array<{ value: number; itemStyle: { color: string } }> }>;
      const data = series[0]!.data;
      expect(data.map((d) => d.value)).toEqual([50, 10, 100, 500]); // Otras (C only), D, B, A (reversed for the axis)
      expect(data.map((d) => d.itemStyle.color)).toEqual([tokens.muted, tokens.blue, tokens.muted, tokens.muted]);
    });

    it('says there is no data for an unknown year', () => {
      expect(buildProvinceBars(records, { resource: 'lithium', year: 1990 }).summary).toBe(
        'Sin datos para este recurso y año.'
      );
    });

    it('unknown year gives empty chart and 0 excluded without throwing', () => {
      const { option, excluded } = buildProvinceBars(records, { resource: 'lithium', year: 1990 });
      expect(excluded).toBe(0);
      const series = option.series as Array<{ data: unknown[] }>;
      expect(series[0]?.data).toHaveLength(0);
    });
  });

  describe('buildTrend', () => {
    const records: ResourceProductionRecord[] = [
      { resource: 'lithium', geo: 'AR', year: 2022, value: 200, unit: 't', source: 'S', retrieved_at: '2026' },
      { resource: 'lithium', geo: 'AR', year: 2020, value: 100, unit: 't', source: 'S', retrieved_at: '2026' },
      { resource: 'lithium', geo: 'AR', year: 2021, value: null, unit: 't', source: 'S', retrieved_at: '2026', note: 'null' },
    ];

    it('sorted by year, null stays null, connectNulls false', () => {
      const { option } = buildTrend(records, { resource: 'lithium', geo: 'AR' });
      expect((option.xAxis as { data: string[] }).data).toEqual(['2020', '2021', '2022']);
      
      const series = option.series as Array<{ data: (number|null)[]; connectNulls: boolean }>;
      expect(series[0]?.data).toEqual([100, null, 200]);
      expect(series[0]?.connectNulls).toBe(false);
    });

    it('summarises in Spanish and says "Sin datos" in the tooltip for a gap', () => {
      const { option, summary } = buildTrend(records, { resource: 'lithium', geo: 'AR' });
      expect(summary).toBe('Gráfico de líneas de la tendencia de producción de 2020 a 2022.');
      const formatter = (option.tooltip as { formatter: (p: unknown[]) => string }).formatter;
      expect(formatter([{ name: '2021', value: null }])).toBe('2021: Sin datos');
      expect(buildTrend([], { resource: 'lithium' }).summary).toBe('Sin datos de tendencia.');
    });
  });

  describe('buildShares, buildPie and buildColumns (2D treemap, doughnut pie and multi-color bars)', () => {
    const sample = [
      { label: 'Servicios', value: 60 },
      { label: 'Industria', value: 25 },
      { label: 'Agro', value: 15 }
    ];

    it('buildShares styles the 2D treemap with centered labels, rounded gaps and distinct categorical colors', () => {
      const { option } = buildShares(sample, { unit: 'miles de millones de USD', summary: 'resumen' });
      const s = (option.series as Array<{
        type: string;
        squareRatio: number;
        itemStyle: { borderRadius: number; gapWidth: number };
        label: { position: string; align: string; verticalAlign: string; formatter: (p: { name: string; value: number }) => string };
        data: Array<{ name: string; itemStyle: { color: string } }>;
      }>)[0]!;
      expect(s.type).toBe('treemap');
      expect(s.squareRatio).toBe(1.15);
      expect(s.itemStyle.borderRadius).toBe(6);
      expect(s.itemStyle.gapWidth).toBe(3);
      expect(s.label.position).toBe('inside');
      expect(s.label.align).toBe('center');
      expect(s.label.verticalAlign).toBe('middle');
      expect(s.label.formatter({ name: 'Servicios', value: 60 })).toContain('60 %');
      expect(s.data.map((d) => d.itemStyle.color)).toEqual([tokens.categorical[0], tokens.categorical[1], tokens.categorical[2]]);
    });

    it('buildPie builds a doughnut chart with rounded slices and categorical colors', () => {
      const { option } = buildPie(sample, { unit: '%', summary: 'resumen' });
      const s = (option.series as Array<{
        type: string;
        radius: string[];
        itemStyle: { borderRadius: number; borderWidth: number };
        data: Array<{ name: string; itemStyle: { color: string } }>;
      }>)[0]!;
      expect(s.type).toBe('pie');
      expect(s.radius).toEqual(['52%', '78%']);
      expect(s.itemStyle.borderRadius).toBe(4);
      expect(s.itemStyle.borderWidth).toBe(2);
      expect(s.data.map((d) => d.itemStyle.color)).toEqual([tokens.categorical[0], tokens.categorical[1], tokens.categorical[2]]);
    });

    it('buildColumns assigns a distinct color from tokens.categorical to every bar in a single-series chart', () => {
      const { option } = buildColumns(
        sample.map((r) => r.label),
        [{ name: 'PBI', values: sample.map((r) => r.value), color: tokens.muted }],
        { unit: '%', highlight: 'Servicios', summary: 'resumen' }
      );
      const s = (option.series as Array<{
        data: Array<{ value: number; itemStyle: { color: string; borderRadius: number[] } }>;
      }>)[0]!;
      expect(s.data.map((d) => d.itemStyle.color)).toEqual([tokens.categorical[0], tokens.categorical[1], tokens.categorical[2]]);
      expect(s.data[0]?.itemStyle.borderRadius).toEqual([4, 4, 0, 0]);
    });
  });
});
