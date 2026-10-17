import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';

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
  sourceNote: string;
  lowerIsBetter?: boolean;
}

export const PROFILE_METRICS: MetricDefinition[] = [
  {
    id: 'pbg_usd_m',
    label: 'PBI provincial',
    shortLabel: 'PBI',
    unit: 'millones de USD',
    sourceNote: 'Estimación a partir de INDEC y Dirección Nacional de Asuntos Provinciales'
  },
  {
    id: 'gdp_per_capita_usd',
    label: 'PBI per cápita',
    shortLabel: 'PBI/hab.',
    unit: 'USD anuales por habitante',
    sourceNote: 'Relación PBG provincial / población Censo 2022'
  },
  {
    id: 'exports_usd_m',
    label: 'Exportaciones',
    shortLabel: 'Export.',
    unit: 'millones de USD',
    sourceNote: 'INDEC, Origen Provincial de las Exportaciones (OPEX)'
  },
  {
    id: 'coparticipacion_share',
    label: 'Coparticipación',
    shortLabel: 'Copart.',
    unit: '% de transferencias automáticas',
    sourceNote: 'Ley 23.548 y modificatorias, Ministerio de Economía'
  },
  {
    id: 'population',
    label: 'Población',
    shortLabel: 'Población',
    unit: 'habitantes',
    sourceNote: 'INDEC, Censo Nacional de Población 2022'
  },
  {
    id: 'poverty_pct',
    label: 'Pobreza',
    shortLabel: 'Pobreza',
    unit: '% de personas',
    sourceNote: 'INDEC, Encuesta Permanente de Hogares (EPH)',
    lowerIsBetter: true
  },
  {
    id: 'unemployment_pct',
    label: 'Desempleo',
    shortLabel: 'Desempleo',
    unit: '% tasa de desocupación',
    sourceNote: 'INDEC, Encuesta Permanente de Hogares (EPH)',
    lowerIsBetter: true
  },
  {
    id: 'registered_jobs_k',
    label: 'Empleo registrado',
    shortLabel: 'Empleo reg.',
    unit: 'miles de puestos de trabajo',
    sourceNote: 'Secretaría de Trabajo, Empleo y Seguridad Social (SIPA)'
  },
  {
    id: 'security_rate',
    label: 'Seguridad',
    shortLabel: 'Seguridad',
    unit: 'delitos cada 100.000 hab.',
    sourceNote: 'Ministerio de Seguridad, Sistema Nacional de Información Criminal (SNIC)',
    lowerIsBetter: true
  }
];

