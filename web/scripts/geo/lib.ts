import { PROVINCES } from '../../src/types/province.js';

export class GeoError extends Error {}

export interface GeoConfig {
  dataset_id: string;
  input_file: string;
  id_property: string;
  id_map: Record<string, string>;
  target_max_bytes: number;
  max_area_change_pct: number;
  min_island_area_km2: number;
  coordinate_decimals: number;
  sanity_bounds: { lon: [number, number]; lat: [number, number] };
}

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInteger = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

const REQUIRED = [
  'dataset_id',
  'input_file',
  'id_map',
  'id_property',
  'target_max_bytes',
  'sanity_bounds'
] as const;
const OPTIONAL = ['max_area_change_pct', 'min_island_area_km2', 'coordinate_decimals'] as const;

function checkFields(obj: Obj, required: readonly string[], optional: readonly string[], where?: string): void {
  const suffix = where ? ` in ${where}` : '';
  for (const field of required) {
    if (!(field in obj)) throw new GeoError(`missing field ${field}${suffix}`);
  }
  for (const field of Object.keys(obj)) {
    if (!required.includes(field) && !optional.includes(field)) {
      throw new GeoError(`unknown field ${field}${suffix}`);
    }
  }
}

function parseRange(value: unknown, name: string): [number, number] {
  const [min, max] = Array.isArray(value) ? (value as unknown[]) : [];
  if (!Array.isArray(value) || value.length !== 2 || !isNumber(min) || !isNumber(max) || !(min < max)) {
    throw new GeoError(`sanity_bounds.${name} must be [min, max] with min < max`);
  }
  return [min, max];
}

function parseIdMap(value: unknown): Record<string, string> {
  if (!isObject(value)) throw new GeoError('id_map must be an object');
  const known = new Set<string>(PROVINCES.map((p) => p.id));
  const seen = new Set<string>();
  const map: Record<string, string> = {};
  for (const [key, target] of Object.entries(value)) {
    if (typeof target !== 'string' || !known.has(target)) {
      throw new GeoError(`id_map has unknown province id ${String(target)}`);
    }
    if (seen.has(target)) throw new GeoError(`id_map has duplicate target id ${target}`);
    seen.add(target);
    map[key] = target;
  }
  const missing = PROVINCES.map((p) => p.id).filter((id) => !seen.has(id));
  if (missing.length > 0) {
    throw new GeoError(missing.map((id) => `id_map is missing province id ${id}`).join('; '));
  }
  return map;
}

export function validateConfig(raw: unknown): GeoConfig {
  if (!isObject(raw)) throw new GeoError('config must be an object');
  checkFields(raw, REQUIRED, OPTIONAL);

  const { dataset_id, input_file, id_property } = raw;
  if (typeof dataset_id !== 'string' || dataset_id === '') throw new GeoError('dataset_id must be a non-empty string');
  if (typeof id_property !== 'string' || id_property === '') throw new GeoError('id_property must be a non-empty string');
  if (
    typeof input_file !== 'string' ||
    input_file === '' ||
    input_file.startsWith('/') ||
    input_file.startsWith('\\') ||
    input_file.split(/[\\/]/).includes('..')
  ) {
    throw new GeoError('input_file must be a relative path inside the dataset');
  }

  const id_map = parseIdMap(raw.id_map);

  const target = raw.target_max_bytes;
  if (!isInteger(target) || target <= 0) throw new GeoError('target_max_bytes must be a positive integer');

  const area = raw.max_area_change_pct ?? 2;
  if (!isNumber(area) || area < 0) throw new GeoError('max_area_change_pct must be a non-negative number');
  const island = raw.min_island_area_km2 ?? 0;
  if (!isNumber(island) || island < 0) throw new GeoError('min_island_area_km2 must be a non-negative number');
  const decimals = raw.coordinate_decimals ?? 3;
  if (!isInteger(decimals) || decimals < 0 || decimals > 8) {
    throw new GeoError('coordinate_decimals must be an integer between 0 and 8');
  }

  const bounds = raw.sanity_bounds;
  if (!isObject(bounds)) throw new GeoError('sanity_bounds must be an object');
  checkFields(bounds, ['lon', 'lat'], [], 'sanity_bounds');

  return {
    dataset_id,
    input_file,
    id_property,
    id_map,
    target_max_bytes: target,
    max_area_change_pct: area,
    min_island_area_km2: island,
    coordinate_decimals: decimals,
    sanity_bounds: { lon: parseRange(bounds.lon, 'lon'), lat: parseRange(bounds.lat, 'lat') }
  };
}

// ---- geometry types ----

export type Position = [number, number]; // [lon, lat]
export type Ring = Position[];

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: Ring[];
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: Ring[][];
}

export type AreaGeometry = PolygonGeometry | MultiPolygonGeometry;

export interface ProvinceInput {
  id: string;
  geometry: AreaGeometry;
}

// ---- area ----

/** Mean Earth radius in km (IUGG), the sphere used for every area in this tool. */
export const EARTH_RADIUS_KM = 6371.0088;

const rad = (deg: number) => (deg * Math.PI) / 180;
const round3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Area of a ring on a sphere of radius EARTH_RADIUS_KM, by the Chamberlain-Duquette line integral:
 *   area = R^2 / 2 * | sum over edges of (lon2 - lon1) * (2 + sin(lat1) + sin(lat2)) |
 * Edges are straight lines in lon/lat, so a ring bounded by meridians and parallels is a spherical rectangle and
 * gets exactly R^2 * (lon2 - lon1) * (sin(lat2) - sin(lat1)). The ring is assumed closed and not to cross the
 * antimeridian. The result does not depend on the winding direction.
 */
