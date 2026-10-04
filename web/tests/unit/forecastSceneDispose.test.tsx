// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, configure, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Scene from '../../src/scenes/forecast/index.js';
import './reducedMotionStub';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

const { mockInit, mockSetOption, mockDispose } = vi.hoisted(() => {
  const mockSetOption = vi.fn();
  const mockDispose = vi.fn();
  const mockInit = vi.fn(() => ({ setOption: mockSetOption, resize: vi.fn(), dispose: mockDispose, on: vi.fn() }));
  return { mockInit, mockSetOption, mockDispose };
});

vi.mock('../../src/charts/echarts.js', () => ({ init: mockInit }));

const doc = {
  model_version: 'mock-1',
  generated_at: '2026-01-01',
  source: 'MOCK',
  horizon: { start_year: 2026, end_year: 2027 },
  series: (['pessimistic', 'expected', 'optimistic'] as const).map((scenario, i) => ({
    indicator: 'gdp_constant_usd',
    geo: 'AR',
    scenario,
    ai_overlay: 'off',
    unit: 'bn USD',
    points: [
      { year: 2026, p10: 9 + i, p50: 10 + i, p90: 11 + i },
      { year: 2027, p10: 10 + i, p50: 11 + i, p90: 12 + i }
    ]
  }))
};

describe('Forecast scene and echarts instances', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('creates a chart instance, feeds it the fan option and disposes it on unmount', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => doc })));
    const { unmount } = render(<Scene />);
    await screen.findByText(/Los escenarios son proyecciones condicionales, no predicciones\./);
    await waitFor(() => expect(mockInit).toHaveBeenCalledTimes(1));
    expect(mockSetOption).toHaveBeenCalled();
    const names = mockSetOption.mock.calls[0]![0].series.map((s: { name: string }) => s.name);
    expect(names).toContain('expected');
    expect(mockDispose).not.toHaveBeenCalled();
    unmount();
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });
});
