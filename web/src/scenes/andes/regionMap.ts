import { columnColor, positionOfColumn } from './columns';
import type { Column } from './columns';
import { MAIN_FORCE_ID } from './forces';
import { coordAtKm } from './mapGeo';
import type { Route } from './timeline';

/** The region the minimap shows: west, south, east, north (all the routes of the crossing, with a margin). */
export const REGION_BOUNDS: [number, number, number, number] = [-72.4, -35.9, -67.4, -26.9];

/** The color of the main force on the minimap, the same light blue as on the map. */
export const MINIMAP_MAIN_COLOR = '#8fbaff';

/** The color of the battle on the map and on the minimap. */
export const BATTLE_COLOR = '#e53935';

/** The battle of Chacabuco as a point: the place of the route that is named as a battle (the last one), or nothing when the route has none. */
export function battleFeature(route: Route): GeoJSON.FeatureCollection {
  const last = route.points[route.points.length - 1];
  if (!last || !/batalla/i.test(last.name)) return { type: 'FeatureCollection', features: [] };
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: 'Batalla de Chacabuco' }, geometry: { type: 'Point', coordinates: [last.lon, last.lat] } }] };
}

/** The combats before the battle (Las Achupallas, Las Coimas) as red points: the places of the route named as a combat, each with the id of its event. */
export function combatFeature(route: Route): GeoJSON.FeatureCollection {
  const features = route.points
    .filter((p) => /combate/i.test(p.name))
    .map((p): GeoJSON.Feature => ({ type: 'Feature', properties: { id: p.id, name: p.name }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] } }));
  return { type: 'FeatureCollection', features };
}

/** What the minimap draws: the route of every force as a line, and the head of every force as a point. */
export function minimapData(main: Route, mainKm: number, columns: readonly Column[], day: number): { routes: GeoJSON.FeatureCollection; heads: GeoJSON.FeatureCollection; battle: GeoJSON.FeatureCollection; combats: GeoJSON.FeatureCollection } {
  const routes: GeoJSON.Feature[] = [
    { type: 'Feature', properties: { id: MAIN_FORCE_ID, color: MINIMAP_MAIN_COLOR }, geometry: { type: 'LineString', coordinates: main.points.map((p) => [p.lon, p.lat]) } }
  ];
  const head = coordAtKm(main, mainKm);
  const heads: GeoJSON.Feature[] = [{ type: 'Feature', properties: { id: MAIN_FORCE_ID, color: MINIMAP_MAIN_COLOR }, geometry: { type: 'Point', coordinates: [head.lon, head.lat] } }];
  for (const c of columns) {
    routes.push({ type: 'Feature', properties: { id: c.id, color: columnColor(c.id) }, geometry: { type: 'LineString', coordinates: c.route.points.map((p) => [p.lon, p.lat]) } });
    const at = positionOfColumn(c, day);
    if (at) heads.push({ type: 'Feature', properties: { id: c.id, color: columnColor(c.id) }, geometry: { type: 'Point', coordinates: [at.lon, at.lat] } });
  }
  return { routes: { type: 'FeatureCollection', features: routes }, heads: { type: 'FeatureCollection', features: heads }, battle: battleFeature(main), combats: combatFeature(main) };
}
