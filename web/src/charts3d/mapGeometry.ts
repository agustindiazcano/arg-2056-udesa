import { MALVINAS_FEATURE } from '../geo/malvinas';
import type { ProvincesGeo } from '../geo/provinces';
import { DIVERGING, NO_DATA, SEQUENTIAL_BLUE } from '../styles/tokens';

type Point = [number, number];

export interface ProjectedPolygon {
  outer: Point[];
  holes: Point[][];
}

export interface ProjectedProvince {
  id: string;
  name: string;
  polygons: ProjectedPolygon[];
  /** drawn but not a province: flat, in the no-data color, never picked (the Malvinas) */
  decor?: true;
}

export interface MapProjectionParams {
  midLon: number;
  midLat: number;
  kx: number;
  scale: number;
}

export interface ProjectedMap {
  provinces: ProjectedProvince[];
  /** shapes drawn with the map that are not provinces (the Malvinas): they do not count for the bounds nor for picking */
  decor?: ProjectedProvince[];
  /** the extent after centring on the origin */
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
  /** parameters used to project geographic coordinates to scene coordinates */
  params?: MapProjectionParams;
}

type Ring = number[][];
type PolygonCoords = Ring[];

/** A ring without its closing point: a shape closes itself. */
function open(ring: Ring): Ring {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first && last && first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
}

/**
 * The provinces as flat polygons ready to extrude: x grows to the east and y to the north, east-west distances are
 * shrunk by the cosine of the middle latitude so the shapes keep their proportions, and the whole map is centred on the
 * origin. `scale` sets the size of one degree of latitude.
 */
export function projectFeatures(geo: ProvincesGeo, opts: { scale?: number; malvinas?: boolean } = {}): ProjectedMap {
  const scale = opts.scale ?? 0.18;
  const rings: Ring[] = [];
  for (const f of geo.features) {
    const g = f.geometry as unknown as { type: string; coordinates: PolygonCoords | PolygonCoords[] };
    const polys = (g.type === 'Polygon' ? [g.coordinates as PolygonCoords] : (g.coordinates as PolygonCoords[]));
    for (const poly of polys) for (const ring of poly) rings.push(ring);
  }
  const lons = rings.flatMap((r) => r.map((p) => p[0]!));
  const lats = rings.flatMap((r) => r.map((p) => p[1]!));
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const midLon = (minLon + maxLon) / 2;
  const midLat = (minLat + maxLat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180) * scale;
  const params: MapProjectionParams = { midLon, midLat, kx, scale };

  const project = (p: number[]): Point => [(p[0]! - midLon) * kx, (p[1]! - midLat) * scale];

  const provinces = geo.features.map((f) => {
    const g = f.geometry as unknown as { type: string; coordinates: PolygonCoords | PolygonCoords[] };
    const polys = g.type === 'Polygon' ? [g.coordinates as PolygonCoords] : (g.coordinates as PolygonCoords[]);
    return {
      id: f.properties.id as string,
      name: f.properties.name,
      polygons: polys.map((poly) => ({
        outer: open(poly[0]!).map(project),
        holes: poly.slice(1).map((ring) => open(ring).map(project))
      }))
    };
  });

  const decor: ProjectedProvince[] =
    opts.malvinas === false
      ? []
      : [
          {
            id: MALVINAS_FEATURE.properties.id,
            name: 'Islas Malvinas',
            decor: true,
            polygons: MALVINAS_FEATURE.geometry.coordinates.map((poly) => ({ outer: open(poly[0]!).map(project), holes: [] }))
          }
        ];

  const width = (maxLon - minLon) * kx;
  const height = (maxLat - minLat) * scale;
  return {
    provinces,
    decor,
    bounds: { minX: -width / 2, maxX: width / 2, minY: -height / 2, maxY: height / 2, width, height },
    params
  };
}

export interface ProjectedDepartment {
  id: string;
  name: string;
  cabecera: string;
  centroid: Point;
  polygons: ProjectedPolygon[];
}

/** Projects a province's departments into the exact same 3D coordinate space as the national map. */
export function projectDepartments(
  departments: { features: Array<{ id?: string; properties: { id?: string; departamento: string; cabecera: string; centroid: [number, number] }; geometry: { type: string; coordinates: unknown } }> },
  params: MapProjectionParams
): ProjectedDepartment[] {
  const { midLon, midLat, kx, scale } = params;
  const project = (p: number[]): Point => [(p[0]! - midLon) * kx, (p[1]! - midLat) * scale];

  return departments.features.map((f) => {
    const g = f.geometry as { type: string; coordinates: PolygonCoords | PolygonCoords[] };
    const polys = g.type === 'Polygon' ? [g.coordinates as PolygonCoords] : (g.coordinates as PolygonCoords[]);
    const centroid = project(f.properties.centroid);
    return {
      id: f.id || f.properties.id || f.properties.departamento,
      name: f.properties.departamento,
      cabecera: f.properties.cabecera,
      centroid,
      polygons: polys.map((poly) => ({
        outer: open(poly[0]!).map(project),
        holes: poly.slice(1).map((ring) => open(ring).map(project))
      }))
    };
  });
}

export interface ProvinceStyle {
  height: number;
  color: string;
  hasData: boolean;
}

// Sophisticated subtle relief: flat base with gentle elevation variations
const BASE_HEIGHT = 0.05;
const RELIEF = 0.14;
const FLAT = 0.03;

/**
 * How a province looks in 3D: subtle relief height and sleek color from its value on the color domain.
 */
export function provinceStyle(value: number | undefined, domain: [number, number] | null, metric: 'level' | 'change'): ProvinceStyle {
  if (value === undefined || domain === null) return { height: FLAT, color: NO_DATA, hasData: false };
  const [min, max] = domain;
  const t = max === min ? 1 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const ramp = metric === 'level' ? SEQUENTIAL_BLUE : DIVERGING;
  const color = ramp[Math.round(t * (ramp.length - 1))]!;
  const height = BASE_HEIGHT + RELIEF * (metric === 'level' ? t : Math.abs(2 * t - 1));
  return { height, color, hasData: true };
}
