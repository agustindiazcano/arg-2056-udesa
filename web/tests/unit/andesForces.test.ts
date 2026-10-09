import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAndesEvents } from '../../src/scenes/andes/data';
import type { AndesEvent } from '../../src/scenes/andes/data';
import { splitColumns } from '../../src/scenes/andes/columns';
import { buildRoute } from '../../src/scenes/andes/timeline';
import { coordAtKm } from '../../src/scenes/andes/mapGeo';
import {
  FORCES,
  FORCE_FACTS,
  SPOTLIGHT_END_MS,
  SPOT_STEPS,
  ballCount,
  ballPositions,
  ballSpacingKm,
  circlePolygon,
  beamGeometry,
  forceMen,
  isSmallForce,
  placeLabel,
  spotlightDimAt,
  spotlightStateAt
} from '../../src/scenes/andes/forces';

const events = parseAndesEvents(JSON.parse(readFileSync(new URL('../../../data/mock/andes_events.json', import.meta.url), 'utf8')) as unknown);
const { main, columns } = splitColumns(events);

const ev = (men: number | null, name = 'x', day = 0, range?: { min: number; max: number }): AndesEvent => ({
  id: name,
  name,
  day_of_campaign: day,
  date: '1817-01-19',
  date_precision: 'day',
  lat: -32 - day * 0.1,
  lon: -69 - day * 0.1,
  elevation_m: 1000,
  forces: [men === null ? { side: 's', men: null, note: 'n' } : { side: 's', men }],
  ...(range ? { estimate_range: range } : {}),
  source: 's',
  retrieved_at: '2026-10-09'
});

describe('FORCES', () => {
  it('names the main force, the artillery and logistics, and the four others as a flank in distraction', () => {
    expect(FORCES.map((f) => f.id)).toEqual(['main', 'las-heras', 'cabot', 'zelada', 'freire', 'lemos']);
    expect(FORCES[0]!.title).toBe('Fuerza principal');
    expect(FORCES[1]!.title).toBe('Artillería y logística');
    expect(FORCES.slice(2).map((f) => f.title)).toEqual(['Flanco norte · distracción', 'Flanco norte · distracción', 'Flanco sur · distracción', 'Flanco sur · distracción']);
  });

  it('has a force for every column of the data', () => {
    for (const c of columns) expect(FORCES.map((f) => f.id)).toContain(c.id);
  });
});

describe('forceMen', () => {
  it('is the strength of the first place, or the middle of its range when the strength is not known', () => {
    expect(forceMen([ev(140)])).toBe(140);
    expect(forceMen([ev(null, 'x', 0, { min: 770, max: 1700 })])).toBe(1235);
    expect(forceMen([ev(null)])).toBeNull();
    expect(forceMen([])).toBeNull();
  });

  it('reads the data: 3,987 for the main force and a range for the artillery and logistics', () => {
    expect(forceMen(main)).toBe(3987);
    expect(forceMen(columns.find((c) => c.id === 'las-heras')!.route.points)).toBe(1235);
  });
});

describe('ballCount and isSmallForce', () => {
  it('is a ball for every 500 men, rounded, and at least one', () => {
    expect(ballCount(3987)).toBe(8);
    expect(ballCount(1235)).toBe(2);
    expect(ballCount(500)).toBe(1);
    expect(ballCount(140)).toBe(1);
    expect(ballCount(55)).toBe(1);
    expect(ballCount(null)).toBe(1);
  });

  it('marks as small the forces under a hundred men', () => {
    expect(isSmallForce(55)).toBe(true);
    expect(isSmallForce(99)).toBe(true);
    expect(isSmallForce(100)).toBe(false);
    expect(isSmallForce(null)).toBe(false);
  });
});

describe('ballSpacingKm', () => {
  it('keeps the balls a few pixels apart: the farther the camera, the more kilometers between them', () => {
    expect(ballSpacingKm(6, -32)).toBeGreaterThan(ballSpacingKm(8, -32));
    expect(ballSpacingKm(8, -32)).toBeGreaterThan(0);
  });
});

