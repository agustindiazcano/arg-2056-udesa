import { describe, expect, it } from 'vitest';
import { terrainBox } from '../../src/scenes/andes/terrainBox';

const pts = [
  { lon: -68.9, lat: -32.9 },
  { lon: -70.1, lat: -32.77 },
  { lon: -70.5, lat: -33.4 }
];

describe('terrainBox', () => {
  it('covers every event with a margin of 0.6 degrees on each side', () => {
    const box = terrainBox(pts);
    [-71.1, -34, -68.3, -32.17].forEach((v, i) => expect(box[i]).toBeCloseTo(v, 10));
  });

  it('has a default box when there are no events', () => {
    const [w, s, e, n] = terrainBox([]);
    expect(e).toBeGreaterThan(w);
    expect(n).toBeGreaterThan(s);
  });
});
