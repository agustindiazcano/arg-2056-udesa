/** A polyline in scene units (x, y, z per point) with the arc length at every point, to place things by distance along it. */
export interface Path {
  points: Float32Array;
  /** arc length from the first point, per point */
  cum: Float64Array;
  length: number;
}

/** Where a sample of the path is, and the direction of travel there (radians, `atan2(dx, dz)` on the ground plane). */
export interface PathSample {
  x: number;
  y: number;
  z: number;
  heading: number;
}

export function buildPath(points: Float32Array): Path {
  const n = Math.floor(points.length / 3);
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i += 1) {
    const j = i * 3;
    cum[i] = cum[i - 1]! + Math.hypot(points[j]! - points[j - 3]!, points[j + 1]! - points[j - 2]!, points[j + 2]! - points[j - 1]!);
  }
  return { points, cum, length: n > 0 ? cum[n - 1]! : 0 };
}

/** The arc length at a fractional index of the points (clamped to the path). */
export function arcAt(path: Path, index: number): number {
  const n = path.cum.length;
  if (n === 0) return 0;
  const f = Math.min(n - 1, Math.max(0, index));
  const i = Math.min(n - 2, Math.floor(f));
  if (i < 0) return 0;
  return path.cum[i]! + (path.cum[i + 1]! - path.cum[i]!) * (f - i);
}

/** The point at arc length `s` (clamped to the ends), written into `out`: nothing is allocated. */
export function sampleAlong(path: Path, s: number, out: PathSample): void {
  const { points, cum } = path;
  const n = cum.length;
  if (n === 0) return;
  if (n === 1) {
    out.x = points[0]!;
    out.y = points[1]!;
    out.z = points[2]!;
    out.heading = 0;
    return;
  }
  const d = Math.min(path.length, Math.max(0, s));
  // the last segment that starts at or before d and has some length
  let lo = 0;
  let hi = n - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid]! <= d) lo = mid;
    else hi = mid - 1;
  }
  while (lo < n - 2 && cum[lo + 1]! - cum[lo]! === 0) lo += 1;
  const a = lo * 3;
  const b = a + 3;
  const span = cum[lo + 1]! - cum[lo]!;
  const t = span === 0 ? 0 : Math.min(1, (d - cum[lo]!) / span);
  out.x = points[a]! + (points[b]! - points[a]!) * t;
  out.y = points[a + 1]! + (points[b + 1]! - points[a + 1]!) * t;
  out.z = points[a + 2]! + (points[b + 2]! - points[a + 2]!) * t;
  const dx = points[b]! - points[a]!;
  const dz = points[b + 2]! - points[a + 2]!;
  out.heading = dx === 0 && dz === 0 ? 0 : Math.atan2(dx, dz);
}