describe('circlePolygon', () => {
  it('is a closed ring around the point at about the radius', () => {
    const ring = circlePolygon(-69, -32, 1000, 16);
    expect(ring).toHaveLength(17);
    expect(ring[0]).toEqual(ring[16]);
    const [lon, lat] = ring[0]!; // the first point is due east
    expect(lat).toBeCloseTo(-32, 5);
    expect((lon! + 69) * 111320 * Math.cos((32 * Math.PI) / 180)).toBeCloseTo(1000, 0);
  });
});

describe('spotlightStateAt', () => {
  it('has one light at a time, in the order of the forces: the main force, the artillery and logistics, and then the others', () => {
    expect(SPOT_STEPS.map((st) => st.id)).toEqual(['main', 'las-heras', 'cabot', 'zelada', 'freire', 'lemos']);
    for (let i = 1; i < SPOT_STEPS.length; i += 1) expect(SPOT_STEPS[i]!.startMs).toBe(SPOT_STEPS[i - 1]!.endMs);
  });

  it('moves the camera first with no light, then fades the light in, holds it and fades it out', () => {
    const st = SPOT_STEPS[1]!;
    expect(spotlightStateAt(st.startMs + 10)).toMatchObject({ step: 1, o: 0 });
    const fadingIn = spotlightStateAt(st.lightFromMs + 100).o;
    expect(fadingIn).toBeGreaterThan(0);
    expect(fadingIn).toBeLessThan(1);
    expect(spotlightStateAt((st.lightFromMs + st.endMs) / 2).o).toBe(1);
    const fadingOut = spotlightStateAt(st.endMs - 100).o;
    expect(fadingOut).toBeGreaterThan(0);
    expect(fadingOut).toBeLessThan(1);
  });

  it('is on the step of the force the light is on at every moment', () => {
    for (const [i, st] of SPOT_STEPS.entries()) expect(spotlightStateAt((st.lightFromMs + st.endMs) / 2).step).toBe(i);
  });

  it('after the last light goes back to the main force (the final move), and then is done', () => {
    const last = SPOT_STEPS[SPOT_STEPS.length - 1]!;
    const back = spotlightStateAt(last.endMs + 100);
    expect(back).toMatchObject({ step: -1, o: 0, final: true, done: false });
    expect(spotlightStateAt(SPOTLIGHT_END_MS)).toMatchObject({ final: true, done: true });
    expect(spotlightStateAt(0).done).toBe(false);
  });
});

describe('beamGeometry', () => {
  const g = beamGeometry({ x: 500, y: 400 });

  it('comes from above the top of the map and ends on the force: narrow at the top, wide on the ground', () => {
    const [topLeft, topRight, bottomRight, bottomLeft] = g.polygon;
    expect(topLeft![1]).toBeLessThan(0);
    expect(topRight![1]).toBe(topLeft![1]);
    expect(bottomLeft![1]).toBe(400);
    expect(bottomRight![0] - bottomLeft![0]).toBeGreaterThan((topRight![0] - topLeft![0]) * 6);
  });

  it('puts a glow on the ground at the force, flatter than it is wide', () => {
    expect(g.ellipse.cx).toBe(500);
    expect(g.ellipse.cy).toBe(400);
    expect(g.ellipse.ry).toBeLessThan(g.ellipse.rx);
  });

  it('is bigger when asked for a bigger light', () => {
    expect(beamGeometry({ x: 500, y: 400 }, 120).ellipse.rx).toBeGreaterThan(g.ellipse.rx);
  });
});

