/**
 * The battle of Chacabuco as a schematic recreation for the 3D scene: the units of both sides as blocks on the real terrain. The positions are NOT from a plan of the
 * field (the plan of Mitre is still to be read): they follow what the sources say in words (Academia de Historia Militar de Chile, Museo Histórico Nacional, Municipalidad
 * de Chacabuco, Arre Caballo; see `docs/references.md`) and are approximate. Meters are east and north of `BATTLE_CENTER`, the middle of the field.
 */

/** The middle of the field: between the line of the patriots and the hills of the royalists (the coordinate of the battle in Wikipedia is the patriots' line). */
export const BATTLE_CENTER = { lon: -70.685, lat: -33.0 };

export const BATTLE_NOTICE =
  'Recreación esquemática: las posiciones de las unidades son aproximadas y las cifras vienen de las fuentes, que no coinciden (los realistas, entre 2.080 y 2.500).';

export type BattleSide = 'patriot' | 'royalist';

export interface BattleUnit {
  id: string;
  name: string;
  side: BattleSide;
  /** the men of the unit as the sources give them; `approx` when it is "unos" */
  men: number;
  /** what the sources say of its place */
  note: string;
  /** meters east and north of the middle of the field */
  eastM: number;
  northM: number;
  /** the size of the block in meters */
  widthM: number;
  depthM: number;
}

export const BATTLE_UNITS: readonly BattleUnit[] = [
  { id: 'soler', name: 'División de Soler', side: 'patriot', men: 2000, note: 'Por los cerros de la derecha, sobre el flanco izquierdo realista', eastM: -620, northM: 1050, widthM: 520, depthM: 160 },
  { id: 'ohiggins', name: "División de O'Higgins", side: 'patriot', men: 1400, note: 'Por el camino y las alturas; atacó primero', eastM: 380, northM: 1000, widthM: 420, depthM: 160 },
  { id: 'talavera', name: 'Regimiento Talavera', side: 'royalist', men: 440, note: 'Cerro Guanaco (Maroto)', eastM: -170, northM: -520, widthM: 240, depthM: 120 },
  { id: 'chiloe', name: 'Batallón de Chiloé', side: 'royalist', men: 220, note: 'Cerro Quemado (Piquero)', eastM: 190, northM: -560, widthM: 200, depthM: 110 },
  { id: 'valdivia', name: 'Batallón de Valdivia', side: 'royalist', men: 220, note: 'Cerro Chinge (Arenas)', eastM: -470, northM: -500, widthM: 200, depthM: 110 },
  { id: 'caballeria', name: 'Caballería realista', side: 'royalist', men: 340, note: 'La de la Concordia y la de Abascal', eastM: 560, northM: -470, widthM: 220, depthM: 100 }
];

const M_PER_DEG_LAT = 111_320;

/** The longitude and latitude of a point `eastM` meters east and `northM` meters north of `from`. */
export function offsetLonLat(from: { lon: number; lat: number }, eastM: number, northM: number): [number, number] {
  return [from.lon + eastM / (M_PER_DEG_LAT * Math.cos((from.lat * Math.PI) / 180)), from.lat + northM / M_PER_DEG_LAT];
}

/** The closed ring of a rectangle `widthM` by `depthM` centered `eastM`, `northM` from `from`. */
export function unitPolygon(from: { lon: number; lat: number }, eastM: number, northM: number, widthM: number, depthM: number): Array<[number, number]> {
  const w = widthM / 2;
  const d = depthM / 2;
  const corners: Array<[number, number]> = [
    [eastM - w, northM - d],
    [eastM + w, northM - d],
    [eastM + w, northM + d],
    [eastM - w, northM + d]
  ];
  const ring = corners.map(([e, n]) => offsetLonLat(from, e, n));
  ring.push(ring[0]!);
  return ring;
}

/** How tall a block is drawn, in meters: enough to read from the side at the pitch of the scene. */
export const BLOCK_HEIGHT_M = 38;
export const PATRIOT_COLOR = '#2f7bff';
export const ROYALIST_COLOR = '#e53935';

const number = new Intl.NumberFormat('es-AR');

/** The text of a unit's label: its name and its men. */
export function unitLabel(u: BattleUnit): string {
  return `${u.name}\nunos ${number.format(u.men)}`;
}

/** The blocks (polygons) and labels (points) of every unit, for the map. */
export function battleUnitsGeoJson(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const u of BATTLE_UNITS) {
    const color = u.side === 'patriot' ? PATRIOT_COLOR : ROYALIST_COLOR;
    const properties = { id: u.id, name: u.name, side: u.side, men: u.men, color, height: BLOCK_HEIGHT_M, label: unitLabel(u) };
    features.push({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [unitPolygon(BATTLE_CENTER, u.eastM, u.northM, u.widthM, u.depthM)] } });
    features.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: offsetLonLat(BATTLE_CENTER, u.eastM, u.northM) } });
  }
  return { type: 'FeatureCollection', features };
}

/** The camera of the scene: from the north, over the patriots, looking south at the hills of the royalists. */
export const BATTLE_SCENE_VIEW = { lon: BATTLE_CENTER.lon, lat: BATTLE_CENTER.lat + 0.004, zoom: 14.1, pitch: 66, bearing: 180 };
