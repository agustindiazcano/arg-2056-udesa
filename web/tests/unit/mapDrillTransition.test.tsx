// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let reduced = false;
vi.mock('../../src/runtime/useReducedMotion', () => ({ useReducedMotion: () => reduced }));
vi.mock('../../src/charts/EChart.js', () => ({ EChart: () => <div data-testid="echart-mock" /> }));
vi.mock('../../src/charts/echarts.js', () => ({ registerMap: () => undefined }));
vi.mock('../../src/geo/departments.js', () => ({
  loadDepartments: vi.fn(async () => ({
    type: 'FeatureCollection',
    source: 'IGN',
    retrieved_at: '2026-10-15',
    provinceId: 'AR-A',
    features: [
      {
        type: 'Feature',
        id: 'AR-A-1',
        properties: { id: 'AR-A-1', departamento: 'Capital', cabecera: 'Salta', provinciaId: 'AR-A', provincia: 'Salta', centroid: [-65.41, -24.78] },
        geometry: { type: 'Polygon', coordinates: [] }
      }
    ]
  }))
}));

import { ProvinceMap } from '../../src/scenes/forecast/ProvinceMap';
import { DRILL_MS } from '../../src/charts/drillTransition';
import type { ProvincesGeo } from '../../src/geo/provinces';
import type { MapValues } from '../../src/scenes/forecast/mapSelectors';
import type { ProvinceId } from '../../src/types/province';

const geo: ProvincesGeo = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'AR-A', name: 'Salta', area_km2: 155488, centroid: [-65, -24], centroid_inside: true, bbox: [-68, -26, -62, -22] },
      geometry: { type: 'Polygon', coordinates: [] }
    }
  ]
};

const values: MapValues = {
  values: { 'AR-A': { plotted: 100, p10: 80, p50: 100, p90: 120, rank: 1 } },
  missing: [],
  domain: [0, 100],
  excluded: 0
};

function view(selectedId: ProvinceId | null) {
  return (
    <ProvinceMap geo={geo} values={values} unit="USD" indicatorLabel="ProducciÃ³n" metric="level" selectedId={selectedId} year={2026} onSelect={() => undefined} />
  );
}

const canvas = (c: HTMLElement) => c.querySelector('.map-drill-canvas')!;

describe('ProvinceMap drill transition (C7)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    reduced = false;
  });

  it('wraps the chart in a drill canvas that is still on the first render', () => {
    const { container } = render(view(null));
    expect(canvas(container)).not.toBeNull();
    expect(canvas(container).classList.contains('is-drilling')).toBe(false);
  });

  it('drills in when the department map of the selected province is drawn, then settles', async () => {
    const { container, rerender } = render(view(null));
    rerender(view('AR-A'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(canvas(container).classList.contains('is-drilling')).toBe(true);
    act(() => vi.advanceTimersByTime(DRILL_MS));
    expect(canvas(container).classList.contains('is-drilling')).toBe(false);
  });

  it('drills back out to the country map', async () => {
    const { container, rerender } = render(view('AR-A'));
    await act(async () => {
      await Promise.resolve();
    });
    act(() => vi.advanceTimersByTime(DRILL_MS));
    rerender(view(null));
    expect(canvas(container).classList.contains('is-drilling')).toBe(true);
  });

  it('switches maps without animation under reduced motion', async () => {
    reduced = true;
    const { container, rerender } = render(view(null));
    rerender(view('AR-A'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(canvas(container).classList.contains('is-drilling')).toBe(false);
  });
});
