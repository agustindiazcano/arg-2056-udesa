import type { Route } from './timeline';

/**
 * Effects of the Andes map that do not come from the data: clouds drifting over the cordillera, the smoke and flashes of a combat, and the banner of a victory.
 * All pure and stateless: where a puff is depends only on the clock, so the same clock gives the same picture and nothing is stored between frames.
 */

/** a repeatable number in [0, 1) from an index and a seed */
function hash(i: number, seed: number): number {
  const h = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

// ---- clouds -----------------------------------------------------------------------------------------------------

export const CLOUD_COUNT = 9;
/** puffs that make one cloud */
const PUFFS_PER_CLOUD = 4;
/** the box the clouds live in: around the passes and the valleys on both sides */
const CLOUD_BOX = { west: -71.4, east: -68.4, south: -33.8, north: -32.0 };
/** the wind, in degrees of longitude per ms (about 8 m/s toward the east) */
const WIND_DEG_PER_MS = 8e-3 / 93_000;
/** from this zoom on the clouds are full size ... */
const CLOUD_FULL_ZOOM = 8;
/** ... and from this one they are gone, so none hides the army up close */
export const CLOUD_MAX_ZOOM = 11;

export interface CloudPuff {
  lon: number;
  lat: number;
  altitudeM: number;
  radiusM: number;
}

/** How much of its size a cloud keeps at this zoom: 1 far away, 0 close up. */
export function cloudScale(zoom: number): number {
  if (zoom <= CLOUD_FULL_ZOOM) return 1;
  if (zoom >= CLOUD_MAX_ZOOM) return 0;
  return 1 - (zoom - CLOUD_FULL_ZOOM) / (CLOUD_MAX_ZOOM - CLOUD_FULL_ZOOM);
}

/** The puffs of every cloud at `timeMs`: they drift east and come back in from the west at the edge of the box. */
export function cloudPuffs(timeMs: number): CloudPuff[] {
  const width = CLOUD_BOX.east - CLOUD_BOX.west;
  const out: CloudPuff[] = [];
  for (let c = 0; c < CLOUD_COUNT; c += 1) {
    const baseLon = CLOUD_BOX.west + hash(c, 1) * width;
    const lon0 = CLOUD_BOX.west + ((((baseLon - CLOUD_BOX.west + timeMs * WIND_DEG_PER_MS * (0.7 + hash(c, 2) * 0.6)) % width) + width) % width);
    const lat0 = CLOUD_BOX.south + hash(c, 3) * (CLOUD_BOX.north - CLOUD_BOX.south);
    const altitude = 5200 + hash(c, 4) * 1400;
    const size = 900 + hash(c, 5) * 1500;
    for (let i = 0; i < PUFFS_PER_CLOUD; i += 1) {
      const dLon = ((hash(c * 10 + i, 6) - 0.5) * size * 1.6) / 93_000;
      const dLat = ((hash(c * 10 + i, 7) - 0.5) * size * 0.9) / 111_000;
      out.push({
        lon: lon0 + dLon,
        lat: lat0 + dLat,
        altitudeM: altitude + (hash(c * 10 + i, 8) - 0.5) * 300,
        radiusM: size * (0.55 + hash(c * 10 + i, 9) * 0.45)
      });
    }
  }
  return out;
}

// ---- combat -----------------------------------------------------------------------------------------------------

/** The fire starts this many days before the day of the combat... */
export const COMBAT_BEFORE_DAYS = 0.4;
/** ...and goes on this many days after it. */
export const COMBAT_AFTER_DAYS = 0.6;
/** meters across the line of fire of the battle and of a skirmish */
const BATTLE_WIDTH_M = 900;
const SKIRMISH_WIDTH_M = 150;

export interface CombatSite {
  id: string;
  name: string;
  lon: number;
  lat: number;
  /** meters across the line of fire */
  widthM: number;
}

/** The combats that are being fought on `day`: the place of each event of the route that has an outcome (a combat or a battle). */
export function combatSites(route: Route, day: number): CombatSite[] {
  const out: CombatSite[] = [];
  for (const p of route.points) {
    if (!p.outcome) continue;
    if (day < p.day_of_campaign - COMBAT_BEFORE_DAYS || day > p.day_of_campaign + COMBAT_AFTER_DAYS) continue;
    out.push({ id: p.id, name: p.name, lon: p.lon, lat: p.lat, widthM: /Batalla/i.test(p.name) ? BATTLE_WIDTH_M : SKIRMISH_WIDTH_M });
  }
  return out;
}

export interface CombatPuff {
  kind: 'smoke' | 'flash';
  /** meters east and north of the site, height above the ground */
  eastM: number;
  northM: number;
  heightM: number;
  /** 0 to 1: how much of its full size it has now (it grows and fades out, or blinks) */
  scale: number;
  radiusM: number;
}

const SMOKE_LIFE_MS = 2600;
const FLASH_LIFE_MS = 260;

/** The smoke and the flashes of a combat at `timeMs`, spread across its line of fire. */
export function combatPuffs(site: CombatSite, timeMs: number): CombatPuff[] {
  const smoke = Math.min(60, Math.max(8, Math.round(site.widthM / 12)));
  const flashes = Math.max(3, Math.round(smoke / 3));
  const out: CombatPuff[] = [];
  for (let i = 0; i < smoke; i += 1) {
    const t = timeMs / SMOKE_LIFE_MS + i * 0.618034;
    const age = t - Math.floor(t);
    out.push({
      kind: 'smoke',
      eastM: (hash(i, 11) - 0.5) * site.widthM,
      northM: (hash(i, 12) - 0.5) * 40 + age * 12,
      heightM: 4 + age * 70,
      scale: Math.sin(Math.PI * age),
      radiusM: 12 + 12 * age
    });
  }
  for (let i = 0; i < flashes; i += 1) {
    const t = timeMs / FLASH_LIFE_MS + i * 0.37;
    const age = t - Math.floor(t);
    // a flash is on for the first third of its cycle and at a new spot each cycle
    const cycle = Math.floor(t);
    out.push({
      kind: 'flash',
      eastM: (hash(i * 31 + cycle, 13) - 0.5) * site.widthM,
      northM: (hash(i * 31 + cycle, 14) - 0.5) * 30,
      heightM: 2 + hash(i, 15) * 8,
      scale: age < 0.33 ? 1 : 0,
      radiusM: 4
    });
  }
  return out;
}

// ---- victory ----------------------------------------------------------------------------------------------------

export interface VictoryBanner {
  id: string;
  name: string;
  lon: number;
  lat: number;
  text: string;
}

/** The banners «Victoria patriota» over the events the army has won (or passed) by `day`: an event with a patriot outcome whose day has come. They stay once shown. */
export function victoryBanners(route: Route, day: number): VictoryBanner[] {
  return route.points
    .filter((p) => p.outcome && /patriota/i.test(p.outcome.result) && day >= p.day_of_campaign)
    .map((p) => ({ id: p.id, name: p.name, lon: p.lon, lat: p.lat, text: 'Victoria patriota' }));
}

/** The width on the screen, in pixels, of a puff of `radiusM` meters where a pixel is `metersPerPixel` meters: never under `minPx`, so it reads from far away. */
export function puffSizePx(radiusM: number, metersPerPixel: number, minPx: number): number {
  return Math.max(minPx, (2 * radiusM) / metersPerPixel);
}
