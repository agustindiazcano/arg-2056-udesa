import Ajv from 'ajv/dist/2020.js';
import ajvFormats from 'ajv-formats';
import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { parseGeoMeta } from './meta.js';
import type { GeoMeta } from './meta.js';
import schema from '../../../data/schemas/provinces_geo.schema.json' with { type: 'json' };

export type Position = [number, number];

export type ProvinceGeometry =
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] };

export interface ProvinceFeature {
  type: 'Feature';
  properties: {
    id: ProvinceId;
    name: string;
    area_km2: number;
    centroid: [number, number];
    centroid_inside: boolean;
    bbox: [number, number, number, number];
  };
  geometry: ProvinceGeometry;
}

export interface ProvincesGeo {
  type: 'FeatureCollection';
  features: ProvinceFeature[];
}

const ajv = new Ajv({ allErrors: true });
ajvFormats(ajv);
const validate = ajv.compile<ProvincesGeo>(schema);

export function parseProvincesGeo(json: unknown): ProvincesGeo {
  if (!validate(json)) {
    const err = validate.errors?.[0];
    const params = (err?.params ?? {}) as { additionalProperty?: string; missingProperty?: string };
    const name = params.additionalProperty ?? params.missingProperty ?? '';
    throw new Error(`Provinces geometry validation failed: ${err?.instancePath} ${name} ${err?.message}`);
  }
  return json;
}

/** Problems of the id set compared with PROVINCES: missing, extra and duplicate ids (empty when consistent). */
export function checkProvinceIds(geo: ProvincesGeo): string[] {
  const expected = PROVINCES.map((p) => p.id as string);
  const counts = new Map<string, number>();
  for (const f of geo.features) counts.set(f.properties.id, (counts.get(f.properties.id) ?? 0) + 1);

  const problems: string[] = [];
  for (const id of expected) if (!counts.has(id)) problems.push(`missing province id ${id}`);
  for (const id of counts.keys()) if (!expected.includes(id)) problems.push(`extra province id ${id}`);
  for (const [id, n] of counts) if (n > 1) problems.push(`duplicate province id ${id}`);
  return problems;
}

export function featureById(geo: ProvincesGeo, id: ProvinceId): ProvinceFeature | undefined {
  return geo.features.find((f) => f.properties.id === id);
}

interface FetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

async function getJson(fetchFn: (url: string) => Promise<FetchResponse>, url: string): Promise<unknown> {
  let response: FetchResponse;
  try {
    response = await fetchFn(url);
  } catch (err) {
    throw new Error(`Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Invalid JSON in ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Fetches `provinces.geojson` and `provinces.meta.json` from baseUrl. No geometry processing happens here. */
export async function loadProvinces(
  baseUrl: string,
  fetchFn: (url: string) => Promise<FetchResponse> = (url) => fetch(url)
): Promise<{ geo: ProvincesGeo; meta: GeoMeta }> {
  const base = baseUrl.replace(/\/+$/, '');
  const rawGeo = await getJson(fetchFn, `${base}/provinces.geojson`);
  const rawMeta = await getJson(fetchFn, `${base}/provinces.meta.json`);

  let geo: ProvincesGeo;
  try {
    geo = parseProvincesGeo(rawGeo);
  } catch (err) {
    throw new Error(`Invalid provinces geometry: ${err instanceof Error ? err.message : String(err)}`);
  }
  const problems = checkProvinceIds(geo);
  if (problems.length > 0) throw new Error(`Province ids are inconsistent: ${problems.join('; ')}`);

  let meta: GeoMeta;
  try {
    meta = parseGeoMeta(rawMeta);
  } catch (err) {
    throw new Error(`Invalid geo metadata: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { geo, meta };
}
