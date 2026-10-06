// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { CHART_STEPS, hasTourChart } from '../../src/tour/chartSteps';
import { ChartStep, visibleSteps } from '../../src/tour/ChartStep';
import { CHART_STEP_LIST, TOUR_CHARTS } from '../../src/tour/tourCharts';
import { hydrocarbonsData, rule70Rows } from '../../src/tour/tourData';
import { useTourLayout } from '../../src/tour/useTourLayout';
import { useStore } from '../../src/state/store';

describe('the charts of the Recorrido', () => {
  it('has a chart for step 1 and for steps 3 to 13, and the shell knows the same steps', () => {
    expect(CHART_STEP_LIST).toEqual([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect([...CHART_STEPS].sort((a, b) => a - b)).toEqual(CHART_STEP_LIST);
    expect(hasTourChart(2)).toBe(false);
    expect(hasTourChart(14)).toBe(false);
  });

  it('titles the steps as the human asked', () => {
    expect(TOUR_CHARTS[3]!.title).toBe('Cuarta revolución industrial: el impacto de la IA en la economía');
    expect(TOUR_CHARTS[4]!.title).toBe('Recursos naturales: exportaciones por sector');
    expect(TOUR_CHARTS[5]!.title).toBe('Regla del 70: cuánto tarda en duplicarse el PBI');
    expect(TOUR_CHARTS[6]!.title).toBe('Qué miran los inversores');
    expect(TOUR_CHARTS[7]!.title).toBe('Mapa productivo por provincia');
    expect(TOUR_CHARTS[8]!.title).toBe('Minería: hoy vs proyecto (con rangos)');
    expect(TOUR_CHARTS[9]!.title).toBe('Hidrocarburos: Vaca Muerta define el piso y el techo');
    expect(TOUR_CHARTS[10]!.title).toBe('Agro: producción actual y potencial');
    expect(TOUR_CHARTS[11]!.title).toBe('Composición de las exportaciones');
    expect(TOUR_CHARTS[12]!.title).toBe('Composición del PBI');
    expect(TOUR_CHARTS[13]!.title).toBe('El stock de recursos naturales');
  });

  it('builds every chart with a text alternative, and a 3D version except the map (drawn by its own component)', () => {
    for (const step of CHART_STEP_LIST) {
      const def = TOUR_CHARTS[step]!;
      if (def.kind === 'map') continue;
      const built = def.build();
      expect(built.summary.length).toBeGreaterThan(20);
      expect(built.spec, `step ${step}`).toBeDefined();
    }
  });

  it('labels the made-up data and not the arithmetic of the Rule of 70', () => {
    expect(TOUR_CHARTS[4]!.source).toMatch(/datos de prueba/i);
    expect(TOUR_CHARTS[5]!.source).not.toMatch(/datos de prueba/i);
    expect(rule70Rows().find((r) => r.label === '3 %')?.value).toBe(23.3);
  });

  it('draws the range of the mining projects as a whisker and the hydrocarbons with a floor and a ceiling', () => {
    const mining = TOUR_CHARTS[8]!.build().option as { series: Array<{ type: string }> };
    expect(mining.series.filter((s) => s.type === 'bar')).toHaveLength(2);
    expect(mining.series.filter((s) => s.type === 'custom')).toHaveLength(1);
    const h = hydrocarbonsData();
    h.years.forEach((_, i) => {
      if (h.expected[i] === null) return;
      expect(h.low[i]).toBeLessThanOrEqual(h.expected[i] as number);
      expect(h.high[i]).toBeGreaterThanOrEqual(h.expected[i] as number);
    });
  });

  it('labels the paired 3D bars on two lines', () => {
    const spec = TOUR_CHARTS[10]!.build().spec as { bars: Array<{ label: string }> };
    expect(spec.bars[0]!.label).toBe('Soja\nactual');
    expect(spec.bars[1]!.label).toBe('Soja\npotencial');
  });
});

describe('visibleSteps', () => {
  it('shows the step and the next ones, and slides back at the end of the list', () => {
    expect(visibleSteps(1, 1)).toEqual([1]);
    expect(visibleSteps(1, 4)).toEqual([1, 3, 4, 5]);
    expect(visibleSteps(6, 3)).toEqual([6, 7, 8]);
    expect(visibleSteps(13, 4)).toEqual([10, 11, 12, 13]);
  });
});

describe('ChartStep', () => {
  beforeEach(() => {
    useStore.setState({ mode: '2d' });
    useTourLayout.setState({ count: 1, focus: false });
  });
  afterEach(cleanup);

  it('has the same buttons on every step: the number of charts and 2D / 3D', () => {
    render(<ChartStep step={8} />);
    expect(screen.getByRole('heading', { name: 'Minería: hoy vs proyecto (con rangos)' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Gráficos en pantalla' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Vista' })).toBeTruthy();
    expect(screen.getAllByTestId('echart')).toHaveLength(1);
  });

  it('shows as many charts as the number chosen', () => {
    render(<ChartStep step={3} />);
    for (const n of [2, 3, 4]) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${n}$`) }));
      expect(screen.getAllByTestId('echart')).toHaveLength(n);
      expect(useTourLayout.getState().count).toBe(n);
    }
  });

  it('has a 1/3 layout: three small charts that are buttons, and the big one is the chart of the step', () => {
    useStore.setState({ tourStep: 3 });
    render(<ChartStep step={3} />);
    fireEvent.click(screen.getByRole('button', { name: '1/3' }));
    expect(screen.getAllByTestId('echart')).toHaveLength(4);
    const picks = screen.getAllByRole('button', { name: /^Ver grande: / });
    expect(picks.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Ver grande: Recursos naturales: exportaciones por sector',
      'Ver grande: Regla del 70: cuánto tarda en duplicarse el PBI',
      'Ver grande: Qué miran los inversores'
    ]);
    expect(document.querySelector('.tour-grid')?.getAttribute('data-layout')).toBe('focus');
    expect(document.querySelector('[data-size="big"]')?.getAttribute('data-step')).toBe('3');
    fireEvent.click(picks[2]!);
    expect(useStore.getState().tourStep).toBe(6);
  });
});
