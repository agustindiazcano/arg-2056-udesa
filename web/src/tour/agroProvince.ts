import data from './agroByProvince.json';
import type { ProvinceId } from '../types/province.js';
import type { Part } from './resourcesData.js';

/** Production of the four main crops by province (MAGyP, campaign 2024/25), valued at the average FOB prices of the file. */
export const AGRO_PROVINCE = data;

/** Average FOB prices of the campaign in USD per tonne, as the file states them (`valuation_reference`). */
const PRICE_USD_T = { soja_t: 420, maiz_t: 180, trigo_t: 230, girasol_t: 410 } as const;
const LABELS = { soja_t: 'Soja', maiz_t: 'Maíz', trigo_t: 'Trigo', girasol_t: 'Girasol' } as const;

type CropKey = keyof typeof PRICE_USD_T;

/** What each of the four crops of a province is worth, in million USD, from the largest. */
export function agroParts(id: ProvinceId): Part[] {
  const row = data.provinces.find((p) => p.id === id);
  if (!row) return [];
  return (Object.keys(PRICE_USD_T) as CropKey[])
    .map((key) => ({ label: LABELS[key], value: (row.crops[key] * PRICE_USD_T[key]) / 1e6 }))
    .filter((p) => p.value > 0);
}

/** The four crops of a province together, in million USD (0 for a province with no crops in the file). */
export const agroValueMusd = (id: ProvinceId): number => agroParts(id).reduce((sum, p) => sum + p.value, 0);
