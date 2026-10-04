import type { Terrain } from '../types/terrain.js';

/** The `source` of a made-up terrain: the scene says it is provisional wherever it shows it. */
export const SYNTHETIC_SOURCE = 'Terreno sintético';

/** Metres of one degree of latitude on the sphere of the terrain tool (radius 6,371,008.8 m). */
export const METERS_PER_DEGREE = (Math.PI * 6371008.8) / 180;

export const isSyntheticTerrain = (t: Terrain): boolean => t.meta.source === SYNTHETIC_SOURCE;

const smooth = (x: number) => Math.exp(-x * x);

/** The height in metres of the made-up cordillera: a ridge running north-south with foothills, valleys and a little roughness. */
function height(lon: number, lat: number, west: number, east: number): number {
  const centerLon = (west + east) / 2;
  const half = (east - west) / 2;
  const ridgeLon = centerLon + 0.12 * Math.sin(lat * 4.1);
  const ridge = 4200 * smooth((lon - ridgeLon) / 0.35);
  const base = 700 + 150 * ((lon - centerLon) / half);
  const rough =
    (0.35 + ridge / 4200) * (250 * Math.sin(lon * 7.3 + lat * 5.1) * Math.sin(lat * 6.7) + 120 * Math.sin(lon * 17 + lat * 13));
  return Math.min(7000, Math.max(0, base + ridge + rough));
}

/**
 * A terrain made up for the Andes scene while the real DEM is not baked: the same shape as a loaded terrain (metadata
 * and heights from the north-west corner) so that nothing downstream knows the difference. Deterministic: no randomness.
 * It is NOT the Andes: its source says so.
 */
export function syntheticTerrain(bbox: [number, number, number, number], width: number, height_: number): Terrain {
  const [west, south, east, north] = bbox;
  const px = (east - west) / width;
  const py = (north - south) / height_;
  const heights = new Float32Array(width * height_);
  let min = Infinity;
  let max = -Infinity;
  for (let row = 0; row < height_; row += 1) {
    const lat = north - (row + 0.5) * py;
    for (let col = 0; col < width; col += 1) {
      const lon = west + (col + 0.5) * px;
      const h = height(lon, lat, west, east);
      heights[row * width + col] = h;
      const stored = heights[row * width + col]!;
      if (stored < min) min = stored;
      if (stored > max) max = stored;
    }
  }
  const midLat = (south + north) / 2;
  return {
    meta: {
      id: 'andes_synthetic',
      crs: 'EPSG:4326',
      bbox,
      width,
      height: height_,
      pixel_size_deg: { x: px, y: py },
      meters_per_pixel: { x: px * METERS_PER_DEGREE * Math.cos((midLat * Math.PI) / 180), y: py * METERS_PER_DEGREE },
      encoding: 'terrarium',
      elevation_min_m: min,
      elevation_max_m: max,
      filled_fraction: 0,
      hillshade: { azimuth_deg: 315, altitude_deg: 45, z_factor: 1 },
      files: { height: '', hillshade: '' },
      bytes: { height: 0, hillshade: 0 },
      dem_inputs: [],
      source: SYNTHETIC_SOURCE,
      source_url: null,
      retrieved_at: '2026-10-04',
      license_or_terms: null,
      attribution: 'Terreno sintético (provisorio): no es el relieve real de los Andes.',
      generated_by: 'synthetic'
    },
    heights
  };
}
