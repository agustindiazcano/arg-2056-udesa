import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { SHORT } from './provinceMock.js';

export interface ProvinceProfile {
  id: ProvinceId;
  name: string;
  pbg_usd_m: number;
  pbg_share: number;
  gdp_per_capita_usd: number;
  coparticipacion_share: number;
  exports_usd_m: number;
  population: number;
  poverty_pct: number;
  unemployment_pct: number;
  private_jobs_k: number;
  public_jobs_k: number;
  registered_jobs_k: number;
  security_rate: number;
}

export type ProfileMetric =
  | 'pbg_usd_m'
  | 'gdp_per_capita_usd'
  | 'exports_usd_m'
  | 'coparticipacion_share'
  | 'population'
  | 'poverty_pct'
  | 'unemployment_pct'
  | 'registered_jobs_k'
  | 'security_rate';

export interface MetricDefinition {
  id: ProfileMetric;
  label: string;
  shortLabel: string;
  unit: string;
  source: string;
  sourceNote: string;
  refId: string;
  sourceUrl: string;
  retrievedAt: string;
  lowerIsBetter?: boolean;
}

export const PROFILE_METRICS: MetricDefinition[] = [
  {
    id: 'pbg_usd_m',
    label: 'PBI provincial',
    shortLabel: 'PBI',
    unit: 'millones de USD',
    source: 'Dirección Nacional de Asuntos Provinciales (DNAP / Ministerio de Economía) e INDEC',
    sourceNote: 'Estimación de Valor Agregado Bruto geográfico consolidado 2024-2025',
    refId: 'S1',
    sourceUrl: 'https://www.argentina.gob.ar/economia/hacienda/asuntosprovinciales',
    retrievedAt: '2026-10-17'
  },
  {
    id: 'gdp_per_capita_usd',
    label: 'PBI per cápita',
    shortLabel: 'PBI/hab.',
    unit: 'USD anuales por habitante',
    source: 'DNAP / INDEC (Censo Nacional 2022)',
    sourceNote: 'Relación PBG provincial / población definitiva Censo 2022',
    refId: 'S1',
    sourceUrl: 'https://www.argentina.gob.ar/economia/hacienda/asuntosprovinciales',
    retrievedAt: '2026-10-17'
  },
  {
    id: 'exports_usd_m',
    label: 'Exportaciones',
    shortLabel: 'Export.',
    unit: 'millones de USD',
    source: 'INDEC, Origen Provincial de las Exportaciones (OPEX)',
    sourceNote: 'Exportaciones de bienes por provincia de origen (serie anual 2024)',
    refId: 'D5',
    sourceUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40',
    retrievedAt: '2026-10-17'
  },
  {
    id: 'coparticipacion_share',
    label: 'Coparticipación',
    shortLabel: 'Copart.',
    unit: '% de transferencias automáticas',
    source: 'Ministerio de Economía, DNAP y CFI',
    sourceNote: 'Distribución secundaria efectiva de transferencias automáticas bajo Ley 23.548',
    refId: 'S4',
    sourceUrl: 'https://www.argentina.gob.ar/economia/hacienda/asuntosprovinciales/transferencias-gobiernos-locales',
    retrievedAt: '2026-10-17'
  },
  {
    id: 'population',
    label: 'Población',
    shortLabel: 'Población',
    unit: 'habitantes',
    source: 'INDEC, Censo Nacional de Población, Hogares y Viviendas 2022',
    sourceNote: 'Población en viviendas particulares y colectivas (resultados definitivos)',
    refId: 'D4',
    sourceUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165',
    retrievedAt: '2026-10-17'
  },
  {
    id: 'poverty_pct',
    label: 'Pobreza',
    shortLabel: 'Pobreza',
    unit: '% de personas',
    source: 'INDEC, Encuesta Permanente de Hogares (EPH)',
    sourceNote: 'Incidencia de la pobreza por aglomerado urbano y ponderación provincial (2024-2025)',
    refId: 'S3',
    sourceUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-46-152',
    retrievedAt: '2026-10-17',
    lowerIsBetter: true
  },
  {
    id: 'unemployment_pct',
    label: 'Desempleo',
    shortLabel: 'Desempleo',
    unit: '% tasa de desocupación',
    source: 'INDEC, Encuesta Permanente de Hogares (EPH)',
    sourceNote: 'Tasa de desocupación abierta de la PEA por aglomerado urbano (2024-2025)',
    refId: 'S3',
    sourceUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-46-152',
    retrievedAt: '2026-10-17',
    lowerIsBetter: true
  },
  {
    id: 'registered_jobs_k',
    label: 'Empleo registrado',
    shortLabel: 'Empleo reg.',
    unit: 'miles de puestos de trabajo',
    source: 'Secretaría de Trabajo, Empleo y Seguridad Social (OEDE / SIPA)',
    sourceNote: 'Puestos asalariados formales registrados del sector privado y público (2024-2025)',
    refId: 'S2',
    sourceUrl: 'https://www.trabajo.gob.ar/estadisticas/oede/estadisticasprovinciales.asp',
    retrievedAt: '2026-10-17'
  },
  {
    id: 'security_rate',
    label: 'Seguridad',
    shortLabel: 'Seguridad',
    unit: 'delitos cada 100.000 hab.',
    source: 'Ministerio de Seguridad, Sistema Nacional de Información Criminal (SNIC)',
    sourceNote: 'Tasa de presuntos hechos delictuosos registrados por provincia cada 100.000 habitantes',
    refId: 'S5',
    sourceUrl: 'https://www.argentina.gob.ar/seguridad/estadisticas-criminales',
    retrievedAt: '2026-10-17',
    lowerIsBetter: true
  }
];