export function ringAreaKm2(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i]!;
    const [lon2, lat2] = ring[i + 1]!;
    sum += (rad(lon2) - rad(lon1)) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return (Math.abs(sum) * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2;
}

/** Exterior ring minus the holes. */
export function polygonAreaKm2(polygon: Ring[]): number {
  const [outer, ...holes] = polygon;
  if (!outer) return 0;
  return ringAreaKm2(outer) - holes.reduce((sum, hole) => sum + ringAreaKm2(hole), 0);
}

export function geometryAreaKm2(geometry: AreaGeometry): number {
  if (geometry.type === 'Polygon') return polygonAreaKm2(geometry.coordinates);
  return geometry.coordinates.reduce((sum, polygon) => sum + polygonAreaKm2(polygon), 0);
}

// ---- input check ----

const fmt = (n: number) => String(n);

function checkPositions(name: string, geometry: AreaGeometry, cfg: GeoConfig): void {
  const { lon, lat } = cfg.sanity_bounds;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon)) throw new GeoError(`feature ${name} has malformed coordinates`);
    for (const ring of polygon) {
      if (!Array.isArray(ring)) throw new GeoError(`feature ${name} has malformed coordinates`);
      for (const position of ring) {
        if (
          !Array.isArray(position) ||
          position.length < 2 ||
          !Number.isFinite(position[0]) ||
          !Number.isFinite(position[1])
        ) {
          throw new GeoError(`feature ${name} has a coordinate that is not a finite [lon, lat] pair`);
        }
        const [x, y] = position as Position;
        if (x < lon[0] || x > lon[1] || y < lat[0] || y > lat[1]) {
          throw new GeoError(
            `feature ${name} has coordinate [${fmt(x)}, ${fmt(y)}] outside sanity_bounds ` +
              `lon [${fmt(lon[0])}, ${fmt(lon[1])}] lat [${fmt(lat[0])}, ${fmt(lat[1])}]`
          );
        }
      }
    }
  }
}

/** Validates the input FeatureCollection and returns the 24 provinces keyed by their final ids, sorted by id. */
export function checkInput(raw: unknown, cfg: GeoConfig): ProvinceInput[] {
  if (!isObject(raw) || raw.type !== 'FeatureCollection' || !Array.isArray(raw.features)) {
    throw new GeoError('input must be a GeoJSON FeatureCollection');
  }

  const entries: Array<{ code: string; geometry: AreaGeometry }> = [];
  raw.features.forEach((feature: unknown, index: number) => {
    const properties = isObject(feature) && isObject(feature.properties) ? feature.properties : {};
    const value = properties[cfg.id_property];
    if (value === undefined || value === null) {
      throw new GeoError(`feature at index ${index} has no property ${cfg.id_property}`);
    }
    const name = String(value);
    const geometry = isObject(feature) ? feature.geometry : undefined;
    const type = isObject(geometry) ? geometry.type : undefined;
    if (type !== 'Polygon' && type !== 'MultiPolygon') {
      throw new GeoError(
        `feature ${name} has geometry type ${String(type)}; only Polygon and MultiPolygon are allowed`
      );
    }
    const area = geometry as AreaGeometry;
    checkPositions(name, area, cfg);
    entries.push({ code: name, geometry: area });
  });

  const unmapped: string[] = [];
  const byId = new Map<string, Array<{ code: string; geometry: AreaGeometry }>>();
  for (const entry of entries) {
    const id = cfg.id_map[entry.code];
    if (id === undefined) {
      if (!unmapped.includes(entry.code)) unmapped.push(entry.code);
      continue;
    }
    byId.set(id, [...(byId.get(id) ?? []), entry]);
  }

  const problems: string[] = [];
  if (unmapped.length > 0) problems.push(`unmapped input ids: ${unmapped.join(', ')}`);
  for (const [id, group] of byId) {
    if (group.length > 1) problems.push(`duplicate province ${id} (input ids: ${group.map((g) => g.code).join(', ')})`);
  }
  const missing = PROVINCES.map((p) => p.id).filter((id) => !byId.has(id));
  if (missing.length > 0) problems.push(`missing provinces: ${missing.join(', ')}`);
  if (problems.length > 0) throw new GeoError(problems.join('; '));

  return [...byId.entries()]
    .map(([id, group]) => ({ id, geometry: group[0]!.geometry }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---- islands ----

export interface DroppedPolygon {
  id: string;
  area_km2: number;
}

/**
 * Drops the polygons of a MultiPolygon whose original area is below minAreaKm2, always keeping the largest
 * polygon of every province. Reported areas are rounded to 3 decimals.
 */
export function dropIslands(
  inputs: ProvinceInput[],
  minAreaKm2: number
): { kept: ProvinceInput[]; dropped: DroppedPolygon[] } {
  const dropped: DroppedPolygon[] = [];
  const kept = inputs.map((input) => {
    if (input.geometry.type === 'Polygon' || minAreaKm2 <= 0) return input;
    const polygons = input.geometry.coordinates;
    const areas = polygons.map((polygon) => polygonAreaKm2(polygon));
    const largest = areas.indexOf(Math.max(...areas));
    const keep: Ring[][] = [];
    polygons.forEach((polygon, i) => {
      if (i === largest || areas[i]! >= minAreaKm2) {
        keep.push(polygon);
      } else {
        dropped.push({ id: input.id, area_km2: round3(areas[i]!) });
      }
    });
    return { id: input.id, geometry: { type: 'MultiPolygon' as const, coordinates: keep } };
  });
  return { kept, dropped };
}
