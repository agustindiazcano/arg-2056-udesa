import { PROVINCES } from '../../../src/types/province.js';

export interface FeatureDoc {
  type: string;
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GeoDoc {
  type: string;
  features: FeatureDoc[];
  [key: string]: unknown;
}

export function validFeature(index: number): FeatureDoc {
  const province = PROVINCES[index]!;
  return {
    type: 'Feature',
    properties: {
      id: province.id,
      name: province.name,
      area_km2: 1000 + index,
      centroid: [-65, -35],
      centroid_inside: true,
      bbox: [-70, -40, -60, -30]
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-70, -40], [-60, -40], [-60, -30], [-70, -30], [-70, -40]]]
    }
  };
}

export function validGeo(): GeoDoc {
  return { type: 'FeatureCollection', features: PROVINCES.map((_, i) => validFeature(i)) };
}

export function validGeoMeta(): Record<string, unknown> {
  return {
    source: 'Example source',
    source_url: 'https://example.com/provinces',
    retrieved_at: '2026-01-01',
    license_or_terms: null,
    attribution: 'Example attribution',
    input_sha256: 'a'.repeat(64),
    simplification: {
      algorithm: 'visvalingam-whyatt',
      parameter: 0.5,
      vertices_before: 1000,
      vertices_after: 500,
      bytes: 12345
    },
    dropped_polygons: [{ id: 'AR-A', area_km2: 1.5 }],
    area_change_pct: { 'AR-A': 0.25 },
    provinces_count: 24,
    generated_by: 'web/scripts/geo'
  };
}
