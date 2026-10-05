import { sampleElevation } from '../../terrain/decode';
import type { Terrain } from '../../types/terrain';
import { sampleAlongExtended } from './pathAlong';
import type { Path } from './pathAlong';
import { TRAIL_COLOR, corridorFactor, hash2, noise2, reliefOffset, smooth, terrainColor, trailBlend } from './relief';
import { fromScene, toScene } from './terrainMesh';
import type { SceneScale } from './terrainMesh';

/** The route stays gentle up to this distance (scene units) and has the full relief from the second one. */
const FLAT = 0.5;
const FULL = 2.4;
/**
 * The valley the army starts in: the column stands on the straight line behind the first point of the route (where the camera is too),
 * which is not part of the route, so its ground is kept open for `OPENING_LENGTH` scene units back (the column is at most 6 long,
 * and the camera stands 1 behind it). The relief is none up to `OPEN_FLAT` from that line and all from `OPEN_FULL`: mountains close in on the sides.
 */
export const OPENING_LENGTH = 8;
const OPEN_FLAT = 1.5;
const OPEN_FULL = 3.5;
/** Trees grow on gentle ground below this fraction of the highest point of the terrain. */
const TREE_LINE = 0.4;
const TREE_SLOPE = 0.3;
/** fewer trees, bigger: one candidate place every half unit, and the road stays clear of them */
const TREE_SPACING = 0.5;
const TREE_KEEP_OFF_ROUTE = 0.4;
/** the trail painted on the ground: all dirt up to the core (about the width of the column), none beyond the edge */
export const TRAIL_CORE = 0.14;
export const TRAIL_EDGE = 0.3;
/** scene units of ground that one repeat of the ground texture covers */
export const TEXTURE_TILE = 0.5;
const TRAIL_STRENGTH = 0.9;

/** The ground in scene units: the base terrain with the procedural relief on top, gentle along the route. */
export interface Field {
  /** the base terrain only: the heights of the data (or the made-up terrain) */
  baseHeight: (x: number, z: number) => number;
  /** the base plus the relief */
  height: (x: number, z: number) => number;
  /** distance on the ground plane to the closest point of the route (exact up to the width of the corridor, Infinity beyond it) */
  distanceToRoute: (x: number, z: number) => number;
  /** distance on the ground plane to the opening: the first point of the route and the line behind it where the column starts */
  distanceToOpening: (x: number, z: number) => number;
  /** y of the highest point of the base terrain */
  maxY: number;
}

export function createField(o: { terrain: Terrain; scale: SceneScale; path: Path; seed: number; amplitude: number }): Field {
  const { terrain, scale, path, seed, amplitude } = o;
  const maxY = toScene(scale, 0, 0, terrain.meta.elevation_max_m).y;
  // beyond the edge the ground goes on flat at the height of the edge (the nearest pixel centre), not down to the lowest point: a cliff at the border looked like a wall
  const [west, south, east, north] = terrain.meta.bbox;
  const halfX = terrain.meta.pixel_size_deg.x * 0.51; // a hair more than half a pixel: `sampleElevation` is strict at the last pixel centre
  const halfY = terrain.meta.pixel_size_deg.y * 0.51;
  const baseHeight = (x: number, z: number) => {
    const at = fromScene(scale, x, z);
    const lon = Math.min(east - halfX, Math.max(west + halfX, at.lon));
    const lat = Math.min(north - halfY, Math.max(south + halfY, at.lat));
    const h = sampleElevation(terrain, lon, lat) ?? terrain.meta.elevation_min_m;
    return toScene(scale, lon, lat, h).y;
  };
  const pts = path.points;
  const n = Math.floor(pts.length / 3);
  const distanceToRoute = (x: number, z: number) => {
    if (n === 0) return Infinity;
    let best = Infinity;
    for (let i = 0; i < n - 1; i += 1) {
      const ax = pts[i * 3]!;
      const az = pts[i * 3 + 2]!;
      const dx = pts[i * 3 + 3]! - ax;
      const dz = pts[i * 3 + 5]! - az;
      // a segment farther than the corridor in x or z cannot matter: it keeps the loop short (the distance is only exact up to FULL)
      if (x < Math.min(ax, ax + dx) - FULL || x > Math.max(ax, ax + dx) + FULL || z < Math.min(az, az + dz) - FULL || z > Math.max(az, az + dz) + FULL) continue;
      const len2 = dx * dx + dz * dz;
      const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2));
      const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
      if (d < best) best = d;
    }
    return n === 1 ? Math.hypot(x - pts[0]!, z - pts[2]!) : best;
  };
  const tail = { x: 0, y: 0, z: 0, heading: 0 };
  if (n > 0) sampleAlongExtended(path, -OPENING_LENGTH, tail);
  const distanceToOpening = (x: number, z: number) => {
    if (n === 0) return Infinity;
    const ax = tail.x;
    const az = tail.z;
    const dx = pts[0]! - ax;
    const dz = pts[2]! - az;
    const len2 = dx * dx + dz * dz;
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2));
    return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
  };
  const height = (x: number, z: number) => {
    const base = baseHeight(x, z);
    const keep = Math.min(corridorFactor(distanceToRoute(x, z), FLAT, FULL), corridorFactor(distanceToOpening(x, z), OPEN_FLAT, OPEN_FULL));
    return keep === 0 ? base : base + reliefOffset(x, z, seed, amplitude) * keep;
  };
  return { baseHeight, height, distanceToRoute, distanceToOpening, maxY };
}

