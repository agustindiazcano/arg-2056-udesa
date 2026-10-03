import type { Terrain, TerrainMeta } from '../types/terrain.js';

/**
 * Pixel convention: pixel (0, 0) has its center at west + 0.5 pixel and north - 0.5 pixel. Pixel coordinates
 * are measured in pixel-center units, so the center of pixel (i, j) is exactly (x = i, y = j) and the outer
 * edge of the bbox lies half a pixel beyond the first and last centers.
 */
export function lonLatToPixel(meta: TerrainMeta, lon: number, lat: number): { x: number; y: number } {
  const [west, , , north] = meta.bbox;
  return {
    x: (lon - west) / meta.pixel_size_deg.x - 0.5,
    y: (north - lat) / meta.pixel_size_deg.y - 0.5
  };
}

export function pixelToLonLat(meta: TerrainMeta, x: number, y: number): { lon: number; lat: number } {
  const [west, , , north] = meta.bbox;
  return {
    lon: west + (x + 0.5) * meta.pixel_size_deg.x,
    lat: north - (y + 0.5) * meta.pixel_size_deg.y
  };
}

/** Terrarium: height = R * 256 + G + B / 256 - 32768 (alpha is ignored). */
export function decodeTerrarium(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const expected = width * height * 4;
  if (rgba.length !== expected) {
    throw new Error(`RGBA buffer has ${rgba.length} values, expected ${expected}`);
  }
  const heights = new Float32Array(width * height);
  for (let i = 0; i < heights.length; i++) {
    const o = i * 4;
    heights[i] = rgba[o]! * 256 + rgba[o + 1]! + rgba[o + 2]! / 256 - 32768;
  }
  return heights;
}

/**
 * Bilinear elevation in meters at a point. Returns null (never 0) where four pixel centers are not
 * available: outside the bbox and in the half-pixel border between the outer pixel centers and the bbox edge.
 */
export function sampleElevation(terrain: Terrain, lon: number, lat: number): number | null {
  const { meta, heights } = terrain;
  const { x, y } = lonLatToPixel(meta, lon, lat);
  if (!(x >= 0 && y >= 0 && x <= meta.width - 1 && y <= meta.height - 1)) return null;

  const x0 = Math.min(Math.floor(x), Math.max(meta.width - 2, 0));
  const y0 = Math.min(Math.floor(y), Math.max(meta.height - 2, 0));
  const x1 = Math.min(x0 + 1, meta.width - 1);
  const y1 = Math.min(y0 + 1, meta.height - 1);
  const fx = x - x0;
  const fy = y - y0;
  const at = (col: number, row: number) => heights[row * meta.width + col]!;
  const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
  const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
  return top * (1 - fy) + bottom * fy;
}

export function elevationRange(terrain: Terrain): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const h of terrain.heights) {
    if (h < min) min = h;
    if (h > max) max = h;
  }
  return { min, max };
}
