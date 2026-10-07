import { fitRadius } from '../charts3d/camera';

export const FOV = 32;

export interface FixedView {
  position: [number, number, number];
  target: [number, number, number];
}

interface FixedViewOptions {
  /** the polar angle from the top, in radians: 0 looks straight down, π/2 is level */
  phi: number;
  /** air around the extent (default 1.08) */
  margin?: number;
  target?: [number, number, number];
}

/** The one camera of a Recorrido 3D chart: in front of the target (looking toward -z) and above it, far enough for `extent` to fill the screen. */
export function fixedView(extent: { width: number; height: number }, aspect: number, o: FixedViewOptions): FixedView {
  const target = o.target ?? [0, 0, 0];
  const radius = fitRadius(extent, FOV, aspect, o.margin);
  return {
    target,
    position: [target[0], target[1] + radius * Math.cos(o.phi), target[2] + radius * Math.sin(o.phi)]
  };
}
