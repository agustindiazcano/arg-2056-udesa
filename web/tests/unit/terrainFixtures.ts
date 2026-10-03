import type { TerrainMeta } from '../../src/types/terrain.js';

/** 3x3 terrain, 1 degree pixels, west 0, north 3: pixel centers at lon 0.5, 1.5, 2.5 and lat 2.5, 1.5, 0.5. */
export function makeMeta(overrides: Partial<TerrainMeta> = {}): TerrainMeta {
  return {
    id: 'region_a',
    crs: 'EPSG:4326',
    bbox: [0, 0, 3, 3],
    width: 3,
    height: 3,
    pixel_size_deg: { x: 1, y: 1 },
    meters_per_pixel: { x: 111000, y: 111000 },
    encoding: 'terrarium',
    elevation_min_m: 0,
    elevation_max_m: 220,
    filled_fraction: 0,
    hillshade: { azimuth_deg: 315, altitude_deg: 45, z_factor: 1 },
    files: { height: 'region_a.height.png', hillshade: 'region_a.hillshade.png' },
    bytes: { height: 100, hillshade: 50 },
    dem_inputs: [{ path: 'tile.tif', sha256: 'a'.repeat(64) }],
    source: 'Example DEM',
    source_url: 'https://example.com/dem',
    retrieved_at: '2026-01-01',
    license_or_terms: null,
    attribution: 'Example attribution',
    generated_by: 'scripts/terrain',
    ...overrides
  };
}

/** Heights of the 3x3 plane: 10 * col + 100 * row. */
export const PLANE = [0, 10, 20, 100, 110, 120, 200, 210, 220];

/** Terrarium RGBA of the plane (all heights are below 256, so R = 128 and G = height). */
export function planeRgba(): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(PLANE.length * 4);
  PLANE.forEach((h, i) => {
    rgba.set([128, h, 0, 255], i * 4);
  });
  return rgba;
}
