// @vitest-environment jsdom
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { IndexStep } from '../../src/tour/IndexStep';
import { TourStep } from '../../src/tour/TourStep';
import { INDEX_STEP, TOUR_ORDER, stepNumber } from '../../src/tour/chartSteps';
import { indexItems } from '../../src/tour/indexData';
import { ExportsStep } from '../../src/tour/ExportsStep';
import { Rule70Step } from '../../src/tour/Rule70Step';
import { COMPOSITION_TITLE, EXPORTS_TITLE, AI_PYRAMID_TITLE, FORECAST_UNCERTAINTY_TITLE, PRODUCTIVITY_TITLE, RULE70_TITLE } from '../../src/tour/slideTitles';
import { TOUR_CHARTS } from '../../src/tour/tourCharts';
import { useStore } from '../../src/state/store';
import { useTourLayout } from '../../src/tour/useTourLayout';

const FORBIDDEN = /datos de prueba|datos en parte reales|datos reales|inventad|mock|sin verificar|no verificad|a verificar|\bleída\b/i;

beforeEach(() => {
  useStore.setState({ mode: '2d', section: 'tour', tourStep: INDEX_STEP });
  useTourLayout.setState({ sideOpen: true, count: 1, focus: false });
});
afterEach(cleanup);

describe('the first slide: the title and the index', () => {
  it('is the first one of the Recorrido and the one the tour opens on, numbered 0', () => {
    expect(TOUR_ORDER[0]).toBe(INDEX_STEP);
    expect(stepNumber(INDEX_STEP)).toBe(0);
    expect(useStore.getState().tourStep).toBe(INDEX_STEP);
  });

  it('shows the text "Argentina 2056" as its title', () => {
    render(<IndexStep />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toMatch(/Argentina\s*2056/);
  });

  it('lists every other slide, in the order they are shown, each with its number and its title', () => {
    render(<IndexStep />);
    const list = within(screen.getByRole('navigation', { name: 'Índice' })).getAllByRole('listitem');
    const rest = TOUR_ORDER.filter((id) => id !== INDEX_STEP);
    expect(list).toHaveLength(rest.length);
    expect(list.map((li) => li.textContent)).toEqual(indexItems().map((i) => `${i.number} · ${i.title}`));
    expect(list[0]!.textContent).toBe('1 · El PBI de Argentina desde 1960');
    expect(list[4]!.textContent).toBe(`5 · ${PRODUCTIVITY_TITLE}`);
    expect(list[10]!.textContent).toBe(`11 · ${AI_PYRAMID_TITLE}`);
    expect(list[12]!.textContent).toBe(`13 · ${FORECAST_UNCERTAINTY_TITLE}`);
    expect(list.at(-1)!.textContent).toBe(`${rest.length} · Recursos y capital humano: Noruega, Australia, Canadá y Chile`);
  });

  it('uses the title each slide shows as its own heading', () => {
    const byId = new Map(indexItems().map((i) => [i.id, i.title]));
    expect(byId.get(12)).toBe(COMPOSITION_TITLE);
    expect(byId.get(5)).toBe(RULE70_TITLE);
    render(<Rule70Step />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(byId.get(5));
    cleanup();
    render(<ExportsStep />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(EXPORTS_TITLE);
    for (const id of [3]) expect(byId.get(id), `step ${id}`).toBe(TOUR_CHARTS[id]!.title);
  });

  it('numbers the items as the buttons of the menu and the Data page do', () => {
    for (const item of indexItems()) expect(item.number).toBe(stepNumber(item.id));
    expect(indexItems().map((i) => i.number)).toEqual(Array.from({ length: TOUR_ORDER.length - 1 }, (_, i) => i + 1));
  });

  it('opens a slide when its title is chosen', () => {
    render(<IndexStep />);
    fireEvent.click(screen.getByRole('button', { name: `5 · ${PRODUCTIVITY_TITLE}` }));
    expect(useStore.getState().tourStep).toBe(14);
  });

  it('is reached with the keyboard: every item is a button', () => {
    render(<IndexStep />);
    const nav = screen.getByRole('navigation', { name: 'Índice' });
    expect(within(nav).getAllByRole('button')).toHaveLength(TOUR_ORDER.length - 1);
  });

  it('is what the Recorrido shows for that step, with no side panel and no label about the data', () => {
    const { container } = render(<TourStep step={INDEX_STEP} />);
    expect(screen.getByRole('navigation', { name: 'Índice' })).toBeTruthy();
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(container.textContent).not.toMatch(FORBIDDEN);
  });
});

describe('the look of the first slide', () => {
  const css = () => readFileSync('src/styles/ui.css', 'utf8');
  // the body of the rule that starts with the selector at the beginning of a line
  const rule = (selector: string): string => {
    const text = css();
    const at = text.indexOf(`
${selector} {`);
    return at < 0 ? '' : text.slice(at, text.indexOf('}', at));
  };

  it('centers the title in its column, horizontally and vertically, and the whole composition in the page', () => {
    expect(rule('.index-head')).toMatch(/display:\s*flex/);
    expect(rule('.index-head')).toMatch(/justify-content:\s*center/);
    expect(rule('.index-head')).toMatch(/align-items:\s*center/);
    expect(rule('.index-title')).toMatch(/text-align:\s*center/);
    expect(rule('.index-step')).toMatch(/margin-inline:\s*auto/);
    expect(rule('.index-step')).toMatch(/max-width:/);
  });
});
