import { describe, it, expect } from 'vitest';
import { buildTreemap } from '../../src/charts/builders/treemap.js';
import { buildProvinceBars } from '../../src/charts/builders/provinceBars.js';
import { buildTrend } from '../../src/charts/builders/trend.js';
import { tokens } from '../../src/styles/tokens.js';
import type { CompositionRecord, ResourceProductionRecord } from '../../src/types/index.js';

describe('Chart Builders', () => {
  describe('buildTreemap', () => {
    const records: CompositionRecord[] = [
      { kind: 'exports_by_product', year: 2020, group: 'A', category: 'a1', label: 'a1', value_usd: 100, source: 'S', retrieved_at: '2026' },
      { kind: 'exports_by_product', year: 2020, group: 'A', category: 'a2', label: 'a2', value_usd: 50, source: 'S', retrieved_at: '2026' },
      { kind: 'exports_by_product', year: 2020, group: 'B', category: 'b1', label: 'b1', value_usd: 200, source: 'S', retrieved_at: '2026' },
      { kind: 'exports_by_product', year: 2020, group: 'C', category: 'c1', label: 'c1', value_usd: null as unknown as number, source: 'S', retrieved_at: '2026' },
    ];

    it('preserves totals, excludes nulls, counts them, orders correctly', () => {
      const { option, excluded, summary } = buildTreemap(records);
      expect(excluded).toBe(1);
      
      const groups = option.series[0]!.data;
      expect(groups).toHaveLength(2);
      expect(groups[0]!.name).toBe('B'); // 200 is largest
      expect(groups[1]!.name).toBe('A'); // 150
      
      expect(groups[1]!.children[0]!.name).toBe('a1'); // 100 > 50
      expect(groups[1]!.children[0]!.itemStyle.color).toBe(tokens.blue);
      
      expect(summary).toMatch(/largest is B/);
    });

    it('highlights group correctly', () => {
      const { option } = buildTreemap(records, { highlightGroup: 'A' });
      const groups = option.series[0]!.data;
      
      // B is not highlighted
      expect(groups[0]!.children[0]!.itemStyle.color).toBe(tokens.muted);
      // A is highlighted
      expect(groups[1]!.children[0]!.itemStyle.color).toBe(tokens.blue);
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
      
      const seriesData = option.series[0]!.data;
      // Reversed for yAxis category! So top-left is at the end.
      expect(seriesData).toHaveLength(3); // top 2 + Other
      
      // The array is reversed, so largest is at index 2
      expect(seriesData[2].value).toBe(500); // AR-A
      expect(seriesData[1].value).toBe(100); // AR-B
      expect(seriesData[0].value).toBe(60); // Other (50 + 10)
      expect(seriesData[0].itemStyle.color).toBe(tokens.muted);
    });

    it('unknown year gives empty chart and 0 excluded without throwing', () => {
      const { option, excluded } = buildProvinceBars(records, { resource: 'lithium', year: 1990 });
      expect(excluded).toBe(0);
      expect(option.series[0]!.data).toHaveLength(0);
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
      expect(option.xAxis.data).toEqual(['2020', '2021', '2022']);
      expect(option.series[0]!.data).toEqual([100, null, 200]);
      expect(option.series[0]!.connectNulls).toBe(false);
    });
  });
});
