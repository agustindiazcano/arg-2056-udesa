import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { feature as topoFeature } from 'topojson-client';
import { topology } from 'topojson-server';
import type { Objects, Topology } from 'topojson-specification';
import { planarTriangleArea, presimplify, simplify } from 'topojson-simplify';
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

// ---- simplification ----

export interface SimplifiedFeature {
  id: string;
  geometry: AreaGeometry;
}

const roundTo = (x: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(x * factor) / factor + 0; // "+ 0" turns -0 into 0
};

function roundRing(ring: Ring, decimals: number): Ring {
  const out: Ring = [];
  for (const [x, y] of ring) {
    const position: Position = [roundTo(x, decimals), roundTo(y, decimals)];
    const last = out[out.length - 1];
    if (!last || last[0] !== position[0] || last[1] !== position[1]) out.push(position);
  }
  return out;
}

function toGeoJsonFeatures(inputs: ProvinceInput[]): FeatureCollection<Polygon | MultiPolygon, { id: string }> {
  return {
    type: 'FeatureCollection',
    features: inputs.map(
      (input): Feature<Polygon | MultiPolygon, { id: string }> => ({
        type: 'Feature',
        properties: { id: input.id },
        geometry: input.geometry
      })
    )
  };
}

function buildTopology(inputs: ProvinceInput[]): Topology<Objects> {
  // topojson-server types the properties as GeoJsonProperties (possibly null), topojson-simplify as {}
  const built = topology({ provinces: toGeoJsonFeatures(inputs) }) as Topology<Objects>;
  return presimplify(built, planarTriangleArea);
}

type Weighted = ReturnType<typeof buildTopology>;

function byId(a: SimplifiedFeature, b: SimplifiedFeature): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function render(topo: Weighted, minWeight: number, decimals: number): SimplifiedFeature[] {
  const simplified = simplify(topo, minWeight);
  const object = simplified.objects.provinces;
  if (!object || object.type !== 'GeometryCollection') {
    throw new GeoError('internal error: unexpected topology object');
  }
  const result: SimplifiedFeature[] = [];
  for (const geometry of object.geometries) {
    const id = String((geometry.properties as { id: string }).id);
    const converted = topoFeature(simplified, geometry);
    if (converted.type !== 'Feature') throw new GeoError('internal error: expected a Feature');
    const g = converted.geometry as Polygon | MultiPolygon | null;
    if (!g) {
      result.push({ id, geometry: { type: 'MultiPolygon', coordinates: [] } });
    } else if (g.type === 'Polygon') {
      result.push({
        id,
        geometry: { type: 'Polygon', coordinates: g.coordinates.map((r) => roundRing(r as Ring, decimals)) }
      });
    } else {
      result.push({
        id,
        geometry: {
          type: 'MultiPolygon',
          coordinates: g.coordinates.map((poly) => poly.map((r) => roundRing(r as Ring, decimals)))
        }
      });
    }
  }
  return result.sort(byId);
}

/**
 * Builds a topology (shared borders become shared arcs), simplifies it with Visvalingam-Whyatt (triangle areas in
 * square degrees, topojson-simplify) removing every point whose weight is below minWeight, and rounds the
 * coordinates. Neighbouring provinces keep exactly the same border because they share the same arcs.
 */
export function simplifyFeatures(inputs: ProvinceInput[], minWeight: number, decimals: number): SimplifiedFeature[] {
  return render(buildTopology(inputs), minWeight, decimals);
}

// ---- geometry checks and properties ----

export function findGeometryProblems(geometry: AreaGeometry): string[] {
  const polygons: Ring[][] = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const rings = polygons.flat();
  if (rings.length === 0) return ['geometry is empty'];
  const problems = new Set<string>();
  for (const ring of rings) {
    if (ring.length < 4) problems.add(`ring has ${ring.length} positions, at least 4 are required`);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) problems.add('ring is not closed');
    if (ring.some((p) => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) problems.add('coordinate is not finite');
  }
  return [...problems];
}

function signedArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i]![0] * ring[i + 1]![1] - ring[i + 1]![0] * ring[i]![1];
  }
  return sum / 2;
}

function ringCentroid(ring: Ring): Position {
  const a = signedArea(ring);
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[i + 1]!;
    const cross = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  return a === 0 ? ring[0]! : [cx / (6 * a), cy / (6 * a)];
}

function inRing(point: Position, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export interface GeometryProperties {
  centroid: Position;
  centroid_inside: boolean;
  bbox: [number, number, number, number];
}

/**
 * Planar area-weighted centroid of the largest polygon (holes subtract), whether it lies inside that polygon, and
 * the bbox of the whole geometry. Values are rounded to `decimals`.
 */
export function polygonProperties(geometry: AreaGeometry, decimals: number): GeometryProperties {
  const polygons: Ring[][] = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let largest = polygons[0]!;
  let largestArea = -Infinity;
  for (const polygon of polygons) {
    const area = polygonAreaKm2(polygon);
    if (area > largestArea) {
      largest = polygon;
      largestArea = area;
    }
  }

  let weight = 0;
  let cx = 0;
  let cy = 0;
  largest.forEach((ring, index) => {
    const w = Math.abs(signedArea(ring)) * (index === 0 ? 1 : -1);
    const [x, y] = ringCentroid(ring);
    weight += w;
    cx += w * x;
    cy += w * y;
  });
  const centroid: Position = [cx / weight, cy / weight];
  const inside = inRing(centroid, largest[0]!) && !largest.slice(1).some((hole) => inRing(centroid, hole));

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const position of polygons.flat(2)) {
    west = Math.min(west, position[0]);
    east = Math.max(east, position[0]);
    south = Math.min(south, position[1]);
    north = Math.max(north, position[1]);
  }
  return {
    centroid: [roundTo(centroid[0], decimals), roundTo(centroid[1], decimals)],
    centroid_inside: inside,
    bbox: [roundTo(west, decimals), roundTo(south, decimals), roundTo(east, decimals), roundTo(north, decimals)]
  };
}

