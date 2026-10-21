// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': label }: { option?: object; 'aria-label'?: string }) => (
    <div role="img" aria-label={label} data-testid="echart" data-option={JSON.stringify(option)} />
  )
}));

import { AiStep } from '../../src/tour/AiStep.js';
import { buildFluidLines, buildLines } from '../../src/charts/builders/tourCharts.js';
import { tokens } from '../../src/styles/tokens.js';

interface ChartOption {
  xAxis?: { splitLine?: { show?: boolean } };
  yAxis?: { splitLine?: { lineStyle?: { color?: string; type?: string } } };
  series?: Array<{
    name?: string;
    areaStyle?: unknown;
    lineStyle?: { width?: number; shadowBlur?: number };
  }>;
}

describe('Slide 3 / AiStep charts matching Slide 5 styles and palette', () => {
  it('buildFluidLines produces clean crisp lines without areaStyle or shadowBlur, with solid Y grid and no X grid', () => {
    const years = [2026, 2030, 2040, 2056];
    const series = [
      { name: 'Base', values: [100, 110, 130, 160], color: tokens.scenario.pessimistic },
      { name: 'Moderado', values: [100, 120, 150, 200], color: tokens.blue },
      { name: 'Optimista', values: [100, 140, 220, 350], color: tokens.scenario.optimistic }
    ];
    const { option } = buildFluidLines(years, series, 2056, { unit: 'USD', labelEvery: 5, summary: 'Test' });
    const opt = option as ChartOption;

    // Y Axis splitLine is solid with tokens.grid (matching Slide 5)
    expect(opt.yAxis?.splitLine?.lineStyle?.color).toBe(tokens.grid);
    expect(opt.yAxis?.splitLine?.lineStyle?.type).toBeUndefined(); // solid

    // X Axis splitLine is false (matching Slide 5)
    expect(opt.xAxis?.splitLine?.show).toBe(false);

    // Lines do not have areaStyle by default (prevents muddy overlapping color fill)
    for (const s of opt.series ?? []) {
      if (s.name?.includes('(cabeza)')) continue;
      expect(s.areaStyle).toBeUndefined();
      expect(s.lineStyle?.shadowBlur).toBeUndefined();
      expect(s.lineStyle?.width).toBe(3);
    }
  });

  it('buildLines also uses clean lines without areaStyle or shadowBlur, and solid Y grid', () => {
    const xLabels = ['2026', '2030', '2040', '2056'];
    const series = [
      { name: 'Base', values: [100, 110, 130, 160], color: tokens.scenario.pessimistic },
      { name: 'Moderado', values: [100, 120, 150, 200], color: tokens.blue }
    ];
    const { option } = buildLines(xLabels, series, { unit: 'USD', labelEvery: 1, summary: 'Test' });
    const opt = option as ChartOption;

    expect(opt.yAxis?.splitLine?.lineStyle?.color).toBe(tokens.grid);
    expect(opt.xAxis?.splitLine?.show).toBe(false);

    for (const s of opt.series ?? []) {
      expect(s.areaStyle).toBeUndefined();
      expect(s.lineStyle?.shadowBlur).toBeUndefined();
      expect(s.lineStyle?.width).toBe(3);
    }
  });

  it('AiStep renders clean cards with rule70-card classes, headers and legend', () => {
    const { container, unmount } = render(<AiStep />);

    // Cards use rule70-card and rule70-card-head
    const cards = container.querySelectorAll('.rule70-card');
    expect(cards.length).toBeGreaterThanOrEqual(3);

    const heads = container.querySelectorAll('.rule70-card-head');
    expect(heads.length).toBeGreaterThanOrEqual(3);

    // Legend uses rule70-legend and rule70-key line indicators
    const keys = container.querySelectorAll('.rule70-key');
    expect(keys.length).toBeGreaterThanOrEqual(3);

    // Indicators table uses rule70-table
    const table = container.querySelector('table.rule70-table');
    expect(table).not.toBeNull();

    unmount();
  });
});