export interface ChunkData {
  columns: number;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  /** texture coordinates in world space (the ground divided by `TEXTURE_TILE`), so neighbors continue the same texture */
  uvs: Float32Array;
  indices: Uint32Array;
}

/**
 * The rectangle of ground from (`x0`, `z0`) `width` by `depth` scene units, in `cellsX` by `cellsZ` squares. Normals come from a ring of
 * heights around the patch, so the light has no seam at the edges. The trail of the army is painted on it: along the route, and behind
 * its first point where the column stands.
 */
export function buildPatch(field: Field, x0: number, z0: number, width: number, depth: number, cellsX: number, cellsZ: number, seed = 0): ChunkData {
  const columns = cellsX + 1;
  const rows = cellsZ + 1;
  const stepX = width / cellsX;
  const stepZ = depth / cellsZ;
  const wideX = cellsX + 3;
  const wideZ = cellsZ + 3;
  const heights = new Float32Array(wideX * wideZ);
  for (let j = 0; j < wideZ; j += 1) for (let i = 0; i < wideX; i += 1) heights[j * wideX + i] = field.height(x0 + (i - 1) * stepX, z0 + (j - 1) * stepZ);

  const positions = new Float32Array(columns * rows * 3);
  const normals = new Float32Array(columns * rows * 3);
  const colors = new Float32Array(columns * rows * 3);
  const uvs = new Float32Array(columns * rows * 2);
  const rgb = { r: 0, g: 0, b: 0 };
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < columns; i += 1) {
      const k = j * columns + i;
      const w = (j + 1) * wideX + (i + 1);
      const y = heights[w]!;
      const x = x0 + i * stepX;
      const z = z0 + j * stepZ;
      const gx = (heights[w - 1]! - heights[w + 1]!) / (2 * stepX);
      const gz = (heights[w - wideX]! - heights[w + wideX]!) / (2 * stepZ);
      const len = Math.hypot(gx, 1, gz);
      positions[k * 3] = x;
      positions[k * 3 + 1] = y;
      positions[k * 3 + 2] = z;
      normals[k * 3] = gx / len;
      normals[k * 3 + 1] = 1 / len;
      normals[k * 3 + 2] = gz / len;
      uvs[k * 2] = x / TEXTURE_TILE;
      uvs[k * 2 + 1] = z / TEXTURE_TILE;
      terrainColor(field.maxY > 0 ? y / field.maxY : 0, 1 - 1 / len, noise2(x * 0.9, z * 0.9, seed + 31), noise2(x * 3.7 + 40, z * 3.7, seed + 57), rgb);
      const trail = trailBlend(Math.min(field.distanceToRoute(x, z), field.distanceToOpening(x, z)), TRAIL_CORE, TRAIL_EDGE) * TRAIL_STRENGTH;
      colors[k * 3] = rgb.r + (TRAIL_COLOR[0] - rgb.r) * trail;
      colors[k * 3 + 1] = rgb.g + (TRAIL_COLOR[1] - rgb.g) * trail;
      colors[k * 3 + 2] = rgb.b + (TRAIL_COLOR[2] - rgb.b) * trail;
    }
  }
  const indices = new Uint32Array(cellsX * cellsZ * 6);
  let q = 0;
  for (let j = 0; j < cellsZ; j += 1) {
    for (let i = 0; i < cellsX; i += 1) {
      const a = j * columns + i;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      indices[q++] = a;
      indices[q++] = c;
      indices[q++] = b;
      indices[q++] = b;
      indices[q++] = c;
      indices[q++] = d;
    }
  }
  return { columns, positions, normals, colors, uvs, indices };
}

/** The square of ground `size` scene units wide at grid cell (`cx`, `cz`) (the grid is anchored at the origin, so neighbors meet exactly): `cells` by `cells` squares. */
export function buildChunk(field: Field, cx: number, cz: number, size: number, cells: number, seed = 0): ChunkData {
  return buildPatch(field, cx * size, cz * size, size, size, cells, cells, seed);
}

/**
 * Where trees grow in the chunk: x, y, z and a size per tree, on a jittered grid, only on gentle low ground and off the route.
 * `density` (0 to 1) is the share of the candidates kept; 0 means a bare chunk.
 */
export function treePlacements(field: Field, cx: number, cz: number, size: number, density = 0.7, seed = 0): Float32Array {
  const out: number[] = [];
  const per = Math.max(1, Math.round(size / TREE_SPACING));
  const cell = size / per;
  const x0 = cx * size;
  const z0 = cz * size;
  const probe = cell * 0.5;
  for (let j = 0; j < per; j += 1) {
    for (let i = 0; i < per; i += 1) {
      const gi = cx * per + i;
      const gj = cz * per + j;
      if (hash2(gi, gj, seed + 5) >= density) continue;
      const x = x0 + (i + 0.1 + 0.8 * hash2(gi, gj, seed + 6)) * cell;
      const z = z0 + (j + 0.1 + 0.8 * hash2(gi, gj, seed + 7)) * cell;
      const y = field.height(x, z);
      if (field.maxY > 0 && y / field.maxY > TREE_LINE) continue;
      const slope = Math.hypot(field.height(x + probe, z) - y, field.height(x, z + probe) - y) / probe;
      if (smooth(0, 1, slope) > TREE_SLOPE) continue;
      if (field.distanceToRoute(x, z) <= TREE_KEEP_OFF_ROUTE) continue;
      out.push(x, y, z, 0.7 + 0.6 * hash2(gi, gj, seed + 8));
    }
  }
  return Float32Array.from(out);
}
