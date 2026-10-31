import { describe, expect, it } from 'vitest';
import { createFigureColumn } from '../../src/scenes/andes/figures3d';
import { buildPath } from '../../src/scenes/andes/pathAlong';

const path = buildPath(new Float32Array([0, 0, 0, 0, 0, 20]));

describe('detailed Andes formation', () => {
  it('spreads the whole column and battle line when detailed infantry is shown', () => {
    const column = createFigureColumn(20, path, () => 0);
    for (const formation of [null, { dx: 0 }]) {
      column.update(10, 0, 0, formation, false);
      const normal = column.infantryPoses.map(({ x, z }) => ({ x, z }));
      column.update(10, 0, 0, formation, true);
      const detailed = column.infantryPoses;
      const span = (poses: readonly { x: number; z: number }[]) =>
        Math.max(...poses.map((p) => p.x)) - Math.min(...poses.map((p) => p.x));
      expect(span(detailed)).toBeGreaterThan(span(normal) * 3);
      if (!formation) expect(detailed[1]!.z).toBeLessThan(normal[1]!.z);
    }
  });
});
