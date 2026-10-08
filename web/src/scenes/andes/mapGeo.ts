import type { Route } from './timeline';
import type { CameraMode } from './camera';

const EARTH_CIRCUMFERENCE_M = 40075016.686;
const TILE = 512;
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Height of a figure of `figureParts` in its own units (the leader with the bicorn is a little taller). */
export const FIGURE_HEIGHT_UNITS = 0.16;
/** A unit of the figures is never less than this many meters: at the closest zoom a man is about as tall as a man (0.16 units x 11 m = 1.76 m). */
export const MIN_METERS_PER_UNIT = 11;
/** From this zoom the column of figures replaces the marker of the army. */
export const FIGURE_MIN_ZOOM = 12;
const FIGURE_ZOOM_MARGIN = 0.6;

/** Meters on the ground that one pixel of the screen covers at this zoom and latitude (MapLibre tiles of 512 px). */
export function metersPerPixel(zoom: number, latitude: number): number {
  return (EARTH_CIRCUMFERENCE_M * Math.cos(rad(latitude))) / (TILE * 2 ** zoom);
}

/**
 * Meters of one unit of the figures, so a figure stands `figurePx` pixels tall on the screen whatever the zoom (a miniature that is
 * always readable), down to the real size of a man at the closest zoom.
 */
export function metersPerUnit(zoom: number, latitude: number, figurePx: number): number {
  return Math.max(MIN_METERS_PER_UNIT, (figurePx * metersPerPixel(zoom, latitude)) / FIGURE_HEIGHT_UNITS);
}

/** Figures or the single marker, by zoom, with a margin so it does not flicker at the threshold. */
export function figuresVisible(zoom: number, current: boolean): boolean {
  return zoom >= (current ? FIGURE_MIN_ZOOM - FIGURE_ZOOM_MARGIN : FIGURE_MIN_ZOOM);
}

/** Compass bearing (degrees, 0 north, clockwise) from one point to another. */
export function bearingDeg(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dLon = rad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(dLon);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export interface RouteCoord {
  lon: number;
  lat: number;
  /** compass bearing of the leg the point is on */
  bearing: number;
}

/** The point of the route at this distance (km) from its start, clamped to the ends, with the bearing of its leg. */
export function coordAtKm(route: Route, km: number): RouteCoord {
  const { points } = route;
  const first = points[0];
  if (!first) return { lon: 0, lat: 0, bearing: 0 };
  if (points.length === 1) return { lon: first.lon, lat: first.lat, bearing: 0 };
  const d = Math.min(route.totalKm, Math.max(0, km));
  let i = 0;
  while (i < points.length - 2 && points[i + 1]!.distanceKm <= d) i += 1;
  const a = points[i]!;
  const b = points[i + 1]!;
  const span = b.distanceKm - a.distanceKm;
  const t = span === 0 ? 0 : (d - a.distanceKm) / span;
  return { lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, bearing: bearingDeg(a.lon, a.lat, b.lon, b.lat) };
}

export interface CameraTarget {
  center: [number, number];
  zoom: number;
  pitch: number;
  /** undefined: keep the turn the reader has */
  bearing?: number;
}

/** Where each camera mode puts the map camera, given the army; `free` (null) leaves it to the reader. */
export function cameraFor(mode: CameraMode, army: RouteCoord): CameraTarget | null {
  const center: [number, number] = [army.lon, army.lat];
  switch (mode) {
    case 'follow':
      return { center, zoom: 14, pitch: 65 };
    case 'cine':
      return { center, zoom: 14.6, pitch: 74, bearing: army.bearing };
    case 'aerial':
      return { center, zoom: 11, pitch: 20 };
    case 'map':
      return { center: [-69.75, -32.35], zoom: 7.8, pitch: 50, bearing: 0 };
    default:
      return null;
  }
}

/** How many strides a figure takes per second: the legs keep this pace however fast the clock runs. */
export const STRIDES_PER_SECOND = 1.3;
/** The army counts as walking while its position changed within this many milliseconds. */
export const WALKING_GRACE_MS = 250;

/** The phase of the stride (in strides) at a time: it grows at a fixed pace, so the animation never speeds up with the clock. */
export function gaitPhaseAt(nowMs: number): number {
  return (nowMs / 1000) * STRIDES_PER_SECOND;
}

/** 1 while the army moves (its position changed a moment ago), 0 when it stands. */
export function gaitAmount(nowMs: number, lastMovedMs: number): number {
  return nowMs - lastMovedMs <= WALKING_GRACE_MS ? 1 : 0;
}
