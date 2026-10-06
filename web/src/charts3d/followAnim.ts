/** The timeline of a chart whose camera follows a line from its first year to its last and then pulls back to show it whole. */
export const FOLLOW_MS = 10000;
export const OUT_MS = 2000;
export const FOLLOW_TOTAL_MS = FOLLOW_MS + OUT_MS;

export interface FollowFrame {
  /** how much of the line is drawn, 0 to 1 (a steady pace: the years go by at the same speed) */
  reveal: number;
  /** how far the view has pulled back to the whole chart, 0 (close, following the line) to 1 (everything) */
  out: number;
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** Where the animation is `elapsedMs` after it started. */
export function followFrame(elapsedMs: number): FollowFrame {
  return { reveal: clamp01(elapsedMs / FOLLOW_MS), out: easeInOut(clamp01((elapsedMs - FOLLOW_MS) / OUT_MS)) };
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
