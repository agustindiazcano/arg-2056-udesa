import { describe, expect, it } from 'vitest';
import { layoutBars } from '../../src/charts3d/layout';
import type { Bar3D } from '../../src/charts3d/types';

const bar = (label: string, value: number, highlight = false): Bar3D => ({ label, value, display: `${value} u`, highlight });

describe('layoutBars', () => {
  const bars = [bar('A', 100), bar('B', 50, true), bar('C', 25)];
  const layout = layoutBars(bars, { maxHeight: 4, barWidth: 1, gap: 0.5 });

  it('gives the tallest bar the maximum height and the others their share', () => {
    expect(layout.items.map((i) => i.height)).toEqual([4, 2, 1]);
  });

  it('keeps the order of the bars along x, centred on zero', () => {
    const xs = layout.items.map((i) => i.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(xs[0]! + xs[2]!).toBeCloseTo(0, 10);
    expect(layout.width).toBeCloseTo(3 * 1 + 2 * 0.5, 10);
  });

  it('carries the label, the display text and the highlight of each bar', () => {
    expect(layout.items.map((i) => [i.label, i.display, i.highlight])).toEqual([
      ['A', '100 u', false],
      ['B', '50 u', true],
      ['C', '25 u', false]
    ]);
  });

  it('never draws a negative or zero value as a bar going down: it gets a flat sliver', () => {
    const flat = layoutBars([bar('A', 10), bar('B', 0), bar('C', -5)], { maxHeight: 4, barWidth: 1, gap: 0.5 });
    expect(flat.items[1]!.height).toBeGreaterThan(0);
    expect(flat.items[1]!.height).toBeLessThan(0.1);
    expect(flat.items[2]!.height).toBeLessThan(0.1);
  });

  it('has no bars and a zero width for an empty list', () => {
    expect(layoutBars([], { maxHeight: 4, barWidth: 1, gap: 0.5 })).toEqual({ items: [], width: 0, max: 0 });
  });

  it('reports the maximum value it scaled by', () => {
    expect(layout.max).toBe(100);
  });

  it('puts the ticks of the height axis at round values up to the maximum', () => {
    expect(layout.ticks.map((t) => t.value)).toEqual([0, 25, 50, 75, 100]);
    expect(layout.ticks.map((t) => t.height)).toEqual([0, 1, 2, 3, 4]);
  });
});
