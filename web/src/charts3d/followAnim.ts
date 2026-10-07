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

/** The numbers of the camera of the bars that follow the clock: angles in radians, distances as a fraction of the distance of the whole chart. */
export interface BarsView {
  /** horizontal turn: 0 looks at the chart from the front */
  theta: number;
  /** tilt from the top: 0 looks straight down, π/2 is level with the chart */
  phi: number;
  /** distance while the years go by, and at the end (a little farther, never the whole chart) */
  near: number;
  end: number;
  /** added to the height the camera looks at */
  height: number;
  /** the lens, in degrees: a small one flattens the perspective */
  fov: number;
}

/** The view the human chose with the tuner (turn 0°, tilt 89°, near 0.46, end 0.32, height -0.3, lens 32°). */
export const DEFAULT_BARS_VIEW: BarsView = { theta: 0, phi: (89 * Math.PI) / 180, near: 0.46, end: 0.32, height: -0.3, fov: 32 };

/**
 * The camera of a bar chart that follows one bar (`bar`: its place along x and the height of its top): it looks at the bar from
 * close while the years go by and, at the end (`out` from 0 to 1), pulls back a little, not to the whole chart, and stays on the bar.
 * `tune` overrides the distances and the height (the numbers of the tuner); the angles are those of `base`.
 */
export function barsFocus(base: FocusPose, bar: { x: number; top: number }, out: number, tune: Partial<Pick<BarsView, 'near' | 'end' | 'height'>> = {}): FocusPose {
  const near = tune.near ?? DEFAULT_BARS_VIEW.near;
  const end = tune.end ?? DEFAULT_BARS_VIEW.end;
  return {
    ...base,
    x: bar.x,
    y: Math.min(0.8 + bar.top * 0.3, 1.3) + (tune.height ?? 0),
    radius: lerp(base.radius * near, base.radius * end, out)
  };
}
