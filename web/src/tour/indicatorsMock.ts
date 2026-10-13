export interface TourIndicator {
  label: string;
  value: string;
  unit: string;
}

/**
 * The small box of indicators of steps 1 and 2: the 2025 values of the World Bank (WDI), read from its API on 2026-10-12
 * (<https://api.worldbank.org/v2/country/ARG/indicator/>; GDP and exports in current US dollars). The file keeps its old name for the imports.
 */
export const TOUR_INDICATORS: readonly TourIndicator[] = [
  { label: 'PBI', value: '683,1', unit: 'miles de millones de USD' },
  { label: 'Población', value: '45,9', unit: 'millones' },
  { label: 'PBI per cápita', value: '14.898', unit: 'USD' },
  { label: 'Exportaciones totales', value: '106,3', unit: 'miles de millones de USD (bienes y servicios)' },
  { label: 'Crecimiento del PBI', value: '4,4', unit: '% anual' },
  { label: 'Inversión', value: '16,1', unit: '% del PBI (formación bruta de capital)' }
];

export const INDICATORS_SOURCE = 'Banco Mundial (WDI), datos de 2025, consultados el 12-10-2026';
export const INDICATORS_YEAR = 2025;
