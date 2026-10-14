import type { Quality } from '../data/series.js';
import type { DataTable } from './types.js';

export interface TableMeta {
  quality: Quality;
  source: string;
  /** ISO date; null only for a placeholder, which retrieved nothing */
  retrievedAt: string | null;
}

const MADE_UP = 'Datos de prueba (inventados)';
const WB = 'Banco Mundial (WDI), NY.GDP.MKTP.KD, dólares constantes de 2015';
const ENERGIA = 'Secretaría de Energía, datos abiertos';
const INDEC_X = 'INDEC, Complejos exportadores, año 2025 (provisorio)';
const ARMINERA = 'Secretaría de Minería, ARMINERA 2025 (transcrito a mano de imágenes, sin verificar)';
const PRESS = 'Prensa, sin verificar';
const PWT = 'Penn World Table 11.0 vía FRED, e INDEC (sin volver a descargar)';

const made = (): TableMeta => ({ quality: 'placeholder', source: MADE_UP, retrievedAt: null });
const meta = (quality: Quality, source: string, retrievedAt: string): TableMeta => ({ quality, source, retrievedAt });

/**
 * The quality, source and retrieval date of every table of the Data page, by table id (the tables that two slides share have one entry).
 * Dates are the days the data was read into the repository (`docs/data-requests.md`). Where a slide mixes sourced and made-up values
 * the table is `partial`.
 */
export const TABLE_META: Readonly<Record<string, TableMeta>> = {
  'gdp-real': meta('real', WB, '2026-10-12'),
  region: meta('real', `${WB}; población: INDEC y Banco Mundial`, '2026-10-12'),
  imf: meta('real', 'FMI, World Economic Outlook (SDMX), comparado con el Banco Mundial', '2026-10-13'),
  gdp: meta('partial', `${WB} hasta 2025; 2026 con el crecimiento del FMI; desde 2027 y el abanico, de prueba`, '2026-10-13'),
  'external-imf': meta('real', 'FMI, World Economic Outlook (actualización del 2026-09-30)', '2026-10-14'),
  'external-oecd': meta('real', 'OCDE, Economic Outlook 117 long-term scenarios (DSD_EO_LTB)', '2026-10-14'),
  'external-un': meta('real', 'ONU, World Population Prospects 2024', '2026-10-14'),
  indicators: meta('real', 'Banco Mundial (WDI) e INDEC (población), 2025', '2026-10-12'),
  provinces: made(),
  'hydrocarbons-provinces': meta('real', `${ENERGIA}, producción 2025 por provincia`, '2026-10-13'),
  'chart-3': made(),
  'chart-4': meta('real', INDEC_X, '2026-10-13'),
  complexes: meta('real', INDEC_X, '2026-10-13'),
  'great-items': meta('real', 'INDEC, Intercambio comercial argentino (informe de agosto de 2026)', '2026-10-13'),
  'chart-5': meta('real', 'Cálculo propio: 70 dividido la tasa de crecimiento, sin dato externo', '2026-10-14'),
  'provinces-value': made(),
  'chart-8': meta('partial', ARMINERA, '2026-10-13'),
  'mining-exports': meta('partial', ARMINERA, '2026-10-13'),
  'mining-2024': meta('partial', ARMINERA, '2026-10-13'),
  'mining-projection': meta('partial', ARMINERA, '2026-10-13'),
  'mining-capex': meta('partial', ARMINERA, '2026-10-13'),
  'lithium-projects': meta('partial', ARMINERA, '2026-10-13'),
  'copper-projects': meta('partial', ARMINERA, '2026-10-13'),
  'rigi-mining': meta('partial', PRESS, '2026-10-13'),
  'chart-9': meta('partial', `${ENERGIA} hasta 2025; proyección y franja de prueba`, '2026-10-13'),
  'oil-gas-national': meta('real', ENERGIA, '2026-10-13'),
  'oil-since-1950': meta('real', ENERGIA, '2026-10-13'),
  'rigi-oil-gas': meta('partial', PRESS, '2026-10-13'),
  'chart-10': made(),
  'agro-production': meta('real', 'MAGyP, series nacionales anuales (datos.gob.ar)', '2026-10-13'),
  'chart-11': meta('real', INDEC_X, '2026-10-13'),
  'chart-12': meta('real', 'INDEC, cuentas nacionales, valor agregado a precios de 2004 (preliminar)', '2026-10-13'),
  'chart-13': made(),
  reserves: meta('real', ENERGIA, '2026-10-13'),
  'tfp-level': meta('partial', PWT, '2026-10-12'),
  'tfp-change': meta('partial', PWT, '2026-10-12'),
  'oph-level': meta('partial', PWT, '2026-10-12'),
  'oph-change': meta('partial', PWT, '2026-10-12'),
  cumulative: meta('partial', PWT, '2026-10-12'),
  factors: made(),
  reference: meta('partial', 'Simulador: parte del PBI real de 2026 (Banco Mundial y FMI); el resto, de prueba', '2026-10-13')
};

/** The table with its quality, source and retrieval date; throws if the registry does not know it, so a new table cannot go without them. */
export function withMeta(table: DataTable): DataTable {
  const m = TABLE_META[table.id];
  if (!m) throw new Error(`table "${table.id}" has no entry in TABLE_META`);
  return { ...table, quality: m.quality, source: m.source, retrievedAt: m.retrievedAt };
}
