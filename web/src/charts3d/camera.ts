/**
 * The camera of a 3D view as pure math: an orbit around a target (azimuth `theta`, polar angle `phi` from the top,
 * distance `radius`). The functions change the state in place so that a pointer move allocates nothing; the renderer
 * only applies the result.
 */
export interface CameraState {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  radius: number;
}

/** The box the camera target may move in. */
export interface TargetBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface CameraLimits {
  start: CameraState;
  minRadius: number;
  maxRadius: number;
  minPhi: number;
  maxPhi: number;
  box: TargetBox;
}

/** Nearly top-down to almost horizontal. */
export const PHI_MIN = 0.05;
export const PHI_MAX = 1.55;
/** The zoom range, as a fraction of the start radius. */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 3;
/** Radians of azimuth and of polar angle per pixel of drag. */
export const ORBIT_X = 0.008;
export const ORBIT_Y = 0.006;
/** The zoom of one `+` or `-` button press and of one wheel notch. */
export const BUTTON_ZOOM = 0.8;
export const WHEEL_ZOOM = 0.08;

export type CameraPreset = 'top' | 'perspective';

const TWO_PI = Math.PI * 2;

export function copyCamera(s: CameraState): CameraState {
  return { x: s.x, y: s.y, z: s.z, theta: s.theta, phi: s.phi, radius: s.radius };
}

/** The limits for a view that starts at `start`: the zoom range from the start radius and the target box. */
export function cameraLimits(start: CameraState, box: TargetBox): CameraLimits {
  return { start: copyCamera(start), minRadius: start.radius * ZOOM_MIN, maxRadius: start.radius * ZOOM_MAX, minPhi: PHI_MIN, maxPhi: PHI_MAX, box };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function clampTarget(s: CameraState, b: TargetBox) {
  s.x = clamp(s.x, b.minX, b.maxX);
  s.y = clamp(s.y, b.minY, b.maxY);
  s.z = clamp(s.z, b.minZ, b.maxZ);
}

/** Drag by (`dx`, `dy`) pixels: the azimuth turns without limit (wrapped into -pi..pi), the polar angle is clamped. */
export function orbit(s: CameraState, dx: number, dy: number, l: CameraLimits): void {
  const t = s.theta - dx * ORBIT_X;
  s.theta = t - TWO_PI * Math.floor((t + Math.PI) / TWO_PI);
  s.phi = clamp(s.phi - dy * ORBIT_Y, l.minPhi, l.maxPhi);
}

/** World size of half the view height at the target plane. */
const halfHeight = (radius: number, fovDeg: number) => Math.tan((fovDeg * Math.PI) / 360) * radius;

/** Drag by (`dx`, `dy`) pixels of a view `viewHeight` pixels tall: the scene follows the pointer; the target stays in the box. */
export function pan(s: CameraState, dx: number, dy: number, viewHeight: number, fovDeg: number, l: CameraLimits): void {
  const perPixel = (2 * halfHeight(s.radius, fovDeg)) / Math.max(1, viewHeight);
  const sinT = Math.sin(s.theta);
  const cosT = Math.cos(s.theta);
  const sinP = Math.sin(s.phi);
  const cosP = Math.cos(s.phi);
  // the camera axes: right = (cosT, 0, -sinT), up = (-cosP sinT, sinP, -cosP cosT)
  const mx = -dx * perPixel;
  const my = dy * perPixel;
  s.x += cosT * mx - cosP * sinT * my;
  s.y += sinP * my;
  s.z += -sinT * mx - cosP * cosT * my;
  clampTarget(s, l.box);
}

/** Scale the distance by `factor` (below 1 is closer), clamped to the radius range. */
export function zoomBy(s: CameraState, factor: number, l: CameraLimits): void {
  s.radius = clamp(s.radius * factor, l.minRadius, l.maxRadius);
}

/**
 * Zoom by `factor` keeping the point of the target plane under the cursor fixed on the screen. The cursor is in
 * normalized device coordinates (-1 to 1, y up). A clamped zoom moves the target only as much as the radius changed.
 */
export function zoomAt(s: CameraState, factor: number, ndcX: number, ndcY: number, aspect: number, fovDeg: number, l: CameraLimits): void {
  const before = s.radius;
  zoomBy(s, factor, l);
  const f = s.radius / before;
  const half = halfHeight(before, fovDeg);
  const ox = ndcX * half * aspect * (1 - f);
  const oy = ndcY * half * (1 - f);
  const sinT = Math.sin(s.theta);
  const cosT = Math.cos(s.theta);
  const sinP = Math.sin(s.phi);
  const cosP = Math.cos(s.phi);
  s.x += cosT * ox - cosP * sinT * oy;
  s.y += sinP * oy;
  s.z += -sinT * ox - cosP * cosT * oy;
  clampTarget(s, l.box);
}

/** Back to the start pose. */
export function resetCamera(s: CameraState, l: CameraLimits): void {
  s.x = l.start.x;
  s.y = l.start.y;
  s.z = l.start.z;
  s.theta = l.start.theta;
  s.phi = l.start.phi;
  s.radius = l.start.radius;
}

/** "Cenital" looks straight down from the start distance; "Perspectiva" is the start pose. */
export function presetCamera(s: CameraState, preset: CameraPreset, l: CameraLimits): void {
  resetCamera(s, l);
  if (preset === 'top') s.phi = l.minPhi;
}

/** Where a world point appears on the screen of the camera `s`, in normalized device coordinates. Used to check the zoom. */
export function ndcOf(s: CameraState, p: { x: number; y: number; z: number }, aspect: number, fovDeg: number): { x: number; y: number } {
  const sinT = Math.sin(s.theta);
  const cosT = Math.cos(s.theta);
  const sinP = Math.sin(s.phi);
  const cosP = Math.cos(s.phi);
  const cam = { x: s.x + s.radius * sinP * sinT, y: s.y + s.radius * cosP, z: s.z + s.radius * sinP * cosT };
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  const dz = p.z - cam.z;
  const fwd = { x: -sinP * sinT, y: -cosP, z: -sinP * cosT };
  const depth = dx * fwd.x + dy * fwd.y + dz * fwd.z;
  const px = dx * cosT - dz * sinT;
  const py = dx * -cosP * sinT + dy * sinP + dz * -cosP * cosT;
  const t = Math.tan((fovDeg * Math.PI) / 360);
  return { x: px / (depth * t * aspect), y: py / (depth * t) };
}

/** `out` = the pose between `a` and `b` at `t` (0 to 1); the azimuth goes the short way round. */
export function blendCamera(out: CameraState, a: CameraState, b: CameraState, t: number): void {
  let d = b.theta - a.theta;
  d -= TWO_PI * Math.round(d / TWO_PI);
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  out.theta = a.theta + d * t;
  out.phi = a.phi + (b.phi - a.phi) * t;
  out.radius = a.radius + (b.radius - a.radius) * t;
}
