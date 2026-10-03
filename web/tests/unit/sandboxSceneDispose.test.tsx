// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, configure, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Scene from '../../src/scenes/sandbox/index.js';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

const { mockInit, mockSetOption, mockDispose } = vi.hoisted(() => {
  const mockSetOption = vi.fn();
  const mockDispose = vi.fn();
  const mockInit = vi.fn(() => ({ setOption: mockSetOption, resize: vi.fn(), dispose: mockDispose, on: vi.fn() }));
  return { mockInit, mockSetOption, mockDispose };
});

vi.mock('echarts', () => ({ init: mockInit }));

const series = (['pessimistic', 'expected', 'optimistic'] as const).flatMap((scenario) =>
  (['gdp_per_capita_usd', 'population'] as const).flatMap((indicator) =>
    (['off', 'on'] as const).map((overlay) => ({
      indicator,
      geo: 'AR',
      scenario,
      ai_overlay: overlay,
      unit: 'u',
      points: [2026, 2027].map((year, i) => ({ year, p10: 9 + i, p50: 10 + i, p90: 11 + i }))
    }))
  )
);
const doc = {
  model_version: 'mock-1',
  generated_at: '2026-01-01',
  source: 'MOCK',
  horizon: { start_year: 2026, end_year: 2027 },
  series
};

describe('Sandbox scene and echarts instances', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('creates the two chart instances, feeds them options and disposes both on unmount', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => doc })));
    const { unmount } = render(<Scene />);
    await screen.findByText('Illustrative arithmetic on your assumptions. It is not the forecasting model.');
    await waitFor(() => expect(mockInit).toHaveBeenCalledTimes(2));
    expect(mockSetOption).toHaveBeenCalled();
    expect(mockDispose).not.toHaveBeenCalled();
    unmount();
    expect(mockDispose).toHaveBeenCalledTimes(2);
  });
});
