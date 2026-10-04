// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, configure, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Scene from '../../src/scenes/economy/index.js';
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

const records = ['ARG', 'BRA', 'CHL'].flatMap((country, c) =>
  [1900, 1901].map((year, i) => ({
    country,
    year,
    indicator: 'gdp_per_capita_usd',
    value: 10 * (c + 1) + i,
    unit: 'u',
    source: 'MOCK',
    retrieved_at: '2026-10-02'
  }))
);

describe('Economy scene and echarts instances', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('creates the three chart instances, feeds them options and disposes every one on unmount', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => records })));
    const { unmount } = render(<Scene />);
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => expect(mockInit).toHaveBeenCalledTimes(3)); // long run, rank bars, rank history
    expect(mockSetOption).toHaveBeenCalled();
    expect(mockDispose).not.toHaveBeenCalled();
    unmount();
    expect(mockDispose).toHaveBeenCalledTimes(3);
  });
});
