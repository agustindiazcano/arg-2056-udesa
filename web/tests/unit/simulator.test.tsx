// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { DEFAULT_SIM, SIM_END, SIM_FIELDS, SIM_START, SIM_START_GDP, doublingYears, growthAt, simulate } from '../../src/tour/simModel';
import { Simulator } from '../../src/tour/Simulator';
import { SECTIONS } from '../../src/types/scene';
import { SECTION_LABELS } from '../../src/content/sectionLabels';
import { reduce } from '../../src/state/reducer';
import { useStore } from '../../src/state/store';

describe('the GDP simulation', () => {
  it('starts at the estimate of the IMF for 2026 and has one value per year to 2056', () => {
    const s = simulate(DEFAULT_SIM);
    expect(s.years[0]).toBe(SIM_START);
    expect(s.years.at(-1)).toBe(SIM_END);
    expect(s.gdp).toHaveLength(SIM_END - SIM_START + 1);
    expect(s.gdp[0]).toBe(SIM_START_GDP);
    expect(s.gdp.every((v, i) => i === 0 || v > s.gdp[i - 1]!)).toBe(true);
  });

  it('grows more with a higher base rate, more AI, more population and more investment', () => {
    const end = (patch: Partial<typeof DEFAULT_SIM>) => simulate({ ...DEFAULT_SIM, ...patch }).gdp.at(-1)!;
    const base = end({});
    expect(end({ baseGrowth: 4 })).toBeGreaterThan(base);
    expect(end({ ai: 2 })).toBeGreaterThan(base);
    expect(end({ ai: 0 })).toBeLessThan(base);
    expect(end({ population: 1.5 })).toBeGreaterThan(base);
    expect(end({ investment: 25 })).toBeGreaterThan(base);
    expect(end({ productivity: 1 })).toBeGreaterThan(base);
  });

  it('brings the AI in little by little: no effect in 2026, the full effect from 2041', () => {
    const none = growthAt({ ...DEFAULT_SIM, ai: 0 }, 2026);
    expect(growthAt(DEFAULT_SIM, 2026)).toBeCloseTo(none, 10);
    expect(growthAt(DEFAULT_SIM, 2041)).toBeCloseTo(none + DEFAULT_SIM.ai, 10);
    expect(growthAt(DEFAULT_SIM, 2056)).toBeCloseTo(none + DEFAULT_SIM.ai, 10);
  });

  it('gives the years to double by the rule of 70, and none when it does not grow', () => {
    expect(doublingYears(2)).toBe(35);
    expect(doublingYears(0)).toBeNull();
    expect(doublingYears(-1)).toBeNull();
  });

  it('has a slider range for every factor that holds its default', () => {
    expect(SIM_FIELDS.length).toBeGreaterThanOrEqual(5);
    for (const f of SIM_FIELDS) {
      expect(f.min).toBeLessThan(f.max);
      expect(DEFAULT_SIM[f.key]).toBeGreaterThanOrEqual(f.min);
      expect(DEFAULT_SIM[f.key]).toBeLessThanOrEqual(f.max);
    }
  });
});

describe('the Simulador del PBI section', () => {
  it('is a section next to the Recorrido, with its name', () => {
    expect(SECTIONS.indexOf('simulator')).toBe(SECTIONS.indexOf('tour') + 1);
    expect(SECTION_LABELS.simulator).toBe('Simulador del PBI');
  });

  it('can be entered, and the arrow keys do not change the scene in it', () => {
    const start = useStore.getState();
    const entered = reduce(start, { type: 'setSection', section: 'simulator' });
    expect(entered.section).toBe('simulator');
    expect(reduce(entered, { type: 'nextScene' })).toBe(entered);
    expect(reduce(entered, { type: 'prevScene' })).toBe(entered);
  });
});

describe('the simulator page', () => {
  beforeEach(() => useStore.setState({ mode: '2d' }));
  afterEach(cleanup);

  it('has a big chart and a side bar with one slider per factor', () => {
    render(<Simulator />);
    expect(screen.getByRole('heading', { name: /evolución del PBI/i })).toBeTruthy();
    expect(screen.getByTestId('echart')).toBeTruthy();
    for (const f of SIM_FIELDS) expect(screen.getByRole('slider', { name: f.label })).toBeTruthy();
  });

  it('carries no label about the data in its subtitle nor in its text alternative', () => {
    const { container } = render(<Simulator />);
    expect(screen.queryByText(/ilustrativ|datos de prueba|inventad/i)).toBeNull();
    expect(container.innerHTML).not.toMatch(/ilustrativ|datos de prueba|inventad/i);
  });

  it('moving a factor changes the GDP of 2056 and Restablecer puts the defaults back', () => {
    render(<Simulator />);
    const result = () => screen.getByTestId('sim-gdp-end').textContent;
    const first = result();
    const growth = screen.getByRole('slider', { name: 'Crecimiento anual base' });
    act(() => {
      fireEvent.change(growth, { target: { value: '5' } });
    });
    expect(result()).not.toBe(first);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
    });
    expect(result()).toBe(first);
  });
});
