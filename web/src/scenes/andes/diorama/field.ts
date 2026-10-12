/**
 * The terrain of the diorama of the battle of Chacabuco: a made-up (procedural) field, NOT the real relief. It is a gentle plain where the patriots come down from the north,
 * three low hills where the royalists stood (Guanaco, Quemado and Chinge, in the words of the sources), a higher hill far behind the patriots from which San Martín watched,
 * and rising edges that frame the picture like a stage. Meters are east and north of the middle of the field; the scene is in `WORLD_UNIT_M`-meter units.
 */

/** One unit of the scene is this many meters. */
export const WORLD_UNIT_M = 100;
/** Half the size of the field, in meters. */
export const FIELD = { halfEastM: 2400, halfNorthM: 2200 };

export interface Hill {
  id: string;
  name: string;
  eastM: number;
  northM: number;
  heightM: number;
  /** the spread of the hill (sigma of its bell), in meters */
  radiusM: number;
}

export const HILLS: readonly Hill[] = [
  { id: 'guanaco', name: 'Cerro Guanaco', eastM: -170, northM: -640, heightM: 95, radiusM: 380 },
  { id: 'quemado', name: 'Cerro Quemado', eastM: 190, northM: -700, heightM: 85, radiusM: 350 },
  { id: 'chinge', name: 'Cerro Chinge', eastM: -500, northM: -620, heightM: 80, radiusM: 330 },
  { id: 'mirador', name: 'Colina del mirador', eastM: -350, northM: 1500, heightM: 120, radiusM: 460 }
];

/** Where San Martín and his officers stand to watch: on the top of the far hill behind the patriot lines. */
export const LOOKOUT = { eastM: -350, northM: 1500 };

/** A repeatable number in [0, 1) for a lattice point. */
export function latticeHash(i: number, j: number, seed: number): number {
  let x = (Math.imul(i + 374761393, 668265263) ^ Math.imul(j + 1274126177, 2246822519) ^ Math.imul(seed + 1, 3266489917)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise in [0, 1]. */
export function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = latticeHash(ix, iy, seed);
  const b = latticeHash(ix + 1, iy, seed);
  const c = latticeHash(ix, iy + 1, seed);
  const d = latticeHash(ix + 1, iy + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** The height of the ground, in meters, at a point of the field. */
export function heightAt(eastM: number, northM: number): number {
  // rolling ground: two octaves of soft noise
  let h = 14 * valueNoise(eastM / 700, northM / 700, 1) + 6 * valueNoise(eastM / 260, northM / 260, 2);
  for (const hill of HILLS) {
    const dx = eastM - hill.eastM;
    const dy = northM - hill.northM;
    h += hill.heightM * Math.exp(-(dx * dx + dy * dy) / (2 * hill.radiusM * hill.radiusM));
  }
  // the edges rise, so the field sits in a shallow bowl like a stage
  const edge = Math.max(0, (Math.abs(eastM) - 1700) / 700);
  const far = Math.max(0, (Math.abs(northM) - 1750) / 450);
  h += 70 * edge * edge + 40 * Math.min(1, far) * far;
  return h;
}

/** How steep the ground is at a point, in radians. */
export function slopeAt(eastM: number, northM: number, stepM = 12): number {
  const dx = (heightAt(eastM + stepM, northM) - heightAt(eastM - stepM, northM)) / (2 * stepM);
  const dy = (heightAt(eastM, northM + stepM) - heightAt(eastM, northM - stepM)) / (2 * stepM);
  return Math.atan(Math.hypot(dx, dy));
}

/** Meters east and north into scene units (x east, z south). */
export function toWorld(eastM: number, northM: number): { x: number; z: number } {
  return { x: eastM / WORLD_UNIT_M, z: -northM / WORLD_UNIT_M };
}

/**
 * The heights of a grid of `cols` x `rows` cells over the whole field, as (cols + 1) x (rows + 1) samples row by row from the north-west corner, in meters.
 */
export function heightGrid(cols: number, rows: number): Float32Array {
  const out = new Float32Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j += 1) {
    const northM = FIELD.halfNorthM - (2 * FIELD.halfNorthM * j) / rows;
    for (let i = 0; i <= cols; i += 1) {
      const eastM = -FIELD.halfEastM + (2 * FIELD.halfEastM * i) / cols;
      out[j * (cols + 1) + i] = heightAt(eastM, northM);
    }
  }
  return out;
}
