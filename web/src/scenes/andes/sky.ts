import { SKY_RAMP } from '../../styles/tokens';

const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** The color of the sky at a height from the horizon (0) to straight up (1), as the ramp blended between its steps. Below the horizon it is the horizon color. */
export function skyColorHex(t: number): string {
  const steps = SKY_RAMP.length - 1;
  const x = Math.min(1, Math.max(0, t)) * steps;
  const i = Math.min(steps - 1, Math.floor(x));
  const f = x - i;
  if (f === 0) return SKY_RAMP[i]!;
  const a = SKY_RAMP[i]!;
  const b = SKY_RAMP[i + 1]!;
  const mix = (o: number) => parseInt(a.slice(o, o + 2), 16) * (1 - f) + parseInt(b.slice(o, o + 2), 16) * f;
  return `#${hex(mix(1))}${hex(mix(3))}${hex(mix(5))}`;
}

/**
 * Stars on a sphere of `radius`, as x, y, z triplets, all in the upper part of the sky (more than a quarter of the radius
 * above the horizon). Deterministic: a golden-angle spiral, no randomness.
 */
export function starPositions(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    // height from 0.3 to 1 of the radius, evenly in area; the angle turns by the golden angle
    const y = 0.3 + (0.7 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    const a = i * golden;
    out[i * 3] = Math.cos(a) * ring * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(a) * ring * radius;
  }
  return out;
}
