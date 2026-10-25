import type { Part } from './resourcesData.js';

/**
 * Livestock production of 2025 (estimates of the Bolsa de Comercio de Rosario published on 2026-01-05, with data of the SAGyP for the meat and the OCLA
 * for the milk; the pork figure is the 809,000 t estimate, the Anuario Porcino 2025 of the Ministerio de Agricultura reports 812,272 t). Beef and pork
 * are carcass weight with bone (res con hueso); poultry is product weight; milk is in million litres and the slide shows it in tonnes at 1.03 kg per litre.
 */
export const LIVESTOCK = {
  year: 2025,
  beef_million_t: 3.1,
  poultry_million_t: 2.3,
  pork_million_t: 0.809,
  milk_million_litres: 11600,
  source: 'Bolsa de Comercio de Rosario (balance cárnico y lácteo 2025, publicado el 2026-01-05): carnes con datos de la SAGyP y leche del OCLA',
  url: 'https://www.expoagro.com.ar/balance-carnico-y-lacteo-2025/',
  retrieved_at: '2026-10-23'
} as const;

/** Kilograms per litre of milk used to show the milk in tonnes (an assumption, 1.03 kg/l). */
export const LITRES_TO_TONNES = 1.03;

/** The livestock products as parts of the agro treemap, in million tonnes. */
export function livestockParts(): Part[] {
  return [
    { label: 'Carne bovina', value: LIVESTOCK.beef_million_t },
    { label: 'Carne aviar', value: LIVESTOCK.poultry_million_t },
    { label: 'Carne porcina', value: LIVESTOCK.pork_million_t },
    { label: 'Leche', value: (LIVESTOCK.milk_million_litres * LITRES_TO_TONNES) / 1000 }
  ];
}
