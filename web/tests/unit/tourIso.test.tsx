// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectedMap } from '../../src/charts3d/mapGeometry';
import { layoutBars } from '../../src/charts3d/layout';
import { isoBars } from '../../src/tour3d/isoBars';
import { isoMap } from '../../src/tour3d/isoMap';
import { TourBarsSvg } from '../../src/tour3d/TourBarsSvg';
import { TourMapSvg } from '../../src/tour3d/TourMapSvg';
import type { Bars3DSpec, Map3DSpec } from '../../src/charts3d/types';
import type { ProvincesGeo } from '../../src/geo/provinces';

afterEach(cleanup);

const square = (x: number, y: number): [number, number][] => [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
const projected: ProjectedMap = {
  provinces: [
    { id: 'S', name: 'Sur', polygons: [{ outer: square(0, 0), holes: [] }] },
    { id: 'N', name: 'Norte', polygons: [{ outer: square(0, 2), holes: [] }] }
  ],
  bounds: { minX: 0, maxX: 1, minY: 0, maxY: 3, width: 1, height: 3 }
};
const style = (height: number) => ({ height, color: '#336699', hasData: true });

describe('isoMap', () => {
  const draw = (selectedId: string | null) => isoMap(projected, { styleOf: (id) => style(id === 'N' ? 1 : 0.5), selectedId });

  it('draws the north first, so the south covers what is behind it', () => {
    const { provinces } = draw(null);
    expect(provinces.map((p) => p.id)).toEqual(['N', 'S']);
  });

  it('gives every province a top and the walls that face the viewer, and a viewBox that holds them all', () => {
    const { provinces, viewBox } = draw(null);
    for (const p of provinces) {
      expect(p.top.startsWith('M')).toBe(true);
      expect(p.sides.startsWith('M')).toBe(true);
    }
    expect(viewBox.width).toBeGreaterThan(1);
    expect(viewBox.height).toBeGreaterThan(1);
    const nums = provinces.flatMap((p) => (p.top + p.sides).match(/-?\d+(\.\d+)?/g)!.map(Number));
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(Math.min(viewBox.x, viewBox.y));
  });

  it('lifts the selected province', () => {
    const plain = draw(null).provinces.find((p) => p.id === 'S')!;
    const lifted = draw('S').provinces.find((p) => p.id === 'S')!;
    expect(lifted.top).not.toBe(plain.top);
    expect(lifted.selected).toBe(true);
  });
});

describe('isoBars', () => {
  const bars = [
    { label: 'A', value: 10, display: '10', short: '10', highlight: false },
    { label: 'B', value: 5, display: '5', short: '5', highlight: true }
  ];
  const layout = layoutBars(bars, { maxHeight: 4, barWidth: 0.9, gap: 0.45, depth: 1.1 });

  it('a taller bar reaches higher on the screen', () => {
    const { bars: drawn } = isoBars(layout);
    expect(drawn).toHaveLength(2);
    expect(drawn[0]!.topY).toBeLessThan(drawn[1]!.topY); // svg y grows downward
  });

  it('keeps everything it draws inside its viewBox', () => {
    const { viewBox, bars: drawn } = isoBars(layout);
    for (const b of drawn) {
      expect(b.labelX).toBeGreaterThan(viewBox.x);
      expect(b.labelX).toBeLessThan(viewBox.x + viewBox.width);
      expect(b.topY).toBeGreaterThan(viewBox.y);
    }
  });
});

const geo = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { id: 'S', name: 'Sur' }, geometry: { type: 'Polygon', coordinates: [[[-60, -40], [-59, -40], [-59, -39], [-60, -39], [-60, -40]]] } },
    { type: 'Feature', properties: { id: 'N', name: 'Norte' }, geometry: { type: 'Polygon', coordinates: [[[-60, -30], [-59, -30], [-59, -29], [-60, -29], [-60, -30]]] } }
  ]
} as unknown as ProvincesGeo;

describe('TourMapSvg', () => {
  const spec = (onSelect = vi.fn(), selectedId: string | null = null): Map3DSpec => ({
    kind: 'map',
    title: 'Mapa',
    geo,
    values: { values: { S: { plotted: 1 }, N: { plotted: 3 } } as never, missing: [], domain: [0, 3], excluded: 0 },
    metric: 'level',
    selectedId,
    formatValue: (v) => `${v} u`,
    onSelect,
    summary: 'resumen del mapa'
  });

  it('is plain SVG: no canvas, and the summary is its text alternative', () => {
    const { container } = render(<TourMapSvg spec={spec()} />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByRole('img', { name: 'resumen del mapa' })).toBeTruthy();
    expect(container.querySelectorAll('[data-province]')).toHaveLength(2);
  });

  it('names the province under the pointer and selects it on click, and a second click clears it', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(<TourMapSvg spec={spec(onSelect)} />);
    const north = container.querySelector('[data-province="N"]')!;
    fireEvent.pointerMove(north, { clientX: 10, clientY: 10 });
    expect(screen.getByText('Norte: 3 u')).toBeTruthy();
    fireEvent.pointerLeave(north);
    expect(container.querySelector('.chart3d-tip')!.hasAttribute('hidden')).toBe(true);
    fireEvent.click(north);
    expect(onSelect).toHaveBeenCalledWith('N');
    rerender(<TourMapSvg spec={spec(onSelect, 'N')} />);
    fireEvent.click(container.querySelector('[data-province="N"]')!);
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});

describe('TourBarsSvg', () => {
  const spec: Bars3DSpec = {
    kind: 'bars',
    title: 'Barras',
    unit: 'u',
    summary: 'resumen de barras',
    bars: [
      { label: 'Alfa', value: 10, display: '10 u', short: '10', highlight: false },
      { label: 'Beta', value: 5, display: '5 u', short: '5', highlight: true }
    ]
  };

  it('is plain SVG with one group per bar, and names the bar under the pointer', () => {
    const { container } = render(<TourBarsSvg spec={spec} />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByRole('img', { name: 'resumen de barras' })).toBeTruthy();
    const bars = container.querySelectorAll('[data-bar]');
    expect(bars).toHaveLength(2);
    fireEvent.pointerMove(bars[1]!, { clientX: 5, clientY: 5 });
    expect(screen.getByText('Beta: 5 u')).toBeTruthy();
  });
});
