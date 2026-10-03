export interface TerrainMeta {
  id: string;
  crs: 'EPSG:4326';
  /** [west, south, east, north] in decimal degrees. */
  bbox: [number, number, number, number];
  width: number;
  height: number;
  pixel_size_deg: { x: number; y: number };
  meters_per_pixel: { x: number; y: number };
  encoding: 'terrarium';
  elevation_min_m: number;
  elevation_max_m: number;
  filled_fraction: number;
  hillshade: { azimuth_deg: number; altitude_deg: number; z_factor: number };
  files: { height: string; hillshade: string };
  bytes: { height: number; hillshade: number };
  dem_inputs: Array<{ path: string; sha256: string }>;
  source: string;
  source_url: string | null;
  retrieved_at: string;
  license_or_terms: string | null;
  attribution: string;
  generated_by: 'scripts/terrain';
}

/** Baked terrain: metadata plus heights in meters, row-major from the north-west corner. */
export interface Terrain {
  meta: TerrainMeta;
  heights: Float32Array;
}