describe('spotlightDimAt', () => {
  it('dims the map as the first light turns on, keeps it dim through all the lights, and brings the light back on the way to the main force', () => {
    const last = SPOT_STEPS[SPOT_STEPS.length - 1]!;
    expect(spotlightDimAt(0)).toBe(0);
    expect(spotlightDimAt(300)).toBeGreaterThan(0);
    expect(spotlightDimAt(300)).toBeLessThan(1);
    expect(spotlightDimAt(SPOT_STEPS[2]!.lightFromMs)).toBe(1);
    expect(spotlightDimAt(last.endMs - 10)).toBe(1);
    expect(spotlightDimAt(last.endMs + 400)).toBeGreaterThan(0);
    expect(spotlightDimAt(last.endMs + 400)).toBeLessThan(1);
    expect(spotlightDimAt(SPOTLIGHT_END_MS)).toBe(0);
  });
});

describe('FORCE_FACTS', () => {
  it('has the commanders and the numbers of every force', () => {
    for (const f of FORCES) {
      const facts = FORCE_FACTS[f.id]!;
      expect(facts, f.id).toBeTruthy();
      expect(facts.commanders.length, f.id).toBeGreaterThanOrEqual(1);
      expect(facts.units.length, f.id).toBeGreaterThanOrEqual(2);
      expect(facts.goal.length, f.id).toBeGreaterThan(5);
    }
  });

  it('names San Martin, Soler and O Higgins in the main force and Las Heras with Beltran in the artillery and logistics', () => {
    const main = FORCE_FACTS['main']!.commanders.join(' ');
    expect(main).toContain('San Martín');
    expect(main).toContain('Soler');
    expect(main).toContain("O'Higgins");
    const heras = FORCE_FACTS['las-heras']!.commanders.join(' ');
    expect(heras).toContain('Las Heras');
    expect(heras).toContain('Beltrán');
  });

  it('says so when a number is not known, and never writes a zero for it', () => {
    const all = Object.values(FORCE_FACTS).flatMap((f) => f.units.map(([, value]) => value));
    expect(all.some((v) => v.includes('sin dato'))).toBe(true);
    expect(all.every((v) => !/^0(\s|$)/.test(v))).toBe(true);
  });

  it('agrees with the data on the size of the small forces', () => {
    for (const c of columns) {
      const men = forceMen(c.route.points);
      if (men === null || c.id === 'las-heras') continue;
      const hombres = FORCE_FACTS[c.id]!.units.find(([label]) => label === 'Hombres')![1];
      expect(hombres, c.id).toContain(String(men).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    }
  });
});

describe('placeLabel', () => {
  const route = buildRoute([ev(100, 'Mendoza'), ev(100, 'Uspallata', 4), ev(100, 'Chile', 9)]);

  it('is the place when the force is at it, and from where to where when it is on the way', () => {
    expect(placeLabel(route, 0)).toBe('Mendoza');
    expect(placeLabel(route, 4)).toBe('Uspallata');
    expect(placeLabel(route, 2)).toBe('Mendoza → Uspallata');
    expect(placeLabel(route, 99)).toBe('Chile');
    expect(placeLabel(route, -5)).toBe('Mendoza');
  });
});

describe('ballPositions', () => {
  const route = buildRoute([ev(100, 'a', 0), ev(100, 'b', 10)]);

  it('puts the first ball at the head of the force and the others behind it along the route, one spacing apart', () => {
    const km = route.totalKm / 2;
    const balls = ballPositions(route, km, 3, 5);
    expect(balls).toHaveLength(3);
    const head = coordAtKm(route, km);
    expect(balls[0]).toEqual([head.lon, head.lat]);
    const second = coordAtKm(route, km - 5);
    expect(balls[1]).toEqual([second.lon, second.lat]);
  });

  it('keeps the balls on the route at the start of it, where there is nothing behind', () => {
    const balls = ballPositions(route, 1, 4, 5);
    expect(balls).toHaveLength(4);
    expect(balls[3]).toEqual([route.points[0]!.lon, route.points[0]!.lat]);
  });

  it('has no balls for a count of zero', () => {
    expect(ballPositions(route, 5, 0, 5)).toEqual([]);
  });
});
