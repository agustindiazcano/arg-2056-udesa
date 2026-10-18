/**
 * Mining exports by province, million USD FOB, from the monthly report "Origen provincial de las exportaciones mineras" of the
 * Dirección Nacional de Promoción y Economía Minera (Secretaría de Minería, based on Aduana). Read from official reports
 * `2026.01_...` (full year 2025) and `2026.09_...` (January-August 2026).
 * The treemap of page 3 in each report explicitly disaggregates all 5 main mining provinces: Santa Cruz, San Juan, Jujuy, Salta, and Catamarca.
 * Periods are never mixed: 2025 is a year, 2026 is eight months.
 */
export interface MiningByProvince {
  period: string;
  total: number;
  santaCruz: number;
  sanJuan: number;
  jujuy: number;
  salta: number;
  catamarca: number;
  /** Catamarca + Jujuy + Salta */
  noa: number;
  resto: number;
}

export const MINING_BY_PROVINCE_2025: MiningByProvince = {
  period: 'Enero a diciembre de 2025',
  total: 6037,
  santaCruz: 2383,
  sanJuan: 1757,
  jujuy: 953,
  salta: 498,
  catamarca: 351,
  noa: 1802,
  resto: 95
};

export const MINING_BY_PROVINCE_2026_JAN_AUG: MiningByProvince = {
  period: 'Enero a agosto de 2026',
  total: 6059,
  santaCruz: 2360,
  sanJuan: 1302,
  jujuy: 1156,
  salta: 706,
  catamarca: 419,
  noa: 2281,
  resto: 115
};

