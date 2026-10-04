import { METERS_PER_DEGREE } from '../../terrain/synthetic';
import type { Terrain } from '../../types/terrain';

/** How the ground maps onto scene units: x east, y up, z south, the terrain centred on x and z. */
export interface SceneScale {
  /** scene size of the box on x and z */
  width: number;
  depth: number;
  metersPerUnit: number;
  /** the heights are stretched by this much over the horizontal scale, or the cordillera would look flat */
  exaggeration: number;
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface TerrainMesh {
  columns: number;
  rows: number;
  /** x, y, z per vertex, row by row from the north-west corner */
  positions: Float32Array;
  indices: Uint32Array;
  /** per vertex: 0 at the lowest point of the terrain, 1 at the highest */
  heightT: Float32Array;
}

/** The scale of a terrain whose longest side is `longSide` scene units. */
export function sceneScale(terrain: Terrain, o: { longSide: number; exaggeration: number }): SceneScale {
  const [west, south, east, north] = terrain.meta.bbox;
  const midLat = (south + north) / 2;
  const widthM = (east - west) * METERS_PER_DEGREE * Math.cos((midLat * Math.PI) / 180);
  const depthM = (north - south) * METERS_PER_DEGREE;
  const metersPerUnit = Math.max(widthM, depthM) / o.longSide;
  return { width: widthM / metersPerUnit, depth: depthM / metersPerUnit, metersPerUnit, exaggeration: o.exaggeration, west, east, south, north };
}

/** A place on the ground in scene units. */
export function toScene(scale: SceneScale, lon: number, lat: number, elevationM: number): { x: number; y: number; z: number } {
  return {
    x: ((lon - scale.west) / (scale.east - scale.west) - 0.5) * scale.width,
    y: (elevationM / scale.metersPerUnit) * scale.exaggeration,
    z: (0.5 - (lat - scale.south) / (scale.north - scale.south)) * scale.depth
  };
}

/** The mesh of the terrain at a fraction of its resolution (1 is a vertex per sample). The corners are always kept. */
export function buildTerrainMesh(terrain: Terrain, scale: SceneScale, detail: number): TerrainMesh {
  const { meta, heights } = terrain;
  const columns = Math.min(meta.width, Math.max(2, Math.round(meta.width * detail)));
  const rows = Math.min(meta.height, Math.max(2, Math.round(meta.height * detail)));
  const positions = new Float32Array(columns * rows * 3);
  const heightT = new Float32Array(columns * rows);
  const span = meta.elevation_max_m - meta.elevation_min_m;
  for (let r = 0; r < rows; r += 1) {
    const srcRow = Math.round((r * (meta.height - 1)) / (rows - 1));
    const lat = meta.bbox[3] - (srcRow + 0.5) * meta.pixel_size_deg.y;
    for (let c = 0; c < columns; c += 1) {
      const srcCol = Math.round((c * (meta.width - 1)) / (columns - 1));
      const lon = meta.bbox[0] + (srcCol + 0.5) * meta.pixel_size_deg.x;
      const h = heights[srcRow * meta.width + srcCol]!;
      const p = toScene(scale, lon, lat, h);
      const i = r * columns + c;
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      heightT[i] = span > 0 ? (h - meta.elevation_min_m) / span : 0;
    }
  }
  const indices = new Uint32Array((columns - 1) * (rows - 1) * 6);
  let k = 0;
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < columns - 1; c += 1) {
      const a = r * columns + c;
      const b = a + 1;
      const d = a + columns;
      const e = d + 1;
      indices[k++] = a;
      indices[k++] = d;
      indices[k++] = b;
      indices[k++] = b;
      indices[k++] = d;
      indices[k++] = e;
    }
  }
  return { columns, rows, positions, indices, heightT };
}
