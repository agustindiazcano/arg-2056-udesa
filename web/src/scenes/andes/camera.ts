import { sampleElevation } from '../../terrain/decode';
import type { Terrain } from '../../types/terrain';
import type { CameraState } from '../../charts3d/camera';
import { toScene } from './terrainMesh';
import type { SceneScale } from './terrainMesh';

/** The start pose: the whole terrain in the frame, seen from the south-east at a slope. */
export function overviewPose(scale: SceneScale): CameraState {
  return { x: 0, y: (scale.exaggeration * 1800) / scale.metersPerUnit, z: 0, theta: 0.35, phi: 0.95, radius: scale.depth * 1.25 };
}

/**
 * Where the camera goes when an event is chosen: looking at the event on the ground, much closer than the overview. The
 * height is the terrain's at that point; outside the terrain the event's altitude, and then the lowest point (never 0).
 */
export function battlePose(
  scale: SceneScale,
  terrain: Terrain,
  event: { lon: number; lat: number; elevation_m: number | null }
): CameraState {
  const ground = sampleElevation(terrain, event.lon, event.lat) ?? event.elevation_m ?? terrain.meta.elevation_min_m;
  const at = toScene(scale, event.lon, event.lat, ground);
  return { x: at.x, y: at.y, z: at.z, theta: 0.5, phi: 0.85, radius: scale.depth * 0.5 };
}

/** The camera that follows the army: its target is the army, the angle the camera already has around it is kept (within a range that reads well), and it is closer than the overview. */
export function followPose(scale: SceneScale, army: { x: number; y: number; z: number }, current: CameraState): CameraState {
  return {
    x: army.x,
    y: army.y,
    z: army.z,
    theta: current.theta,
    phi: Math.min(1.2, Math.max(0.5, current.phi)),
    radius: scale.depth * 0.55
  };
}

/** Distance (scene units) of the close-up on the army: nearer than where the figures replace the marker. */
const CLOSE_RADIUS = 2;

/** The camera right next to the army, where the column of figures can be seen marching; the turn the camera has is kept. */
export function closePose(_scale: SceneScale, army: { x: number; y: number; z: number }, current: CameraState): CameraState {
  return { x: army.x, y: army.y, z: army.z, theta: current.theta, phi: Math.min(1.2, Math.max(0.7, current.phi)), radius: CLOSE_RADIUS };
}

const TWO_PI = Math.PI * 2;

/**
 * The cinematic camera: it looks at `target` from `camera` (both places on the ground of the scene, chosen by the renderer along the
 * route so the camera stays in the valley), as an orbit pose. `k` (0 to 1) is how much of the way to the new angles and distance is taken
 * at this tick: the angle goes the short way around the circle.
 */
export function cinePose(target: { x: number; y: number; z: number }, camera: { x: number; y: number; z: number }, current: CameraState, k: number): CameraState {
  const dx = camera.x - target.x;
  const dy = camera.y - target.y;
  const dz = camera.z - target.z;
  const radius = Math.hypot(dx, dy, dz);
  const wantedTheta = Math.atan2(dx, dz);
  const wantedPhi = radius === 0 ? current.phi : Math.acos(Math.min(1, Math.max(-1, dy / radius)));
  let delta = (wantedTheta - current.theta) % TWO_PI;
  if (delta > Math.PI) delta -= TWO_PI;
  if (delta < -Math.PI) delta += TWO_PI;
  return {
    x: target.x,
    y: target.y,
    z: target.z,
    theta: current.theta + delta * k,
    phi: current.phi + (wantedPhi - current.phi) * k,
    radius: current.radius + (radius - current.radius) * k
  };
}

/**
 * The height the camera must have for the straight line to the target to clear the ground by `margin`: its own height, or higher
 * when a hill is in between (never lower). `heightAt` is the ground (x, z) in scene units.
 */
export function clearEye(
  eye: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
  heightAt: (x: number, z: number) => number,
  margin: number,
  samples = 16
): number {
  let y = eye.y;
  for (let i = 1; i < samples; i += 1) {
    const t = i / samples;
    const ground = heightAt(eye.x + (target.x - eye.x) * t, eye.z + (target.z - eye.z) * t) + margin;
    // the eye height at which the line passes exactly through `ground` at t
    y = Math.max(y, (ground - target.y * t) / (1 - t));
  }
  return y;
}

/** Where to look from `eye`: the target, or, with the camera past the horizon (`phi` above a right angle), as far above the horizon as it is past it. */
export function lookPoint(
  eye: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
  phi: number
): { x: number; y: number; z: number } {
  if (phi <= Math.PI / 2) return { x: target.x, y: target.y, z: target.z };
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dz = target.z - eye.z;
  const distance = Math.hypot(dx, dy, dz);
  const flat = Math.hypot(dx, dz);
  const hx = flat > 1e-9 ? dx / flat : 0;
  const hz = flat > 1e-9 ? dz / flat : -1;
  const pitch = phi - Math.PI / 2;
  return {
    x: eye.x + hx * Math.cos(pitch) * distance,
    y: eye.y + Math.sin(pitch) * distance,
    z: eye.z + hz * Math.cos(pitch) * distance
  };
}

/** What the user has done to the cinematic camera: a turn and a tilt in radians, and a zoom as a factor of the distance. */
export interface Steer {
  theta: number;
  phi: number;
  zoom: number;
}
export const NO_STEER: Steer = { theta: 0, phi: 0, zoom: 1 };

/** The steer after the user moved the camera from where it was `left` to where it is `now` (the cinematic camera writes the rest). */
export function addSteer(steer: Steer, left: CameraState, now: CameraState): Steer {
  let dTheta = (now.theta - left.theta) % TWO_PI;
  if (dTheta > Math.PI) dTheta -= TWO_PI;
  if (dTheta < -Math.PI) dTheta += TWO_PI;
  return {
    theta: steer.theta + dTheta,
    phi: steer.phi + (now.phi - left.phi),
    zoom: left.radius > 0 ? steer.zoom * (now.radius / left.radius) : steer.zoom
  };
}

/** Where the camera ends up: the cinematic pose with the steer of the user on top; the target is the cinematic one. */
export function steered(base: CameraState, steer: Steer, phiMax: number): CameraState {
  return {
    x: base.x,
    y: base.y,
    z: base.z,
    theta: base.theta + steer.theta,
    phi: Math.min(phiMax, Math.max(0.05, base.phi + steer.phi)),
    radius: base.radius * steer.zoom
  };
}
