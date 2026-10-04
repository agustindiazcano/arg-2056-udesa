import { sampleElevation } from '../../terrain/decode';
import type { Terrain } from '../../types/terrain';
import type { Path } from './pathAlong';
import { corridorFactor, hash2, noise2, reliefOffset, smooth, terrainColor } from './relief';
import { fromScene, toScene } from './terrainMesh';
import type { SceneScale } from './terrainMesh';

/** The route stays gentle up to this distance (scene units) and has the full relief from the second one. */
const FLAT = 0.5;
const FULL = 2.4;
/** Trees grow on gentle ground below this fraction of the highest point of the terrain. */
const TREE_LINE = 0.4;
const TREE_SLOPE = 0.3;
const TREE_SPACING = 0.2;
const TREE_KEEP_OFF_ROUTE = 0.2;

/** The ground in scene units: the base terrain with the procedural relief on top, gentle along the route. */
export interface Field {
  /** the base terrain only: the heights of the data (or the made-up terrain) */
  baseHeight: (x: number, z: number) => number;
  /** the base plus the relief */
  height: (x: number, z: number) => number;
  /** distance on the ground plane to the closest point of the route (exact up to the width of the corridor, Infinity beyond it) */
  distanceToRoute: (x: number, z: number) => number;
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
  const height = (x: number, z: number) => {
    const base = baseHeight(x, z);
    const keep = corridorFactor(distanceToRoute(x, z), FLAT, FULL);
    return keep === 0 ? base : base + reliefOffset(x, z, seed, amplitude) * keep;
  };
  return { baseHeight, height, distanceToRoute, maxY };
}

export interface ChunkData {
  columns: number;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

/**
 * The square of ground `size` scene units wide at grid cell (`cx`, `cz`) (the grid is anchored at the origin, so neighbors
 * meet exactly): `cells` by `cells` squares. Normals come from a ring of heights around the chunk, so the light has no seam at the edges.
 */
export function buildChunk(field: Field, cx: number, cz: number, size: number, cells: number, seed = 0): ChunkData {
  const columns = cells + 1;
  const step = size / cells;
  const x0 = cx * size;
  const z0 = cz * size;
  const wide = cells + 3;
  const heights = new Float32Array(wide * wide);
  for (let j = 0; j < wide; j += 1) for (let i = 0; i < wide; i += 1) heights[j * wide + i] = field.height(x0 + (i - 1) * step, z0 + (j - 1) * step);

  const positions = new Float32Array(columns * columns * 3);
  const normals = new Float32Array(columns * columns * 3);
  const colors = new Float32Array(columns * columns * 3);
  const rgb = { r: 0, g: 0, b: 0 };
  for (let j = 0; j < columns; j += 1) {
    for (let i = 0; i < columns; i += 1) {
      const k = j * columns + i;
      const w = (j + 1) * wide + (i + 1);
      const y = heights[w]!;
      const x = x0 + i * step;
      const z = z0 + j * step;
      const gx = (heights[w - 1]! - heights[w + 1]!) / (2 * step);
      const gz = (heights[w - wide]! - heights[w + wide]!) / (2 * step);
      const len = Math.hypot(gx, 1, gz);
      positions[k * 3] = x;
      positions[k * 3 + 1] = y;
      positions[k * 3 + 2] = z;
      normals[k * 3] = gx / len;
      normals[k * 3 + 1] = 1 / len;
      normals[k * 3 + 2] = gz / len;
      terrainColor(field.maxY > 0 ? y / field.maxY : 0, 1 - 1 / len, noise2(x * 0.9, z * 0.9, seed + 31), noise2(x * 3.7 + 40, z * 3.7, seed + 57), rgb);
      colors[k * 3] = rgb.r;
      colors[k * 3 + 1] = rgb.g;
      colors[k * 3 + 2] = rgb.b;
    }
  }
  const indices = new Uint32Array(cells * cells * 6);
  let q = 0;
  for (let j = 0; j < cells; j += 1) {
    for (let i = 0; i < cells; i += 1) {
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
  return { columns, positions, normals, colors, indices };
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
