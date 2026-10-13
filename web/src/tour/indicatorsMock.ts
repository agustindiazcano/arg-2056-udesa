import { MOCK_SOURCE } from './tourData';

export interface TourIndicator {
  label: string;
  value: string;
  unit: string;
}

/** The small box of indicators of steps 1 and 2. Every figure is made up (MOCK_SOURCE) until sourced values replace them. */
export const TOUR_INDICATORS: readonly TourIndicator[] = [
  { label: 'PBI', value: '640', unit: 'miles de millones de USD' },
  { label: 'Población', value: '46,6', unit: 'millones' },
  { label: 'PBI per cápita', value: '13.700', unit: 'USD' },
  { label: 'Exportaciones totales', value: '79', unit: 'miles de millones de USD' },
  { label: 'Crecimiento del PBI', value: '3,2', unit: '% anual' },
  { label: 'Inversión', value: '17,5', unit: '% del PBI' }
];

export const INDICATORS_SOURCE = MOCK_SOURCE;
