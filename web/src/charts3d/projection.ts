/** What a 3D view needs to show a projected title over it. */
export interface ProjectionRequest {
  title: string;
}

/** The extent of a chart in scene units: centred on x and z, standing on y = 0. */
export interface ProjectionBounds {
  width: number;
  depth: number;
  height: number;
}

/** Where the parts of the projection go, from the size of the chart. */
export interface ProjectionPose {
  planeWidth: number;
  planeDepth: number;
  titleY: number;
  beamHeight: number;
  beamRadius: number;
}

/** What the projection looks like at one moment. Opacities are 0 to 1; `titleRise` is how far below its place the title is. */
export interface ProjectionFrame {
  planeY: number;
  planeOpacity: number;
  titleOpacity: number;
  titleRise: number;
  beamOpacity: number;
}

/** The scan plane is wider than the chart by this much on every side. */
export const PROJECTION_MARGIN = 0.6;
/** The title floats this far above the top of the chart. */
export const TITLE_LIFT = 1.2;
/** One trip of the scan plane up and down. */
export const SWEEP_MS = 3200;
/** The title and the beam fade in over this time. */
export const INTRO_MS = 700;
/** The title starts this far below its place and rises. */
export const TITLE_RISE = 0.8;
/** The opacity of the beam of light from the title to the chart. */
export const BEAM_OPACITY = 0.1;

/** The tallest the title text is, in scene units. */
export const TITLE_MAX_HEIGHT = 0.8;
/** How wide a character of the title is, as a fraction of the text height (an average for the system font). */
const CHAR_ASPECT = 0.55;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Where the scan plane, the title and the beam go for a chart of this size. Pure: the renderer only places them. */
export function projectionPose(bounds: ProjectionBounds): ProjectionPose {
  const planeWidth = bounds.width + 2 * PROJECTION_MARGIN;
  const planeDepth = bounds.depth + 2 * PROJECTION_MARGIN;
  const titleY = bounds.height + TITLE_LIFT;
  return { planeWidth, planeDepth, titleY, beamHeight: titleY, beamRadius: Math.hypot(planeWidth, planeDepth) / 2 };
}

/** The height of the title text: as tall as the cap, or smaller so that its width fits 95% of the longest side of the chart. */
export function titleHeight(chars: number, bounds: ProjectionBounds): number {
  return Math.min(TITLE_MAX_HEIGHT, (0.95 * Math.max(bounds.width, bounds.depth)) / (Math.max(1, chars) * CHAR_ASPECT));
}

/** The height of the scan plane at a phase of the cycle (0 to 1): up to the top of the chart and back down. */
export function sweepHeight(phase: number, height: number): number {
  return height * (1 - Math.abs(2 * phase - 1));
}

/** The opacity of the scan plane at a phase of the cycle: faint at the ends, strongest at the top. */
export function sweepOpacity(phase: number): number {
  return 0.1 + 0.3 * Math.sin(Math.PI * phase);
}

/**
 * The projection `elapsedMs` after it started: the title rises and fades in, the beam appears and breathes, and a
 * scan plane travels up and down the chart for ever. Under reduced motion nothing moves: the title and the beam are
 * still and there is no scan plane.
 */
export function projectionFrame(elapsedMs: number, height: number, reduced: boolean): ProjectionFrame {
  if (reduced) return { planeY: 0, planeOpacity: 0, titleOpacity: 1, titleRise: 0, beamOpacity: BEAM_OPACITY };
  const intro = easeOutCubic(Math.min(1, Math.max(0, elapsedMs / INTRO_MS)));
  const phase = (elapsedMs % SWEEP_MS) / SWEEP_MS;
  return {
    planeY: sweepHeight(phase, height),
    planeOpacity: intro * sweepOpacity(phase),
    titleOpacity: intro,
    titleRise: (1 - intro) * TITLE_RISE,
    beamOpacity: intro * BEAM_OPACITY * (0.85 + 0.15 * Math.sin(2 * Math.PI * phase))
  };
}
