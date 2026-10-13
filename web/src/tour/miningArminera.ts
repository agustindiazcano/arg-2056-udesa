/**
 * Mining data of the Secretaría de Minería (Ministerio de Economía), "Minería en Argentina: un año de gestión" (ARMINERA 2025, May 2025),
 * pages 7 to 10. The pages are images: the values were READ by eye from the rendered pages on 2026-10-13 (a transcription, not a download), and the
 * figures that the charts do not label are not given. Sources of the charts: Dirección Nacional de Promoción y Economía Minera, with customs data.
 */
export const ARMINERA_NOTE = 'Secretaría de Minería, ARMINERA 2025 (mayo de 2025), páginas 7 a 10: transcrito a mano de imágenes; el estado de cada proyecto es el de esa fecha';

/** Mining exports of Argentina, billions of USD (page 9). 2018 to 2024, and the first two months of 2024 and 2025. */
export const MINING_EXPORTS_BY_YEAR: ReadonlyArray<readonly [string, number]> = [
  ['2018', 3.45],
  ['2019', 3.248],
  ['2020', 2.621],
  ['2021', 3.243],
  ['2022', 3.858],
  ['2023', 4.061],
  ['2024', 4.673],
  ['Enero y febrero de 2024', 0.54],
  ['Enero y febrero de 2025', 0.782]
];

/** Main mining products exported in 2024, millions of USD and share of the total (page 9): 3,141 + 652 + 645 + 235 = 4,673. */
export const MINING_EXPORTS_2024: ReadonlyArray<readonly [string, number, number]> = [
  ['Oro', 3141, 67.2],
  ['Plata', 652, 14.0],
  ['Litio', 645, 13.8],
  ['Resto', 235, 5.0]
];

/** Projection of the Secretaría for the exports of 2025 to 2035, billions of USD: the totals and the only minerals the chart labels (page 10). */
export const MINING_PROJECTION: ReadonlyArray<{ year: number; total: number; lithium: number | null; copper: number | null }> = [
  { year: 2024, total: 4.7, lithium: 0.6, copper: null },
  { year: 2025, total: 4.9, lithium: 1.3, copper: null },
  { year: 2026, total: 6.0, lithium: 2.6, copper: null },
  { year: 2027, total: 6.6, lithium: 3.6, copper: null },
  { year: 2028, total: 8.6, lithium: 6.0, copper: null },
  { year: 2029, total: 13.9, lithium: 8.0, copper: 3.0 },
  { year: 2030, total: 19.2, lithium: 9.7, copper: 6.1 },
  { year: 2031, total: 23.4, lithium: 10.7, copper: 9.0 },
  { year: 2032, total: 26.1, lithium: 11.3, copper: 11.1 },
  { year: 2033, total: 26.4, lithium: 11.3, copper: 11.7 },
  { year: 2034, total: 25.8, lithium: 11.3, copper: 11.7 },
  { year: 2035, total: 25.5, lithium: 11.3, copper: 11.7 }
];

/** Capital expenditure that the Secretaría projects, 2025 to 2031, millions of USD (page 10); the total of each year, and no more than that is labelled. */
export const MINING_CAPEX: ReadonlyArray<readonly [number, number]> = [
  [2025, 1388],
  [2026, 7510],
  [2027, 6664],
  [2028, 7029],
  [2029, 4501],
  [2030, 2360],
  [2031, 750]
];

export type ProjectRow = [name: string, partner: string, countries: string, province: string, capacity: string, production2024: string, status: string];