export const PROVINCE_PROFILES: Record<ProvinceId, ProvinceProfile> = {
  'AR-B': {
    id: 'AR-B',
    name: 'Buenos Aires',
    pbg_usd_m: 195000,
    pbg_share: 32.5,
    gdp_per_capita_usd: 11100,
    coparticipacion_share: 21.2,
    exports_usd_m: 30500,
    population: 17569053,
    poverty_pct: 45.2,
    unemployment_pct: 7.8,
    private_jobs_k: 1950,
    public_jobs_k: 620,
    registered_jobs_k: 2570,
    security_rate: 3450
  },
  'AR-C': {
    id: 'AR-C',
    name: 'Ciudad Autónoma de Buenos Aires',
    pbg_usd_m: 120000,
    pbg_share: 20.0,
    gdp_per_capita_usd: 38460,
    coparticipacion_share: 2.1,
    exports_usd_m: 3200,
    population: 3120612,
    poverty_pct: 21.5,
    unemployment_pct: 5.2,
    private_jobs_k: 1510,
    public_jobs_k: 190,
    registered_jobs_k: 1700,
    security_rate: 2890
  },
  'AR-X': {
    id: 'AR-X',
    name: 'Córdoba',
    pbg_usd_m: 52000,
    pbg_share: 8.7,
    gdp_per_capita_usd: 13060,
    coparticipacion_share: 8.6,
    exports_usd_m: 12800,
    population: 3978984,
    poverty_pct: 39.8,
    unemployment_pct: 6.9,
    private_jobs_k: 525,
    public_jobs_k: 145,
    registered_jobs_k: 670,
    security_rate: 3120
  },
  'AR-S': {
    id: 'AR-S',
    name: 'Santa Fe',
    pbg_usd_m: 51000,
    pbg_share: 8.5,
    gdp_per_capita_usd: 14320,
    coparticipacion_share: 8.8,
    exports_usd_m: 16500,
    population: 3556522,
    poverty_pct: 38.5,
    unemployment_pct: 6.4,
    private_jobs_k: 510,
    public_jobs_k: 150,
    registered_jobs_k: 660,
    security_rate: 3680
  },
  'AR-M': {
    id: 'AR-M',
    name: 'Mendoza',
    pbg_usd_m: 22000,
    pbg_share: 3.7,
    gdp_per_capita_usd: 10940,
    coparticipacion_share: 4.1,
    exports_usd_m: 1600,
    population: 2014533,
    poverty_pct: 42.1,
    unemployment_pct: 5.8,
    private_jobs_k: 245,
    public_jobs_k: 110,
    registered_jobs_k: 355,
    security_rate: 3050
  },
  'AR-Q': {
    id: 'AR-Q',
    name: 'Neuquén',
    pbg_usd_m: 19500,
    pbg_share: 3.3,
    gdp_per_capita_usd: 26710,
    coparticipacion_share: 1.7,
    exports_usd_m: 3800,
    population: 726590,
    poverty_pct: 34.2,
    unemployment_pct: 4.9,
    private_jobs_k: 140,
    public_jobs_k: 75,
    registered_jobs_k: 215,
    security_rate: 2950
  },
  'AR-E': {
    id: 'AR-E',
    name: 'Entre Ríos',
    pbg_usd_m: 12500,
    pbg_share: 2.1,
    gdp_per_capita_usd: 8740,
    coparticipacion_share: 4.9,
    exports_usd_m: 1950,
    population: 1426426,
    poverty_pct: 43.8,
    unemployment_pct: 6.2,
    private_jobs_k: 140,
    public_jobs_k: 98,
    registered_jobs_k: 238,
    security_rate: 2350
  },
  'AR-T': {
    id: 'AR-T',
    name: 'Tucumán',
    pbg_usd_m: 11800,
    pbg_share: 2.0,
    gdp_per_capita_usd: 6940,
    coparticipacion_share: 4.7,
    exports_usd_m: 1100,
    population: 1703186,
    poverty_pct: 48.2,
    unemployment_pct: 7.1,
    private_jobs_k: 175,
    public_jobs_k: 115,
    registered_jobs_k: 290,
    security_rate: 3340
  },
  'AR-A': {
    id: 'AR-A',
    name: 'Salta',
    pbg_usd_m: 11200,
    pbg_share: 1.9,
    gdp_per_capita_usd: 7780,
    coparticipacion_share: 3.8,
    exports_usd_m: 1450,
    population: 1440672,
    poverty_pct: 49.5,
    unemployment_pct: 6.5,
    private_jobs_k: 120,
    public_jobs_k: 95,
    registered_jobs_k: 215,
    security_rate: 2780
  },
  'AR-U': {
    id: 'AR-U',
    name: 'Chubut',
    pbg_usd_m: 9800,
    pbg_share: 1.6,
    gdp_per_capita_usd: 16330,
    coparticipacion_share: 1.6,
    exports_usd_m: 2900,
    population: 603120,
    poverty_pct: 37.5,
    unemployment_pct: 5.5,
    private_jobs_k: 105,
    public_jobs_k: 58,
    registered_jobs_k: 163,
    security_rate: 2620
  },
  'AR-J': {
    id: 'AR-J',
    name: 'San Juan',
    pbg_usd_m: 8400,
    pbg_share: 1.4,
    gdp_per_capita_usd: 10240,
    coparticipacion_share: 3.3,
    exports_usd_m: 1350,
    population: 818234,
    poverty_pct: 44.0,
    unemployment_pct: 4.8,
    private_jobs_k: 92,
    public_jobs_k: 62,
    registered_jobs_k: 154,
    security_rate: 2420
  },
  'AR-N': {
    id: 'AR-N',
    name: 'Misiones',
    pbg_usd_m: 7800,
    pbg_share: 1.3,
    gdp_per_capita_usd: 6090,
    coparticipacion_share: 3.3,
    exports_usd_m: 610,
    population: 1280960,
    poverty_pct: 47.9,
    unemployment_pct: 5.9,
    private_jobs_k: 108,
    public_jobs_k: 78,
    registered_jobs_k: 186,
    security_rate: 2390
  },
  'AR-R': {
    id: 'AR-R',
    name: 'Río Negro',
    pbg_usd_m: 7500,
    pbg_share: 1.3,
    gdp_per_capita_usd: 9870,
    coparticipacion_share: 2.5,
    exports_usd_m: 750,
    population: 762893,
    poverty_pct: 41.5,
    unemployment_pct: 5.7,
    private_jobs_k: 112,
    public_jobs_k: 64,
    registered_jobs_k: 176,
    security_rate: 2750
  },
  'AR-W': {
    id: 'AR-W',
    name: 'Corrientes',
    pbg_usd_m: 7200,
    pbg_share: 1.2,
    gdp_per_capita_usd: 6000,
    coparticipacion_share: 3.7,
    exports_usd_m: 520,
    population: 1197553,
    poverty_pct: 51.2,
    unemployment_pct: 6.8,
    private_jobs_k: 82,
    public_jobs_k: 85,
    registered_jobs_k: 167,
    security_rate: 2450
  },
  'AR-Z': {
    id: 'AR-Z',
    name: 'Santa Cruz',
    pbg_usd_m: 6900,
    pbg_share: 1.2,
    gdp_per_capita_usd: 20910,
    coparticipacion_share: 1.6,
    exports_usd_m: 2600,
    population: 333473,
    poverty_pct: 36.1,
    unemployment_pct: 5.1,
    private_jobs_k: 62,
    public_jobs_k: 45,
    registered_jobs_k: 107,
    security_rate: 2510
  },
  'AR-H': {
    id: 'AR-H',
    name: 'Chaco',
    pbg_usd_m: 6500,
    pbg_share: 1.1,
    gdp_per_capita_usd: 5700,
    coparticipacion_share: 4.9,
    exports_usd_m: 480,
    population: 1142963,
    poverty_pct: 55.4,
    unemployment_pct: 7.2,
    private_jobs_k: 78,
    public_jobs_k: 92,
    registered_jobs_k: 170,
    security_rate: 2890
  },
  'AR-G': {
    id: 'AR-G',
    name: 'Santiago del Estero',
    pbg_usd_m: 5900,
    pbg_share: 1.0,
    gdp_per_capita_usd: 5620,
    coparticipacion_share: 4.0,
    exports_usd_m: 1200,
    population: 1054028,
    poverty_pct: 53.6,
    unemployment_pct: 5.4,
    private_jobs_k: 56,
    public_jobs_k: 76,
    registered_jobs_k: 132,
    security_rate: 2120
  },
  'AR-Y': {
    id: 'AR-Y',
    name: 'Jujuy',
    pbg_usd_m: 5500,
    pbg_share: 0.9,
    gdp_per_capita_usd: 6880,
    coparticipacion_share: 2.8,
    exports_usd_m: 920,
    population: 797955,
    poverty_pct: 47.2,
    unemployment_pct: 6.3,
    private_jobs_k: 64,
    public_jobs_k: 68,
    registered_jobs_k: 132,
    security_rate: 2340
  },
  'AR-D': {
    id: 'AR-D',
    name: 'San Luis',
    pbg_usd_m: 5100,
    pbg_share: 0.9,
    gdp_per_capita_usd: 9440,
    coparticipacion_share: 2.3,
    exports_usd_m: 780,
    population: 540905,
    poverty_pct: 44.5,
    unemployment_pct: 4.9,
    private_jobs_k: 62,
    public_jobs_k: 44,
    registered_jobs_k: 106,
    security_rate: 2280
  },
  'AR-K': {
    id: 'AR-K',
    name: 'Catamarca',
    pbg_usd_m: 4600,
    pbg_share: 0.8,
    gdp_per_capita_usd: 10700,
    coparticipacion_share: 2.7,
    exports_usd_m: 720,
    population: 429556,
    poverty_pct: 46.1,
    unemployment_pct: 6.0,
    private_jobs_k: 38,
    public_jobs_k: 48,
    registered_jobs_k: 86,
    security_rate: 2180
  },
  'AR-V': {
    id: 'AR-V',
    name: 'Tierra del Fuego',
    pbg_usd_m: 4200,
    pbg_share: 0.7,
    gdp_per_capita_usd: 22100,
    coparticipacion_share: 1.3,
    exports_usd_m: 450,
    population: 190641,
    poverty_pct: 31.2,
    unemployment_pct: 5.2,
    private_jobs_k: 38,
    public_jobs_k: 24,
    registered_jobs_k: 62,
    security_rate: 2150
  },
  'AR-L': {
    id: 'AR-L',
    name: 'La Pampa',
    pbg_usd_m: 4100,
    pbg_share: 0.7,
    gdp_per_capita_usd: 11080,
    coparticipacion_share: 1.9,
    exports_usd_m: 650,
    population: 366022,
    poverty_pct: 37.8,
    unemployment_pct: 5.3,
    private_jobs_k: 42,
    public_jobs_k: 36,
    registered_jobs_k: 78,
    security_rate: 1980
  },
  'AR-F': {
    id: 'AR-F',
    name: 'La Rioja',
    pbg_usd_m: 3200,
    pbg_share: 0.5,
    gdp_per_capita_usd: 8420,
    coparticipacion_share: 2.0,
    exports_usd_m: 280,
    population: 384607,
    poverty_pct: 49.1,
    unemployment_pct: 6.1,
    private_jobs_k: 32,
    public_jobs_k: 51,
    registered_jobs_k: 83,
    security_rate: 2050
  },
  'AR-P': {
    id: 'AR-P',
    name: 'Formosa',
    pbg_usd_m: 3100,
    pbg_share: 0.5,
    gdp_per_capita_usd: 5080,
    coparticipacion_share: 3.6,
    exports_usd_m: 65,
    population: 606041,
    poverty_pct: 52.8,
    unemployment_pct: 5.6,
    private_jobs_k: 28,
    public_jobs_k: 54,
    registered_jobs_k: 82,
    security_rate: 2210
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

import { SHORT } from './provinceMock.js';

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
