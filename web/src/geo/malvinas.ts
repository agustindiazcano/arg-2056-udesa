import type { Position, ProvinceFeature, ProvincesGeo } from './provinces.js';

/** Id of the illustrative Malvinas region on the map; it is never a province id. */
export const MALVINAS_ID = 'MALVINAS';

export interface MalvinasFeature {
  type: 'Feature';
  properties: { id: typeof MALVINAS_ID; name: string; illustrative: true };
  geometry: { type: 'MultiPolygon'; coordinates: Position[][][] };
}

/**
 * ILLUSTRATIVE outline of the Malvinas Islands (the two main islands), drawn by hand from memory of the shape of the coast and
 * NOT surveyed: it has no source and no precision. It exists only so that the islands appear on the map as national territory
 * (decision D-geo-1 in docs/decisions.md), recognizable as Gran Malvina (west) and Soledad (east, with Lafonia to the south and
 * Cabo Pembroke at the east tip). It carries no data and is not selectable. Replace it with a sourced geometry if precision is
 * ever needed. Both rings run counter-clockwise.
 */
const WEST_ISLAND: Position[] = [
  [-59.55, -51.3],
  [-59.8, -51.15],
  [-60.1, -51.08],
  [-60.45, -51.1],
  [-60.8, -51.15],
  [-61.1, -51.25],
  [-61.4, -51.4],
  [-61.35, -51.6],
  [-61.2, -51.75],
  [-61.25, -51.95],
  [-61.05, -52.05],
  [-60.75, -52.12],
  [-60.5, -52.25],
  [-60.2, -52.2],
  [-59.95, -52.05],
  [-59.7, -52.02],
  [-59.55, -51.88],
  [-59.5, -51.7],
  [-59.47, -51.5],
  [-59.55, -51.3]
];

const EAST_ISLAND: Position[] = [
  [-57.72, -51.7],
  [-57.78, -51.58],
  [-57.95, -51.5],
  [-58.12, -51.42],
  [-58.3, -51.52],
  [-58.5, -51.46],
  [-58.72, -51.36],
  [-58.95, -51.28],
  [-59.18, -51.36],
  [-59.3, -51.52],
  [-59.22, -51.68],
  [-59.28, -51.85],
  [-59.15, -52.02],
  [-59.0, -52.22],
  [-58.75, -52.38],
  [-58.45, -52.36],
  [-58.2, -52.25],
  [-58.12, -52.08],
  [-58.3, -51.95],
  [-58.2, -51.84],
  [-57.98, -51.86],
  [-57.82, -51.8],
  [-57.72, -51.7]
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
