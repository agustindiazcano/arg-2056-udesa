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
