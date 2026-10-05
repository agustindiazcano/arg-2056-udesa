import { TERRAIN_RAMP } from '../../styles/tokens';

/**
 * The pieces of the procedural relief: deterministic noise, ridged octaves that look like a cordillera, the corridor
 * along the route where the ground stays gentle, and the color of the ground by height and slope. Pure: no randomness
 * (same seed, same mountains), nothing here touches WebGL.
 */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Smooth 0 to 1 step from `a` to `b` (either order). */
export function smooth(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** A hash of an integer cell and a seed, in 0 (included) to 1 (excluded). */
export function hash2(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041) + 1013904223) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function gradient(ix: number, iy: number, x: number, y: number, seed: number): number {
  const a = hash2(ix, iy, seed) * Math.PI * 2;
  return Math.cos(a) * x + Math.sin(a) * y;
}

/** Gradient noise, continuous, within -1 and 1. */
export function noise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = fade(xf);
  const v = fade(yf);
  const n00 = gradient(xi, yi, xf, yf, seed);
  const n10 = gradient(xi + 1, yi, xf - 1, yf, seed);
  const n01 = gradient(xi, yi + 1, xf, yf - 1, seed);
  const n11 = gradient(xi + 1, yi + 1, xf - 1, yf - 1, seed);
  const a = n00 + (n10 - n00) * u;
  const b = n01 + (n11 - n01) * u;
  return Math.max(-1, Math.min(1, a + (b - a) * v));
}

const OCTAVES = 6;
/** each octave has this share of the height of the one before: below 0.5 the fine crests do not turn into needles */
const PERSISTENCE = 0.42;

/** Ridged multifractal noise, 0 to 1: sharp crests where the noise crosses zero, finer crests on top of the coarse ones. */
export function ridged(x: number, y: number, seed: number): number {
  let f = 1;
  let a = 1;
  let sum = 0;
  let weights = 0;
  for (let o = 0; o < OCTAVES; o += 1) {
    const n = noise2(x * f + o * 17.3, y * f - o * 9.1, seed + o);
    const v = Math.max(1 - Math.abs(n) * 1.5, 0);
    sum += v * v * a;
    weights += a;
    a *= PERSISTENCE;
    f *= 2.05;
  }
  return sum / weights;
}

/** Mean of `ridged ** 1.5` over the terrain, so the relief goes both above and below the base ground. */
const RELIEF_MEAN = 0.2;
/** Cycles per scene unit of the coarsest crests. */
export const RELIEF_FREQUENCY = 0.3;

/** The height (scene units) the relief adds or takes at a point: both signs, in proportion to `amplitude`. */
export function reliefOffset(x: number, z: number, seed: number, amplitude: number): number {
  return (Math.pow(ridged(x * RELIEF_FREQUENCY, z * RELIEF_FREQUENCY, seed), 1.5) - RELIEF_MEAN) * amplitude;
}

/** How much of the relief is kept at a distance from the route: none up to `flat`, all from `full`, smooth in between. */
export function corridorFactor(distance: number, flat: number, full: number): number {
  return smooth(flat, full, distance);
}

const hexRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255
];
const RAMP = TERRAIN_RAMP.map(hexRgb);
const ROCK: [number, number, number] = [0.48, 0.45, 0.42];
const SNOW: [number, number, number] = [0.94, 0.96, 1];
const GRASS: [number, number, number] = [0.3, 0.45, 0.24];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The color of the ground: the natural ramp by height `t` (0 lowest, 1 highest), bare rock on steep slopes, snow on high ground
 * that is not too steep, grass in the low gentle valleys. `slope` is 0 flat to 1 vertical; `n1` and `n2` (-1 to 1, from noise) break up the bands.
 */
export function terrainColor(t: number, slope: number, n1: number, n2: number, out: { r: number; g: number; b: number }): void {
  const steps = RAMP.length - 1;
  const x = clamp01(t) * steps;
  const i = Math.min(steps - 1, Math.floor(x));
  const f = x - i;
  let r = mix(RAMP[i]![0], RAMP[i + 1]![0], f);
  let g = mix(RAMP[i]![1], RAMP[i + 1]![1], f);
  let b = mix(RAMP[i]![2], RAMP[i + 1]![2], f);

  const grass = smooth(0.3, 0.12, t + n1 * 0.04) * (1 - smooth(0.18, 0.42, slope));
  r = mix(r, GRASS[0] + 0.05 * n2, grass);
  g = mix(g, GRASS[1] + 0.06 * n2, grass);
  b = mix(b, GRASS[2], grass);

  const grain = 1 + 0.12 * n2;
  const rock = smooth(0.3, 0.65, slope);
  r = mix(r, ROCK[0] * grain, rock);
  g = mix(g, ROCK[1] * grain, rock);
  b = mix(b, ROCK[2] * grain, rock);

  const snow = smooth(0.62, 0.78, t + n1 * 0.05) * (1 - smooth(0.5, 0.8, slope));
  r = mix(r, SNOW[0], snow);
  g = mix(g, SNOW[1], snow);
  b = mix(b, SNOW[2], snow);

  const shade = 0.82 + 0.18 * (1 - slope);
  out.r = clamp01(r * shade);
  out.g = clamp01(g * shade);
  out.b = clamp01(b * shade);
}

/** The color of the dirt of the trail, painted on the ground where the army walks. */
export const TRAIL_COLOR: [number, number, number] = [0.62, 0.52, 0.38];

/** How much of the trail color a point at `distance` from the route takes: all of it up to `core`, none from `edge`, smooth between. */
export function trailBlend(distance: number, core: number, edge: number): number {
  return 1 - smooth(core, edge, distance);
}

/**
 * Noise that tiles: `size` by `size` values from 0 to 1 whose last column meets the first (and the last row the first), built from a few
 * octaves of periodic value noise. It is the grain of the ground texture; deterministic for a seed.
 */
export function tileableNoise(size: number, seed: number): Float32Array {
  const out = new Float32Array(size * size);
  const octaves = [4, 8, 16];
  const weights = [0.5, 0.3, 0.2];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let v = 0;
      octaves.forEach((cells, o) => {
        const fx = (x / size) * cells;
        const fy = (y / size) * cells;
        const ix = Math.floor(fx);
        const iy = Math.floor(fy);
        const u = fade(fx - ix);
        const w = fade(fy - iy);
        const at = (cx: number, cy: number) => hash2(((cx % cells) + cells) % cells, ((cy % cells) + cells) % cells, seed + o * 31);
        const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * u;
        const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * u;
        v += (top + (bottom - top) * w) * weights[o]!;
      });
      out[y * size + x] = Math.min(1, Math.max(0, v));
    }
  }
  return out;
}
