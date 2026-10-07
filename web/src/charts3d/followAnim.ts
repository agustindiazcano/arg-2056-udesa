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

interface FocusPose {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  radius: number;
}

/** How close the camera stands to a bar while the years go by, and how close it still is at the end, as fractions of the distance of the whole chart. */
export const FOCUS_NEAR = 0.42;
export const FOCUS_END = 0.5;

/**
 * The camera of a bar chart that follows one bar (`bar`: its place along x and the height of its top): it looks at the bar from
 * close while the years go by and, at the end (`out` from 0 to 1), pulls back a little, not to the whole chart, and stays on the bar.
 */
export function barsFocus(base: FocusPose, bar: { x: number; top: number }, out: number): FocusPose {
  return {
    ...base,
    x: bar.x,
    y: Math.min(0.8 + bar.top * 0.3, 1.3),
    radius: lerp(base.radius * FOCUS_NEAR, base.radius * FOCUS_END, out)
  };
}
