import type { CameraState } from '../../../charts3d/camera';
import { FIELD, LOOKOUT, WORLD_UNIT_M, heightAt, toWorld } from './field';

/** The terrain is drawn this many times taller than it is, the way a diorama is: a hill of 130 m would be a bump of 1.3 units over a field 48 units wide. */
export const VERTICAL_EXAGGERATION = 1.7;

/** The ground height of a point of the scene, in scene units, from its height in meters. */
export const groundUnits = (heightM: number) => (heightM * VERTICAL_EXAGGERATION) / WORLD_UNIT_M;

export type DioramaViewId = 'mirador' | 'frente' | 'aerea' | 'flanco' | 'sanmartin';

export interface DioramaView {
  id: DioramaViewId;
  label: string;
  pose: CameraState;
}

/**
 * The cameras of the diorama. Scene axes: x east, z south, y up. A pose looks at a target from `radius` away; `theta` 0 puts the camera south of the target looking north,
 * `theta` π puts it north of the target looking south (from the patriot side, over the hill of the lookout).
 */
export const DIORAMA_VIEWS: readonly DioramaView[] = [
  { id: 'mirador', label: 'Desde el mirador', pose: { x: -3.5, y: 0, z: 0, theta: Math.PI, phi: 1.2, radius: 28 } },
  { id: 'frente', label: 'Desde los realistas', pose: { x: 0, y: 1, z: -2, theta: 0, phi: 1.25, radius: 26 } },
  { id: 'flanco', label: 'Desde el flanco', pose: { x: 0, y: 1, z: 0, theta: -Math.PI / 2, phi: 1.25, radius: 30 } },
  { id: 'aerea', label: 'Aérea', pose: { x: 0, y: 0, z: 0, theta: Math.PI, phi: 0.55, radius: 64 } },
  { id: 'sanmartin', label: 'San Martín', pose: { x: toWorld(LOOKOUT.eastM, LOOKOUT.northM).x + 0.3, y: groundUnits(heightAt(LOOKOUT.eastM, LOOKOUT.northM)) + 0.5, z: toWorld(LOOKOUT.eastM, LOOKOUT.northM).z + 0.9, theta: Math.PI + 0.35, phi: 1.3, radius: 4.2 } }
];

/** The first view: over the shoulder of San Martín, looking south at the field. */
export const DEFAULT_VIEW = DIORAMA_VIEWS[0]!;

/** Where the camera target may go: over the field and a little above it. */
export const TARGET_BOX = {
  minX: -(FIELD.halfEastM / WORLD_UNIT_M),
  maxX: FIELD.halfEastM / WORLD_UNIT_M,
  minY: 0,
  maxY: 30,
  minZ: -(FIELD.halfNorthM / WORLD_UNIT_M),
  maxZ: FIELD.halfNorthM / WORLD_UNIT_M
};
