import { ARG_GDP_LAST, ARG_POPULATION_LAST } from './gdpFacts';

export interface TourIndicator {
  label: string;
  value: string;
  unit: string;
}

/**
 * The small box of indicators of steps 1 and 2: the 2025 values of the World Bank (WDI), read from its API on 2026-10-12
 * (<https://api.worldbank.org/v2/country/ARG/indicator/>; GDP and exports in current US dollars). The file keeps its old name for the imports.
 */
const num = (value: number, digits: number): string => value.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const TOUR_INDICATORS: readonly TourIndicator[] = [
  { label: 'PBI real', value: num(ARG_GDP_LAST, 1), unit: 'miles de millones de USD de 2015 (precios constantes)' },
  { label: 'Población', value: num(ARG_POPULATION_LAST, 1), unit: 'millones (INDEC)' },
  { label: 'PBI per cápita real', value: num((ARG_GDP_LAST * 1000) / ARG_POPULATION_LAST, 0).replace(/^(\d)(\d{3})$/, '$1.$2'), unit: 'USD de 2015' },
  { label: 'Exportaciones totales', value: '106,3', unit: 'miles de millones de USD (bienes y servicios)' },
  { label: 'Crecimiento del PBI', value: '4,4', unit: '% anual' },
  { label: 'Inversión', value: '16,1', unit: '% del PBI (formación bruta de capital)' }
];

export const INDICATORS_SOURCE = 'PBI real (a precios constantes de 2015): Banco Mundial (WDI), 2025, consultado el 12-10-2026; población: INDEC, proyección al 30 de junio de 2025 (Censo 2022); exportaciones y crecimiento: Banco Mundial (las exportaciones están en dólares corrientes). El FMI da 4,5 % de crecimiento en 2025.';
export const INDICATORS_YEAR = 2025;
