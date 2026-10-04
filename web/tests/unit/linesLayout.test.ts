import { describe, expect, it } from 'vitest';
import { layoutLines } from '../../src/charts3d/linesLayout';
import type { Lines3DSpec } from '../../src/charts3d/types';

const spec = (over: Partial<Lines3DSpec> = {}): Lines3DSpec => ({
  kind: 'lines',
  title: 'T',
  unit: 'u',
  xLabels: ['2020', '2021', '2022', '2023'],
  series: [
    { name: 'A', values: [1, null, 3, 4], tone: 'highlight' },
    { name: 'B', values: [2, 2, 2, 2], tone: 'muted' }
  ],
  summary: 's',
  ...over
});

const opts = { width: 10, maxHeight: 4, laneGap: 1 };

describe('layoutLines', () => {
  const layout = layoutLines(spec(), opts);

  it('spaces the x positions evenly from one end of the width to the other', () => {
    expect(layout.xs).toHaveLength(4);
    expect(layout.xs[0]).toBeCloseTo(-5, 10);
    expect(layout.xs[3]).toBeCloseTo(5, 10);
    expect(layout.xs[1]! - layout.xs[0]!).toBeCloseTo(layout.xs[2]! - layout.xs[1]!, 10);
  });

  it('scales every value on a round maximum, so the same value has the same height in every series', () => {
    const a = layout.series[0]!;
    const b = layout.series[1]!;
    expect(a.segments[1]![1]!.y).toBeCloseTo(4, 10); // 4 on a scale that ends at 4
    expect(b.segments[0]![0]!.y).toBeCloseTo(2, 10);
  });

  it('breaks a series at a missing value: a gap is a gap, never a line down to zero', () => {
    const a = layout.series[0]!;
    expect(a.segments.map((s) => s.length)).toEqual([1, 2]);
    expect(layout.series[1]!.segments).toHaveLength(1);
  });

  it('puts each series in its own lane, centred on zero', () => {
    const [a, b] = layout.series;
    expect(a!.z + b!.z).toBeCloseTo(0, 10);
    expect(Math.abs(a!.z - b!.z)).toBeCloseTo(1, 10);
  });

  it('carries the name and the tone of each series', () => {
    expect(layout.series.map((s) => [s.name, s.tone])).toEqual([
      ['A', 'highlight'],
      ['B', 'muted']
    ]);
  });

  it('has the ticks of the height axis at round values', () => {
    expect(layout.ticks.map((t) => t.value)).toEqual([0, 1, 2, 3, 4]);
    expect(layout.ticks.map((t) => t.height)).toEqual([0, 1, 2, 3, 4]);
  });

  it('labels a few of the x positions, including the first and the last', () => {
    expect(layout.xTicks[0]).toEqual({ x: layout.xs[0], label: '2020' });
    expect(layout.xTicks.at(-1)).toEqual({ x: layout.xs[3], label: '2023' });
  });

  it('draws the band between the lower and the upper line where both exist', () => {
    const banded = layoutLines(spec({ band: { lower: [1, 1, null, 2], upper: [3, 3, null, 4] } }), opts);
    expect(banded.bands).toHaveLength(2); // the missing point splits it
    expect(banded.bands[0]!.upper).toHaveLength(2);
    expect(banded.bands[0]!.lower).toHaveLength(2);
    expect(banded.bands[0]!.upper[0]!.y).toBeGreaterThan(banded.bands[0]!.lower[0]!.y);
  });

  it('has no band without one', () => {
    expect(layout.bands).toEqual([]);
  });

  it('places the marker (the playhead year) at its x position', () => {
    expect(layoutLines(spec({ marker: 2 }), opts).markerX).toBeCloseTo(layout.xs[2]!, 10);
    expect(layout.markerX).toBeNull();
  });

  it('has nothing to draw for no series or no values', () => {
    expect(layoutLines(spec({ series: [] }), opts).series).toEqual([]);
    const empty = layoutLines(spec({ series: [{ name: 'A', values: [null, null], tone: 'muted' }], xLabels: ['1', '2'] }), opts);
    expect(empty.series[0]!.segments).toEqual([]);
  });
});
