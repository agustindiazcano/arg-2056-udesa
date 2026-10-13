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
  { label: 'PBI nominal', value: num(ARG_GDP_LAST, 1), unit: 'miles de millones de USD corrientes (no PPA)' },
  { label: 'Población', value: num(ARG_POPULATION_LAST, 1), unit: 'millones (INDEC)' },
  { label: 'PBI per cápita nominal', value: num((ARG_GDP_LAST * 1000) / ARG_POPULATION_LAST, 0).replace(/^(\d)(\d{3})$/, '$1.$2'), unit: 'USD corrientes' },
  { label: 'Exportaciones totales', value: '106,3', unit: 'miles de millones de USD (bienes y servicios)' },
  { label: 'Crecimiento del PBI', value: '4,4', unit: '% anual' },
  { label: 'Inversión', value: '16,1', unit: '% del PBI (formación bruta de capital)' }
];

export const INDICATORS_SOURCE = 'PBI y exportaciones: Banco Mundial (WDI), 2025, consultado el 12-10-2026; población: INDEC, proyección al 30 de junio de 2025 (Censo 2022). Según el FMI el PBI de 2025 es 683,6 (misma cifra).';
export const INDICATORS_YEAR = 2025;
