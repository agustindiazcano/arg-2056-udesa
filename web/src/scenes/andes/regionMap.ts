import { columnColor, positionOfColumn } from './columns';
import type { Column } from './columns';
import { MAIN_FORCE_ID } from './forces';
import { coordAtKm } from './mapGeo';
import type { Route } from './timeline';

/** The region the minimap shows: west, south, east, north (all the routes of the crossing, with a margin). */
export const REGION_BOUNDS: [number, number, number, number] = [-72.4, -35.9, -67.4, -26.9];

/** The color of the main force on the minimap, the same light blue as on the map. */
export const MINIMAP_MAIN_COLOR = '#8fbaff';

/** What the minimap draws: the route of every force as a line, and the head of every force as a point. */
export function minimapData(main: Route, mainKm: number, columns: readonly Column[], day: number): { routes: GeoJSON.FeatureCollection; heads: GeoJSON.FeatureCollection } {
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
  return { routes: { type: 'FeatureCollection', features: routes }, heads: { type: 'FeatureCollection', features: heads } };
}
