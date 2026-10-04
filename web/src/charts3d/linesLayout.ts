import { niceCeil } from './layout';
import type { Lines3DSpec, LinesLayout } from './types';

interface LinesOpts {
  /** width of the plot in scene units */
  width: number;
  /** height of the scale (the nice maximum) in scene units */
  maxHeight: number;
  /** distance between the lanes of two series */
  laneGap: number;
}

type P = { x: number; y: number };

/** Splits a list of values at its gaps into runs of points; a run of one point cannot be a line but is kept. */
function runs(values: Array<number | null>, xs: number[], y: (v: number) => number): P[][] {
  const out: P[][] = [];
  let current: P[] = [];
  values.forEach((v, i) => {
    if (v === null || v === undefined || !Number.isFinite(v)) {
      if (current.length > 0) out.push(current);
      current = [];
    } else current.push({ x: xs[i]!, y: y(v) });
  });
  if (current.length > 0) out.push(current);
  return out;
}

/**
 * Where everything of a 3D line chart goes: the points of each series in its own lane, broken at the missing values
 * (a gap is a gap), the band between two lines where both exist, the ticks and the marker. All series share one scale
 * that ends at a round number. Pure: the renderer only places what this returns.
 */
export function layoutLines(spec: Lines3DSpec, opts: LinesOpts): LinesLayout {
  const { width, maxHeight, laneGap } = opts;
  const n = spec.xLabels.length;
  const xs = spec.xLabels.map((_, i) => (n <= 1 ? 0 : -width / 2 + (i * width) / (n - 1)));

  const all: number[] = [];
  for (const s of spec.series) for (const v of s.values) if (v !== null && Number.isFinite(v)) all.push(v);
  if (spec.band) for (const v of [...spec.band.lower, ...spec.band.upper]) if (v !== null && Number.isFinite(v)) all.push(v);
  const top = all.length === 0 ? 1 : niceCeil(Math.max(...all));
  const y = (v: number) => (Math.max(v, 0) / top) * maxHeight;

  const lanes = spec.series.length;
  const series = spec.series.map((s, i) => ({
    name: s.name,
    tone: s.tone,
    z: (i - (lanes - 1) / 2) * laneGap,
    segments: runs(s.values, xs, y)
  }));

  const bands: LinesLayout['bands'] = [];
  if (spec.band) {
    let upper: P[] = [];
    let lower: P[] = [];
    const flush = () => {
      if (upper.length > 0) bands.push({ upper, lower });
      upper = [];
      lower = [];
    };
    spec.band.lower.forEach((lo, i) => {
      const hi = spec.band!.upper[i];
      if (lo === null || hi === null || hi === undefined || !Number.isFinite(lo) || !Number.isFinite(hi)) flush();
      else {
        lower.push({ x: xs[i]!, y: y(lo) });
        upper.push({ x: xs[i]!, y: y(hi) });
      }
    });
    flush();
  }

  const ticks = [0, 1, 2, 3, 4].map((i) => ({ value: (top * i) / 4, height: (maxHeight * i) / 4 }));
  // about five labels along x, always the first and the last
  const every = Math.max(1, Math.ceil((n - 1) / 4));
  const xTicks = spec.xLabels
    .map((label, i) => ({ x: xs[i]!, label, i }))
    .filter(({ i }) => i === 0 || i === n - 1 || i % every === 0)
    .map(({ x, label }) => ({ x, label }));

  return { xs, series, bands, ticks, xTicks, markerX: spec.marker === undefined || spec.marker < 0 || spec.marker >= n ? null : xs[spec.marker]!, top };
}
