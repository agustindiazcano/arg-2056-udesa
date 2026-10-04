import { validator } from '../validation/validators';

export interface GeoMeta {
  source: string;
  source_url: string | null;
  retrieved_at: string;
  license_or_terms: string | null;
  attribution: string;
  input_sha256: string;
  simplification: {
    algorithm: string;
    parameter: number;
    vertices_before: number;
    vertices_after: number;
    bytes: number;
  };
  dropped_polygons: Array<{ id: string; area_km2: number }>;
  area_change_pct: Record<string, number>;
  provinces_count: 24;
  generated_by: 'web/scripts/geo';
}

const validate = validator<GeoMeta>('geoMeta');

export function parseGeoMeta(json: unknown): GeoMeta {
  if (!validate(json)) {
    const err = validate.errors?.[0];
    const params = (err?.params ?? {}) as { additionalProperty?: string; missingProperty?: string };
    const name = params.additionalProperty ?? params.missingProperty ?? '';
    throw new Error(`Geo metadata validation failed: ${err?.instancePath} ${name} ${err?.message}`);
  }
  return json;
}
