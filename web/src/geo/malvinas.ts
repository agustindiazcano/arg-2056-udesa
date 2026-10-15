import outline from './malvinasOutline.json';
import type { Position, ProvinceFeature, ProvincesGeo } from './provinces.js';

/** Id of the Malvinas region on the map; it is never a province id. */
export const MALVINAS_ID = 'MALVINAS';

export interface MalvinasFeature {
  type: 'Feature';
  properties: { id: typeof MALVINAS_ID; name: string; illustrative: true };
  geometry: { type: 'MultiPolygon'; coordinates: Position[][][] };
}

/**
 * The outline of the Malvinas Islands (Gran Malvina, Soledad and the larger islets), from Natural Earth 1:10m (public domain), simplified:
 * `malvinasOutline.json`, built by `scripts/build_malvinas_geo.py` (source, license and date are in that file). It is a map outline, not a
 * survey, and it carries no data: on the maps the islands are national territory drawn as "no data" and are not selectable
 * (decision D-geo-1 in docs/decisions.md). Every ring runs counter-clockwise.
 */
const POLYGONS = outline.polygons as unknown as Position[][];

export const MALVINAS_FEATURE: MalvinasFeature = {
  type: 'Feature',
  properties: { id: MALVINAS_ID, name: 'Malvinas Islands', illustrative: true },
  geometry: { type: 'MultiPolygon', coordinates: POLYGONS.map((ring) => [ring]) }
};

export interface MapGeo {
  type: 'FeatureCollection';
  features: Array<ProvinceFeature | MalvinasFeature>;
}

/** The geometry to register on the map: the provinces plus the illustrative Malvinas outline. */
export function geoWithMalvinas(geo: ProvincesGeo): MapGeo {
  return { type: 'FeatureCollection', features: [...geo.features, MALVINAS_FEATURE] };
}
