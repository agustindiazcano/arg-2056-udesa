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
  return { x: at.x, y: at.y, z: at.z, theta: 0.5, phi: 0.85, radius: scale.depth * 0.3 };
}
