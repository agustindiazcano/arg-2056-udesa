/**
 * Mining exports by province, million USD FOB, from the monthly report "Origen provincial de las exportaciones mineras" of the
 * Dirección Nacional de Promoción y Economía Minera (Secretaría de Minería, based on Aduana). Read on 2026-10-14 from the PDFs
 * `2026.01_...` (full year 2025) and `2026.09_...` (January-August 2026). The report publishes Catamarca, Jujuy and Salta together
 * (NOA); only Jujuy is labelled alone, and only in 2026. Periods are never mixed: 2025 is a year, 2026 is eight months.
 */
export interface MiningByProvince {
  period: string;
  total: number;
  santaCruz: number;
  sanJuan: number;
  jujuy: number | null;
  /** Catamarca + Jujuy + Salta */
  noa: number;
}

export const MINING_BY_PROVINCE_2025: MiningByProvince = { period: 'Enero a diciembre de 2025', total: 6037, santaCruz: 2383, sanJuan: 1757, jujuy: null, noa: 1803 };

export const MINING_BY_PROVINCE_2026_JAN_AUG: MiningByProvince = { period: 'Enero a agosto de 2026', total: 6059, santaCruz: 2360, sanJuan: 1302, jujuy: 1156, noa: 2281 };
