import type { Bar3D, BarsLayout } from './types';

interface LayoutOpts {
  /** height of the scale (the nice maximum), in scene units */
  maxHeight: number;
  barWidth: number;
  gap: number;
  depth?: number;
}

/** A value with a bar that is not drawn as a bar: zero or negative gets a flat sliver, never a bar going down. */
const SLIVER = 0.03;

const NICE = [1, 2, 4, 5, 8, 10];

/** The smallest round number (1, 2, 4, 5 or 8 times a power of ten) that is at least `value`. */
export function niceCeil(value: number): number {
  if (!(value > 0)) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const f = value / base;
  const nice = NICE.find((n) => n >= f - 1e-9) ?? 10;
  return nice * base;
}

/**
 * Where each bar goes: along x, centred on zero, with a height proportional to its value on a scale that ends at a
 * round number (so the ticks of the height axis are round). Pure: the renderer only places what this returns.
 */
export function layoutBars(bars: Bar3D[], opts: LayoutOpts): BarsLayout {
  if (bars.length === 0) return { items: [], width: 0, max: 0, ticks: [] };
  const { maxHeight, barWidth, gap, depth = barWidth } = opts;
  const max = Math.max(...bars.map((b) => b.value));
  const top = niceCeil(max);
  const width = bars.length * barWidth + (bars.length - 1) * gap;
  const items = bars.map((b, i) => ({
    x: -width / 2 + barWidth / 2 + i * (barWidth + gap),
    height: b.value > 0 ? (b.value / top) * maxHeight : SLIVER,
    width: barWidth,
    depth,
    label: b.label,
    display: b.display,
    short: b.short,
    highlight: b.highlight
  }));
  const ticks = [0, 1, 2, 3, 4].map((i) => ({ value: (top * i) / 4, height: (maxHeight * i) / 4 }));
  return { items, width, max, ticks };
}
