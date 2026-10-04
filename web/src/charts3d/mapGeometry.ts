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
}

export interface ProjectedMap {
  provinces: ProjectedProvince[];
  /** the extent after centring on the origin */
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
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
export function projectFeatures(geo: ProvincesGeo, opts: { scale?: number } = {}): ProjectedMap {
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

  const width = (maxLon - minLon) * kx;
  const height = (maxLat - minLat) * scale;
  return {
    provinces,
    bounds: { minX: -width / 2, maxX: width / 2, minY: -height / 2, maxY: height / 2, width, height }
  };
}

export interface ProvinceStyle {
  height: number;
  color: string;
  hasData: boolean;
}

const BASE_HEIGHT = 0.12;
const RELIEF = 1.5;
const FLAT = 0.05;

/**
 * How a province looks in 3D: its height and color from its value on the color domain. No value or no domain: flat, in
 * the no-data color. Level uses the sequential ramp (higher is lighter and taller); change uses the diverging one and
 * rises with the size of the change in either direction.
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
