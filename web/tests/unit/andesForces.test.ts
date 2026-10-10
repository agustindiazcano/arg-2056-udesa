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
  forceLabel,
  joinedLabel,
  bubblesFor,
  ENEMY_ID,
  ENEMY_POSITION,
  SKIRMISHES,
  activeSkirmishes,
  skirmishBalls,
  enemyBalls,
  ENEMY_PALETTE,
  stationaryRoute,
  joinedShortLabel,
  MERGE_KM,
  forceShortLabel,
  figureMen,
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
  it('names the main force, the column of Uspallata, and the four others as secondary columns of the north and of the south', () => {
    expect(FORCES.map((f) => f.id)).toEqual(['main', 'las-heras', 'cabot', 'zelada', 'freire', 'lemos']);
    expect(FORCES[0]!.title).toBe('Fuerza principal');
    expect(FORCES[1]!.title).toBe('Columna de Uspallata');
    expect(FORCES.slice(2).map((f) => f.title)).toEqual(['Columna secundaria del norte', 'Columna secundaria del norte', 'Columna secundaria del sur', 'Columna secundaria del sur']);
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

  it('leaves out what the sources do not give: no «sin dato» anywhere, and never a zero', () => {
    expect(JSON.stringify(FORCE_FACTS)).not.toContain('sin dato');
    const all = Object.values(FORCE_FACTS).flatMap((f) => f.units.map(([, value]) => value));
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

describe('forceLabel', () => {
  it('is four lines for every force: its role, its commanders, its men and its units', () => {
    for (const f of FORCES) {
      const lines = forceLabel(f.id).split('\n');
      expect(lines, f.id).toHaveLength(4);
      expect(lines[0], f.id).toBeTruthy();
      expect(lines[1], f.id).toBeTruthy();
      expect(lines[2], f.id).toContain('hombres');
      expect(lines[3], f.id).toBeTruthy();
    }
  });

  it('names the battalions of the main force and of Las Heras, and the kind of men of the detachments', () => {
    expect(forceLabel('main')).toContain('Batallones 1');
    expect(forceLabel('main')).toContain('Granaderos a Caballo');
    expect(forceLabel('las-heras')).toContain('Batallón 11');
    expect(forceLabel('freire')).toContain('Destacamento');
    expect(forceLabel('zelada')).toContain('milicianos');
    expect(forceLabel('lemos')).toContain('blandengues');
  });

  it('names the commanders of each group', () => {
    expect(forceLabel('main')).toContain('San Martín');
    expect(forceLabel('main')).toContain('Soler');
    expect(forceLabel('main')).toContain("O'Higgins");
    expect(forceLabel('las-heras')).toContain('Las Heras');
    expect(forceLabel('las-heras')).toContain('Beltrán');
    expect(forceLabel('cabot')).toContain('Cabot');
    expect(forceLabel('zelada')).toContain('Zelada');
    expect(forceLabel('freire')).toContain('Freire');
    expect(forceLabel('lemos')).toContain('Lemos');
  });

  it('says the main force and the artillery and logistics by their role', () => {
    expect(forceLabel('main')).toContain('Fuerza principal');
    expect(forceLabel('las-heras')).toContain('Columna de Uspallata');
    expect(forceLabel('las-heras')).toContain('artillería y parque');
  });

  it('gives the infantry of the ones that have it and says nothing of it for the ones that do not', () => {
    expect(forceLabel('freire')).toContain('infantería: 75 a 80');
    expect(forceLabel('zelada')).toContain('infantería: 50');
    expect(forceLabel('las-heras')).toContain('683');
    expect(forceLabel('main')).not.toContain('infantería');
    expect(forceLabel('cabot')).not.toContain('infantería');
    expect(forceLabel('lemos')).not.toContain('infantería');
  });

  it('never says sin dato', () => {
    for (const f of FORCES) expect(forceLabel(f.id)).not.toContain('sin dato');
  });

  it('is empty for a force it does not know', () => {
    expect(forceLabel('nobody')).toBe('');
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

describe('forceShortLabel', () => {
  it('is only the role of the group, without commanders or units, so it is short from far away', () => {
    expect(forceShortLabel('main')).toBe('Fuerza principal');
    expect(forceShortLabel('las-heras')).toBe('Columna de Uspallata');
    expect(forceShortLabel('nobody')).toBe('');
    for (const f of FORCES) expect(forceShortLabel(f.id)).not.toContain('\n');
  });
});

describe('figureMen', () => {
  it('is the infantry of the force when the sources give it, so the figures up close stand for its infantry', () => {
    expect(figureMen('las-heras', 1235)).toBe(683);
    expect(figureMen('zelada', 130)).toBe(50);
    expect(figureMen('freire', 100)).toBe(78);
  });

  it('is the men of the force when the infantry is not known', () => {
    expect(figureMen('cabot', 140)).toBe(140);
    expect(figureMen('lemos', 55)).toBe(55);
    expect(figureMen('main', 3987)).toBe(3987);
  });

  it('is null when there is nothing', () => {
    expect(figureMen('cabot', null)).toBeNull();
  });
});

describe('joinedLabel and joinedShortLabel', () => {
  it('is one text for forces that march together: the roles joined, and every commander and unit once', () => {
    const lines = joinedLabel(['main', 'las-heras']).split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('Fuerza principal + Columna de Uspallata');
    expect(lines[1]).toContain("San Martín");
    expect(lines[1]).toContain('Las Heras');
    expect(lines[1]).toContain('Beltrán');
    expect(lines[2]).toContain('3.987');
    expect(lines[2]).toContain('770 a 1.700');
    expect(lines[2]).toContain('hombres');
    expect(lines[3]).toContain('Batallones 1');
    expect(lines[3]).toContain('Batallón 11');
  });

  it('has a short version with only the roles', () => {
    expect(joinedShortLabel(['main', 'las-heras'])).toBe('Fuerza principal + Columna de Uspallata');
  });

  it('is the text of the force itself when it is alone, and empty for none', () => {
    expect(joinedLabel(['cabot'])).toBe(forceLabel('cabot'));
    expect(joinedShortLabel(['cabot'])).toBe(forceShortLabel('cabot'));
    expect(joinedLabel([])).toBe('');
  });

  it('merges the texts of forces that are within a few kilometers of each other', () => {
    expect(MERGE_KM).toBeGreaterThan(2);
    expect(MERGE_KM).toBeLessThan(40);
  });
});

describe('bubblesFor', () => {
  const bubbleRoute = buildRoute(main);
  const at = (day: number) => bubblesFor(bubbleRoute, 0, columns, day);

  it('has a bubble for every force, the main one first', () => {
    const away = at(14);
    expect(away.map((b) => b.id)[0]).toBe('main');
    expect(away.flatMap((b) => b.ids).filter((id) => id !== ENEMY_ID).sort()).toEqual(['cabot', 'freire', 'las-heras', 'lemos', 'main', 'zelada']);
  });

  it('keeps the column of Uspallata apart at the start, when both leave El Plumerillo, and joins it only after the roads cross at Curimón', () => {
    const start = bubblesFor(bubbleRoute, 0, columns, 0);
    expect(start.find((b) => b.id === 'las-heras')).toBeTruthy();
    expect(start[0]!.ids).toEqual(['main']);
    const curimon = columns.find((c) => c.id === 'las-heras')!.route.points.find((p) => p.name.startsWith('Curimón'))!;
    const before = bubblesFor(bubbleRoute, bubbleRoute.points.find((p) => p.name.startsWith('Curimón'))!.distanceKm, columns, curimon.day_of_campaign - 1);
    expect(before[0]!.ids).toEqual(['main']);
    const after = bubblesFor(bubbleRoute, bubbleRoute.points.find((p) => p.name.startsWith('Curimón'))!.distanceKm, columns, curimon.day_of_campaign);
    expect(after[0]!.ids).toEqual(['main', 'las-heras']);
  });

  it('shares one bubble between the main force and the column of Uspallata while they are together', () => {
    const together = bubblesFor(bubbleRoute, bubbleRoute.totalKm, columns, bubbleRoute.lastDay);
    const first = together[0]!;
    expect(first.ids).toEqual(['main', 'las-heras']);
    expect(together.flatMap((b) => b.ids).filter((id) => id === 'las-heras')).toHaveLength(1);
    expect(together.filter((b) => b.id !== ENEMY_ID)).toHaveLength(5);
  });

  it('gives each bubble the place of the head of its force', () => {
    const start = at(0)[0]!;
    expect(start.lon).toBeCloseTo(bubbleRoute.points[0]!.lon, 6);
    expect(start.lat).toBeCloseTo(bubbleRoute.points[0]!.lat, 6);
  });
});

describe('the royalist force at Chacabuco', () => {
  it('has a bubble of its own, last, over its position, with its commander and its units', () => {
    const all = bubblesFor(buildRoute(main), 0, columns, 0);
    const enemy = all[all.length - 1]!;
    expect(enemy.id).toBe(ENEMY_ID);
    expect([enemy.lon, enemy.lat]).toEqual([ENEMY_POSITION.lon, ENEMY_POSITION.lat]);
    const label = joinedLabel([ENEMY_ID]);
    expect(label).toContain('Fuerzas realistas');
    expect(label).toContain('Maroto');
    expect(label).toContain('2.080 a 2.500');
    expect(label).toContain('Talavera');
    expect(label).toContain('Quintanilla');
    expect(label).toContain('Barañao');
  });

  it('has the cavalry in its table: two units, 340 men, and the infantry of its three corps', () => {
    const facts = FORCE_FACTS[ENEMY_ID]!;
    const rows = Object.fromEntries(facts.units);
    expect(rows['Caballería']).toContain('340');
    expect(rows['Caballería']).toContain('Concordia');
    expect(rows['Caballería']).toContain('Abascal');
    expect(rows['Talavera']).toContain('440');
    expect(rows['Chiloé']).toContain('220');
    expect(rows['Valdivia']).toContain('220');
    expect(facts.infantry).toBe('880');
    expect(facts.commanders.join(' ')).toContain('Quintanilla');
    expect(facts.commanders.join(' ')).toContain('Barañao');
  });

  it('is not one of the patriot forces: the buttons and the spotlight do not know it', () => {
    expect(FORCES.map((f) => f.id)).not.toContain(ENEMY_ID);
  });

  it('is at the hacienda of Chacabuco, south of the cuesta where the patriot columns end', () => {
    const last = main[main.length - 1]!;
    expect(ENEMY_POSITION.lat).toBeLessThan(last.lat);
    expect(Math.abs(ENEMY_POSITION.lon - last.lon)).toBeLessThan(0.1);
  });

  it('is drawn with a ball for every 500 men, in a row across the place, centered on it', () => {
    const balls = enemyBalls(3);
    expect(balls).toHaveLength(5);
    const lons = balls.map(([lon]) => lon);
    expect(lons).toEqual([...lons].sort((a, b) => a - b));
    expect((lons[0]! + lons[4]!) / 2).toBeCloseTo(ENEMY_POSITION.lon, 6);
    for (const [, lat] of balls) expect(lat).toBe(ENEMY_POSITION.lat);
  });
});

describe('the figures of the royalists', () => {
  it('wear white where the patriot ones wear blue', () => {
    expect(ENEMY_PALETTE['#2f4a80']).toBe('#ecece4');
    expect(ENEMY_PALETTE['#2f4a80']).not.toBe('#2f4a80');
    expect(ENEMY_PALETTE['#243a66']).not.toBe('#243a66');
  });

  it('stand on a route of their own that does not move: two points a short way apart, at their place', () => {
    const r = stationaryRoute(ENEMY_POSITION.lon, ENEMY_POSITION.lat);
    expect(r.points).toHaveLength(2);
    expect(r.totalKm).toBeGreaterThan(0.1);
    expect(r.points[0]!.lon).toBe(ENEMY_POSITION.lon);
    expect(r.points[0]!.lat).toBe(ENEMY_POSITION.lat);
  });
});

describe('the skirmishes before Chacabuco', () => {
  const route = buildRoute(main);
  const dayOf = (name: RegExp) => route.points.find((p) => name.test(p.name))!.day_of_campaign;

  it('are the combats of Las Achupallas (4 Feb) and Las Coimas (7 Feb), each with its royalists, and each has data for its card', () => {
    expect(SKIRMISHES.map((k) => k.name)).toEqual(['Combate de Las Achupallas', 'Combate de Las Coimas']);
    for (const k of SKIRMISHES) {
      expect(k.id.startsWith(ENEMY_ID)).toBe(true);
      expect(FORCE_FACTS[k.id]).toBeTruthy();
      expect(k.men).toBeGreaterThan(50);
    }
    expect(dayOf(/Achupallas/)).toBe(16);
    expect(dayOf(/Coimas/)).toBe(19);
  });

  it('show the royalists only on their days, at the place of the combat of the route', () => {
    expect(activeSkirmishes(route, 5)).toEqual([]);
    const at16 = activeSkirmishes(route, dayOf(/Achupallas/));
    expect(at16.map((k) => k.id)).toEqual([SKIRMISHES[0]!.id]);
    const place = route.points.find((p) => /Achupallas/.test(p.name))!;
    expect(at16[0]!.lon).toBe(place.lon);
    expect(at16[0]!.lat).toBe(place.lat);
    expect(activeSkirmishes(route, dayOf(/Coimas/)).map((k) => k.id)).toEqual([SKIRMISHES[1]!.id]);
    expect(activeSkirmishes(route, 23)).toEqual([]);
  });

  it('add a bubble (with its flag) and red balls at the place while they last', () => {
    const day = dayOf(/Coimas/);
    const bubbles = bubblesFor(route, 0, columns, day);
    expect(bubbles.map((b) => b.id)).toContain(SKIRMISHES[1]!.id);
    expect(bubblesFor(route, 0, columns, 5).map((b) => b.id)).not.toContain(SKIRMISHES[1]!.id);
    const balls = skirmishBalls(route, day, 1);
    expect(balls.length).toBeGreaterThanOrEqual(3);
    expect(balls.every((b) => b.id === SKIRMISHES[1]!.id)).toBe(true);
    expect(skirmishBalls(route, 5, 1)).toEqual([]);
  });
});

describe('the numbers of the main force', () => {
  it('say when each one counts: the army when it left, the column of Los Patos and the patriots at Chacabuco', () => {
    const f = FORCE_FACTS.main!;
    expect(f.men).toBe('3.987');
    expect(f.menLabel).toBe('Hombres al partir');
    const rows = Object.fromEntries(f.units.map(([label, value]) => [label, value]));
    expect(rows['Ejército al partir']).toContain('3.987');
    expect(rows['En Chacabuco']).toContain('3.500');
  });
});
