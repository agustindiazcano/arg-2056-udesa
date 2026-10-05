import { positionAt } from './timeline';
import type { Route } from './timeline';

/** One place of the altitude profile of the crossing: how far along the route (0 to 1, by distance) and how high. */
export interface ProfilePoint {
  progress: number;
  altitudeM: number;
}

/**
 * The altitude along the whole route, sampled evenly over the days of the campaign and placed by distance walked. Empty when
 * there is nothing to draw: no route, no distance, or no altitude in the data (never a made-up 0).
 */
export function altitudeProfile(route: Route, samples = 120): ProfilePoint[] {
  if (route.points.length < 2 || route.totalKm <= 0) return [];
  // the even steps, and the day of every event, so a peak that falls between two steps is not missed
  const days = new Set<number>(route.points.map((p) => p.day_of_campaign));
  for (let i = 0; i <= samples; i += 1) days.add((route.lastDay * i) / samples);
  const out: ProfilePoint[] = [];
  for (const day of [...days].sort((a, b) => a - b)) {
    const p = positionAt(route, day);
    if (!p || p.altitudeM === null) return [];
    out.push({ progress: Math.min(1, Math.max(0, p.distanceKm / route.totalKm)), altitudeM: p.altitudeM });
  }
  return out;
}

/** The altitude at a progress, the points joined in a straight line and the ends held; null with no points. */
export function altitudeAtProgress(points: readonly ProfilePoint[], progress: number): number | null {
  if (points.length === 0) return null;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (progress <= first.progress) return first.altitudeM;
  if (progress >= last.progress) return last.altitudeM;
  let i = 0;
  while (i < points.length - 2 && points[i + 1]!.progress <= progress) i += 1;
  const a = points[i]!;
  const b = points[i + 1]!;
  const span = b.progress - a.progress;
  const t = span === 0 ? 0 : (progress - a.progress) / span;
  return a.altitudeM + (b.altitudeM - a.altitudeM) * t;
}

/** The size of the chart, its margins for the labels, and the altitudes at its bottom and top. */
export interface ProfileFrame {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  min: number;
  max: number;
}

/** A frame for the points: the bottom and the top are multiples of 500 m that hold every altitude. */
export function profileFrame(points: readonly ProfilePoint[], width: number, height: number): ProfileFrame {
  const altitudes = points.map((p) => p.altitudeM);
  const low = altitudes.length > 0 ? Math.min(...altitudes) : 0;
  const high = altitudes.length > 0 ? Math.max(...altitudes) : 1000;
  const min = Math.floor(low / 500) * 500;
  let max = Math.ceil(high / 500) * 500;
  if (max <= min) max = min + 500;
  return { width, height, padL: 34, padR: 8, padT: 8, padB: 16, min, max };
}

export const profileX = (frame: ProfileFrame, progress: number): number =>
  frame.padL + Math.min(1, Math.max(0, progress)) * (frame.width - frame.padL - frame.padR);

export const profileY = (frame: ProfileFrame, altitudeM: number): number => {
  const t = (Math.min(frame.max, Math.max(frame.min, altitudeM)) - frame.min) / (frame.max - frame.min);
  return frame.padT + (1 - t) * (frame.height - frame.padT - frame.padB);
};

/** The labelled gridlines: every 1,000 m inside the range. */
export function profileTicks(frame: ProfileFrame): number[] {
  const ticks: number[] = [];
  for (let a = Math.ceil(frame.min / 1000) * 1000; a <= frame.max; a += 1000) ticks.push(a);
  return ticks;
}

const at = (frame: ProfileFrame, p: ProfilePoint) => `${profileX(frame, p.progress).toFixed(1)} ${profileY(frame, p.altitudeM).toFixed(1)}`;

/** The line of the profile as an SVG path; empty with no points. */
export function profilePath(frame: ProfileFrame, points: readonly ProfilePoint[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${at(frame, p)}`).join(' ');
}

/** The same line closed down to the bottom of the plot, to be filled. */
export function profileAreaPath(frame: ProfileFrame, points: readonly ProfilePoint[]): string {
  if (points.length === 0) return '';
  const base = (frame.height - frame.padB).toFixed(1);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${profilePath(frame, points)} L${profileX(frame, last.progress).toFixed(1)} ${base} L${profileX(frame, first.progress).toFixed(1)} ${base} Z`;
}