// ---- build ----

export interface BuildMeta {
  simplification: {
    algorithm: string;
    parameter: number;
    vertices_before: number;
    vertices_after: number;
    bytes: number;
  };
  dropped_polygons: DroppedPolygon[];
  area_change_pct: Record<string, number>;
}

export interface BuildResult {
  /** Serialized FeatureCollection, ending with a newline. */
  geojson: string;
  meta: BuildMeta;
}

export const SIMPLIFICATION_ALGORITHM =
  'visvalingam-whyatt (topojson-simplify, planar triangle area in square degrees)';
const SEARCH_ITERATIONS = 40;

function countPositions(geometries: AreaGeometry[]): number {
  return geometries.reduce((sum, g) => {
    const polygons: Ring[][] = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    return sum + polygons.flat().reduce((n, ring) => n + ring.length, 0);
  }, 0);
}

function serialize(features: SimplifiedFeature[], originalAreas: Map<string, number>, decimals: number): string {
  const collection = {
    type: 'FeatureCollection',
    features: features.map((f) => {
      const props = polygonProperties(f.geometry, decimals);
      return {
        type: 'Feature',
        properties: {
          id: f.id,
          name: PROVINCES.find((p) => p.id === f.id)!.name,
          area_km2: round3(originalAreas.get(f.id)!),
          centroid: props.centroid,
          centroid_inside: props.centroid_inside,
          bbox: props.bbox
        },
        geometry: f.geometry
      };
    })
  };
  return JSON.stringify(collection) + '\n';
}

function maxFiniteWeight(topo: Weighted): number {
  let max = 0;
  for (const arc of topo.arcs) {
    for (const point of arc) {
      const z = point[2];
      if (typeof z === 'number' && Number.isFinite(z) && z > max) max = z;
    }
  }
  return max;
}

/**
 * Whole pipeline: input check, island drop, area before simplification, topology and budget search, quality gates.
 * area_km2 comes from the original geometry (islands included); the area change gate compares the geometry that
 * went into the simplification (after the island drop, which is reported separately) with the simplified one.
 */
export function buildProvinces(raw: unknown, cfg: GeoConfig): BuildResult {
  const inputs = checkInput(raw, cfg);
  const originalAreas = new Map(inputs.map((i) => [i.id, geometryAreaKm2(i.geometry)]));
  const { kept, dropped } = dropIslands(inputs, cfg.min_island_area_km2);
  const verticesBefore = countPositions(kept.map((k) => k.geometry));

  const topo = buildTopology(kept);
  const decimals = cfg.coordinate_decimals;
  const attempt = (minWeight: number) => {
    const features = render(topo, minWeight, decimals);
    const geojson = serialize(features, originalAreas, decimals);
    return { features, geojson, bytes: Buffer.byteLength(geojson) };
  };

  let parameter = 0;
  let result = attempt(0);
  if (result.bytes > cfg.target_max_bytes) {
    let hi = Math.max(maxFiniteWeight(topo) * 2, 1e-12);
    const coarsest = attempt(hi);
    if (coarsest.bytes > cfg.target_max_bytes) {
      throw new GeoError(
        `cannot fit target_max_bytes ${cfg.target_max_bytes}: achieved size ${coarsest.bytes} bytes at maximum simplification`
      );
    }
    let lo = 0;
    for (let i = 0; i < SEARCH_ITERATIONS; i++) {
      const mid = (lo + hi) / 2;
      if (attempt(mid).bytes <= cfg.target_max_bytes) hi = mid;
      else lo = mid;
    }
    parameter = hi;
    result = attempt(hi);
  }

  const areaChange: Record<string, number> = {};
  const before = new Map(kept.map((k) => [k.id, k.geometry]));
  for (const f of result.features) {
    const problems = findGeometryProblems(f.geometry);
    if (problems.length > 0) throw new GeoError(`province ${f.id} ${problems.join('; ')}`);
    const beforeArea = geometryAreaKm2(before.get(f.id)!);
    const afterArea = geometryAreaKm2(f.geometry);
    const pct = beforeArea === 0 ? (afterArea === 0 ? 0 : 100) : (Math.abs(afterArea - beforeArea) / beforeArea) * 100;
    if (pct > cfg.max_area_change_pct) {
      throw new GeoError(
        `province ${f.id} area changed ${pct.toFixed(6)}% which exceeds max_area_change_pct ${cfg.max_area_change_pct}`
      );
    }
    areaChange[f.id] = Math.round(pct * 1e6) / 1e6;
  }

  return {
    geojson: result.geojson,
    meta: {
      simplification: {
        algorithm: SIMPLIFICATION_ALGORITHM,
        parameter,
        vertices_before: verticesBefore,
        vertices_after: countPositions(result.features.map((f) => f.geometry)),
        bytes: result.bytes
      },
      dropped_polygons: dropped,
      area_change_pct: areaChange
    }
  };
}
