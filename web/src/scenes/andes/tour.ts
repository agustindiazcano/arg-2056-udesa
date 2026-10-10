import { clampView } from './cameraKeyframes';
import type { CameraView } from './cameraKeyframes';

/** One stop of the camera tour: where the camera is, as the five numbers saved with the camera tuner. */
export interface TourStop extends CameraView {
  name: string;
}

/** The tour the Andes open with: a far aerial view of the whole region, then the points the reader saved (the aerial view, the approach, and the tilt toward the valley of Mendoza). */
export const ANDES_TOUR: readonly TourStop[] = [
  { name: 'Vista aérea lejana', lon: -69.6, lat: -33, zoom: 4.4, pitch: 45, bearing: -20.2 },
  { name: 'Vista aérea', lon: -70.28148, lat: -31.73048, zoom: 6.05, pitch: 71, bearing: -20.2 },
  { name: 'Acercamiento 1', lon: -69.92981, lat: -32.0916, zoom: 6.36, pitch: 71, bearing: -20.2 },
  { name: 'Acercamiento 2', lon: -69.29779, lat: -32.50792, zoom: 7.1, pitch: 71, bearing: -20.2 },
  { name: 'Acercamiento 3', lon: -69.04351, lat: -32.77633, zoom: 7.71, pitch: 71, bearing: -20.2 },
  { name: 'Inclinación', lon: -69.04333, lat: -32.77674, zoom: 7.71, pitch: 76.5, bearing: -20.2 },
  { name: 'Mendoza', lon: -69.0816, lat: -32.89267, zoom: 8.32, pitch: 72.5, bearing: -18.6 }
];

/** Where the camera ends, over the main force, after the spotlight: the point the reader saved. */
export const ANDES_FINAL_VIEW: CameraView = { lon: -68.83449, lat: -32.80341, zoom: 12.14, pitch: 75.5, bearing: -33.8 };

/** Where the camera goes when the battle of Chacabuco is chosen: the view the reader saved, over the field where the lines stand. */
export const BATTLE_VIEW: CameraView = { lon: -70.69952, lat: -32.99905, zoom: 13.64, pitch: 77, bearing: -32 };

/** How the camera frames each force while its light is on: the same height and angle for all, centered on the force. */
export const SPOT_VIEW = { zoom: 8.2, pitch: 62, bearing: -20.2 };

/** How long the camera stays on the first view, when the loading screen has left, before it starts to move. */
export const TOUR_HOLD_MS = 1000;

const MIN_LEG_MS = 500;
const LEG_MS_PER_UNIT = 400;
const MAX_UNITS = 2;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** The way around from `from` to `to` in degrees, between -180 and 180. */
function shortestTurn(from: number, to: number): number {
  return ((((to - from + 180) % 360) + 360) % 360) - 180;
}

/** The time of every leg: a base plus a share that grows with how far the camera moves, zooms, tilts and turns, so a long move is not rushed and a tilt alone is quick. */
export function tourSegmentsMs(stops: readonly TourStop[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < stops.length; i += 1) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    const distance = Math.hypot((b.lon - a.lon) * Math.cos(rad((a.lat + b.lat) / 2)), b.lat - a.lat);
    const units = Math.min(MAX_UNITS, distance * 2 + Math.abs(b.zoom - a.zoom) * 0.6 + Math.abs(b.pitch - a.pitch) / 30 + Math.abs(shortestTurn(a.bearing, b.bearing)) / 60);
    out.push(Math.round(MIN_LEG_MS + LEG_MS_PER_UNIT * units));
  }
  return out;
}

export function tourDurationMs(stops: readonly TourStop[]): number {
  return tourSegmentsMs(stops).reduce((sum, ms) => sum + ms, 0);
}

/** A leg eases a little at its ends (60 % of a smoothstep over a straight line), so the camera breathes at the stops and does not stop dead. */
function ease(s: number): number {
  const smooth = s * s * (3 - 2 * s);
  return s + 0.6 * (smooth - s);
}

/**
 * The slope of a value at each stop, for a curve that never overshoots (monotone, as PCHIP): zero where the value stops or turns around (so a leg
 * that only changes the tilt does not drift sideways), the harmonic mean of the two legs around the stop elsewhere.
 */
function slopes(values: readonly number[]): number[] {
  const n = values.length;
  const d = values.slice(1).map((v, i) => v - values[i]!);
  const m: number[] = new Array<number>(n).fill(0);
  if (n < 2) return m;
  m[0] = d[0]!;
  m[n - 1] = d[n - 2]!;
  for (let i = 1; i < n - 1; i += 1) {
    const before = d[i - 1]!;
    const after = d[i]!;
    m[i] = before * after <= 0 ? 0 : (2 * before * after) / (before + after);
  }
  return m;
}

/** Cubic Hermite between two stops at `t` (0 to 1) with the slopes of the stops. */
function hermite(y0: number, y1: number, m0: number, m1: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1;
}

/** The camera `ms` after the tour started: it goes through every stop at the time its leg ends, along a smooth curve that does not overshoot (not stop and go), turning the short way around. */
export function tourPoseAt(stops: readonly TourStop[], ms: number): CameraView {
  const first = stops[0];
  if (!first) return { lon: 0, lat: 0, zoom: 0, pitch: 0, bearing: 0 };
  const legs = tourSegmentsMs(stops);
  if (legs.length === 0 || ms <= 0) return clampView(first);

  // the bearings unwrapped, so the curve never swings through the long way around
  const bearings = [first.bearing];
  for (let i = 1; i < stops.length; i += 1) bearings.push(bearings[i - 1]! + shortestTurn(bearings[i - 1]!, stops[i]!.bearing));

  let leg = 0;
  let rest = ms;
  while (leg < legs.length - 1 && rest > legs[leg]!) {
    rest -= legs[leg]!;
    leg += 1;
  }
  const s = ease(Math.min(1, rest / legs[leg]!));
  const along = (values: readonly number[]) => {
    const m = slopes(values);
    return hermite(values[leg]!, values[leg + 1]!, m[leg]!, m[leg + 1]!, s);
  };
  return clampView({
    lon: along(stops.map((p) => p.lon)),
    lat: along(stops.map((p) => p.lat)),
    zoom: along(stops.map((p) => p.zoom)),
    pitch: along(stops.map((p) => p.pitch)),
    bearing: along(bearings)
  });
}
