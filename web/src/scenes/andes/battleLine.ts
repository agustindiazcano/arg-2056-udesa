import { columnSlots } from './column';
import type { Slot } from './column';

/** Scene units between two figures of a line (the same as the rows of the column). */
const SPACING = 0.13;
/** Figures of a rank of the infantry. */
const PER_RANK = 18;
/** The mules stand in ranks of this many. */
const MULES_PER_RANK = 6;
/** Cavalry per rank on each wing. */
const WING_RANK = 3;

export interface Offset {
  /** east (+) or west (-) of the center of the line, in scene units */
  x: number;
  /** toward the enemy (+, south) or behind the line (-), in scene units */
  z: number;
}

/**
 * Where each figure of a force stands when it forms to fight, relative to the center of its line, facing south: the infantry in a line across, in ranks one behind
 * the other (the first rank is the front, z 0); the cavalry apart from it, on both wings, in line with the front rank; the leader in front of the center;
 * the mules behind. The order of the result is the order of `slots`.
 */
export function battleSlots(slots: readonly Slot[]): Offset[] {
  const out: Offset[] = slots.map(() => ({ x: 0, z: 0 }));
  const foot = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.kind === 'foot' || s.kind === 'foot_afro');
  const horse = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.kind === 'rider' || s.kind === 'rider_black');
  const mules = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.kind === 'mule');

  const perRank = Math.max(1, Math.min(foot.length, PER_RANK));
  const ranks = Math.max(1, Math.ceil(foot.length / perRank));
  foot.forEach(({ i }, j) => {
    const rank = Math.floor(j / perRank);
    const inRank = Math.min(perRank, foot.length - rank * perRank);
    const col = j % perRank;
    out[i] = { x: (col - (inRank - 1) / 2) * SPACING, z: -rank * SPACING * 1.1 || 0 };
  });

  // the wings start beyond the widest rank of the infantry, with a gap
  const half = ((perRank - 1) / 2) * SPACING;
  const wingStart = half + 2.2 * SPACING;
  horse.forEach(({ i }, k) => {
    const side = k % 2 === 0 ? -1 : 1;
    const idx = Math.floor(k / 2);
    out[i] = { x: side * (wingStart + (idx % WING_RANK) * SPACING * 1.5), z: -Math.floor(idx / WING_RANK) * SPACING * 1.6 || 0 };
  });

  const behind = -(ranks - 1) * SPACING * 1.1 - 2.5 * SPACING;
  mules.forEach(({ i }, k) => {
    const rank = Math.floor(k / MULES_PER_RANK);
    const inRank = Math.min(MULES_PER_RANK, mules.length - rank * MULES_PER_RANK);
    out[i] = { x: ((k % MULES_PER_RANK) - (inRank - 1) / 2) * SPACING * 1.3, z: behind - rank * SPACING * 1.3 };
  });

  slots.forEach((s, i) => {
    if (s.kind === 'leader') out[i] = { x: 0, z: 1.6 * SPACING };
  });
  return out;
}

/** How wide the line of a force of `count` figures is, in scene units: from its west wing to its east wing. */
export function battleWidth(count: number): number {
  const offsets = battleSlots(columnSlots(count));
  if (offsets.length === 0) return 0;
  const xs = offsets.map((o) => o.x);
  return Math.max(...xs) - Math.min(...xs);
}