/** Advanced lithium projects (page 7): name, main shareholder, country, province, capacity a year, production of 2024, state in May 2025. */
export const LITHIUM_PROJECTS: ReadonlyArray<ProjectRow> = [
  ['Fénix', 'Rio Tinto Group', 'Reino Unido', 'Catamarca', '20.600 t de LCE (carbonato) y 4.500 t (cloruro de litio)', '25.000 t', 'Producción'],
  ['Hombre Muerto Oeste', 'Galan Litio', 'Australia', 'Catamarca', '20.000 t de LCE', '0 t', 'Construcción'],
  ['Sal de Vida', 'Rio Tinto Group', 'Reino Unido', 'Catamarca', '15.000 t de LCE', '0 t', 'Construcción'],
  ['Tres Quebradas', 'Zijin Mining', 'China', 'Catamarca', '20.000 t de LCE', '0 t', 'Construcción'],
  ['Sal de Oro', 'Posco', 'Corea', 'Catamarca y Salta', '25.000 t (hidróxido de litio)', '0,85 t', 'Producción'],
  ['Cauchari-Olaroz', 'Ganfeng Lithium, Lithium Argentina y JEMSE', 'China, Canadá y Argentina', 'Jujuy', '40.000 t de LCE', '25.000 t', 'Producción'],
  ['Olaroz', 'Rio Tinto Group', 'Reino Unido', 'Jujuy', '20.000 t de LCE', '20.000 t', 'Producción'],
  ['Mariana', 'Ganfeng Lithium', 'China', 'Salta', '20.000 t de LCE (cloruro de litio)', '0 t', 'Producción'],
  ['Centenario-Ratones', 'Eramet', 'Francia', 'Salta', '24.000 t de LCE', '0,1 t', 'Producción'],
  ['Rincón', 'Argosy Minerals', 'Australia', 'Salta', '12.000 t de LCE', '0 t', 'Construcción'],
  ['Sal de los Ángeles', 'Revotech Asia, Tibet Summit Resources y Leading Resources Global', 'China y Reino Unido', 'Salta', '20.000 t de LCE', '0 t', 'Construcción'],
  ['Salar del Rincón', 'Rio Tinto Group', 'Reino Unido', 'Salta', '60.000 t de LCE', '0 t', 'Factibilidad y construcción']
];

/** Advanced copper projects (page 8): name, main shareholder, country, province, capacity a year (kt = thousand tons, koz = thousand ounces), state in May 2025. */
export const COPPER_PROJECTS: ReadonlyArray<[string, string, string, string, string, string]> = [
  ['Josemaría (Vicuña)', 'Lundin Mining y BHP', 'Canadá y Australia', 'San Juan', 'Cobre 131 kt; oro 224 koz; plata 1.048 koz', 'Construcción'],
  ['Filo del Sol (Vicuña)', 'Lundin Mining y BHP', 'Canadá y Australia', 'San Juan', 'Cobre 66 kt; oro 168 koz; plata 9.256 koz', 'Prefactibilidad'],
  ['Los Azules', 'McEwen Mining, Stellantis y Nuton', 'Canadá, Países Bajos y Australia', 'San Juan', 'Cobre 175 kt (cátodo); oro 4.600 koz; plata 100.000 koz', 'Evaluación económica preliminar'],
  ['Altar', 'Aldebaran Resources, Sibanye Stillwater y Nuton Holdings', 'Canadá, Sudáfrica y Reino Unido', 'San Juan', 'Cobre 127 kt; oro 24 koz', 'Exploración'],
  ['PSJ Cobre Mendocino (ex San Jorge)', 'Zonda Metals y Alberdi Energy', 'Suiza y Argentina', 'Mendoza', 'Cobre 40 kt', 'Prefactibilidad'],
  ['El Pachón', 'Glencore', 'Suiza', 'San Juan', 'Cobre 280 kt; plata 3.000 koz; molibdeno 9 kt', 'Factibilidad'],
  ['Taca Taca', 'First Quantum Minerals', 'Canadá', 'Salta', 'Cobre 227 kt; molibdeno 2.205 t; oro 106,3 koz', 'Factibilidad'],
  ['MARA (Agua Rica - Bajo La Alumbrera)', 'Glencore', 'Suiza', 'Catamarca', 'Equivale a 533 millones de libras de concentrado de cobre', 'Factibilidad']
];
