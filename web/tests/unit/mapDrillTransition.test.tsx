// @vitest-environment jsdom
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProvinceMap } from '../../src/scenes/forecast/ProvinceMap.js';
import type { ProvincesGeo } from '../../src/geo/provinces.js';
import type { MapValues } from '../../src/scenes/forecast/mapSelectors.js';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option }: { option?: object }) => (
    <div data-testid="echart-mock" data-option={JSON.stringify(option)} />
  )
}));

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
        properties: {
          id: 'AR-A-1',
          departamento: 'Capital',
          cabecera: 'Salta',
          provinciaId: 'AR-A',
          provincia: 'Salta',
          centroid: [-65.41, -24.78]
        },
        geometry: { type: 'Polygon', coordinates: [] }
      }
    ]
  }))
}));

const mockGeo: ProvincesGeo = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'AR-A',
        name: 'Salta',
        area_km2: 155488,
        centroid: [-65, -24],
        centroid_inside: true,
        bbox: [-68, -26, -62, -22]
      },
      geometry: { type: 'Polygon', coordinates: [] }
    }
  ]
};

const mockValues: MapValues = {
  values: {
    'AR-A': { plotted: 100, p10: 80, p50: 100, p90: 120, rank: 1 }
  },
  missing: [],
  domain: [0, 100],
  excluded: 0
};

describe('ProvinceMap drilldown transition (C7: map-drill-transition)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies map-transitioning class during province selection drilldown and clears it after timeout', async () => {
    const { container, rerender } = render(
      <ProvinceMap
        geo={mockGeo}
        values={mockValues}
        unit="USD"
        indicatorLabel="Producción"
        metric="level"
        selectedId={null}
        year={2026}
        onSelect={() => {}}
      />
    );

    const canvas = container.querySelector('.map-drill-canvas');
    expect(canvas).not.toBeNull();

    // Select province: should trigger transition
    rerender(
      <ProvinceMap
        geo={mockGeo}
        values={mockValues}
        unit="USD"
        indicatorLabel="Producción"
        metric="level"
        selectedId="AR-A"
        year={2026}
        onSelect={() => {}}
      />
    );

    expect(canvas?.classList.contains('map-transitioning')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(canvas?.classList.contains('map-transitioning')).toBe(false);
  });
});
