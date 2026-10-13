import { describe, expect, it } from 'vitest';
import { TEXTURE_SIZE, splatWeights, tileTexture } from '../../src/scenes/andes/diorama/textures';

const mean = (data: Uint8Array, channel: number) => {
  let sum = 0;
  for (let i = channel; i < data.length; i += 4) sum += data[i]!;
  return sum / (data.length / 4);
};

describe('tileTexture', () => {
  it('is a small square texture, deterministic for a kind', () => {
    const a = tileTexture('grass');
    expect(a).toHaveLength(TEXTURE_SIZE * TEXTURE_SIZE * 4);
    expect(Array.from(tileTexture('grass'))).toEqual(Array.from(a));
    expect(Array.from(tileTexture('dirt'))).not.toEqual(Array.from(a));
  });

  it('tiles: the seam between the right edge and the left edge is no harder than an ordinary step inside', () => {
    for (const kind of ['grass', 'dirt', 'rock'] as const) {
      const t = tileTexture(kind);
      let seam = 0;
      let inner = 0;
      for (let y = 0; y < TEXTURE_SIZE; y += 1) {
        const at = (x: number) => t[(y * TEXTURE_SIZE + x) * 4 + 1]!;
        seam += Math.abs(at(0) - at(TEXTURE_SIZE - 1));
        for (let x = 1; x < TEXTURE_SIZE; x += 1) inner += Math.abs(at(x) - at(x - 1)) / (TEXTURE_SIZE - 1);
      }
      expect(seam).toBeLessThanOrEqual(inner * 1.6 + 2);
    }
  });

  it('paints the ground in the colors of the field: dry olive grass, brown earth, grey rock', () => {
    const grass = tileTexture('grass');
    expect(mean(grass, 1)).toBeGreaterThan(mean(grass, 2) + 20);
    const dirt = tileTexture('dirt');
    expect(mean(dirt, 0)).toBeGreaterThan(mean(dirt, 2) + 30);
    const rock = tileTexture('rock');
    expect(Math.abs(mean(rock, 0) - mean(rock, 2))).toBeLessThan(25);
  });

  it('is opaque and not flat', () => {
    const t = tileTexture('grass');
    for (let i = 3; i < t.length; i += 4) expect(t[i]).toBe(255);
    const greens = new Set<number>();
    for (let i = 1; i < t.length; i += 4) greens.add(t[i]!);
    expect(greens.size).toBeGreaterThan(8);
  });
});

describe('splatWeights', () => {
  it('always adds up to one', () => {
    for (const [h, s, m] of [[0, 0, 0.5], [60, 0.2, 0.1], [140, 0.6, 0.9], [20, 1, 0]] as const) {
      const w = splatWeights(h, s, m);
      expect(w[0] + w[1] + w[2]).toBeCloseTo(1, 6);
      for (const x of w) expect(x).toBeGreaterThanOrEqual(0);
    }
  });

  it('puts rock on a steep slope and grass on a gentle low one', () => {
    const steep = splatWeights(40, 0.8, 0.5);
    expect(steep[2]).toBeGreaterThan(steep[0]);
    expect(steep[2]).toBeGreaterThan(0.5);
    const meadow = splatWeights(8, 0.02, 0.2);
    expect(meadow[0]).toBeGreaterThan(meadow[2]);
  });

  it('blends softly: a small change of slope is a small change of weight', () => {
    const a = splatWeights(50, 0.3, 0.5);
    const b = splatWeights(50, 0.31, 0.5);
    for (let i = 0; i < 3; i += 1) expect(Math.abs(a[i]! - b[i]!)).toBeLessThan(0.1);
  });
});
