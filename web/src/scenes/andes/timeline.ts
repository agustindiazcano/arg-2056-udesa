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

/** The events ordered by campaign day, with the distance along the route at each. `endDay` lets the clock run past the last event (the other columns arrive later). */
export function buildRoute(events: readonly AndesEvent[], endDay?: number): Route {
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
    lastDay: Math.max(endDay ?? 0, points[points.length - 1]?.day_of_campaign ?? 0)
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

/** Altitude (m) from which the army dwells longer on the screen, and where the dwell is at its most; `DWELL_MAX` times the plain pace. */
const DWELL_FROM = 2200;
const DWELL_FULL = 3600;
const DWELL_MAX = 2.5;

/** How much of the clock a day of the campaign gets at this altitude, relative to a day on low ground (1): the high pass, the most epic part, lasts longer. */
export function dwellWeight(altitudeM: number | null): number {
  if (altitudeM === null) return 1;
  const t = Math.min(1, Math.max(0, (altitudeM - DWELL_FROM) / (DWELL_FULL - DWELL_FROM)));
  return 1 + (DWELL_MAX - 1) * t * t * (3 - 2 * t);
}

/**
 * The clock of the scene: the shared clock (the years of the app) mapped onto the days of the campaign like `campaignDay`, but a day
 * on high ground (`dwellWeight`) takes more of the clock than one in the valley. The whole campaign still takes the whole clock;
 * only its pacing changes. Built once per route: the returned function is cheap to call every frame.
 */
export function paceClock(route: Route, steps = 480): (yearFloat: number) => number {
  const last = route.lastDay;
  if (route.points.length === 0 || last <= 0) return () => 0;
  const cumulative = new Float64Array(steps + 1);
  for (let i = 0; i < steps; i += 1) {
    const mid = (last * (i + 0.5)) / steps;
    cumulative[i + 1] = cumulative[i]! + dwellWeight(positionAt(route, mid)?.altitudeM ?? null);
  }
  const total = cumulative[steps]!;
  return (yearFloat) => {
    const t = Math.min(1, Math.max(0, (yearFloat - YEAR_MIN) / (YEAR_MAX - YEAR_MIN))) * total;
    let lo = 0;
    let hi = steps;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (cumulative[m]! <= t) lo = m;
      else hi = m;
    }
    const span = cumulative[lo + 1]! - cumulative[lo]!;
    const within = span === 0 ? 0 : (t - cumulative[lo]!) / span;
    return Math.min(last, ((lo + within) / steps) * last);
  };
}

export interface PaceProgress {
  /** the share of the route walked by the clock's year, 0 to 1, by distance */
  progress: (yearFloat: number) => number;
  /** the year of the clock at which that share has been walked */
  yearAt: (progress: number) => number;
}

/** The progress of the crossing as the reader sees it (a percentage of the route) and the way back from it to the shared clock. */
export function paceProgress(route: Route): PaceProgress {
  const day = paceClock(route);
  const progress = (yearFloat: number) => {
    if (route.totalKm <= 0) return 0;
    const walked = positionAt(route, day(yearFloat))?.distanceKm ?? 0;
    return Math.min(1, Math.max(0, walked / route.totalKm));
  };
  const yearAt = (p: number) => {
    if (p <= 0) return YEAR_MIN;
    if (p >= 1) return YEAR_MAX;
    let lo = YEAR_MIN;
    let hi = YEAR_MAX;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (progress(mid) < p) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  return { progress, yearAt };
}
