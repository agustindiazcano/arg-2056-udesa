import type { Position, ProvinceFeature, ProvincesGeo } from './provinces.js';

/** Id of the illustrative Malvinas region on the map; it is never a province id. */
export const MALVINAS_ID = 'MALVINAS';

export interface MalvinasFeature {
  type: 'Feature';
  properties: { id: typeof MALVINAS_ID; name: string; illustrative: true };
  geometry: { type: 'MultiPolygon'; coordinates: Position[][][] };
}

/**
 * ILLUSTRATIVE outline of the Malvinas Islands (the two main islands), drawn by hand with a handful of points
 * and NOT surveyed: it has no source and no precision. It exists only so that the islands appear on the map as
 * national territory (decision D-geo-1 in docs/decisions.md). It carries no data and is not selectable. Replace it
 * with a sourced geometry if precision is ever needed.
 */
const WEST_ISLAND: Position[] = [
  [-60.25, -51.05],
  [-59.55, -51.25],
  [-59.4, -51.65],
  [-59.65, -52.05],
  [-60.35, -52.2],
  [-61.0, -52.05],
  [-61.3, -51.6],
  [-61.0, -51.15],
  [-60.25, -51.05]
];

const EAST_ISLAND: Position[] = [
  [-58.95, -51.25],
  [-58.2, -51.35],
  [-57.75, -51.55],
  [-57.72, -51.72],
  [-58.25, -51.88],
  [-58.05, -52.2],
  [-58.6, -52.35],
  [-59.2, -52.15],
  [-59.3, -51.75],
  [-59.25, -51.45],
  [-58.95, -51.25]
];

export const MALVINAS_FEATURE: MalvinasFeature = {
  type: 'Feature',
  properties: { id: MALVINAS_ID, name: 'Malvinas Islands', illustrative: true },
  geometry: { type: 'MultiPolygon', coordinates: [[WEST_ISLAND], [EAST_ISLAND]] }
};

export interface MapGeo {
  type: 'FeatureCollection';
  features: Array<ProvinceFeature | MalvinasFeature>;
}

/** The geometry to register on the map: the provinces plus the illustrative Malvinas outline. */
export function geoWithMalvinas(geo: ProvincesGeo): MapGeo {
  return { type: 'FeatureCollection', features: [...geo.features, MALVINAS_FEATURE] };
}
