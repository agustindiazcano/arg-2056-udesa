// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { CHART_STEPS, hasTourChart } from '../../src/tour/chartSteps';
import { ChartStep, visibleSteps } from '../../src/tour/ChartStep';
import { AGRO_TONNES_CHART, AGRO_USD_CHART, CHART_STEP_LIST, HYDROCARBONS_CHART, STOCK_CHART, TOUR_CHARTS } from '../../src/tour/tourCharts';
import { hydrocarbonsData, rule70Rows } from '../../src/tour/tourData';
import { useTourLayout } from '../../src/tour/useTourLayout';
import { useStore } from '../../src/state/store';

describe('the charts of the Recorrido', () => {
  it('has a chart for step 1 and for steps 3 to 13 except 6 (the investor slide was removed), and the shell also knows steps 0 and 2', () => {
    expect(CHART_STEP_LIST).toEqual([3, 4, 5, 8, 12]);
    // step 2 is the map of production by province: its own component, not one of the charts that go side by side
    expect([...CHART_STEPS].sort((a, b) => a - b)).toEqual([0, ...CHART_STEP_LIST.filter((s) => s !== 4), 14, 16, 17, 20]); // custom slide components and the index
    expect(hasTourChart(0)).toBe(true);
    expect(hasTourChart(2)).toBe(false); // Producción por provincia is a view of the Recursos slide
    expect(hasTourChart(8)).toBe(true);
    expect(hasTourChart(14)).toBe(true);
    expect(hasTourChart(15)).toBe(false);
  });

  it('titles the steps as the human asked', () => {
    expect(TOUR_CHARTS[3]!.title).toBe('Cuarta revolución industrial: el impacto de la IA en la economía');
    expect(TOUR_CHARTS[4]!.title).toBe('Recursos naturales: exportaciones por sector');
    expect(TOUR_CHARTS[5]!.title).toBe('¿Cuánto hay que crecer por año para duplicar el PBI? La regla del 70');
    expect(TOUR_CHARTS[6]).toBeUndefined();
    expect(TOUR_CHARTS[7]).toBeUndefined(); // merged into the province slide (step 2)
    expect(TOUR_CHARTS[8]!.title).toBe('Minería: hoy vs proyecto');
    // steps 9, 10 and 13 are tabs of the Resources slide (step 8) now
    expect(TOUR_CHARTS[9]).toBeUndefined();
    expect(TOUR_CHARTS[10]).toBeUndefined();
    expect(HYDROCARBONS_CHART.title).toBe('Hidrocarburos: Vaca Muerta define el piso y el techo');
    expect(AGRO_USD_CHART.title).toBe('Agro: producción actual y potencial');
    expect(AGRO_TONNES_CHART.title).toBe('Agro: toneladas producidas por campaña');
    expect(TOUR_CHARTS[11]).toBeUndefined(); // merged into the Exports slide (step 4)
    expect(TOUR_CHARTS[12]!.title).toBe('Composición del PBI');
    expect(STOCK_CHART.title).toBe('El stock de recursos naturales');
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

  it('names the real sources and carries no label about made-up data', () => {
    expect(TOUR_CHARTS[3]!.source).not.toMatch(/datos de prueba/i);
    expect(TOUR_CHARTS[4]!.source).toMatch(/INDEC/);
    expect(TOUR_CHARTS[12]!.source).toMatch(/INDEC/);
    expect(TOUR_CHARTS[5]!.source).not.toMatch(/datos de prueba/i);
    expect(rule70Rows().find((r) => r.label === '3 %')?.value).toBe(23.3);
  });

  it('draws the mining bars without a made-up range and the hydrocarbons with a floor and a ceiling', () => {
    const mining = TOUR_CHARTS[8]!.build().option as { series: Array<{ type: string }> };
    expect(mining.series.filter((s) => s.type === 'bar')).toHaveLength(2);
    expect(mining.series.filter((s) => s.type === 'custom')).toHaveLength(0);
    const h = hydrocarbonsData();
    h.years.forEach((_, i) => {
      if (h.expected[i] === null) return;
      expect(h.low[i]).toBeLessThanOrEqual(h.expected[i] as number);
      expect(h.high[i]).toBeGreaterThanOrEqual(h.expected[i] as number);
    });
  });

  it('labels the paired 3D bars on two lines', () => {
    const spec = AGRO_USD_CHART.build().spec as { bars: Array<{ label: string }> };
    expect(spec.bars[0]!.label).toBe('Soja\nactual');
    expect(spec.bars[1]!.label).toBe('Soja\npotencial');
  });
});

describe('visibleSteps', () => {
  it('shows the step and the next ones, and slides back at the end of the list', () => {
    expect(visibleSteps(3, 1)).toEqual([3]);
    expect(visibleSteps(3, 4)).toEqual([3, 4, 5, 8]);
    expect(visibleSteps(5, 3)).toEqual([5, 8, 12]);
    expect(visibleSteps(12, 4)).toEqual([4, 5, 8, 12]);
  });
});

describe('the default layout of the charts', () => {
  it('is the 1/3 layout (human order of 2026-10-15)', () => {
    expect(useTourLayout.getInitialState().focus).toBe(true);
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
    expect(screen.getByRole('heading', { name: 'Minería: hoy vs proyecto' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Gráficos en pantalla' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Vista' })).toBeTruthy();
    expect(screen.getAllByTestId('echart')).toHaveLength(1);
  });

  it('shows as many charts as the number chosen', () => {
    // from step 8 the next three are charts too (step 7 is the map, which is not an ECharts chart)
    render(<ChartStep step={8} />);
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
      `Ver grande: ${TOUR_CHARTS[4]!.title}`,
      `Ver grande: ${TOUR_CHARTS[5]!.title}`,
      `Ver grande: ${TOUR_CHARTS[8]!.title}`
    ]);
    expect(document.querySelector('.tour-grid')?.getAttribute('data-layout')).toBe('focus');
    expect(document.querySelector('[data-size="big"]')?.getAttribute('data-step')).toBe('3');
    fireEvent.click(picks[1]!);
    expect(useStore.getState().tourStep).toBe(5);
  });
});