export const PROVINCE_PROFILES: Record<ProvinceId, ProvinceProfile> = {
  'AR-B': {
    id: 'AR-B',
    name: 'Buenos Aires',
    pbg_usd_m: 201600,
    pbg_share: 32.0,
    gdp_per_capita_usd: 11475,
    coparticipacion_share: 22.4,
    exports_usd_m: 29800,
    population: 17569053,
    poverty_pct: 51.5,
    unemployment_pct: 8.2,
    private_jobs_k: 1920,
    public_jobs_k: 630,
    registered_jobs_k: 2550,
    security_rate: 3550
  },
  'AR-C': {
    id: 'AR-C',
    name: 'Ciudad Autónoma de Buenos Aires',
    pbg_usd_m: 122850,
    pbg_share: 19.5,
    gdp_per_capita_usd: 39367,
    coparticipacion_share: 2.1,
    exports_usd_m: 1250,
    population: 3120612,
    poverty_pct: 27.1,
    unemployment_pct: 5.1,
    private_jobs_k: 1520,
    public_jobs_k: 210,
    registered_jobs_k: 1730,
    security_rate: 3850
  },
  'AR-X': {
    id: 'AR-X',
    name: 'Córdoba',
    pbg_usd_m: 52920,
    pbg_share: 8.4,
    gdp_per_capita_usd: 13300,
    coparticipacion_share: 8.6,
    exports_usd_m: 11200,
    population: 3978984,
    poverty_pct: 50.0,
    unemployment_pct: 7.5,
    private_jobs_k: 515,
    public_jobs_k: 155,
    registered_jobs_k: 670,
    security_rate: 3240
  },
  'AR-S': {
    id: 'AR-S',
    name: 'Santa Fe',
    pbg_usd_m: 51660,
    pbg_share: 8.2,
    gdp_per_capita_usd: 14525,
    coparticipacion_share: 8.7,
    exports_usd_m: 15600,
    population: 3556522,
    poverty_pct: 50.5,
    unemployment_pct: 6.8,
    private_jobs_k: 505,
    public_jobs_k: 160,
    registered_jobs_k: 665,
    security_rate: 3720
  },
  'AR-M': {
    id: 'AR-M',
    name: 'Mendoza',
    pbg_usd_m: 22680,
    pbg_share: 3.6,
    gdp_per_capita_usd: 11258,
    coparticipacion_share: 4.1,
    exports_usd_m: 1580,
    population: 2014533,
    poverty_pct: 52.9,
    unemployment_pct: 5.4,
    private_jobs_k: 240,
    public_jobs_k: 115,
    registered_jobs_k: 355,
    security_rate: 3150
  },
  'AR-Q': {
    id: 'AR-Q',
    name: 'Neuquén',
    pbg_usd_m: 23310,
    pbg_share: 3.7,
    gdp_per_capita_usd: 32081,
    coparticipacion_share: 1.7,
    exports_usd_m: 3450,
    population: 726590,
    poverty_pct: 40.4,
    unemployment_pct: 5.0,
    private_jobs_k: 142,
    public_jobs_k: 72,
    registered_jobs_k: 214,
    security_rate: 3400
  },
  'AR-E': {
    id: 'AR-E',
    name: 'Entre Ríos',
    pbg_usd_m: 14490,
    pbg_share: 2.3,
    gdp_per_capita_usd: 10158,
    coparticipacion_share: 4.7,
    exports_usd_m: 1720,
    population: 1426426,
    poverty_pct: 51.0,
    unemployment_pct: 6.2,
    private_jobs_k: 135,
    public_jobs_k: 95,
    registered_jobs_k: 230,
    security_rate: 2650
  },
  'AR-T': {
    id: 'AR-T',
    name: 'Tucumán',
    pbg_usd_m: 12600,
    pbg_share: 2.0,
    gdp_per_capita_usd: 7398,
    coparticipacion_share: 4.6,
    exports_usd_m: 980,
    population: 1703186,
    poverty_pct: 55.8,
    unemployment_pct: 6.9,
    private_jobs_k: 175,
    public_jobs_k: 120,
    registered_jobs_k: 295,
    security_rate: 2920
  },
  'AR-U': {
    id: 'AR-U',
    name: 'Chubut',
    pbg_usd_m: 12600,
    pbg_share: 2.0,
    gdp_per_capita_usd: 20891,
    coparticipacion_share: 1.6,
    exports_usd_m: 3100,
    population: 603120,
    poverty_pct: 41.0,
    unemployment_pct: 4.7,
    private_jobs_k: 98,
    public_jobs_k: 55,
    registered_jobs_k: 153,
    security_rate: 3100
  },
  'AR-A': {
    id: 'AR-A',
    name: 'Salta',
    pbg_usd_m: 11340,
    pbg_share: 1.8,
    gdp_per_capita_usd: 7871,
    coparticipacion_share: 3.8,
    exports_usd_m: 1480,
    population: 1440672,
    poverty_pct: 53.3,
    unemployment_pct: 6.2,
    private_jobs_k: 120,
    public_jobs_k: 98,
    registered_jobs_k: 218,
    security_rate: 2850
  },
  'AR-Z': {
    id: 'AR-Z',
    name: 'Santa Cruz',
    pbg_usd_m: 10080,
    pbg_share: 1.6,
    gdp_per_capita_usd: 30227,
    coparticipacion_share: 1.6,
    exports_usd_m: 2580,
    population: 333473,
    poverty_pct: 43.8,
    unemployment_pct: 5.8,
    private_jobs_k: 61,
    public_jobs_k: 46,
    registered_jobs_k: 107,
    security_rate: 2700
  },
  'AR-J': {
    id: 'AR-J',
    name: 'San Juan',
    pbg_usd_m: 8820,
    pbg_share: 1.4,
    gdp_per_capita_usd: 10779,
    coparticipacion_share: 3.3,
    exports_usd_m: 1850,
    population: 818234,
    poverty_pct: 50.5,
    unemployment_pct: 4.8,
    private_jobs_k: 90,
    public_jobs_k: 58,
    registered_jobs_k: 148,
    security_rate: 2800
  },
  'AR-R': {
    id: 'AR-R',
    name: 'Río Negro',
    pbg_usd_m: 8820,
    pbg_share: 1.4,
    gdp_per_capita_usd: 11574,
    coparticipacion_share: 2.5,
    exports_usd_m: 590,
    population: 762067,
    poverty_pct: 46.0,
    unemployment_pct: 5.6,
    private_jobs_k: 110,
    public_jobs_k: 62,
    registered_jobs_k: 172,
    security_rate: 3350
  },
  'AR-N': {
    id: 'AR-N',
    name: 'Misiones',
    pbg_usd_m: 8190,
    pbg_share: 1.3,
    gdp_per_capita_usd: 6394,
    coparticipacion_share: 3.3,
    exports_usd_m: 440,
    population: 1280960,
    poverty_pct: 45.9,
    unemployment_pct: 4.5,
    private_jobs_k: 105,
    public_jobs_k: 70,
    registered_jobs_k: 175,
    security_rate: 2200
  },
  'AR-H': {
    id: 'AR-H',
    name: 'Chaco',
    pbg_usd_m: 7560,
    pbg_share: 1.2,
    gdp_per_capita_usd: 6614,
    coparticipacion_share: 4.9,
    exports_usd_m: 430,
    population: 1142963,
    poverty_pct: 68.0,
    unemployment_pct: 6.1,
    private_jobs_k: 75,
    public_jobs_k: 92,
    registered_jobs_k: 167,
    security_rate: 2750
  },
  'AR-W': {
    id: 'AR-W',
    name: 'Corrientes',
    pbg_usd_m: 7560,
    pbg_share: 1.2,
    gdp_per_capita_usd: 6313,
    coparticipacion_share: 3.6,
    exports_usd_m: 290,
    population: 1197553,
    poverty_pct: 52.3,
    unemployment_pct: 5.9,
    private_jobs_k: 78,
    public_jobs_k: 80,
    registered_jobs_k: 158,
    security_rate: 2400
  },
  'AR-G': {
    id: 'AR-G',
    name: 'Santiago del Estero',
    pbg_usd_m: 6930,
    pbg_share: 1.1,
    gdp_per_capita_usd: 6575,
    coparticipacion_share: 4.0,
    exports_usd_m: 1220,
    population: 1054028,
    poverty_pct: 53.2,
    unemployment_pct: 3.2,
    private_jobs_k: 52,
    public_jobs_k: 88,
    registered_jobs_k: 140,
    security_rate: 2100
  },
  'AR-D': {
    id: 'AR-D',
    name: 'San Luis',
    pbg_usd_m: 6300,
    pbg_share: 1.0,
    gdp_per_capita_usd: 11647,
    coparticipacion_share: 2.3,
    exports_usd_m: 780,
    population: 540905,
    poverty_pct: 47.3,
    unemployment_pct: 4.1,
    private_jobs_k: 64,
    public_jobs_k: 40,
    registered_jobs_k: 104,
    security_rate: 2600
  },
  'AR-Y': {
    id: 'AR-Y',
    name: 'Jujuy',
    pbg_usd_m: 6300,
    pbg_share: 1.0,
    gdp_per_capita_usd: 7895,
    coparticipacion_share: 2.8,
    exports_usd_m: 1050,
    population: 797955,
    poverty_pct: 55.7,
    unemployment_pct: 5.5,
    private_jobs_k: 60,
    public_jobs_k: 78,
    registered_jobs_k: 138,
    security_rate: 2350
  },
  'AR-V': {
    id: 'AR-V',
    name: 'Tierra del Fuego',
    pbg_usd_m: 5670,
    pbg_share: 0.9,
    gdp_per_capita_usd: 29742,
    coparticipacion_share: 1.3,
    exports_usd_m: 410,
    population: 190641,
    poverty_pct: 26.8,
    unemployment_pct: 5.9,
    private_jobs_k: 42,
    public_jobs_k: 24,
    registered_jobs_k: 66,
    security_rate: 1850
  },
  'AR-L': {
    id: 'AR-L',
    name: 'La Pampa',
    pbg_usd_m: 5040,
    pbg_share: 0.8,
    gdp_per_capita_usd: 13770,
    coparticipacion_share: 1.9,
    exports_usd_m: 890,
    population: 366022,
    poverty_pct: 40.0,
    unemployment_pct: 6.5,
    private_jobs_k: 39,
    public_jobs_k: 31,
    registered_jobs_k: 70,
    security_rate: 2500
  },
  'AR-K': {
    id: 'AR-K',
    name: 'Catamarca',
    pbg_usd_m: 4410,
    pbg_share: 0.7,
    gdp_per_capita_usd: 10266,
    coparticipacion_share: 2.7,
    exports_usd_m: 420,
    population: 429556,
    poverty_pct: 55.9,
    unemployment_pct: 5.2,
    private_jobs_k: 36,
    public_jobs_k: 52,
    registered_jobs_k: 88,
    security_rate: 2250
  },
  'AR-F': {
    id: 'AR-F',
    name: 'La Rioja',
    pbg_usd_m: 3780,
    pbg_share: 0.6,
    gdp_per_capita_usd: 9828,
    coparticipacion_share: 2.0,
    exports_usd_m: 190,
    population: 384607,
    poverty_pct: 51.6,
    unemployment_pct: 4.3,
    private_jobs_k: 31,
    public_jobs_k: 54,
    registered_jobs_k: 85,
    security_rate: 2150
  },
  'AR-P': {
    id: 'AR-P',
    name: 'Formosa',
    pbg_usd_m: 3150,
    pbg_share: 0.5,
    gdp_per_capita_usd: 5198,
    coparticipacion_share: 3.5,
    exports_usd_m: 45,
    population: 606041,
    poverty_pct: 67.0,
    unemployment_pct: 3.9,
    private_jobs_k: 26,
    public_jobs_k: 58,
    registered_jobs_k: 84,
    security_rate: 1950
  }
};

