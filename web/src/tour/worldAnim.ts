import { FOLLOW_MS, FOLLOW_TOTAL_MS, followFrame, lerp } from '../charts3d/followAnim.js';

/** The years that stay in view while the 2D chart follows the line. */
export const FOLLOW_WINDOW_YEARS = 30;

export interface SeriesFrame {
  /** the year the line has reached (a fraction of a year between two years) */
  year: number;
  xMin: number;
  xMax: number;
  yMax: number;
  /** how many points are drawn (the last one may be a partial step: see `partial`) */
  visibleCount: number;
}

/** The value of a series at a (fractional) year, interpolated between the two years around it. */
export function valueAt(years: number[], values: number[], year: number): number {
  if (year <= years[0]!) return values[0]!;
  const last = years.length - 1;
  if (year >= years[last]!) return values[last]!;
  let i = Math.floor(year - years[0]!);
  while (i < last && years[i + 1]! < year) i += 1;
  const t = (year - years[i]!) / (years[i + 1]! - years[i]!);
  return lerp(values[i]!, values[i + 1]!, t);
}

/** A round top for an axis: the next 1, 1.5, 2, 3, 4, 5, 7.5 or 10 times a power of ten. */
export function niceTop(value: number): number {
  const exp = Math.floor(Math.log10(Math.max(value, 1e-9)));
  const f = value / 10 ** exp;
  const nice = [1, 1.5, 2, 3, 4, 5, 7.5, 10].find((n) => n >= f - 1e-9) ?? 10;
  return nice * 10 ** exp;
}

/**
 * The view of the 2D chart `elapsedMs` after the animation began: a window of a few decades that ends a little after the year
 * the line has reached, with the vertical scale that fits what is in it; once the line gets to the last year the window opens
 * to the whole chart.
 */
export function seriesFrame(elapsedMs: number, years: number[], values: number[]): SeriesFrame {
  const first = years[0]!;
  const last = years[years.length - 1]!;
  const { reveal, out } = followFrame(elapsedMs);
  const year = lerp(first, last, reveal);
  const followMin = Math.max(first, year - FOLLOW_WINDOW_YEARS * 0.75);
  const followMax = followMin + FOLLOW_WINDOW_YEARS;
  let top = 0;
  for (let i = 0; i < years.length && years[i]! <= year; i += 1) if (years[i]! >= followMin) top = Math.max(top, values[i]!);
  top = Math.max(top, valueAt(years, values, year));
  const followTop = niceTop(top * 1.25);
  const fullTop = niceTop(Math.max(...values) * 1.1);
  return {
    year,
    xMin: lerp(followMin, first, out),
    xMax: lerp(followMax, last + 2, out),
    yMax: lerp(followTop, fullTop, out),
    visibleCount: years.filter((y) => y <= year).length
  };
}

const FIRST = 1900;
const LAST = 2026;

/** The moment of the animation at which the line has reached a year: the last year is the end, with the view already pulled back. */
export function elapsedForYear(year: number, first = FIRST, last = LAST): number {
  if (year >= last) return FOLLOW_TOTAL_MS;
  return ((Math.max(year, first) - first) / (last - first)) * FOLLOW_MS;
}

/** The year the line has reached `elapsedMs` after the animation began (the inverse of `elapsedForYear`, up to the end of the drawing). */
export function yearAtElapsed(elapsedMs: number, first = FIRST, last = LAST): number {
  return lerp(first, last, followFrame(elapsedMs).reveal);
}
