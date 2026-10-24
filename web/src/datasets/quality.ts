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
const CEI = 'CEI de la Cancillería, Análisis del comercio de servicios de la Argentina 2026 (con base en el INDEC)';
const PRESS = 'Prensa, sin verificar';
const PWT = 'Penn World Table 11.0 vía FRED, e INDEC (sin volver a descargar)';

const REPORT = 'Informe de escenarios de crecimiento con IA pasado por el responsable (sin verificar); 2026 del FMI y el Banco Mundial';
const CALC = 'Cálculo propio con t = ln 2 / ln(1 + r), sin dato externo';

const made = (): TableMeta => ({ quality: 'placeholder', source: MADE_UP, retrievedAt: null });
const draft = (source: string): TableMeta => ({ quality: 'placeholder', source, retrievedAt: null });
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
  'chart-3': meta('partial', REPORT, '2026-10-15'),
  'ai-scenarios': meta('partial', REPORT, '2026-10-15'),
  'ai-per-capita': meta('partial', REPORT, '2026-10-15'),
  'ai-population': meta('real', 'ONU, World Population Prospects 2024 (variante media), sobre la población del INDEC de 2025', '2026-10-14'),
  'ai-us': meta('partial', REPORT, '2026-10-15'),
  'ai-analysts': meta('partial', 'Informe pasado por el responsable con estimaciones de Anthropic, PwC, Goldman Sachs, Oxford Economics, OMC, CEPR, Acemoglu y Penn Wharton (sin verificar en los originales)', '2026-10-15'),
  'chart-4': meta('real', INDEC_X, '2026-10-13'),
  complexes: meta('real', INDEC_X, '2026-10-13'),
  'great-items': meta('real', 'INDEC, Intercambio comercial argentino (informe de agosto de 2026)', '2026-10-13'),
  'chart-5': meta('real', 'Cálculo propio: 70 dividido la tasa de crecimiento, sin dato externo', '2026-10-14'),
  'provinces-value': made(),
  'rule70-errors': meta('real', CALC, '2026-10-15'),
  'rule70-argentina': meta('real', `${CALC}; PBI real de 2026: Banco Mundial y FMI`, '2026-10-15'),
  'rule70-countries': meta('real', `${WB}; PBI per cápita: PBI sobre población del mismo archivo; tasas calculadas`, '2026-10-15'),
  'rule70-scenarios': meta('real', CALC, '2026-10-15'),
  'rule70-convergence': meta('real', `${WB}; población: ONU WPP 2024 e INDEC; cálculos de tasas requeridas a 2046 y 2056`, '2026-10-16'),
  'rule70-imf': meta('real', 'FMI, World Economic Outlook (SDMX), crecimiento real del PBI 2026-2031; promedio y duplicación calculados', '2026-10-14'),
  'chart-8': meta('partial', ARMINERA, '2026-10-13'),
  'mining-exports': meta('partial', ARMINERA, '2026-10-13'),
  'services-exports': meta('real', CEI, '2026-10-15'),
  'sbc-exports': meta('real', CEI, '2026-10-15'),
  'mining-provinces': meta('real', 'Secretaría de Minería, Origen provincial de las exportaciones mineras (Aduana), informes de diciembre de 2025 y agosto de 2026', '2026-10-14'),
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
  'agro-tonnes': meta('real', 'MAGyP, series anuales nacionales (datos.gob.ar); millones de toneladas', '2026-10-13'),
  'agro-other-crops': meta('real', 'MAGyP, Estimaciones agrícolas (datos.magyp.gob.ar), serie completa por campaña; sin la caña de azúcar, que no está en el archivo', '2026-10-23'),
  'agro-livestock': meta('partial', 'Bolsa de Comercio de Rosario, balance cárnico y lácteo 2025 (estimación, con datos de la SAGyP y del OCLA)', '2026-10-23'),
  'agro-production': meta('real', 'MAGyP, series nacionales anuales (datos.gob.ar)', '2026-10-13'),
  'chart-11': meta('real', INDEC_X, '2026-10-13'),
  'exports-shares': meta('real', `${INDEC_X}; porcentajes calculados`, '2026-10-13'),
  'chart-12': meta('real', 'INDEC, cuentas nacionales, valor agregado a precios de 2004 (preliminar)', '2026-10-13'),
  'chart-13': made(),
  reserves: meta('real', ENERGIA, '2026-10-13'),
  'tfp-level': meta('partial', PWT, '2026-10-12'),
  'tfp-change': meta('partial', PWT, '2026-10-12'),
  'oph-level': meta('partial', PWT, '2026-10-12'),
  'oph-change': meta('partial', PWT, '2026-10-12'),
  cumulative: meta('partial', PWT, '2026-10-12'),
  factors: made(),
  reference: meta('partial', 'Simulador: parte del PBI real de 2026 (Banco Mundial y FMI); crecimiento base y aporte de la IA del informe de escenarios con IA (sin verificar); el resto, de prueba', '2026-10-15'),
  'hdi-series': meta('real', 'PNUD (UNDP), Human Development Report (1990-2023)', '2026-10-16'),
  'life-expectancy': meta('real', 'Banco Mundial (WDI, SP.DYN.LE00.IN), serie 1990-2024 y comparativa regional 2023', '2026-10-18'),
  'infant-mortality': meta('real', 'Banco Mundial (WDI, SP.DYN.IMRT.IN) / DEIS, serie 1990-2024 y comparativa regional', '2026-10-18'),
  'gini-index': meta('real', 'Banco Mundial (WDI, SI.POV.GINI) / INDEC (EPH) SEDLAC, serie 1995-2024 y comparativa regional', '2026-10-18'),
  'schooling-years': meta('real', 'PNUD (Human Development Report) / UNESCO, años promedio y esperados de escolaridad', '2026-10-18'),
  'pisa-argentina': meta('real', 'OCDE, Programa para la Evaluación Internacional de Alumnos (PISA)', '2026-10-16'),
  'pisa-latam-math': meta('real', 'OCDE, PISA 2022 (Resultados de Matemática en América Latina)', '2026-10-16'),
  'ai-training-costs': meta('real', 'Stanford HAI / Epoch AI, Artificial Intelligence Index Report 2024 / 2025', '2026-10-18'),
  'tech-diffusion-lags': meta('real', 'Comin & Hobijn (CHAT dataset / NBER) y Our World in Data, rezagos de adopción', '2026-10-18'),
  'ai-inference-costs': meta('real', 'Stanford HAI (AI Index 2025) y Artificial Analysis, costo por 1M tokens', '2026-10-18'),
  'macro-forecast-errors': meta('real', 'FMI (WEO Historical Database) e INDEC, desvíos observados vs proyectados', '2026-10-18'),
  'development-draft': draft('Estructura conceptual de indicadores agregados, cobertura y dimensiones sociales'),
  'forecast-uncertainty-draft': draft('Estructura conceptual de difusión tecnológica, costos de computación y sensibilidad distributiva'),
  'ai-plans-cost': meta('partial', 'Precios de lista de OpenAI, Anthropic y Google según blogs de comparación; impuestos de Argentina (RG 4240 y RG 5617) según notas contables; IVA general de cada país', '2026-10-23'),
  'ai-plans-taxes': meta('partial', 'Notas contables sobre RG 4240 y RG 5617 (Argentina); tasas generales de IVA o GST de cada país', '2026-10-23'),
  'draft-22': draft('Esquema de temas del borrador'),
  'draft-23': draft('Esquema de temas del borrador'),
  'draft-24': draft('Esquema de temas del borrador'),
  'draft-25': draft('Esquema de temas del borrador'),
  'draft-26': draft('Esquema de temas del borrador')
};

/** The table with its quality, source and retrieval date; throws if the registry does not know it, so a new table cannot go without them. */
export function withMeta(table: DataTable): DataTable {
  const m = TABLE_META[table.id];
  if (!m) throw new Error(`table "${table.id}" has no entry in TABLE_META`);
  return { ...table, quality: m.quality, source: m.source, retrievedAt: m.retrievedAt };
}
