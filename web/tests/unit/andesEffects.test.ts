import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseAndesEvents } from '../../src/scenes/andes/data';
import { splitColumns } from '../../src/scenes/andes/columns';
import { buildRoute } from '../../src/scenes/andes/timeline';
import {
  CLOUD_COUNT,
  CLOUD_MAX_ZOOM,
  COMBAT_AFTER_DAYS,
  COMBAT_BEFORE_DAYS,
  cloudPuffs,
  cloudScale,
  combatPuffs,
  combatSites,
  victoryBanners
} from '../../src/scenes/andes/effects';

const events = parseAndesEvents(JSON.parse(readFileSync(resolve(process.cwd(), '../data/mock/andes_events.json'), 'utf8')) as unknown);
const route = buildRoute(splitColumns(events).main);
const day = (re: RegExp) => route.points.find((p) => re.test(p.name))!.day_of_campaign;

describe('cloudScale', () => {
  it('is full far away, shrinks as the camera comes close and is gone up close, so no cloud hides the army', () => {
    expect(cloudScale(5)).toBe(1);
    expect(cloudScale(CLOUD_MAX_ZOOM)).toBe(0);
    expect(cloudScale(15)).toBe(0);
    const mid = cloudScale((CLOUD_MAX_ZOOM + 8) / 2);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe('cloudPuffs', () => {
  it('gives every cloud a few puffs high above the ground, deterministic for a clock', () => {
    const a = cloudPuffs(0);
    const b = cloudPuffs(0);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(CLOUD_COUNT * 3);
    for (const p of a) {
      expect(p.altitudeM).toBeGreaterThan(4000);
      expect(p.radiusM).toBeGreaterThan(300);
    }
  });

  it('drifts with the wind and wraps inside the box instead of leaving it', () => {
    const early = cloudPuffs(0);
    const later = cloudPuffs(120_000);
    expect(later[0]!.lon).not.toBe(early[0]!.lon);
    for (const p of cloudPuffs(10 * 3600_000)) {
      expect(p.lon).toBeGreaterThan(-72.5);
      expect(p.lon).toBeLessThan(-67.5);
    }
  });
});

describe('combatSites', () => {
  it('lights up the place of a combat only around its day', () => {
    const coimas = day(/Coimas/);
    expect(combatSites(route, coimas - COMBAT_BEFORE_DAYS - 0.5)).toHaveLength(0);
    const during = combatSites(route, coimas);
    expect(during.map((s) => s.id)).toContain(route.points.find((p) => /Coimas/.test(p.name))!.id);
    expect(combatSites(route, coimas + COMBAT_AFTER_DAYS + 0.5).some((s) => /Coimas/.test(s.name))).toBe(false);
  });

  it('has a wider line of fire for the battle than for a skirmish', () => {
    const battle = combatSites(route, day(/Batalla/)).find((s) => /Batalla/.test(s.name))!;
    const skirmish = combatSites(route, day(/Achupallas/)).find((s) => /Achupallas/.test(s.name))!;
    expect(battle.widthM).toBeGreaterThan(skirmish.widthM);
  });

  it('is nothing for an event that is not a combat', () => {
    expect(combatSites(route, day(/Manantiales/)).some((s) => /Manantiales/.test(s.name))).toBe(false);
  });
});

describe('combatPuffs', () => {
  const site = { id: 's', name: 'x', lon: -70.7, lat: -32.99, widthM: 400 };

  it('raises smoke and flashes across the line of fire, deterministic for a clock', () => {
    const a = combatPuffs(site, 1234);
    expect(a).toEqual(combatPuffs(site, 1234));
    expect(a.some((p) => p.kind === 'smoke')).toBe(true);
    expect(a.some((p) => p.kind === 'flash')).toBe(true);
    for (const p of a) {
      expect(Math.abs(p.eastM)).toBeLessThanOrEqual(site.widthM / 2 + 1);
      expect(p.heightM).toBeGreaterThanOrEqual(0);
      expect(p.scale).toBeGreaterThanOrEqual(0);
      expect(p.scale).toBeLessThanOrEqual(1);
    }
  });

  it('moves with the clock', () => {
    expect(combatPuffs(site, 0)).not.toEqual(combatPuffs(site, 700));
  });

  it('is bigger for a wider line', () => {
    expect(combatPuffs({ ...site, widthM: 1000 }, 0).length).toBeGreaterThan(combatPuffs({ ...site, widthM: 150 }, 0).length);
  });
});

describe('victoryBanners', () => {
  it('shows nothing before the army reaches a patriot victory', () => {
    expect(victoryBanners(route, 0)).toHaveLength(0);
    expect(victoryBanners(route, day(/Achupallas/) - 1)).toHaveLength(0);
  });

  it('shows a banner over each victory the army has won so far, and keeps it', () => {
    const first = victoryBanners(route, day(/Achupallas/));
    expect(first.map((b) => b.name)).toEqual(['Las Achupallas (combate)']);
    const all = victoryBanners(route, day(/Batalla/));
    expect(all.map((b) => b.name)).toEqual(['Las Achupallas (combate)', 'Las Coimas (combate)', 'Batalla de Chacabuco']);
    expect(victoryBanners(route, day(/Batalla/) + 3)).toHaveLength(3);
  });

  it('says Victoria patriota with the place on the spot of the event', () => {
    const b = victoryBanners(route, day(/Batalla/)).find((x) => /Batalla/.test(x.name))!;
    expect(b.text).toBe('Victoria patriota');
    expect(b.lon).toBeCloseTo(route.points.find((p) => /Batalla/.test(p.name))!.lon, 6);
  });
});
