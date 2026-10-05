/**
 * A light snowstorm as pure math: how much snow falls at an altitude, and a field of flakes that fall and drift in a box around
 * a center (the camera). Flakes keep their world position, so moving the camera gives parallax; a flake that leaves the box comes
 * back in on the opposite side. Nothing here touches WebGL and nothing is random: the same seed makes the same snow.
 */
const SNOW_FROM = 2200;
const SNOW_FULL = 3600;
/** Scene units per second a flake of speed 1 falls. */
const FALL = 0.45;

/** How much snow falls at this altitude, 0 (none, or no altitude) to 1 (at the pass): it grows smoothly with the height. */
export function snowAmount(altitudeM: number | null): number {
  if (altitudeM === null) return 0;
  const t = Math.min(1, Math.max(0, (altitudeM - SNOW_FROM) / (SNOW_FULL - SNOW_FROM)));
  return t * t * (3 - 2 * t);
}

/** How many of `max` flakes the amount asks for. */
export function snowCount(amount: number, max: number): number {
  return Math.round(Math.min(1, Math.max(0, amount)) * max);
}

/** `v` brought into the range of `size` centred on `center`, shifted by whole sizes: [center - size/2, center + size/2). */
export function wrapAround(v: number, center: number, size: number): number {
  const lo = center - size / 2;
  return lo + ((((v - lo) % size) + size) % size);
}

/** An integer hash to 0 (included) up to 1 (excluded). */
function unit(n: number, salt: number): number {
  let x = (Math.imul(n + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0;
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0;
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

export interface SnowField {
  /** x, y, z of each flake */
  positions: Float32Array;
  /** how fast each falls, 0.6 to 1.4 times the base speed */
  speeds: Float32Array;
}

type Point = { x: number; y: number; z: number };

/** `count` flakes spread in a box `size` wide and `height` tall around `center`. */
export function snowField(count: number, seed: number, center: Point, size: number, height: number): SnowField {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = center.x + (unit(i, seed * 3 + 1) - 0.5) * size;
    positions[i * 3 + 1] = center.y + (unit(i, seed * 3 + 2) - 0.5) * height;
    positions[i * 3 + 2] = center.z + (unit(i, seed * 3 + 3) - 0.5) * size;
    speeds[i] = 0.6 + 0.8 * unit(i, seed * 3 + 4);
  }
  return { positions, speeds };
}

/** Moves every flake for `dt` seconds (down, and sideways with the wind) and keeps them in the box around `center`. */
export function stepSnow(field: SnowField, dt: number, wind: { x: number; z: number }, center: Point, size: number, height: number): void {
  const p = field.positions;
  for (let i = 0; i < field.speeds.length; i += 1) {
    const k = field.speeds[i]!;
    p[i * 3] = wrapAround(p[i * 3]! + wind.x * dt * k, center.x, size);
    p[i * 3 + 1] = wrapAround(p[i * 3 + 1]! - FALL * k * dt, center.y, height);
    p[i * 3 + 2] = wrapAround(p[i * 3 + 2]! + wind.z * dt * k, center.z, size);
  }
}
