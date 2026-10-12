/**
 * The units of the battle of Chacabuco for the 3D recreation (the diorama). The positions are NOT from a plan of the
 * field (the plan of Mitre is still to be read): they follow what the sources say in words (Academia de Historia Militar de Chile, Museo Histórico Nacional, Municipalidad
 * de Chacabuco, Arre Caballo; see `docs/references.md`) and are approximate. Meters are east and north of the middle of the field.
 */

export const BATTLE_NOTICE =
  'Recreación esquemática: el terreno es inventado, las posiciones de las unidades son aproximadas y las cifras vienen de las fuentes, que no coinciden (los realistas, entre 2.080 y 2.500).';

export type BattleSide = 'patriot' | 'royalist';

export interface BattleUnit {
  id: string;
  name: string;
  side: BattleSide;
  /** infantry or cavalry: how its figures are drawn */
  arm: 'infantry' | 'cavalry';
  /** the share of its foot soldiers drawn as Afro-descendant (red coat): the battalions 7 and 8 were of pardos y morenos; a schematic share */
  afroShare: number;
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
  { id: 'soler', name: 'División de Soler', side: 'patriot', arm: 'infantry', afroShare: 0.2, men: 2000, note: 'Por los cerros de la derecha, sobre el flanco izquierdo realista', eastM: -620, northM: 1050, widthM: 520, depthM: 160 },
  { id: 'ohiggins', name: "División de O'Higgins", side: 'patriot', arm: 'infantry', afroShare: 0.5, men: 1400, note: 'Por el camino y las alturas; atacó primero', eastM: 380, northM: 1000, widthM: 420, depthM: 160 },
  { id: 'talavera', name: 'Regimiento Talavera', side: 'royalist', arm: 'infantry', afroShare: 0, men: 440, note: 'Cerro Guanaco (Maroto)', eastM: -170, northM: -520, widthM: 240, depthM: 120 },
  { id: 'chiloe', name: 'Batallón de Chiloé', side: 'royalist', arm: 'infantry', afroShare: 0, men: 220, note: 'Cerro Quemado (Piquero)', eastM: 190, northM: -560, widthM: 200, depthM: 110 },
  { id: 'valdivia', name: 'Batallón de Valdivia', side: 'royalist', arm: 'infantry', afroShare: 0, men: 220, note: 'Cerro Chinge (Arenas)', eastM: -470, northM: -500, widthM: 200, depthM: 110 },
  { id: 'caballeria', name: 'Caballería realista', side: 'royalist', arm: 'cavalry', afroShare: 0, men: 340, note: 'La de la Concordia y la de Abascal', eastM: 560, northM: -470, widthM: 220, depthM: 100 }
];
