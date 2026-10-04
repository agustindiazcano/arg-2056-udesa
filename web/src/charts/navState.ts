import type { ProvincesGeo } from '../geo/provinces';

/** [minLng, minLat, maxLng, maxLat] */
export type Bbox = [number, number, number, number];

/** The zoom of a 2D map goes from the whole territory to 8 times. */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;
/** One press of `+` zooms in by this factor and one press of `-` by its inverse. */
export const BUTTON_FACTOR = 1.25;

export const clampZoom = (zoom: number): number => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));

/** `factor`, cut so that `zoom * result` stays in the range (1 when the zoom is already at the limit). */
export function zoomFactorFor(zoom: number, factor: number): number {
  return clampZoom(zoom * factor) / zoom;
}

/** The union of the boxes of the provinces. */
export function geoBbox(geo: Pick<ProvincesGeo, 'features'>): Bbox {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const f of geo.features) {
    const [a, b, c, d] = f.properties.bbox;
    x0 = Math.min(x0, a);
    y0 = Math.min(y0, b);
    x1 = Math.max(x1, c);
    y1 = Math.max(y1, d);
  }
  return [x0, y0, x1, y1];
}

/**
 * The map centre kept where the window (1/zoom of the box on each side) stays inside the box: the territory never
 * leaves the frame. At zoom 1 the centre is the middle of the box.
 */
export function clampCenter(center: [number, number], zoom: number, bbox: Bbox): [number, number] {
  const [x0, y0, x1, y1] = bbox;
  const spare = 1 - 1 / Math.max(1, zoom);
  const hx = ((x1 - x0) / 2) * spare;
  const hy = ((y1 - y0) / 2) * spare;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return [Math.min(mx + hx, Math.max(mx - hx, center[0])), Math.min(my + hy, Math.max(my - hy, center[1]))];
}
