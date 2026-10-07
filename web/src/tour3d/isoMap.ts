import type { ProjectedMap, ProvinceStyle } from '../charts3d/mapGeometry';

/** How much the north-south direction is squashed on the screen (the map is seen from the south, tilted), and how tall one unit of height is. */
const SQUASH = 0.62;
const RISE = 0.9;
const SELECTED_LIFT = 0.35;
const WALL_SHADE = 0.58;
const PAD = 0.4;

export interface IsoProvince {
  id: string;
  name: string;
  /** the roof, a path of the svg */
  top: string;
  /** the walls that face the viewer, one path */
  sides: string;
  color: string;
  sideColor: string;
  selected: boolean;
}

export interface IsoMap {
  /** north first: the south is drawn last and covers what is behind it */
  provinces: IsoProvince[];
  viewBox: { x: number; y: number; width: number; height: number };
}

type Point = [number, number];

/** Ground (x east, y north) and height to the screen: x stays, the rest goes up. */
const project = (x: number, y: number, z: number): Point => [x, -(y * SQUASH + z * RISE)];

const num = (n: number) => Math.round(n * 100) / 100;
const pt = (p: Point) => `${num(p[0])} ${num(p[1])}`;

/** A color darkened to `k` of its brightness (a hex color). */
export function shade(hex: string, k: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const v = parseInt(m[1]!, 16);
  const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((n) => Math.round(n * k).toString(16).padStart(2, '0'));
  return `#${c.join('')}`;
}

const signedArea = (ring: Point[]) => ring.reduce((sum, a, i) => {
  const b = ring[(i + 1) % ring.length]!;
  return sum + (a[0] * b[1] - b[0] * a[1]);
}, 0);

/**
 * The provinces as an oblique drawing: each one a roof (holes cut out) and the walls of its edges that look south, which are
 * the ones the viewer sees. Pure: the component only paints what this returns.
 */
export function isoMap(map: ProjectedMap, o: { styleOf: (id: string) => ProvinceStyle; selectedId: string | null }): IsoMap {
  const xs: number[] = [];
  const ys: number[] = [];
  const grow = (p: Point) => {
    xs.push(p[0]);
    ys.push(p[1]);
  };

  const provinces = map.provinces.map((province) => {
    const style = o.styleOf(province.id);
    const selected = o.selectedId === province.id;
    const height = style.height + (selected ? SELECTED_LIFT : 0);
    const top: string[] = [];
    const sides: string[] = [];
    let sumY = 0;
    let count = 0;
    for (const polygon of province.polygons) {
      for (const ring of [polygon.outer, ...polygon.holes]) {
        if (ring.length < 3) continue;
        const roof = ring.map(([x, y]) => project(x, y, height));
        roof.forEach(grow);
        top.push(`M${roof.map(pt).join('L')}Z`);
      }
      const ring = polygon.outer;
      if (ring.length < 3) continue;
      const ccw = signedArea(ring) > 0;
      ring.forEach(([, y]) => {
        sumY += y;
        count += 1;
      });
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length]!;
        const dx = b[0] - a[0];
        // the outward normal of a counter-clockwise edge is (dy, -dx): it looks south when dx > 0 (the other way for a clockwise ring)
        if (ccw ? dx <= 0 : dx >= 0) return;
        const quad = [project(a[0], a[1], 0), project(b[0], b[1], 0), project(b[0], b[1], height), project(a[0], a[1], height)];
        quad.forEach(grow);
        sides.push(`M${quad.map(pt).join('L')}Z`);
      });
    }
    return {
      order: count > 0 ? sumY / count : 0,
      province: {
        id: province.id,
        name: province.name,
        top: top.join(''),
        sides: sides.join('') || 'M0 0Z',
        color: style.color,
        sideColor: shade(style.color, WALL_SHADE),
        selected
      } satisfies IsoProvince
    };
  });

  provinces.sort((a, b) => b.order - a.order);
  const minX = Math.min(...xs) - PAD;
  const minY = Math.min(...ys) - PAD;
  return {
    provinces: provinces.map((p) => p.province),
    viewBox: { x: minX, y: minY, width: Math.max(...xs) + PAD - minX, height: Math.max(...ys) + PAD - minY }
  };
}
