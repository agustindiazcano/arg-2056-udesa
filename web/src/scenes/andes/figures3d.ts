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
  update: (leaderArc: number, gaitPhase?: number, gaitAmount?: number) => void;
}

/**
 * The column of figures as ONE instanced mesh of boxes (the parts of `figureParts`, a color per instance). `ground` gives the
 * height of the terrain under a point, or null outside it (the figure then keeps the height of the route). Nothing is allocated
 * in `update`: the pose of a figure is a function of where it is on the route, so it marches as the days go by and stands still when they stop (or, with a `gaitPhase`, at the pace of that clock).
 */
export function createFigureColumn(count: number, path: Path, ground: (x: number, z: number) => number | null, figureScale = 1): FigureColumn {
  const slots: Slot[] = columnSlots(count);
  const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.9, metalness: 0 }), Math.max(1, instanceCount(slots)));
  mesh.frustumCulled = false;
  const color = new Color();
  let k = 0;
  for (const slot of slots) for (const part of FIGURE_PARTS[slot.kind]) mesh.setColorAt(k++, color.set(part.color).offsetHSL(0, 0, slot.tint));
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
  const one = new Vector3(figureScale, figureScale, figureScale);  const up = new Vector3(0, 1, 0);
  const across = new Vector3(1, 0, 0);

  const update = (leaderArc: number, gaitPhase?: number, gaitAmount = 1) => {
    let i = 0;
    slots.forEach((slot, n) => {
      const s = leaderArc - slot.along;
      sampleAlongExtended(path, s, sample);
      const cos = Math.cos(sample.heading);
      const sin = Math.sin(sample.heading);
      const x = sample.x + cos * slot.lateral;
      const z = sample.z - sin * slot.lateral;
      // with a `gaitPhase` (strides, from a clock) the legs keep their own pace whatever the speed of the army; without it they follow the distance walked
      const g = gaitAt(slot.kind, (gaitPhase ?? s / STRIDE) + n * PHASE_STEP, gaitAmount);
      position.set(x, (ground(x, z) ?? sample.y) + g.bob, z);
      base.compose(position, qHeading.setFromAxisAngle(up, sample.heading), one.setScalar(figureScale * slot.scale));
      for (const part of FIGURE_PARTS[slot.kind]) {
        const swings = part.leg ?? part.arm;
        if (swings) {
          // turns about its pivot (the top of the box unless it has its own): the centre of the box swings with the leg or the arm
          const angle = g.swing * swings;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const px = part.pivot ? part.pivot[0] : part.at[0];
          const py = part.pivot ? part.pivot[1] : part.at[1];
          const pz = part.pivot ? part.pivot[2] : part.at[2];
          const oy = part.pivot ? part.at[1] - py : -part.size[1] / 2;
          const oz = part.pivot ? part.at[2] - pz : 0;
          partAt.set(px, py + oy * cos - oz * sin, pz + oy * sin + oz * cos);
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
