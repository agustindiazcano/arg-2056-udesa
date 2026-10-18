import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { linesSpec } from '../../src/charts3d/specs';

describe('3D tips follow the head of a line', () => {
  it('a Line3D can carry the place of every year next to its flag', () => {
    const spec = linesSpec({
      title: 't',
      unit: 'u',
      xLabels: ['2000', '2001'],
      follow: true,
      series: [{ name: 'A', values: [1, 2], tone: 'highlight', tip: { flag: '/flags/ar.svg', rank: 2, ranks: [3, 2] } }]
    });
    expect(spec.series[0]!.tip?.ranks).toEqual([3, 2]);
  });

  it('the followed-line renderer shows the label while the line draws instead of hiding it until the end', () => {
    const src = readFileSync('src/three/Lines3D.tsx', 'utf8');
    expect(src).toMatch(/followTips\.push/);
    expect(src).toMatch(/setRank/);
  });
});
