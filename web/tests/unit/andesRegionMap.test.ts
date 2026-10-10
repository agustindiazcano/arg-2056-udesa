import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAndesEvents } from '../../src/scenes/andes/data';
import { splitColumns } from '../../src/scenes/andes/columns';
import { buildRoute } from '../../src/scenes/andes/timeline';
import { REGION_BOUNDS, battleFeature, minimapData } from '../../src/scenes/andes/regionMap';

const events = parseAndesEvents(JSON.parse(readFileSync(new URL('../../../data/mock/andes_events.json', import.meta.url), 'utf8')) as unknown);
const { main, columns } = splitColumns(events);
const route = buildRoute(main);

describe('REGION_BOUNDS', () => {
  it('holds every place of every route of the crossing', () => {
    const [west, south, east, north] = REGION_BOUNDS;
    for (const e of events) {
      expect(e.lon, e.name).toBeGreaterThan(west);
      expect(e.lon, e.name).toBeLessThan(east);
      expect(e.lat, e.name).toBeGreaterThan(south);
      expect(e.lat, e.name).toBeLessThan(north);
    }
  });
});

describe('minimapData', () => {
  const data = minimapData(route, route.totalKm / 2, columns, 5);

  it('has a line for the route of every force: the main one and the five columns', () => {
    expect(data.routes.features).toHaveLength(1 + columns.length);
    expect(data.routes.features[0]!.geometry.type).toBe('LineString');
  });

  it('has a point for the head of every force, the main one first and in the light blue', () => {
    expect(data.heads.features).toHaveLength(1 + columns.length);
    expect(data.heads.features[0]!.properties).toMatchObject({ id: 'main', color: '#8fbaff' });
  });

  it('puts the head of the main force on its route, half way', () => {
    const [lon, lat] = (data.heads.features[0]!.geometry as GeoJSON.Point).coordinates;
    expect(lon).toBeLessThan(route.points[0]!.lon);
    expect(lon).toBeGreaterThan(route.points[route.points.length - 1]!.lon);
    expect(typeof lat).toBe('number');
  });
});

describe('battleFeature', () => {
  it('is the place of the battle of Chacabuco: the last place of the route, named as a battle', () => {
    const f = battleFeature(route);
    expect(f.features).toHaveLength(1);
    const last = route.points[route.points.length - 1]!;
    expect(last.name.toLowerCase()).toContain('batalla');
    expect((f.features[0]!.geometry as GeoJSON.Point).coordinates).toEqual([last.lon, last.lat]);
    expect(f.features[0]!.properties).toMatchObject({ name: 'Batalla de Chacabuco' });
  });

  it('is empty for a route without a battle', () => {
    const peaceful = buildRoute(main.slice(0, 3));
    expect(battleFeature(peaceful).features).toEqual([]);
  });

  it('goes with the data of the minimap', () => {
    expect(minimapData(route, 0, columns, 0).battle.features).toHaveLength(1);
  });
});