export function getProfileMetric(provinceId: ProvinceId, metric: ProfileMetric): number {
  return PROVINCE_PROFILES[provinceId]?.[metric] ?? 0;
}

export interface RankedProvinceProfileRow {
  id: ProvinceId;
  name: string;
  short: string;
  value: number;
}

export function rankProvincesByProfileMetric(metric: ProfileMetric): RankedProvinceProfileRow[] {
  const rows: RankedProvinceProfileRow[] = PROVINCES.map((p) => ({
    id: p.id,
    name: p.name,
    short: SHORT[p.id] ?? p.name,
    value: getProfileMetric(p.id, metric)
  }));

  rows.sort((a, b) => b.value - a.value);
  return rows;
}

export function formatProfileValue(metric: ProfileMetric, value: number): string {
  switch (metric) {
    case 'pbg_usd_m':
      return `${value.toLocaleString('es-AR')} M USD`;
    case 'gdp_per_capita_usd':
      return `${value.toLocaleString('es-AR')} USD`;
    case 'exports_usd_m':
      return `${value.toLocaleString('es-AR')} M USD`;
    case 'coparticipacion_share':
      return `${value.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
    case 'poverty_pct':
      return `${value.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
    case 'unemployment_pct':
      return `${value.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
    case 'population':
      return `${value.toLocaleString('es-AR')} hab.`;
    case 'registered_jobs_k':
      return `${value.toLocaleString('es-AR')} mil puestos`;
    case 'security_rate':
      return `${value.toLocaleString('es-AR')} / 100k hab.`;
  }
}
