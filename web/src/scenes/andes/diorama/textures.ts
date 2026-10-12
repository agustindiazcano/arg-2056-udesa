/**
 * The small tileable textures that paint the diorama, made here from noise (no image files to license or download), and the weights that blend them. The game-development
 * technique: a few small textures that repeat, at two scales so the repetition does not show, blended softly by a weight per vertex (splatting) according to the height and
 * the slope of the ground.
 */
import { latticeHash } from './field';

/** The side of a texture, in pixels. Small on purpose: it repeats and the filter softens it. */
export const TEXTURE_SIZE = 64;

export type TileKind = 'grass' | 'dirt' | 'rock';

/** The base color and the spread of each kind: dry olive grass, the brown earth of the central valley of Chile, grey rock. */
const PALETTE: Record<TileKind, { base: readonly [number, number, number]; spread: number; seed: number }> = {
  grass: { base: [112, 122, 62], spread: 46, seed: 31 },
  dirt: { base: [152, 120, 82], spread: 40, seed: 47 },
  rock: { base: [126, 122, 114], spread: 52, seed: 59 }
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Noise that wraps around every `period` cells, so the texture has no seam. */
function periodicNoise(u: number, v: number, period: number, seed: number): number {
  const fx = u * period;
  const fy = v * period;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const wrap = (i: number) => ((i % period) + period) % period;
  const a = latticeHash(wrap(ix), wrap(iy), seed);
  const b = latticeHash(wrap(ix + 1), wrap(iy), seed);
  const c = latticeHash(wrap(ix), wrap(iy + 1), seed);
  const d = latticeHash(wrap(ix + 1), wrap(iy + 1), seed);
  const s = smooth(fx - ix);
  const t = smooth(fy - iy);
  return a + (b - a) * s + (c - a) * t + (a - b - c + d) * s * t;
}

/** An RGBA texture of `size` x `size` pixels that tiles. */
export function tileTexture(kind: TileKind, size: number = TEXTURE_SIZE): Uint8Array {
  const { base, spread, seed } = PALETTE[kind];
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      // three octaves, from broad patches to fine grain
      const n = 0.5 * periodicNoise(u, v, 4, seed) + 0.3 * periodicNoise(u, v, 8, seed + 1) + 0.2 * periodicNoise(u, v, 16, seed + 2);
      const shade = (n - 0.5) * spread;
      const k = (y * size + x) * 4;
      out[k] = Math.max(0, Math.min(255, base[0] + shade));
      out[k + 1] = Math.max(0, Math.min(255, base[1] + shade * 0.9));
      out[k + 2] = Math.max(0, Math.min(255, base[2] + shade * 0.7));
      out[k + 3] = 255;
    }
  }
  return out;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));

/**
 * The weights of [grass, dirt, rock] at a vertex, adding up to 1: rock on steep ground, earth on the high dry ground and where the large-scale noise `macro` (0 to 1) says
 * so, grass on the low gentle ground.
 */
export function splatWeights(heightM: number, slopeRad: number, macro: number): [number, number, number] {
  const rock = smoothstep(0.3, 0.62, slopeRad);
  const dirt = (1 - rock) * clamp01(smoothstep(40, 130, heightM) * 0.7 + smoothstep(0.45, 0.8, macro) * 0.5);
  const grass = Math.max(0, 1 - rock - dirt);
  const total = grass + dirt + rock || 1;
  return [grass / total, dirt / total, rock / total];
}
