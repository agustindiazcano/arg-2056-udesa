// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { buildGdp } from '../../src/charts/builders/gdp';
import { GDP_MOCK, LAST_OBSERVED_YEAR, gdpLinesSpec } from '../../src/tour/gdpMock';
import { GdpStep } from '../../src/tour/GdpStep';
import { useStore } from '../../src/state/store';

describe('GDP mock data', () => {
  it('has one value per year, the history up to the last observed year and the projection from it', () => {
    const n = GDP_MOCK.years.length;
    expect(GDP_MOCK.history).toHaveLength(n);
    expect(GDP_MOCK.expected).toHaveLength(n);
    const last = GDP_MOCK.years.indexOf(LAST_OBSERVED_YEAR);
    expect(last).toBeGreaterThan(0);
    expect(GDP_MOCK.history.slice(0, last + 1).every((v) => typeof v === 'number')).toBe(true);
    expect(GDP_MOCK.history.slice(last + 1).every((v) => v === null)).toBe(true);
    expect(GDP_MOCK.expected.slice(0, last).every((v) => v === null)).toBe(true);
    expect(GDP_MOCK.expected[last]).toBe(GDP_MOCK.history[last]);
    expect(GDP_MOCK.years.at(-1)).toBe(2056);
  });

  it('keeps the range around the expected path', () => {
    GDP_MOCK.years.forEach((_, i) => {
      const e = GDP_MOCK.expected[i];
      if (e === null || e === undefined) return;
      expect(GDP_MOCK.low[i]).toBeLessThanOrEqual(e as number);
      expect(GDP_MOCK.high[i]).toBeGreaterThanOrEqual(e as number);
    });
  });

  it('is labelled as test data', () => {
    expect(GDP_MOCK.source).toMatch(/datos de prueba/i);
  });
});

describe('buildGdp', () => {
  const { option, summary } = buildGdp(GDP_MOCK);

  it('draws vertical grid lines at the labelled years, like the horizontal ones', () => {
    const x = option.xAxis.splitLine;
    expect(x.show).toBe(true);
    expect(x.interval).toBe(option.xAxis.axisLabel.interval);
    expect(x.lineStyle).toEqual(option.yAxis.splitLine.lineStyle);
  });
  const series = (option as { series: Array<{ name?: string; type: string; data: Array<number | null> }> }).series;

  it('draws the history and the projection as lines with a gap, never as zero', () => {
    const history = series.find((s) => s.name === 'PBI observado');
    const expected = series.find((s) => s.name === 'Proyección esperada');
    expect(history?.type).toBe('line');
    expect(history?.data.includes(0)).toBe(false);
    expect(expected?.data.includes(0)).toBe(false);
  });

  it('describes the chart in words', () => {
    expect(summary).toContain('PBI');
    expect(summary).toContain('2056');
  });
});

describe('gdpLinesSpec', () => {
  it('feeds the 3D lines with the same data', () => {
    const spec = gdpLinesSpec(GDP_MOCK);
    expect(spec.kind).toBe('lines');
    expect(spec.xLabels).toHaveLength(GDP_MOCK.years.length);
    expect(spec.series.map((s) => s.name)).toEqual(['PBI observado', 'Proyección esperada']);
    expect(spec.band?.lower).toHaveLength(GDP_MOCK.years.length);
  });
});

describe('GdpStep', () => {
  beforeEach(() => useStore.setState({ mode: '2d' }));
  afterEach(cleanup);

  it('shows the title, the test-data label and the chart', () => {
    render(<GdpStep />);
    expect(screen.getByRole('heading', { name: /PBI de la Argentina/ })).toBeTruthy();
    expect(screen.getByText(/datos de prueba/i)).toBeTruthy();
    expect(screen.getByTestId('echart')).toBeTruthy();
  });

  it('has 2D and 3D buttons that follow and change the mode', () => {
    render(<GdpStep />);
    const d2 = screen.getByRole('button', { name: '2D' });
    const d3 = screen.getByRole('button', { name: '3D' });
    expect(d2.getAttribute('aria-pressed')).toBe('true');
    expect(d3.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(d3);
    expect(useStore.getState().mode).toBe('3d');
    expect(screen.getByRole('button', { name: '3D' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '2D' }));
    expect(useStore.getState().mode).toBe('2d');
  });
});
