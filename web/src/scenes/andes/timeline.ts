import { YEAR_MAX, YEAR_MIN } from '../../types/year';
import type { AndesEvent } from './data';

/** Radius of the sphere of the terrain tool, in km. */
const EARTH_KM = 6371.0088;

export interface RoutePoint extends AndesEvent {
  /** kilometers along the route from the first point */
  distanceKm: number;
}

export interface Route {
  points: RoutePoint[];
  totalKm: number;
  firstDay: number;
  lastDay: number;
}

export interface RoutePosition {
  lon: number;
  lat: number;
  /** meters, interpolated between the points that have an altitude; null when none has one */
  altitudeM: number | null;
  distanceKm: number;
  /** the index of the point the segment starts at */
  segment: number;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km between two points (haversine). */
export function distanceKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** The events ordered by campaign day, with the distance along the route at each. */
export function buildRoute(events: readonly AndesEvent[]): Route {
  const sorted = [...events].sort((a, b) => a.day_of_campaign - b.day_of_campaign);
  let total = 0;
  const points = sorted.map((e, i) => {
    if (i > 0) {
      const prev = sorted[i - 1]!;
      total += distanceKm(prev.lon, prev.lat, e.lon, e.lat);
    }
    return { ...e, distanceKm: total };
  });
  return {
    points,
    totalKm: total,
    firstDay: points[0]?.day_of_campaign ?? 0,
    lastDay: points[points.length - 1]?.day_of_campaign ?? 0
  };
}

/** The altitude at a point of the route: the nearest known ones before and after, joined in a straight line by day. */
function altitudeAt(points: readonly RoutePoint[], day: number): number | null {
  let before: RoutePoint | null = null;
  let after: RoutePoint | null = null;
  for (const p of points) {
    if (p.elevation_m === null) continue;
    if (p.day_of_campaign <= day) before = p;
    if (p.day_of_campaign >= day && after === null) after = p;
  }
  if (before && after) {
    if (after.day_of_campaign === before.day_of_campaign) return before.elevation_m;
    const t = (day - before.day_of_campaign) / (after.day_of_campaign - before.day_of_campaign);
    return before.elevation_m! + (after.elevation_m! - before.elevation_m!) * t;
  }
  return (before ?? after)?.elevation_m ?? null;
}

/** Where the army is on a campaign day: on the straight line between the two points around that day, clamped to the ends. */
export function positionAt(route: Route, day: number): RoutePosition | null {
  const { points } = route;
  if (points.length === 0) return null;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const d = Math.min(last.day_of_campaign, Math.max(first.day_of_campaign, day));
  let i = 0;
  while (i < points.length - 2 && points[i + 1]!.day_of_campaign <= d) i += 1;
  const a = points[i]!;
  const b = points[i + 1];
  if (!b) return { lon: a.lon, lat: a.lat, altitudeM: altitudeAt(points, d), distanceKm: a.distanceKm, segment: i };
  const span = b.day_of_campaign - a.day_of_campaign;
  const t = span === 0 ? 0 : (d - a.day_of_campaign) / span;
  return {
    lon: a.lon + (b.lon - a.lon) * t,
    lat: a.lat + (b.lat - a.lat) * t,
    altitudeM: altitudeAt(points, d),
    distanceKm: a.distanceKm + (b.distanceKm - a.distanceKm) * t,
    segment: i
  };
}

/** The shared clock (the years of the app) mapped onto the days of the campaign. */
export function campaignDay(yearFloat: number, lastDay: number): number {
  const t = (yearFloat - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  return Math.min(1, Math.max(0, t)) * lastDay;
}
