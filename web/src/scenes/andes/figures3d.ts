import { BoxGeometry, Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { columnSlots, gaitAt } from './column';
import type { Slot } from './column';
import { FIGURE_PARTS, instanceCount } from './figureParts';
import { sampleAlongExtended } from './pathAlong';
import type { Path, PathSample } from './pathAlong';

/** Scene units of one stride: the legs complete a cycle over this much of the route. */
const STRIDE = 0.18;
/** Each figure starts its stride at its own point of the cycle (deterministic), so the column does not step as one. */
const PHASE_STEP = 0.37;

export interface FigureColumn {
  mesh: InstancedMesh;
  /** scene units from the head of the column to the last figure */
  length: number;
  /** puts every figure at its place with the head of the column at arc length `leaderArc` of the path */
  update: (leaderArc: number) => void;
}

/**
 * The column of figures as ONE instanced mesh of boxes (the parts of `figureParts`, a color per instance). `ground` gives the
 * height of the terrain under a point, or null outside it (the figure then keeps the height of the route). Nothing is allocated
 * in `update`: the pose of a figure is a function of where it is on the route, so it marches as the days go by and stands still when they stop.
 */
export function createFigureColumn(count: number, path: Path, ground: (x: number, z: number) => number | null, figureScale = 1): FigureColumn {
  const slots: Slot[] = columnSlots(count);
  const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.9, metalness: 0 }), Math.max(1, instanceCount(slots)));
  mesh.frustumCulled = false;
  const color = new Color();
  let k = 0;
  for (const slot of slots) for (const part of FIGURE_PARTS[slot.kind]) mesh.setColorAt(k++, color.set(part.color));
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.count = k;

  const sample: PathSample = { x: 0, y: 0, z: 0, heading: 0 };
  const base = new Matrix4();
  const local = new Matrix4();
  const qHeading = new Quaternion();
  const qPart = new Quaternion();
  const position = new Vector3();
  const partAt = new Vector3();
  const scale = new Vector3();
  const one = new Vector3(figureScale, figureScale, figureScale);
  const up = new Vector3(0, 1, 0);
  const across = new Vector3(1, 0, 0);

  const update = (leaderArc: number) => {
    let i = 0;
    slots.forEach((slot, n) => {
      const s = leaderArc - slot.along;
      sampleAlongExtended(path, s, sample);
      const cos = Math.cos(sample.heading);
      const sin = Math.sin(sample.heading);
      const x = sample.x + cos * slot.lateral;
      const z = sample.z - sin * slot.lateral;
      const g = gaitAt(slot.kind, s / STRIDE + n * PHASE_STEP);
      position.set(x, (ground(x, z) ?? sample.y) + g.bob, z);
      base.compose(position, qHeading.setFromAxisAngle(up, sample.heading), one);
      for (const part of FIGURE_PARTS[slot.kind]) {
        if (part.leg) {
          // hangs from its pivot: the centre of the box swings with the leg
          const angle = g.swing * part.leg;
          const half = part.size[1] / 2;
          partAt.set(part.at[0], part.at[1] - half * Math.cos(angle), part.at[2] - half * Math.sin(angle));
          qPart.setFromAxisAngle(across, angle);
        } else {
          partAt.set(part.at[0], part.at[1], part.at[2]);
          qPart.setFromAxisAngle(across, part.tilt ?? 0);
        }
        local.compose(partAt, qPart, scale.set(part.size[0], part.size[1], part.size[2]));
        mesh.setMatrixAt(i++, local.premultiply(base));
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return { mesh, update, length: slots.length > 0 ? slots[slots.length - 1]!.along : 0 };
}
