// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { DataPage } from '../../src/datasets/DataPage';
import { ChartStep } from '../../src/tour/ChartStep';
import { DevelopmentStep } from '../../src/tour/DevelopmentStep';
import { ExportsStep } from '../../src/tour/ExportsStep';
import { ForecastUncertaintyStep } from '../../src/tour/ForecastUncertaintyStep';
import { STEP_INFO } from '../../src/tour/stepInfo';
import { TourChart } from '../../src/tour/TourChart';
import { TourSidebar } from '../../src/tour/TourSidebar';
import { CHART_STEP_LIST, TOUR_CHARTS } from '../../src/tour/tourCharts';
import { useStore } from '../../src/state/store';
import { useTourLayout } from '../../src/tour/useTourLayout';

// Human decision of 2026-10-14 and 2026-10-16: the front says nothing about how real, read or verified a datum is
// (no "Datos de prueba", "Datos en parte reales", "Datos reales", "leída", "sin verificar", "por investigar"...).
// That lives in docs/data-requests.md and docs/references.md.
const FORBIDDEN = /datos de prueba|datos en parte reales|datos reales|inventad|mock|sin verificar|no verificad|a verificar|no leíd|\bleída\b|\bleíd[oa]s?\b|\bleyeron\b|por investigar|en investigaci[oó]n|pendiente de verificaci/i;

const everyText = (root: HTMLElement): string =>
  [root.textContent ?? '', ...Array.from(root.querySelectorAll('[aria-label],[title]')).flatMap((e) => [e.getAttribute('aria-label') ?? '', e.getAttribute('title') ?? ''])].join('\n');

beforeEach(() => {
  useStore.setState({ mode: '2d' });
  useTourLayout.setState({ sideOpen: true, count: 1, focus: false });
});
afterEach(cleanup);

describe('the side panel of the steps', () => {
  it.each(Object.keys(STEP_INFO).map(Number))('step %i has no badge, no note about the state of the data and no reading status on the references', (step) => {
    const { container } = render(<TourSidebar step={step} />);
    expect(everyText(container)).not.toMatch(FORBIDDEN);
    expect(container.querySelector('.tour-side-badge')).toBeNull();
    expect(container.querySelector('.tour-side-status')).toBeNull();
  });
});

describe('the charts of the Recorrido', () => {
  it.each(CHART_STEP_LIST)('step %i has no label in its title, subtitle, source or text alternative', (step) => {
    const def = TOUR_CHARTS[step]!;
    expect(`${def.title}\n${def.subtitle}\n${def.source}`).not.toMatch(FORBIDDEN);
    expect(def.build().summary).not.toMatch(FORBIDDEN);
  });

  it.each(CHART_STEP_LIST.filter((s) => s !== 4))('step %i draws no badge nor mark over the chart', (step) => {
    const { container } = render(<ChartStep step={step} />);
    expect(everyText(container)).not.toMatch(FORBIDDEN);
    expect(container.querySelector('[role="note"]')).toBeNull();
    expect(container.querySelector('[data-testid="quality-watermark"]')).toBeNull();
  });

  it('the Exports slide draws no badge', () => {
    const { container } = render(<ExportsStep />);
    expect(everyText(container)).not.toMatch(FORBIDDEN);
    expect(container.querySelector('[role="note"]')).toBeNull();
  });

  it('DevelopmentStep contains no unverified or pending investigation labels', () => {
    const { container } = render(<DevelopmentStep />);
    expect(everyText(container)).not.toMatch(FORBIDDEN);
  });

  it('ForecastUncertaintyStep contains no unverified or pending investigation labels', () => {
    const { container } = render(<ForecastUncertaintyStep />);
    expect(everyText(container)).not.toMatch(FORBIDDEN);
  });

  it('TourChart puts its children straight in the box, with no extra wrapper (the map takes its height from `.prov-map > .tour-chart > *`)', () => {
    const { container } = render(
      <div className="tour-chart" data-testid="box">
        <TourChart>
          <p id="child">x</p>
        </TourChart>
      </div>
    );
    const box = screen.getByTestId('box');
    expect(box.firstElementChild!.id).toBe('child');
    expect(container.querySelectorAll('.tour-quality-frame')).toHaveLength(0);
  });
});

describe('the Data page', () => {
  it('shows no label about the data of a slide or of a table, and the intro does not talk about it', () => {
    const { container } = render(<DataPage />);
    const select = screen.getByRole('combobox', { name: 'Diapositiva' });
    for (const slide of ['0', '12', '3', '8', '14']) {
      fireEvent.change(select, { target: { value: slide } });
      expect(everyText(container), `slide ${slide}`).not.toMatch(/datos de prueba|datos en parte reales|datos reales|inventad/i);
      expect(container.querySelector('.data-badge')).toBeNull();
      expect(container.querySelector('.data-quality')).toBeNull();
    }
    for (const slide of ['16', '17']) {
      fireEvent.change(select, { target: { value: slide } });
      expect(everyText(container), `slide ${slide}`).not.toMatch(FORBIDDEN);
      expect(container.querySelector('.data-badge')).toBeNull();
      expect(container.querySelector('.data-quality')).toBeNull();
    }
  });

  it('shows no unverified or reading status on the references, methodology, or AI usage tabs', () => {
    const { container } = render(<DataPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Referencias' }));
    expect(everyText(container)).not.toMatch(FORBIDDEN);

    fireEvent.click(screen.getByRole('button', { name: 'Metodología' }));
    expect(everyText(container)).not.toMatch(FORBIDDEN);

    fireEvent.click(screen.getByRole('button', { name: 'Uso de AI' }));
    expect(everyText(container)).not.toMatch(FORBIDDEN);
  });
});
